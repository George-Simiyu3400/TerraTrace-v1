import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import {
  computeEventHash,
  computeSha256,
  createGenesisHash,
  validateAuditChain,
} from './server/audit.js';
import { defaultBlockchainAdapter } from './server/blockchainAdapter.js';
import { db } from './server/db.js';
import { parseLandFields, performOcr } from './server/ocr.js';
import { defaultRegistryProvider } from './server/registryProvider.js';
import { runVerificationRules } from './server/verificationEngine.js';
import {
  AuditEvent,
  DocumentExtractedFields,
  LandDocument,
  ReferenceRecord,
  VerificationRun,
} from './src/types/index.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Multer memory storage for private file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PNG, JPG, or PDF document.'));
    }
  },
});

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const userId = db.getUserIdFromSession(token);
  if (!userId) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  req.userId = userId;
  next();
}

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName, accountType, phone, country } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, password, and legal name are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const userId = crypto.randomUUID();
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

  const newUser = {
    id: userId,
    email: email.toLowerCase().trim(),
    passwordHash,
    profile: {
      id: userId,
      accountType: accountType === 'COMPANY' ? 'COMPANY' : 'INDIVIDUAL',
      displayName: displayName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '+254',
      country: country || 'Kenya',
      identityVerificationStatus: 'NOT_STARTED' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    organization:
      accountType === 'COMPANY'
        ? {
            id: crypto.randomUUID(),
            ownerUserId: userId,
            registeredName: req.body.companyName || `${displayName} Ltd`,
            registrationNumber: req.body.registrationNumber || '',
            country: country || 'Kenya',
            representativeName: displayName.trim(),
            representativeEmail: email.toLowerCase().trim(),
            phone: phone || '+254',
            verificationStatus: 'SELF_DECLARED' as const,
            createdAt: new Date().toISOString(),
          }
        : undefined,
  };

  db.createUser(newUser);
  const sessionToken = db.createSession(userId);

  res.status(201).json({
    token: sessionToken,
    user: newUser.profile,
    organization: newUser.organization,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.passwordHash !== hash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const sessionToken = db.createSession(user.id);
  res.json({
    token: sessionToken,
    user: user.profile,
    organization: user.organization,
  });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    db.destroySession(token);
  }
  res.json({ success: true, message: 'Signed out securely.' });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found.' });
  }
  res.json({
    user: user.profile,
    organization: user.organization,
  });
});

app.post('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { displayName, phone, country, idNumber, companyName, registrationNumber } = req.body;
  const user = db.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const updatedProfile = db.updateProfile(req.userId!, {
    displayName: displayName ?? user.profile.displayName,
    phone: phone ?? user.profile.phone,
    country: country ?? user.profile.country,
    idNumber: idNumber !== undefined ? idNumber : user.profile.idNumber,
  });

  let updatedOrg = user.organization;
  if (user.profile.accountType === 'COMPANY' || companyName) {
    updatedOrg = db.updateOrgProfile(req.userId!, {
      registeredName: companyName,
      registrationNumber,
    });
  }

  res.json({
    user: updatedProfile,
    organization: updatedOrg,
  });
});

// -----------------------------------------------------------------------------
// Document Upload & Management Endpoints
// -----------------------------------------------------------------------------
app.post('/api/documents/upload', requireAuth, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file provided.' });
    }

    const userId = req.userId!;
    const file = req.file;

    // Strict SHA-256 calculation of original raw bytes
    const originalSha256 = computeSha256(file.buffer);

    const docId = crypto.randomUUID();
    const randomizedStorageName = `private_vault_${userId}_${crypto.randomBytes(12).toString('hex')}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const newDoc: LandDocument = {
      id: docId,
      ownerUserId: userId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalSha256,
      documentType: (req.body.documentType as any) || 'TITLE_DEED',
      processingStatus: 'UPLOADED',
      privateStoragePath: randomizedStorageName,
      uploadedAt: new Date().toISOString(),
    };

    // Store securely in memory vault
    db.saveDocument(newDoc, {
      id: docId,
      ownerUserId: userId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sha256: originalSha256,
      buffer: file.buffer,
    });

    res.status(201).json({
      document: newDoc,
      message: 'Document uploaded and original SHA-256 digest calculated successfully.',
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

app.get('/api/documents', requireAuth, (req: AuthenticatedRequest, res) => {
  const docs = db.getUserDocuments(req.userId!);
  res.json({ documents: docs });
});

app.get('/api/documents/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const doc = db.getDocument(req.userId!, req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found or access denied.' });
  }
  res.json({ document: doc });
});

// Endpoint to view preview / download document
app.get('/api/documents/:id/file', requireAuth, (req: AuthenticatedRequest, res) => {
  const storedFile = db.getFile(req.userId!, req.params.id);
  if (!storedFile) {
    return res.status(404).json({ error: 'Document file not found or unauthorized.' });
  }
  res.setHeader('Content-Type', storedFile.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${storedFile.fileName}"`);
  res.send(storedFile.buffer);
});

app.delete('/api/documents/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const deleted = db.deleteDocument(req.userId!, req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Document not found or access denied.' });
  }
  res.json({ success: true, message: 'Document and associated data permanently deleted.' });
});

// -----------------------------------------------------------------------------
// Document OCR & Field Extraction Endpoint
// -----------------------------------------------------------------------------
app.post('/api/documents/:id/extract', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const doc = db.getDocument(req.userId!, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    const storedFile = db.getFile(req.userId!, req.params.id);
    if (!storedFile) {
      return res.status(404).json({ error: 'Document file is missing from private storage.' });
    }

    // Perform actual OCR on uploaded file buffer
    const ocrText = await performOcr(storedFile.buffer, storedFile.mimeType);

    // Extract structured Kenyan land fields
    const extractedFields = await parseLandFields(ocrText, storedFile.buffer, storedFile.mimeType);

    // Save extracted fields to document record
    db.updateDocumentFields(req.userId!, doc.id, extractedFields);

    res.json({
      documentId: doc.id,
      extractedFields,
      message: 'OCR extraction completed from document image bytes.',
    });
  } catch (err: any) {
    console.error('OCR Extraction error:', err);
    res.status(500).json({ error: 'Optical Character Recognition processing failed on this document.' });
  }
});

// -----------------------------------------------------------------------------
// Reference Records Endpoints
// -----------------------------------------------------------------------------
app.post('/api/reference-records', requireAuth, (req: AuthenticatedRequest, res) => {
  const {
    sourceType,
    sourceName,
    obtainedAt,
    parcelNumber,
    titleNumber,
    registeredOwner,
    countyOrLocality,
    landArea,
    registrationDate,
    notes,
  } = req.body;

  const record: ReferenceRecord = {
    id: crypto.randomUUID(),
    ownerUserId: req.userId!,
    sourceType: sourceType || 'USER_SUPPLIED_INPUT',
    sourceName: sourceName || 'User manual declaration',
    obtainedAt: obtainedAt || new Date().toISOString(),
    parcelNumber: parcelNumber?.trim() || undefined,
    titleNumber: titleNumber?.trim() || undefined,
    registeredOwner: registeredOwner?.trim() || undefined,
    countyOrLocality: countyOrLocality?.trim() || undefined,
    landArea: landArea?.trim() || undefined,
    registrationDate: registrationDate?.trim() || undefined,
    notes: notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  db.saveReferenceRecord(record);
  res.status(201).json({ referenceRecord: record });
});

app.get('/api/reference-records', requireAuth, (req: AuthenticatedRequest, res) => {
  const records = db.getUserReferenceRecords(req.userId!);
  res.json({ referenceRecords: records });
});

// -----------------------------------------------------------------------------
// Verification Engine & Audit Chain Endpoints
// -----------------------------------------------------------------------------
app.post('/api/verifications', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { documentId, extractedFields, referenceRecordId, manualReference } = req.body;
    const userId = req.userId!;

    const doc = db.getDocument(userId, documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }

    let referenceRecord: ReferenceRecord | undefined;
    let referenceSourceType = 'NO_REFERENCE_PROVIDED' as const;

    if (referenceRecordId) {
      const existingRef = db.getReferenceRecord(userId, referenceRecordId);
      if (existingRef) {
        referenceRecord = existingRef;
        referenceSourceType = existingRef.sourceType as any;
      }
    } else if (manualReference && typeof manualReference === 'object') {
      referenceRecord = {
        id: crypto.randomUUID(),
        ownerUserId: userId,
        sourceType: 'USER_SUPPLIED_INPUT',
        sourceName: 'User direct input during screening run',
        obtainedAt: new Date().toISOString(),
        parcelNumber: manualReference.parcelNumber?.trim() || undefined,
        titleNumber: manualReference.titleNumber?.trim() || undefined,
        registeredOwner: manualReference.registeredOwner?.trim() || undefined,
        countyOrLocality: manualReference.countyOrLocality?.trim() || undefined,
        landArea: manualReference.landArea?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      db.saveReferenceRecord(referenceRecord);
      referenceSourceType = 'USER_SUPPLIED_INPUT';
    }

    const fieldsToUse: DocumentExtractedFields = extractedFields || {};

    const userDocs = db.getUserDocuments(userId);
    const userRuns = db.getUserVerificationRuns(userId);

    // Evaluate rules
    const engineResult = runVerificationRules({
      userId,
      document: doc,
      extractedFields: fieldsToUse,
      referenceRecord,
      referenceSourceType,
      existingUserDocuments: userDocs,
      existingUserVerifications: userRuns,
    });

    const runId = crypto.randomUUID();
    const runTimestamp = new Date().toISOString();

    const verificationRun: VerificationRun = {
      id: runId,
      ownerUserId: userId,
      documentId: doc.id,
      status: engineResult.status,
      statusExplanation: engineResult.statusExplanation,
      extractedFields: fieldsToUse,
      referenceRecord,
      referenceSourceType,
      findings: engineResult.findings,
      checksPerformed: engineResult.checksPerformed,
      documentSha256: doc.originalSha256,
      auditRunReference: `AUDIT-TR-${runId.substring(0, 8).toUpperCase()}`,
      officialVerificationStatus: 'NOT_CONNECTED',
      createdAt: runTimestamp,
    };

    db.saveVerificationRun(verificationRun);

    // -------------------------------------------------------------------------
    // Construct Cryptographic Hash-Linked Audit Chain
    // -------------------------------------------------------------------------
    let previousHash = createGenesisHash();

    const auditSteps: Array<{
      eventType: AuditEvent['eventType'];
      details: Record<string, any>;
    }> = [
      {
        eventType: 'DOCUMENT_UPLOADED',
        details: {
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          privateVaultId: doc.privateStoragePath,
        },
      },
      {
        eventType: 'SHA256_FINGERPRINTED',
        details: {
          originalSha256: doc.originalSha256,
          algorithm: 'SHA-256 (NIST FIPS 180-4)',
        },
      },
      {
        eventType: 'OCR_EXTRACTION_COMPLETED',
        details: {
          engine: fieldsToUse.ocrEngine || 'Tesseract OCR',
          hasRawText: Boolean(fieldsToUse.rawText),
          fieldsExtracted: Object.keys(fieldsToUse).filter((k) => (fieldsToUse as any)[k]?.value),
        },
      },
      {
        eventType: 'FIELDS_CONFIRMED_BY_USER',
        details: {
          hasUserEdits: Object.values(fieldsToUse).some(
            (v: any) => v && typeof v === 'object' && v.isUserCorrected
          ),
        },
      },
      {
        eventType: 'REFERENCE_RECORD_ATTACHED',
        details: {
          sourceType: referenceSourceType,
          hasReferenceRecord: Boolean(referenceRecord),
        },
      },
      {
        eventType: 'VERIFICATION_RULES_EVALUATED',
        details: {
          checksPerformedCount: engineResult.checksPerformed.length,
          findingsCount: engineResult.findings.length,
          status: engineResult.status,
        },
      },
      {
        eventType: 'REPORT_GENERATED',
        details: {
          runId,
          reportReference: verificationRun.auditRunReference,
          disclaimerAcknowledged: true,
        },
      },
    ];

    for (const step of auditSteps) {
      const eventTimestamp = new Date().toISOString();
      const eventHash = computeEventHash(
        previousHash,
        step.eventType,
        eventTimestamp,
        doc.originalSha256,
        step.details
      );

      const event: AuditEvent = {
        id: crypto.randomUUID(),
        verificationRunId: runId,
        eventType: step.eventType,
        timestamp: eventTimestamp,
        documentHash: doc.originalSha256,
        previousHash,
        eventHash,
        actorId: userId,
        details: step.details,
      };

      db.appendAuditEvent(runId, event);
      previousHash = eventHash;
    }

    res.status(201).json({ verificationRun });
  } catch (err: any) {
    console.error('Verification run error:', err);
    res.status(500).json({ error: err.message || 'Verification execution failed.' });
  }
});

app.get('/api/verifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const runs = db.getUserVerificationRuns(req.userId!);
  res.json({ verificationRuns: runs });
});

app.get('/api/verifications/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const run = db.getVerificationRun(req.userId!, req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Verification run not found or unauthorized.' });
  }
  const document = db.getDocument(req.userId!, run.documentId);
  res.json({ verificationRun: run, document });
});

app.get('/api/audit/:verificationId', requireAuth, (req: AuthenticatedRequest, res) => {
  const events = db.getAuditEvents(req.userId!, req.params.verificationId);
  if (!events) {
    return res.status(404).json({ error: 'Audit events not found or unauthorized.' });
  }
  res.json({ events });
});

app.get('/api/audit/:verificationId/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  const events = db.getAuditEvents(req.userId!, req.params.verificationId);
  if (!events) {
    return res.status(404).json({ error: 'Audit events not found.' });
  }
  const validation = validateAuditChain(events);
  res.json({
    chainValidation: validation,
    totalEvents: events.length,
    latestHash: events.length > 0 ? events[events.length - 1].eventHash : null,
  });
});

// Interactive Tamper Test Simulation (to demonstrate tamper-evident audit history)
app.post('/api/audit/:verificationId/tamper-test', requireAuth, (req: AuthenticatedRequest, res) => {
  const { eventIndex } = req.body;
  const success = db.tamperWithAuditEvent(req.userId!, req.params.verificationId, eventIndex ?? 1, {
    unauthorized_modification: 'Altered parcel number in audit record',
    timestamp_modified: new Date().toISOString(),
  });

  if (!success) {
    return res.status(400).json({ error: 'Could not execute tamper test on this run.' });
  }

  // Re-verify chain to reveal the detected tamper
  const events = db.getAuditEvents(req.userId!, req.params.verificationId) || [];
  const validation = validateAuditChain(events);

  res.json({
    tamperSimulated: true,
    chainValidation: validation,
    message: 'Tamper simulated! The SHA-256 hash link immediately detects the unauthorized change.',
  });
});

// -----------------------------------------------------------------------------
// Official Registry Status & Guidance Endpoints
// -----------------------------------------------------------------------------
app.get('/api/registry/status', async (_req, res) => {
  const status = await defaultRegistryProvider.getStatus();
  res.json(status);
});

// -----------------------------------------------------------------------------
// Identity Verification Endpoints
// -----------------------------------------------------------------------------
app.get('/api/identity-verification/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  res.json({
    providerConnected: false,
    status: user.profile.identityVerificationStatus,
    message:
      'Identity verification is not currently connected. Your identity has not been independently verified by TerraTrace.',
    disclaimer:
      'In compliance with Kenya Data Protection Act 2019, identity documents are only processed with explicit lawful basis and authorized third-party identity verification provider integration.',
  });
});

app.post('/api/identity-verification/start', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = db.getUser(req.userId!);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Set status to PENDING_REVIEW if requested
  db.updateProfile(req.userId!, {
    identityVerificationStatus: 'PENDING_REVIEW',
  });

  res.json({
    status: 'PENDING_REVIEW',
    message:
      'Verification request logged. External automated verification provider is not currently connected in this environment.',
  });
});

// -----------------------------------------------------------------------------
// Blockchain Status Endpoint
// -----------------------------------------------------------------------------
app.get('/api/blockchain/status', async (_req, res) => {
  const status = await defaultBlockchainAdapter.getStatus();
  res.json(status);
});

// -----------------------------------------------------------------------------
// Dev & Production Serving
// -----------------------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TerraTrace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start TerraTrace server:', err);
  process.exit(1);
});

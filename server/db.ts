import crypto from 'node:crypto';
import {
  AuditEvent,
  DocumentExtractedFields,
  IdentityVerificationStatus,
  LandDocument,
  OrganizationProfile,
  ReferenceRecord,
  UserProfile,
  VerificationRun,
} from '../src/types/index.js';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  organization?: OrganizationProfile;
}

export interface StoredFile {
  id: string;
  ownerUserId: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  buffer: Buffer;
  extractedFields?: DocumentExtractedFields;
}

class TerraTraceDatabase {
  users: Map<string, StoredUser> = new Map();
  sessions: Map<string, string> = new Map(); // token -> userId
  documents: Map<string, LandDocument> = new Map();
  files: Map<string, StoredFile> = new Map(); // docId -> file
  verificationRuns: Map<string, VerificationRun> = new Map();
  referenceRecords: Map<string, ReferenceRecord> = new Map();
  auditEvents: Map<string, AuditEvent[]> = new Map(); // verificationRunId -> events

  constructor() {
    // Empty state on boot, obeying CORE PRODUCT REQUIREMENT:
    // "Start with empty states when no user documents, records, or verification reports exist."
    // "Do not create fictional parcel numbers, title numbers, registered owners..."
  }

  // Session & Auth
  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.sessions.set(token, userId);
    return token;
  }

  getUserIdFromSession(token?: string): string | null {
    if (!token) return null;
    return this.sessions.get(token) || null;
  }

  destroySession(token: string): boolean {
    return this.sessions.delete(token);
  }

  getUser(userId: string): StoredUser | null {
    return this.users.get(userId) || null;
  }

  getUserByEmail(email: string): StoredUser | null {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return null;
  }

  createUser(user: StoredUser): StoredUser {
    this.users.set(user.id, user);
    return user;
  }

  updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile | null {
    const user = this.users.get(userId);
    if (!user) return null;
    user.profile = {
      ...user.profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return user.profile;
  }

  updateOrgProfile(userId: string, updates: Partial<OrganizationProfile>): OrganizationProfile | null {
    const user = this.users.get(userId);
    if (!user) return null;
    if (!user.organization) {
      user.organization = {
        id: crypto.randomUUID(),
        ownerUserId: userId,
        registeredName: updates.registeredName || 'Organization',
        country: updates.country || 'Kenya',
        representativeName: updates.representativeName || user.profile.displayName,
        representativeEmail: updates.representativeEmail || user.profile.email,
        phone: updates.phone || user.profile.phone,
        verificationStatus: 'SELF_DECLARED',
        createdAt: new Date().toISOString(),
        ...updates,
      };
    } else {
      user.organization = {
        ...user.organization,
        ...updates,
      };
    }
    return user.organization;
  }

  // Row-Level Security: Documents
  getUserDocuments(userId: string): LandDocument[] {
    return Array.from(this.documents.values()).filter((d) => d.ownerUserId === userId);
  }

  getDocument(userId: string, documentId: string): LandDocument | null {
    const doc = this.documents.get(documentId);
    if (!doc || doc.ownerUserId !== userId) {
      return null;
    }
    return doc;
  }

  saveDocument(doc: LandDocument, file: StoredFile): LandDocument {
    this.documents.set(doc.id, doc);
    this.files.set(doc.id, file);
    return doc;
  }

  getFile(userId: string, documentId: string): StoredFile | null {
    const doc = this.documents.get(documentId);
    if (!doc || doc.ownerUserId !== userId) {
      return null;
    }
    return this.files.get(documentId) || null;
  }

  updateDocumentFields(userId: string, documentId: string, fields: DocumentExtractedFields): boolean {
    const file = this.getFile(userId, documentId);
    if (!file) return false;
    file.extractedFields = fields;
    const doc = this.documents.get(documentId);
    if (doc) {
      doc.processingStatus = 'EXTRACTED';
    }
    return true;
  }

  deleteDocument(userId: string, documentId: string): boolean {
    const doc = this.documents.get(documentId);
    if (!doc || doc.ownerUserId !== userId) {
      return false;
    }
    this.documents.delete(documentId);
    this.files.delete(documentId);

    // Delete associated verification runs
    for (const [runId, run] of this.verificationRuns.entries()) {
      if (run.documentId === documentId && run.ownerUserId === userId) {
        this.verificationRuns.delete(runId);
        this.auditEvents.delete(runId);
      }
    }
    return true;
  }

  // Row-Level Security: Reference Records
  saveReferenceRecord(record: ReferenceRecord): ReferenceRecord {
    this.referenceRecords.set(record.id, record);
    return record;
  }

  getUserReferenceRecords(userId: string): ReferenceRecord[] {
    return Array.from(this.referenceRecords.values()).filter((r) => r.ownerUserId === userId);
  }

  getReferenceRecord(userId: string, recordId: string): ReferenceRecord | null {
    const r = this.referenceRecords.get(recordId);
    if (!r || r.ownerUserId !== userId) {
      return null;
    }
    return r;
  }

  // Row-Level Security: Verifications
  saveVerificationRun(run: VerificationRun): VerificationRun {
    this.verificationRuns.set(run.id, run);
    return run;
  }

  getUserVerificationRuns(userId: string): VerificationRun[] {
    return Array.from(this.verificationRuns.values())
      .filter((v) => v.ownerUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getVerificationRun(userId: string, runId: string): VerificationRun | null {
    const run = this.verificationRuns.get(runId);
    if (!run || run.ownerUserId !== userId) {
      return null;
    }
    return run;
  }

  // Audit Events
  appendAuditEvent(runId: string, event: AuditEvent): AuditEvent {
    const events = this.auditEvents.get(runId) || [];
    events.push(event);
    this.auditEvents.set(runId, events);
    return event;
  }

  getAuditEvents(userId: string, runId: string): AuditEvent[] | null {
    const run = this.getVerificationRun(userId, runId);
    if (!run) {
      return null;
    }
    return this.auditEvents.get(runId) || [];
  }

  // Tamper test simulation (for verification testing UI)
  tamperWithAuditEvent(userId: string, runId: string, eventIndex: number, alteredDetails: Record<string, any>): boolean {
    const run = this.getVerificationRun(userId, runId);
    if (!run) return false;
    const events = this.auditEvents.get(runId);
    if (!events || !events[eventIndex]) return false;

    // Mutate the details without updating the eventHash or subsequent hashes
    events[eventIndex].details = {
      ...events[eventIndex].details,
      ...alteredDetails,
      tampered_marker: true,
    };
    return true;
  }
}

export const db = new TerraTraceDatabase();

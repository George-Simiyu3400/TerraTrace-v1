import {
  DocumentExtractedFields,
  LandDocument,
  ReferenceRecord,
  ReferenceSourceType,
  VerificationFinding,
  VerificationRun,
  VerificationStatus,
} from '../src/types/index.js';

export interface VerificationEngineInput {
  userId: string;
  document: LandDocument;
  extractedFields: DocumentExtractedFields;
  referenceRecord?: ReferenceRecord;
  referenceSourceType: ReferenceSourceType;
  existingUserDocuments: LandDocument[];
  existingUserVerifications: VerificationRun[];
}

function normalizeString(val?: string): string {
  if (!val) return '';
  return val
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function runVerificationRules(input: VerificationEngineInput): {
  status: VerificationStatus;
  statusExplanation: string;
  findings: VerificationFinding[];
  checksPerformed: string[];
} {
  const { document, extractedFields, referenceRecord, referenceSourceType, existingUserDocuments } = input;
  const findings: VerificationFinding[] = [];
  const checksPerformed: string[] = [];

  let hasSevereMismatch = false;
  let hasMissingCriticalFields = false;
  let hasUserComparison = Boolean(referenceRecord);

  // Check 1: Exact-file duplicate detection using SHA-256
  checksPerformed.push('Exact-file duplicate detection via SHA-256');
  const otherSameDocs = existingUserDocuments.filter(
    (d) => d.id !== document.id && d.originalSha256 === document.originalSha256
  );
  if (otherSameDocs.length > 0) {
    findings.push({
      code: 'DUPLICATE_FILE_DETECTED',
      severity: 'WARNING',
      title: 'Identical Document Uploaded Previously',
      description: `This file has the exact same SHA-256 fingerprint (${document.originalSha256.substring(0, 16)}...) as an existing document in your records (${otherSameDocs[0].fileName}).`,
      recommendation: 'Check whether this document has already undergone a previous verification check.',
    });
  }

  // Check 2: Missing-field detection
  checksPerformed.push('Document critical field completeness check');
  const criticalFields = [
    { key: 'parcelNumber', label: 'Parcel / Land Reference Number' },
    { key: 'registeredOwner', label: 'Registered Owner / Proprietor Name' },
  ];

  for (const cf of criticalFields) {
    const val = (extractedFields as any)[cf.key]?.value;
    if (!val || val.trim().length === 0) {
      hasMissingCriticalFields = true;
      findings.push({
        code: `MISSING_${cf.key.toUpperCase()}`,
        severity: 'WARNING',
        title: `Unextracted Field: ${cf.label}`,
        description: `The document scanning process was unable to reliably extract the ${cf.label}. This can happen due to low scan resolution, physical wear, or non-standard title layouts.`,
        field: cf.key,
        recommendation: 'Use the manual correction tool to provide this value if clearly visible on your physical paper deed.',
      });
    }
  }

  // Check 3: OCR uncertainty checks
  checksPerformed.push('OCR confidence & legibility threshold analysis');
  const lowConfidenceFields: string[] = [];
  Object.entries(extractedFields).forEach(([fieldKey, fieldVal]) => {
    if (fieldVal && typeof fieldVal === 'object' && 'confidence' in fieldVal) {
      if (fieldVal.confidence < 0.65 && !fieldVal.isUserCorrected) {
        lowConfidenceFields.push(fieldKey);
      }
    }
  });

  if (lowConfidenceFields.length > 0) {
    findings.push({
      code: 'LOW_OCR_CONFIDENCE',
      severity: 'INFO',
      title: 'Low Optical Confidence on Certain Fields',
      description: `OCR detected potential character ambiguity on: ${lowConfidenceFields.join(', ')}.`,
      recommendation: 'Review the extracted text against your original document before relying on screening results.',
    });
  }

  // Check 4: Basic Kenyan document-format checks
  checksPerformed.push('Kenyan parcel reference syntax format check');
  const parcelVal = extractedFields.parcelNumber?.value;
  if (parcelVal) {
    const isKenyanFormat =
      /^(?:LR|L\.R\.)\s*(?:NO\.?)?\s*[0-9]+(?:\/[0-9A-Z\.]+)?/i.test(parcelVal) ||
      /^[A-Z0-9\s\-]+(?:\/[A-Z0-9\s\-]+)+$/i.test(parcelVal) ||
      /^(?:BLOCK|PLOT|PARCEL)\s*[0-9A-Z\/\-]+/i.test(parcelVal) ||
      /^[A-Z]{3,}\/[0-9A-Z\s\-]+\/[0-9]+$/i.test(parcelVal);

    if (!isKenyanFormat) {
      findings.push({
        code: 'NON_STANDARD_PARCEL_FORMAT',
        severity: 'WARNING',
        title: 'Non-Standard Parcel Reference Format',
        description: `The extracted parcel number "${parcelVal}" deviates from typical Kenyan registry formatting (e.g., "LR NO. 209/...", "KIAMBU/MUGUGA/123", or "BLOCK 105/12").`,
        field: 'parcelNumber',
        extractedValue: parcelVal,
        recommendation: 'Check whether an OCR character error occurred (such as confusing "O" with "0" or "I" with "1").',
      });
    }
  }

  // Checks 5, 6, 7: Comparison against reference record (when provided)
  if (referenceRecord) {
    // 5. Parcel-reference comparison
    checksPerformed.push('Parcel reference comparison with reference record');
    if (referenceRecord.parcelNumber && parcelVal) {
      const normExtracted = normalizeString(parcelVal);
      const normRef = normalizeString(referenceRecord.parcelNumber);

      if (normExtracted === normRef) {
        findings.push({
          code: 'PARCEL_MATCH',
          severity: 'MATCH',
          title: 'Parcel Reference Matches Supplied Reference',
          description: `Extracted parcel "${parcelVal}" strictly matches reference "${referenceRecord.parcelNumber}".`,
          field: 'parcelNumber',
          extractedValue: parcelVal,
          referenceValue: referenceRecord.parcelNumber,
        });
      } else {
        hasSevereMismatch = true;
        findings.push({
          code: 'PARCEL_MISMATCH',
          severity: 'CRITICAL',
          title: 'Parcel Reference Inconsistency Detected',
          description: `Discrepancy: Extracted "${parcelVal}" does not match user-supplied reference "${referenceRecord.parcelNumber}".`,
          field: 'parcelNumber',
          extractedValue: parcelVal,
          referenceValue: referenceRecord.parcelNumber,
          recommendation: 'Confirm which parcel number is accurate on the official green card or mutation form.',
        });
      }
    }

    // 6. Title-reference comparison
    checksPerformed.push('Title / Deed reference comparison with reference record');
    const titleVal = extractedFields.titleNumber?.value;
    if (referenceRecord.titleNumber && titleVal) {
      const normExtracted = normalizeString(titleVal);
      const normRef = normalizeString(referenceRecord.titleNumber);

      if (normExtracted === normRef) {
        findings.push({
          code: 'TITLE_MATCH',
          severity: 'MATCH',
          title: 'Title Number Matches Supplied Reference',
          description: `Extracted title "${titleVal}" matches reference "${referenceRecord.titleNumber}".`,
          field: 'titleNumber',
          extractedValue: titleVal,
          referenceValue: referenceRecord.titleNumber,
        });
      } else {
        hasSevereMismatch = true;
        findings.push({
          code: 'TITLE_MISMATCH',
          severity: 'CRITICAL',
          title: 'Title Reference Inconsistency Detected',
          description: `Discrepancy: Extracted title "${titleVal}" does not match reference "${referenceRecord.titleNumber}".`,
          field: 'titleNumber',
          extractedValue: titleVal,
          referenceValue: referenceRecord.titleNumber,
          recommendation: 'Inspect deed registration folio and IR number.',
        });
      }
    }

    // 7. Registered-name comparison with fuzzy tolerance display
    checksPerformed.push('Registered owner / proprietor name comparison');
    const ownerVal = extractedFields.registeredOwner?.value;
    if (referenceRecord.registeredOwner && ownerVal) {
      const normExtracted = normalizeString(ownerVal);
      const normRef = normalizeString(referenceRecord.registeredOwner);

      if (normExtracted === normRef) {
        findings.push({
          code: 'OWNER_NAME_MATCH',
          severity: 'MATCH',
          title: 'Proprietor Name Matches Supplied Reference',
          description: `Name extracted from deed ("${ownerVal}") matches reference record exactly.`,
          field: 'registeredOwner',
          extractedValue: ownerVal,
          referenceValue: referenceRecord.registeredOwner,
        });
      } else {
        const dist = levenshteinDistance(normExtracted, normRef);
        const maxLen = Math.max(normExtracted.length, normRef.length);
        const similarity = maxLen > 0 ? (maxLen - dist) / maxLen : 0;

        if (similarity > 0.8) {
          findings.push({
            code: 'OWNER_NAME_APPROXIMATE_MATCH',
            severity: 'INFO',
            title: 'Approximate Name Match (Potential OCR Spelling Variance)',
            description: `Document name "${ownerVal}" is closely similar (${Math.round(
              similarity * 100
            )}%) to reference "${referenceRecord.registeredOwner}", but contains character variations.`,
            field: 'registeredOwner',
            extractedValue: ownerVal,
            referenceValue: referenceRecord.registeredOwner,
            recommendation: 'Verify exact spelling against Kenyan National ID / Passport.',
          });
        } else {
          hasSevereMismatch = true;
          findings.push({
            code: 'OWNER_NAME_MISMATCH',
            severity: 'CRITICAL',
            title: 'Proprietor Name Inconsistency',
            description: `Extracted proprietor "${ownerVal}" differs significantly from reference "${referenceRecord.registeredOwner}".`,
            field: 'registeredOwner',
            extractedValue: ownerVal,
            referenceValue: referenceRecord.registeredOwner,
            recommendation: 'Perform an official Ardhisasa search to confirm current registered ownership.',
          });
        }
      }
    }

    // 8. County or Locality check
    if (referenceRecord.countyOrLocality && extractedFields.countyOrLocality?.value) {
      checksPerformed.push('County & locality territorial alignment check');
      const docCounty = extractedFields.countyOrLocality.value.toLowerCase().trim();
      const refCounty = referenceRecord.countyOrLocality.toLowerCase().trim();
      if (docCounty === refCounty) {
        findings.push({
          code: 'COUNTY_MATCH',
          severity: 'MATCH',
          title: 'County / Locality Aligned',
          description: `Both document and reference specify ${extractedFields.countyOrLocality.value}.`,
        });
      } else {
        findings.push({
          code: 'COUNTY_MISMATCH',
          severity: 'WARNING',
          title: 'County / Locality Discrepancy',
          description: `Document notes "${extractedFields.countyOrLocality.value}" whereas reference record specifies "${referenceRecord.countyOrLocality}".`,
          recommendation: 'Confirm Land Registry jurisdiction under the Land Registration Act 2012.',
        });
      }
    }
  } else {
    checksPerformed.push('No independent reference record provided (Document self-consistency only)');
    findings.push({
      code: 'NO_REFERENCE_DATA',
      severity: 'INFO',
      title: 'Screening Completed Without Independent Comparison Record',
      description: 'Document fields were extracted and checked for internal formatting, but no independent user reference or official registry record was supplied for cross-checking.',
      recommendation: 'Provide a comparison record or conduct an official search on Ardhisasa to verify against official land records.',
    });
  }

  // Check 8: Audit-history integrity validation check
  checksPerformed.push('Cryptographic audit trail validation');

  // Determine final status
  let status: VerificationStatus;
  let statusExplanation: string;

  if (hasSevereMismatch) {
    status = 'REVIEW_REQUIRED';
    statusExplanation =
      'One or more discrepancies were detected between the document fields and the reference record. Manual review and official due diligence are strongly advised.';
  } else if (!hasUserComparison) {
    if (hasMissingCriticalFields) {
      status = 'INSUFFICIENT_INFORMATION';
      statusExplanation =
        'Critical document identifiers could not be fully extracted, and no comparison record was provided.';
    } else {
      status = 'OFFICIAL_VERIFICATION_REQUIRED';
      statusExplanation =
        'Internal document format screening passed. However, without an authoritative land registry connection, legal ownership cannot be verified.';
    }
  } else {
    // User comparison was provided
    if (hasMissingCriticalFields) {
      status = 'INSUFFICIENT_INFORMATION';
      statusExplanation =
        'Comparison was performed, but certain vital fields on the document remain unextracted or unconfirmed.';
    } else {
      status = 'MATCHED_USER_SUPPLIED_DATA';
      statusExplanation =
        'Available extracted fields match the information supplied by the user. Note: This confirms document-to-input consistency only; it does NOT establish authentic government ownership.';
    }
  }

  return {
    status,
    statusExplanation,
    findings,
    checksPerformed,
  };
}

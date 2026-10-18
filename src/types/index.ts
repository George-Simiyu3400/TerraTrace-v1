export type AccountType = 'INDIVIDUAL' | 'COMPANY';

export type IdentityVerificationStatus =
  | 'NOT_STARTED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ACTION_REQUIRED';

export interface UserProfile {
  id: string;
  accountType: AccountType;
  displayName: string;
  email: string;
  phone: string; // e.g. +254...
  country: string;
  identityVerificationStatus: IdentityVerificationStatus;
  idNumber?: string; // Stored securely only when strictly provided
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationProfile {
  id: string;
  ownerUserId: string;
  registeredName: string;
  registrationNumber?: string;
  country: string;
  representativeName: string;
  representativeEmail: string;
  phone: string;
  verificationStatus: 'UNVERIFIED' | 'SELF_DECLARED' | 'VERIFIED';
  createdAt: string;
}

export type DocumentType =
  | 'TITLE_DEED'
  | 'CERTIFICATE_OF_TITLE'
  | 'CERTIFICATE_OF_LEASE'
  | 'MUTATION_FORM'
  | 'ALLOTMENT_LETTER'
  | 'SURVEY_PLAN'
  | 'OFFICIAL_SEARCH'
  | 'OTHER_LAND_DOCUMENT';

export interface LandDocument {
  id: string;
  ownerUserId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  originalSha256: string;
  documentType: DocumentType;
  processingStatus: 'UPLOADED' | 'PROCESSING' | 'EXTRACTED' | 'FAILED';
  privateStoragePath: string;
  uploadedAt: string;
  retentionUntil?: string;
  previewUrl?: string;
}

export interface ExtractedFieldItem {
  value: string;
  confidence: number; // 0 to 1
  isUserCorrected?: boolean;
  originalOcrValue?: string;
  source: 'OCR' | 'AI_ASSISTED' | 'USER_CORRECTED';
}

export interface DocumentExtractedFields {
  parcelNumber?: ExtractedFieldItem;
  titleNumber?: ExtractedFieldItem;
  registeredOwner?: ExtractedFieldItem;
  countyOrLocality?: ExtractedFieldItem;
  landArea?: ExtractedFieldItem;
  documentType?: ExtractedFieldItem;
  registrationDate?: ExtractedFieldItem;
  rawText?: string;
  ocrEngine?: string;
}

export type ReferenceSourceType =
  | 'USER_SUPPLIED_INPUT'
  | 'USER_UPLOADED_REFERENCE'
  | 'OFFICIAL_REGISTRY_PROVIDER'
  | 'NO_REFERENCE_PROVIDED';

export interface ReferenceRecord {
  id: string;
  ownerUserId: string;
  sourceType: ReferenceSourceType;
  sourceName?: string;
  obtainedAt: string;
  parcelNumber?: string;
  titleNumber?: string;
  registeredOwner?: string;
  countyOrLocality?: string;
  landArea?: string;
  registrationDate?: string;
  notes?: string;
  createdAt: string;
}

export type VerificationStatus =
  | 'MATCHED_USER_SUPPLIED_DATA'
  | 'REVIEW_REQUIRED'
  | 'INSUFFICIENT_INFORMATION'
  | 'OFFICIAL_VERIFICATION_REQUIRED'
  | 'OFFICIAL_SOURCE_MATCH'
  | 'PROCESSING_FAILED'
  | 'REFERENCE_UNAVAILABLE';

export interface VerificationFinding {
  code: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'MATCH';
  title: string;
  description: string;
  field?: string;
  extractedValue?: string;
  referenceValue?: string;
  recommendation?: string;
}

export interface VerificationRun {
  id: string;
  ownerUserId: string;
  documentId: string;
  status: VerificationStatus;
  statusExplanation: string;
  extractedFields: DocumentExtractedFields;
  referenceRecord?: ReferenceRecord;
  referenceSourceType: ReferenceSourceType;
  findings: VerificationFinding[];
  checksPerformed: string[];
  documentSha256: string;
  auditRunReference: string;
  officialVerificationStatus: 'NOT_CONNECTED' | 'PENDING' | 'VERIFIED' | 'UNAVAILABLE';
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  verificationRunId: string;
  eventType:
    | 'DOCUMENT_UPLOADED'
    | 'SHA256_FINGERPRINTED'
    | 'OCR_EXTRACTION_COMPLETED'
    | 'FIELDS_CONFIRMED_BY_USER'
    | 'REFERENCE_RECORD_ATTACHED'
    | 'VERIFICATION_RULES_EVALUATED'
    | 'REPORT_GENERATED'
    | 'DOCUMENT_DELETED';
  timestamp: string;
  documentHash: string;
  previousHash: string;
  eventHash: string;
  actorId: string;
  details: Record<string, any>;
}

export interface RegistryStatusResponse {
  providerName: string;
  connected: boolean;
  status: 'NOT_CONNECTED' | 'AUTHORIZED_PENDING' | 'CONNECTED';
  message: string;
  officialPortalUrl: string;
  disclaimer: string;
  supportedLookups: string[];
}

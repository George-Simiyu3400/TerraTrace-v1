import assert from 'node:assert';
import {
  computeEventHash,
  computeSha256,
  createGenesisHash,
  validateAuditChain,
} from '../server/audit.js';
import { defaultBlockchainAdapter } from '../server/blockchainAdapter.js';
import { defaultRegistryProvider } from '../server/registryProvider.js';
import { runVerificationRules } from '../server/verificationEngine.js';
import { AuditEvent, LandDocument } from '../src/types/index.js';

console.log('--- Starting TerraTrace Automated Acceptance Tests ---');

// Test 1: SHA-256 calculation on original file bytes
{
  const bufferA = Buffer.from('Republic of Kenya Title Deed Parcel Nairobi/Block 105/12');
  const hashA = computeSha256(bufferA);
  const hashA2 = computeSha256(bufferA);
  assert.strictEqual(hashA, hashA2, 'SHA-256 must be strictly deterministic');
  assert.strictEqual(hashA.length, 64, 'SHA-256 must be 64 hex characters');
  console.log('✔ Test 1 Passed: SHA-256 deterministic computation verified.');
}

// Test 2: Tamper-evident hash-linked audit chain validation
{
  const genesisHash = createGenesisHash();
  const docHash = computeSha256('TestDocumentBytes');

  const event1Hash = computeEventHash(genesisHash, 'DOCUMENT_UPLOADED', '2026-10-18T10:00:00Z', docHash, {
    fileName: 'sample_deed.png',
  });

  const event1: AuditEvent = {
    id: 'ev-1',
    verificationRunId: 'run-1',
    eventType: 'DOCUMENT_UPLOADED',
    timestamp: '2026-10-18T10:00:00Z',
    documentHash: docHash,
    previousHash: genesisHash,
    eventHash: event1Hash,
    actorId: 'user-1',
    details: { fileName: 'sample_deed.png' },
  };

  const event2Hash = computeEventHash(event1Hash, 'SHA256_FINGERPRINTED', '2026-10-18T10:01:00Z', docHash, {
    algorithm: 'SHA-256',
  });

  const event2: AuditEvent = {
    id: 'ev-2',
    verificationRunId: 'run-1',
    eventType: 'SHA256_FINGERPRINTED',
    timestamp: '2026-10-18T10:01:00Z',
    documentHash: docHash,
    previousHash: event1Hash,
    eventHash: event2Hash,
    actorId: 'user-1',
    details: { algorithm: 'SHA-256' },
  };

  const chain = [event1, event2];
  const validResult = validateAuditChain(chain);
  assert.strictEqual(validResult.isValid, true, 'Original chain must be valid');
  console.log('✔ Test 2 Passed: Audit chain linkage valid.');

  // Test 3: Tampering detection assertion
  const tamperedChain: AuditEvent[] = [
    {
      ...event1,
      details: { fileName: 'forged_deed.png' }, // Alter details without recomputing eventHash
    },
    event2,
  ];

  const tamperedResult = validateAuditChain(tamperedChain);
  assert.strictEqual(tamperedResult.isValid, false, 'Tampered block MUST be detected');
  assert.strictEqual(tamperedResult.tamperedIndex, 0, 'Tampered index must point to event 0');
  console.log('✔ Test 3 Passed: Cryptographic tampering detected immediately.');
}

// Test 4: Verification Engine - Missing critical fields
{
  const mockDoc: LandDocument = {
    id: 'doc-1',
    ownerUserId: 'u-1',
    fileName: 'deed.png',
    fileSize: 1000,
    mimeType: 'image/png',
    originalSha256: 'abc1234567890123456789012345678901234567890123456789012345678901',
    documentType: 'TITLE_DEED',
    processingStatus: 'EXTRACTED',
    privateStoragePath: 'vault/path',
    uploadedAt: new Date().toISOString(),
  };

  // Blank extracted fields
  const result = runVerificationRules({
    userId: 'u-1',
    document: mockDoc,
    extractedFields: {},
    referenceSourceType: 'NO_REFERENCE_PROVIDED',
    existingUserDocuments: [mockDoc],
    existingUserVerifications: [],
  });

  assert.strictEqual(result.status, 'INSUFFICIENT_INFORMATION');
  const hasMissingFinding = result.findings.some((f) => f.code.startsWith('MISSING_'));
  assert.strictEqual(hasMissingFinding, true, 'Must flag missing critical fields');
  console.log('✔ Test 4 Passed: Missing critical fields correctly flagged as INSUFFICIENT_INFORMATION.');
}

// Test 5: Verification Engine - Matching user-supplied data
{
  const mockDoc: LandDocument = {
    id: 'doc-2',
    ownerUserId: 'u-1',
    fileName: 'deed2.png',
    fileSize: 2000,
    mimeType: 'image/png',
    originalSha256: '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff',
    documentType: 'TITLE_DEED',
    processingStatus: 'EXTRACTED',
    privateStoragePath: 'vault/path2',
    uploadedAt: new Date().toISOString(),
  };

  const result = runVerificationRules({
    userId: 'u-1',
    document: mockDoc,
    extractedFields: {
      parcelNumber: { value: 'NAIROBI/BLOCK 105/12', confidence: 0.95, source: 'OCR' },
      titleNumber: { value: 'TITLE NO. 88392', confidence: 0.92, source: 'OCR' },
      registeredOwner: { value: 'KIPCHOGE KEINO', confidence: 0.9, source: 'OCR' },
      countyOrLocality: { value: 'Nairobi', confidence: 0.9, source: 'OCR' },
    },
    referenceRecord: {
      id: 'ref-1',
      ownerUserId: 'u-1',
      sourceType: 'USER_SUPPLIED_INPUT',
      obtainedAt: new Date().toISOString(),
      parcelNumber: 'NAIROBI/BLOCK 105/12',
      titleNumber: 'TITLE NO. 88392',
      registeredOwner: 'KIPCHOGE KEINO',
      countyOrLocality: 'Nairobi',
      createdAt: new Date().toISOString(),
    },
    referenceSourceType: 'USER_SUPPLIED_INPUT',
    existingUserDocuments: [mockDoc],
    existingUserVerifications: [],
  });

  assert.strictEqual(result.status, 'MATCHED_USER_SUPPLIED_DATA');
  console.log('✔ Test 5 Passed: Matching fields correctly categorized as MATCHED_USER_SUPPLIED_DATA.');
}

// Test 6: Verification Engine - Discrepancy triggers REVIEW_REQUIRED
{
  const mockDoc: LandDocument = {
    id: 'doc-3',
    ownerUserId: 'u-1',
    fileName: 'deed3.png',
    fileSize: 3000,
    mimeType: 'image/png',
    originalSha256: '222233334444555566667777888899990000aaaabbbbccccddddeeeeffff1111',
    documentType: 'TITLE_DEED',
    processingStatus: 'EXTRACTED',
    privateStoragePath: 'vault/path3',
    uploadedAt: new Date().toISOString(),
  };

  const result = runVerificationRules({
    userId: 'u-1',
    document: mockDoc,
    extractedFields: {
      parcelNumber: { value: 'NAIROBI/BLOCK 105/12', confidence: 0.95, source: 'OCR' },
      registeredOwner: { value: 'JOHN DOE', confidence: 0.9, source: 'OCR' },
    },
    referenceRecord: {
      id: 'ref-2',
      ownerUserId: 'u-1',
      sourceType: 'USER_SUPPLIED_INPUT',
      obtainedAt: new Date().toISOString(),
      parcelNumber: 'KIAMBU/MUGUGA/999', // Discrepant parcel number
      registeredOwner: 'JOHN DOE',
      createdAt: new Date().toISOString(),
    },
    referenceSourceType: 'USER_SUPPLIED_INPUT',
    existingUserDocuments: [mockDoc],
    existingUserVerifications: [],
  });

  assert.strictEqual(result.status, 'REVIEW_REQUIRED');
  const mismatch = result.findings.find((f) => f.code === 'PARCEL_MISMATCH');
  assert.ok(mismatch, 'Must contain PARCEL_MISMATCH finding');
  console.log('✔ Test 6 Passed: Conflicting fields trigger REVIEW_REQUIRED.');
}

// Test 7: Official Registry Provider strictly NOT_CONNECTED
{
  const status = await defaultRegistryProvider.getStatus();
  assert.strictEqual(status.status, 'NOT_CONNECTED');
  assert.strictEqual(status.connected, false);
  assert.ok(status.officialPortalUrl.includes('ardhisasa.lands.go.ke'));
  console.log('✔ Test 7 Passed: Registry returns NOT_CONNECTED and guides to Ardhisasa.');
}

// Test 8: Blockchain Adapter returns honest disconnected status
{
  const status = await defaultBlockchainAdapter.getStatus();
  assert.strictEqual(status.status, 'NOT_CONNECTED');
  assert.ok(status.message.includes('Blockchain anchoring is not connected'));
  console.log('✔ Test 8 Passed: Blockchain adapter returns strictly honest disconnected state.');
}

console.log('--- All 8 Acceptance Test Suites Executed Successfully! ---');

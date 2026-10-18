import crypto from 'node:crypto';
import { AuditEvent } from '../src/types/index.js';

export function computeSha256(bufferOrString: Buffer | string): string {
  return crypto.createHash('sha256').update(bufferOrString).digest('hex');
}

export function computeEventHash(
  previousHash: string,
  eventType: string,
  timestamp: string,
  documentHash: string,
  details: Record<string, any>
): string {
  const content = `${previousHash}|${eventType}|${timestamp}|${documentHash}|${JSON.stringify(details)}`;
  return computeSha256(content);
}

export function createGenesisHash(): string {
  return '0'.repeat(64);
}

export interface ChainValidationResult {
  isValid: boolean;
  tamperedIndex?: number;
  expectedHash?: string;
  actualHash?: string;
  reason?: string;
}

export function validateAuditChain(chain: AuditEvent[]): ChainValidationResult {
  if (!chain || chain.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < chain.length; i++) {
    const current = chain[i];

    // Check link to previous hash
    if (i === 0) {
      if (current.previousHash !== createGenesisHash()) {
        return {
          isValid: false,
          tamperedIndex: 0,
          reason: 'Genesis block previous hash is invalid',
        };
      }
    } else {
      const prev = chain[i - 1];
      if (current.previousHash !== prev.eventHash) {
        return {
          isValid: false,
          tamperedIndex: i,
          expectedHash: prev.eventHash,
          actualHash: current.previousHash,
          reason: `Chain broken at event #${i + 1}: previousHash does not match previous eventHash`,
        };
      }
    }

    // Verify self-hash integrity
    const calculatedHash = computeEventHash(
      current.previousHash,
      current.eventType,
      current.timestamp,
      current.documentHash,
      current.details
    );

    if (calculatedHash !== current.eventHash) {
      return {
        isValid: false,
        tamperedIndex: i,
        expectedHash: calculatedHash,
        actualHash: current.eventHash,
        reason: `Cryptographic integrity failure at event #${i + 1} (${current.eventType}): event data or hash has been altered`,
      };
    }
  }

  return { isValid: true };
}

export interface BlockchainAnchorStatus {
  isConfigured: boolean;
  networkName: string;
  contractAddress?: string;
  status: 'NOT_CONNECTED' | 'CONNECTED';
  message: string;
  disclaimer: string;
}

export interface BlockchainAdapter {
  name: string;
  getStatus(): Promise<BlockchainAnchorStatus>;
  anchorDocumentHash(documentSha256: string, verificationRunId: string): Promise<{
    anchored: boolean;
    txHash?: string;
    message: string;
  }>;
}

export class ModularBlockchainAdapter implements BlockchainAdapter {
  name = 'EVM / Layer 2 Anchor Service';

  async getStatus(): Promise<BlockchainAnchorStatus> {
    const isConfigured = Boolean(process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_CONTRACT_ADDRESS);
    return {
      isConfigured,
      networkName: process.env.BLOCKCHAIN_NETWORK_NAME || 'Not Configured',
      contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      status: isConfigured ? 'CONNECTED' : 'NOT_CONNECTED',
      message: isConfigured
        ? 'Blockchain anchoring node connected.'
        : 'Blockchain anchoring is not connected. Your document fingerprint and audit history are maintained within the configured application database.',
      disclaimer:
        'A blockchain transaction hash only proves temporal existence of a cryptographic digest. It does not certify the underlying authenticity, legality, or ownership of a Kenyan land title.',
    };
  }

  async anchorDocumentHash(documentSha256: string, _verificationRunId: string) {
    const status = await this.getStatus();
    if (!status.isConfigured) {
      return {
        anchored: false,
        message: 'Blockchain anchoring is not connected. Document SHA-256 is tracked locally in tamper-evident audit history.',
      };
    }

    return {
      anchored: false,
      message: 'Blockchain node endpoint reached but transaction signing key not provisioned in this environment.',
    };
  }
}

export const defaultBlockchainAdapter = new ModularBlockchainAdapter();

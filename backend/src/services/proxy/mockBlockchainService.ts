import { logger } from '../../utils/logger';

const mockBlockchainStorage = new Map<string, {
  hash: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
  recorder: string;
}>();

let mockBlockNumber = 1000000;

export default class MockBlockchainService {
  static async recordDocumentHash(documentId: string, hash: string): Promise<string> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));

      const txHash = '0x' + Buffer.from(`${documentId}-${Date.now()}-${Math.random()}`).toString('hex').slice(0, 64).padEnd(64, '0');
      const blockNumber = mockBlockNumber++;

      mockBlockchainStorage.set(documentId, {
        hash: hash.toLowerCase(),
        timestamp: Date.now(),
        blockNumber,
        txHash,
        recorder: 'mock-signer'
      });

      logger.info('🔸 Mock Blockchain: Document hash recorded', {
        documentId,
        hash: hash.slice(0, 10) + '...',
        txHash: txHash.slice(0, 10) + '...',
        blockNumber,
        provider: 'mock-blockchain'
      });

      return txHash;
    } catch (error) {
      logger.error('🔸 Mock Blockchain: Recording failed:', error);
      throw new Error(`Mock blockchain recording failed: ${error}`);
    }
  }

  static async verifyDocumentHash(documentId: string, expectedHash: string): Promise<boolean> {
    try {
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800));

      const stored = mockBlockchainStorage.get(documentId);

      if (!stored) {
        logger.warn('🔸 Mock Blockchain: Document not found', { documentId });
        return false;
      }

      const normalizedExpected = expectedHash.toLowerCase();
      const isValid = stored.hash === normalizedExpected;

      logger.info('🔸 Mock Blockchain: Verification completed', {
        documentId,
        expectedHash: normalizedExpected.slice(0, 10) + '...',
        storedHash: stored.hash.slice(0, 10) + '...',
        isValid,
        blockNumber: stored.blockNumber,
        provider: 'mock-blockchain'
      });

      return isValid;
    } catch (error) {
      logger.error('🔸 Mock Blockchain: Verification failed:', error);
      return false;
    }
  }

  static async getDocumentHash(documentId: string): Promise<string | null> {
    const stored = mockBlockchainStorage.get(documentId);

    if (stored) {
      logger.debug('🔸 Mock Blockchain: Hash retrieved', {
        documentId,
        hash: stored.hash.slice(0, 10) + '...'
      });
    }

    return stored ? stored.hash : null;
  }

  static async recordMultipleDocuments(documents: Array<{id: string, hash: string}>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const batchTxHash = '0xbatch' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10).padEnd(56, '0');
    const batchBlockNumber = mockBlockNumber++;

    documents.forEach(doc => {
      mockBlockchainStorage.set(doc.id, {
        hash: doc.hash.toLowerCase(),
        timestamp: Date.now(),
        blockNumber: batchBlockNumber,
        txHash: batchTxHash,
        recorder: 'mock-signer'
      });
    });

    logger.info('🔸 Mock Blockchain: Batch documents recorded', {
      count: documents.length,
      batchTxHash: batchTxHash.slice(0, 10) + '...',
      blockNumber: batchBlockNumber
    });

    return batchTxHash;
  }

  static async documentExists(documentId: string): Promise<boolean> {
    return mockBlockchainStorage.has(documentId);
  }

  static async getNetworkInfo(): Promise<{chainId: number, name: string}> {
    return {
      chainId: 31337,
      name: 'mock-network'
    };
  }

  static async getContractAddress(): Promise<string> {
    return '0xMockContractAddress123456789abcdef';
  }

  static async getSignerBalance(): Promise<string> {
    return '100.0';
  }

  static async healthCheck(): Promise<boolean> {
    return true;
  }

  static getAllRecords(): Array<{documentId: string, data: any}> {
    return Array.from(mockBlockchainStorage.entries()).map(([documentId, data]) => ({
      documentId,
      data
    }));
  }

  static clearAllData(): void {
    mockBlockchainStorage.clear();
    mockBlockNumber = 1000000;
    logger.info('🔸 Mock Blockchain: All data cleared');
  }

  static getStats(): {
    totalDocuments: number;
    currentBlock: number;
    totalTransactions: number;
  } {
    return {
      totalDocuments: mockBlockchainStorage.size,
      currentBlock: mockBlockNumber,
      totalTransactions: mockBlockchainStorage.size
    };
  }
}

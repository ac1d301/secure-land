import crypto from 'crypto';
import { logger } from '../utils/logger';

type StoredRecord = {
  hash: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
  recorder: string;
};

type BlockchainStats = {
  totalDocuments: number;
  currentBlock: number;
  totalTransactions: number;
  delays: {
    enabled: boolean;
    minDelay: number;
    maxDelay: number;
  };
};

const DEFAULT_MIN_DELAY = 500;
const DEFAULT_MAX_DELAY = 2000;

const parseDelay = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const delaysEnabled = (): boolean => {
  const flag = process.env.MOCK_ENABLE_REALISTIC_DELAYS;
  if (!flag) {
    return true;
  }
  return flag.toLowerCase() !== 'false';
};

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

class BlockchainService {
  private static storage = new Map<string, StoredRecord>();
  private static blockNumber = 1000000;
  private static totalTransactions = 0;
  private static initialized = false;

  private static getDelayRange(): { min: number; max: number } {
    const min = parseDelay(process.env.MOCK_BLOCKCHAIN_MIN_DELAY, DEFAULT_MIN_DELAY);
    const max = parseDelay(process.env.MOCK_BLOCKCHAIN_MAX_DELAY, DEFAULT_MAX_DELAY);
    if (max < min) {
      return { min, max: min };
    }
    return { min, max };
  }

  private static async simulateDelay(): Promise<void> {
    if (!delaysEnabled()) {
      return;
    }
    const { min, max } = this.getDelayRange();
    const duration = min + Math.random() * (max - min);
    await wait(duration);
  }

  private static generateTransactionHash(documentId: string): string {
    const seed = `${documentId}-${Date.now()}-${Math.random()}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    return `0x${hash}`;
  }

  static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const { min, max } = this.getDelayRange();
    logger.info('🔧 Mock Blockchain: Service initialized', {
      delaysEnabled: delaysEnabled(),
      minDelay: min,
      maxDelay: max
    });
  }

  static getStats(): BlockchainStats {
    const { min, max } = this.getDelayRange();
    return {
      totalDocuments: this.storage.size,
      currentBlock: this.blockNumber,
      totalTransactions: this.totalTransactions,
      delays: {
        enabled: delaysEnabled(),
        minDelay: min,
        maxDelay: max
      }
    };
  }

  static async recordDocumentHash(
    documentId: string,
    hash: string,
    _options: { waitForConfirmation?: boolean } = {}
  ): Promise<string> {
    await this.initialize();
    await this.simulateDelay();

    if (!documentId || !hash) {
      throw new Error('Document ID and hash are required');
    }

    const normalizedHash = hash.toLowerCase();
    const txHash = this.generateTransactionHash(documentId);
    const blockNumber = this.blockNumber++;

    this.storage.set(documentId, {
      hash: normalizedHash,
      timestamp: Date.now(),
      blockNumber,
      txHash,
      recorder: 'mock-signer'
    });

    this.totalTransactions += 1;

    logger.info('🔗 Mock Blockchain: Document hash recorded successfully', {
      documentId,
      hash: normalizedHash.slice(0, 10),
      txHash: `${txHash.slice(0, 10)}...`,
      blockNumber
    });

    return txHash;
  }

  static async recordMultipleDocuments(documents: Array<{ id: string; hash: string }>): Promise<string> {
    await this.initialize();

    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('At least one document is required');
    }

    await this.simulateDelay();

    const batchHash = crypto.createHash('sha256').update(`${Date.now()}-${documents.length}-${Math.random()}`).digest('hex');
    const batchTxHash = `0x${batchHash}`;
    const batchBlockNumber = this.blockNumber++;

    documents.forEach(doc => {
      const normalized = doc.hash.toLowerCase();
      this.storage.set(doc.id, {
        hash: normalized,
        timestamp: Date.now(),
        blockNumber: batchBlockNumber,
        txHash: batchTxHash,
        recorder: 'mock-signer'
      });
    });

    this.totalTransactions += documents.length;

    logger.info('🔗 Mock Blockchain: Batch documents recorded', {
      count: documents.length,
      txHash: `${batchTxHash.slice(0, 10)}...`,
      blockNumber: batchBlockNumber
    });

    return batchTxHash;
  }

  static async verifyDocumentHash(documentId: string, expectedHash: string): Promise<boolean> {
    await this.initialize();
    await this.simulateDelay();

    const stored = this.storage.get(documentId);
    if (!stored) {
      logger.warn('🔗 Mock Blockchain: Document not found during verification', { documentId });
      return false;
    }

    const normalizedExpected = expectedHash.toLowerCase();
    const isValid = stored.hash === normalizedExpected;

    logger.info('🔗 Mock Blockchain: Verification completed', {
      documentId,
      expectedHash: normalizedExpected.slice(0, 10),
      storedHash: stored.hash.slice(0, 10),
      isValid,
      blockNumber: stored.blockNumber
    });

    return isValid;
  }

  static async getDocumentHash(documentId: string): Promise<string | null> {
    await this.initialize();
    const stored = this.storage.get(documentId);
    if (stored) {
      logger.debug('🔗 Mock Blockchain: Hash retrieved', {
        documentId,
        hash: stored.hash.slice(0, 10)
      });
      return stored.hash;
    }
    return null;
  }

  static async documentExists(documentId: string): Promise<boolean> {
    await this.initialize();
    return this.storage.has(documentId);
  }

  static async getNetworkInfo(): Promise<{ chainId: number; name: string }> {
    await this.initialize();
    return {
      chainId: 31337,
      name: 'secureland-mocknet'
    };
  }

  static async getContractAddress(): Promise<string> {
    await this.initialize();
    return '0xMockContractAddress123456789abcdef';
  }

  static async getSignerBalance(): Promise<string> {
    await this.initialize();
    return '100.0';
  }

  static async healthCheck(): Promise<boolean> {
    await this.initialize();
    return true;
  }

  static getAllRecords(): Array<{ documentId: string; data: StoredRecord }> {
    return Array.from(this.storage.entries()).map(([documentId, data]) => ({
      documentId,
      data
    }));
  }

  static async getRecordDetails(documentId: string): Promise<StoredRecord | null> {
    await this.initialize();
    return this.storage.get(documentId) ?? null;
  }

  static clearAllData(): void {
    this.storage.clear();
    this.blockNumber = 1000000;
    this.totalTransactions = 0;
    logger.info('🔗 Mock Blockchain: All data cleared');
  }
}

export default BlockchainService;

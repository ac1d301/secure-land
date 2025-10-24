import axios from 'axios';
import { logger } from '../../utils/logger';

const BLOCKCHAIN_API_BASE = process.env.BLOCKCHAIN_API_BASE || 'https://api.secureland.io';
const BLOCKCHAIN_API_KEY = process.env.BLOCKCHAIN_API_KEY || '';

const apiClient = axios.create({
  baseURL: BLOCKCHAIN_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    ...(BLOCKCHAIN_API_KEY && { 'Authorization': `Bearer ${BLOCKCHAIN_API_KEY}` })
  }
});

apiClient.interceptors.request.use(
  (config) => {
    logger.debug('🌐 Blockchain API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL
    });
    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => {
    logger.debug('🌐 Blockchain API Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    logger.error('🌐 Blockchain API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

export default class ExternalBlockchainProxy {
  static async recordDocumentHash(documentId: string, hash: string): Promise<string> {
    try {
      logger.info('🌐 External API: Recording document hash', { documentId });

      const response = await apiClient.post('/blockchain/record', {
        documentId,
        hash,
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
        timestamp: new Date().toISOString()
      });

      const { txHash, status, blockNumber } = response.data;

      if (status !== 'success' && status !== 'pending') {
        throw new Error(`Recording failed with status: ${status}`);
      }

      logger.info('🌐 External API: Document hash recorded successfully', {
        documentId,
        txHash: txHash?.slice(0, 10) + '...',
        blockNumber,
        status,
        provider: 'external-blockchain-api'
      });

      return txHash;
    } catch (error: any) {
      logger.error('🌐 External API: Blockchain recording failed:', error);

      if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded: Too many requests');
      } else if (error.response?.status >= 500) {
        throw new Error('External service unavailable: Server error');
      }

      throw new Error(`Blockchain recording failed: ${error.message}`);
    }
  }

  static async verifyDocumentHash(documentId: string, expectedHash: string): Promise<boolean> {
    try {
      logger.info('🌐 External API: Verifying document hash', { documentId });

      const response = await apiClient.post('/blockchain/verify', {
        documentId,
        expectedHash,
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia'
      });

      const { isValid, onChainHash, blockNumber } = response.data;

      logger.info('🌐 External API: Verification completed', {
        documentId,
        isValid,
        onChainHash: onChainHash?.slice(0, 10) + '...',
        blockNumber,
        provider: 'external-blockchain-api'
      });

      return Boolean(isValid);
    } catch (error: any) {
      logger.error('🌐 External API: Blockchain verification failed:', error);

      if (error.response?.status === 404) {
        logger.warn('🌐 External API: Document not found on blockchain');
        return false;
      }

      return false;
    }
  }

  static async getDocumentHash(documentId: string): Promise<string | null> {
    try {
      const response = await apiClient.get(`/blockchain/document/${documentId}`, {
        params: {
          network: process.env.BLOCKCHAIN_NETWORK || 'sepolia'
        }
      });

      const { exists, hash } = response.data;

      logger.debug('🌐 External API: Document hash retrieved', {
        documentId,
        exists,
        hash: hash?.slice(0, 10) + '...'
      });

      return exists ? hash : null;
    } catch (error: any) {
      logger.error('🌐 External API: Get document hash failed:', error);

      if (error.response?.status === 404) {
        return null;
      }

      return null;
    }
  }

  static async recordMultipleDocuments(documents: Array<{id: string, hash: string}>): Promise<string> {
    try {
      const response = await apiClient.post('/blockchain/batch-record', {
        documents,
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
        timestamp: new Date().toISOString()
      });

      const { batchTxHash, status, processedCount } = response.data;

      logger.info('🌐 External API: Batch documents recorded', {
        count: documents.length,
        processedCount,
        batchTxHash: batchTxHash?.slice(0, 10) + '...',
        status
      });

      return batchTxHash;
    } catch (error: any) {
      logger.error('🌐 External API: Batch recording failed:', error);
      throw new Error(`Batch recording failed: ${error.message}`);
    }
  }

  static async documentExists(documentId: string): Promise<boolean> {
    const hash = await this.getDocumentHash(documentId);
    return hash !== null;
  }

  static async getNetworkInfo(): Promise<{chainId: number, name: string}> {
    try {
      const response = await apiClient.get('/blockchain/network-info');

      const { chainId, name, blockNumber } = response.data;

      logger.debug('🌐 External API: Network info retrieved', {
        chainId, name, blockNumber
      });

      return { chainId: Number(chainId), name };
    } catch (error) {
      logger.warn('🌐 External API: Failed to get network info, using defaults');
      return { chainId: 11155111, name: 'sepolia' };
    }
  }

  static async getContractAddress(): Promise<string> {
    try {
      const response = await apiClient.get('/blockchain/contract-info');
      return response.data?.address || 'unknown';
    } catch (error) {
      return 'external-api-managed';
    }
  }

  static async getSignerBalance(): Promise<string> {
    try {
      const response = await apiClient.get('/blockchain/signer-balance');
      return response.data?.balance || '0';
    } catch (error) {
      return 'managed-externally';
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health', { timeout: 5000 });

      logger.info('🌐 External API: Health check passed', {
        status: response.status,
        provider: 'external-blockchain-api'
      });

      return response.status === 200;
    } catch (error) {
      logger.error('🌐 External API: Health check failed:', error);
      return false;
    }
  }

  static async getUsageStats(): Promise<any> {
    try {
      const response = await apiClient.get('/blockchain/usage-stats');
      return response.data;
    } catch (error) {
      logger.warn('🌐 External API: Usage stats not available');
      return null;
    }
  }
}

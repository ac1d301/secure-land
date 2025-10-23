import { ethers } from 'ethers';
import { 
  getBlockchainConfig, 
  getRetryConfig, 
  getGasSettings, 
  isEthereumAddress,
  isTransactionHash
} from '../config/blockchain';
import { logger } from '../utils/logger';

// Smart Contract ABI for SecureLand
const SECURE_LAND_ABI = [
  // Record single document
  {
    "inputs": [
      {"internalType": "string", "name": "documentId", "type": "string"},
      {"internalType": "bytes32", "name": "hash", "type": "bytes32"}
    ],
    "name": "recordDocumentHash",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Record multiple documents
  {
    "inputs": [
      {"internalType": "string[]", "name": "documentIds", "type": "string[]"},
      {"internalType": "bytes32[]", "name": "hashes", "type": "bytes32[]"}
    ],
    "name": "recordDocumentHashes",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Verify document
  {
    "inputs": [
      {"internalType": "string", "name": "documentId", "type": "string"},
      {"internalType": "bytes32", "name": "hash", "type": "bytes32"}
    ],
    "name": "verifyDocumentHash",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Get document hash
  {
    "inputs": [{"internalType": "string", "name": "documentId", "type": "string"}],
    "name": "getDocumentHash",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Get document metadata
  {
    "inputs": [{"internalType": "string", "name": "documentId", "type": "string"}],
    "name": "getDocumentMetadata",
    "outputs": [
      {"internalType": "bytes32", "name": "hash", "type": "bytes32"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "address", "name": "recorder", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

type RetryOptions = {
  maxRetries: number;
  initialBackoff: number;
  maxBackoff: number;
  factor: number;
};

export class BlockchainService {
  private static contract: ethers.Contract | null = null;
  private static provider: ethers.JsonRpcProvider | null = null;
  private static signer: ethers.Wallet | null = null;
  private static config: ReturnType<typeof getBlockchainConfig> | null = null;

  /**
   * Initialize blockchain service with configuration
   */
  static async initialize(): Promise<void> {
    try {
      this.config = getBlockchainConfig();
      this.provider = this.config.provider;
      this.signer = this.config.signer;
      
      // Create contract instance with signer for write operations
      this.contract = new ethers.Contract(
        this.config.contractAddress,
        SECURE_LAND_ABI,
        this.signer
      );

      logger.info('Blockchain service initialized', {
        network: this.config.network,
        contractAddress: this.config.contractAddress,
        signerAddress: await this.signer.getAddress()
      });
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw new Error(`Blockchain service initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a function with retry logic and exponential backoff
   */
  private static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        if (result === undefined) {
          throw new Error('Operation returned undefined');
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
          logger.warn(`Operation failed, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries}):`, error);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          throw lastError;
        }
      }
    }
    
    throw lastError || new Error('Unknown error in retry operation');
  }

  /**
   * Wait for transaction confirmation
   */
  static async waitForConfirmation(
    txHash: string,
    confirmations: number = this.config.requiredConfirmations
  ): Promise<ethers.TransactionReceipt> {
    if (!isTransactionHash(txHash)) {
      throw new Error(`Invalid transaction hash: ${txHash}`);
    }

    try {
      logger.info(`Waiting for ${confirmations} confirmations for tx: ${txHash}`);
      const receipt = await this.withRetry(async () => {
        const tx = await this.provider.getTransaction(txHash);
        if (!tx) {
          throw new Error(`Transaction not found: ${txHash}`);
        }
        const receipt = await tx.wait(confirmations);
        if (!receipt) {
          throw new Error(`No receipt received for transaction: ${txHash}`);
        }
        return receipt;
      });

      if (!receipt) {
        throw new Error(`Failed to get receipt for transaction: ${txHash}`);
      }

      if (receipt.status === 0) {
        throw new Error(`Transaction ${txHash} failed`);
      }

      logger.info(`Transaction confirmed: ${txHash}`, {
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations,
        gasUsed: receipt.gasUsed?.toString() || '0',
        effectiveGasPrice: receipt.gasPrice?.toString() || '0'
      });

      return receipt;
    } catch (error) {
      logger.error(`Failed to confirm transaction ${txHash}:`, error);
      throw new Error(`Transaction confirmation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Estimate gas for a contract method
   */
  static async estimateGas(
    method: string,
    params: any[]
  ): Promise<bigint> {
    try {
      if (!this.contract) await this.initialize();
      
      const contractMethod = this.contract[method as keyof typeof this.contract];
      if (!contractMethod || typeof contractMethod.estimateGas !== 'function') {
        throw new Error(`Method ${method} not found or not callable`);
      }
      
      const gasEstimate = await contractMethod.estimateGas(...params);
      // Add 20% buffer to the estimate using bigint operations
      const gasEstimateBigInt = typeof gasEstimate === 'bigint' ? gasEstimate : BigInt(gasEstimate.toString());
      const gasWithBuffer = (gasEstimateBigInt * 120n) / 100n;
      return gasWithBuffer;
    } catch (error) {
      logger.error(`Gas estimation failed for ${method}:`, error);
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Record a document hash on the blockchain
   */
  static async recordDocumentHash(
    documentId: string,
    hash: string,
    options: { waitForConfirmation?: boolean } = { waitForConfirmation: true }
  ): Promise<string> {
    try {
      if (!this.contract) await this.initialize();

      // Validate inputs
      if (!documentId || !hash) {
        throw new Error('Document ID and hash are required');
      }

      // Convert hex string to bytes32
      const hashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(hash));
      
      // Get gas settings
      const gasSettings = getGasSettings();
      
      // Estimate gas
      const estimatedGas = await this.estimateGas('recordDocumentHash', [documentId, hashBytes32]);
      
      // Send transaction
      const tx = await this.withRetry(async () => {
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }
        // Type assertion since we know this method exists from the ABI
        const contractWithMethods = this.contract as unknown as {
          recordDocumentHash: (id: string, hash: string, options: any) => Promise<ethers.TransactionResponse>;
        };
        return contractWithMethods.recordDocumentHash(documentId, hashBytes32, {
          ...gasSettings,
          gasLimit: estimatedGas
        });
      });

      logger.info(`Document hash recorded on blockchain`, {
        documentId,
        txHash: tx.hash,
        blockNumber: tx.blockNumber
      });

      // Wait for confirmation if requested
      if (options.waitForConfirmation) {
        await this.waitForConfirmation(tx.hash);
      }

      return tx.hash;
    } catch (error) {
      logger.error('Failed to record document hash on blockchain:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to record document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Record multiple document hashes in a single transaction
   */
  static async recordMultipleDocuments(
    documents: Array<{ id: string; hash: string }>,
    options: { waitForConfirmation?: boolean } = { waitForConfirmation: true }
  ): Promise<string> {
    try {
      if (!this.contract) await this.initialize();

      // Validate inputs
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('At least one document is required');
      }

      // Process documents
      const documentIds = documents.map(doc => doc.id);
      const hashes = documents.map(doc => ethers.keccak256(ethers.toUtf8Bytes(doc.hash)));
      
      // Get gas settings
      const gasSettings = getGasSettings();
      
      // Estimate gas (with some buffer for multiple documents)
      const estimatedGas = await this.estimateGas('recordDocumentHashes', [documentIds, hashes]);
      const bufferPercentage = BigInt(100 + (documents.length * 5));
      const gasWithBuffer = (estimatedGas * bufferPercentage) / 100n;
      
      // Send transaction
      const tx = await this.withRetry(async () => {
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }
        // Type assertion since we know this method exists from the ABI
        const contractWithMethods = this.contract as unknown as {
          recordDocumentHashes: (ids: string[], hashes: string[], options: any) => Promise<ethers.TransactionResponse>;
        };
        return contractWithMethods.recordDocumentHashes(documentIds, hashes, {
          ...gasSettings,
          gasLimit: gasWithBuffer
        });
      });

      logger.info(`Batch document hashes recorded on blockchain`, {
        documentCount: documents.length,
        txHash: tx.hash,
        blockNumber: tx.blockNumber
      });

      // Wait for confirmation if requested
      if (options.waitForConfirmation) {
        await this.waitForConfirmation(tx.hash);
      }

      return tx.hash;
    } catch (error) {
      logger.error('Failed to record multiple documents on blockchain:', {
        documentCount: documents?.length,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to record documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Verify a document hash on the blockchain
   */
  static async verifyDocumentHash(
    documentId: string,
    hash: string
  ): Promise<boolean> {
    try {
      };
      return await contractWithMethods.verifyDocumentHash(documentId, hashBytes32);
    });

    logger.info(`Document verification ${isValid ? 'succeeded' : 'failed'}`, {
      documentId,
      isValid
    });
    try {
      const hash = await this.getDocumentHash(documentId);
      return hash !== null;
    } catch (error) {
      logger.error('Failed to check if document exists on blockchain:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}

export default BlockchainService;

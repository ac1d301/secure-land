import { logger } from '../utils/logger';
import { BlockchainService, IPFSService } from './proxySelector';
import DocumentService from './documentService';

export interface IntegrityCheckResult {
  documentId: string;
  documentExists: boolean;
  fileHashValid: boolean;
  blockchainRecordExists: boolean;
  hashesMatch: boolean;
  ipfsAccessible: boolean;
  metadataValid: boolean;
  lastVerified: Date;
  blockchainHash?: string;
  ipfsCid?: string;
  errors: string[];
  warnings: string[];
  overallStatus: 'verified' | 'tampered' | 'not_recorded' | 'unavailable' | 'error';
}

export interface BatchIntegrityResult {
  totalDocuments: number;
  verified: number;
  tampered: number;
  notRecorded: number;
  unavailable: number;
  errors: number;
  results: IntegrityCheckResult[];
}

export class DocumentIntegrityService {
  
  /**
   * Comprehensive document integrity check using proxy services
   */
  static async performIntegrityCheck(documentId: string): Promise<IntegrityCheckResult> {
    const result: IntegrityCheckResult = {
      documentId,
      documentExists: false,
      fileHashValid: false,
      blockchainRecordExists: false,
      hashesMatch: false,
      ipfsAccessible: false,
      metadataValid: false,
      lastVerified: new Date(),
      errors: [],
      warnings: [],
      overallStatus: 'error'
    };

    try {
      logger.info('Starting comprehensive integrity check', { documentId });

      // Step 1: Check document exists in database
      const document = await DocumentService.getDocumentById(documentId);
      if (!document) {
        result.errors.push('Document not found in database');
        result.overallStatus = 'unavailable';
        return result;
      }

      result.documentExists = true;
      result.ipfsCid = document.ipfsCid;

      // Step 2: Validate hash format
      if (!/^[a-f0-9]{64}$/i.test(document.hash)) {
        result.errors.push('Invalid hash format in database');
      } else {
        result.fileHashValid = true;
      }

      // Step 3: Check blockchain record (using proxy service)
      try {
        const blockchainHash = await BlockchainService.getDocumentHash(documentId);
        result.blockchainRecordExists = blockchainHash !== null;
        
        if (blockchainHash) {
          result.blockchainHash = blockchainHash;
          const normalizedBlockchainHash = blockchainHash.toLowerCase();
          const normalizedDocHash = document.hash.toLowerCase();
          result.hashesMatch = normalizedBlockchainHash === normalizedDocHash;
          
          if (!result.hashesMatch) {
            result.errors.push('Hash mismatch between database and blockchain');
          }
        } else {
          result.warnings.push('Document not recorded on blockchain');
        }
      } catch (error) {
        result.errors.push(`Blockchain check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Step 4: Check IPFS accessibility (using proxy service)
      if (document.ipfsCid) {
        try {
          result.ipfsAccessible = await IPFSService.isAvailable(document.ipfsCid);
          if (!result.ipfsAccessible) {
            result.warnings.push('Document not accessible via IPFS');
          }
        } catch (error) {
          result.errors.push(`IPFS check failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        result.errors.push('No IPFS CID found');
      }

      // Step 5: Validate metadata
      try {
        if (document.metadata && typeof document.metadata === 'object') {
          result.metadataValid = true;
        } else if (!document.metadata) {
          result.warnings.push('No metadata found');
          result.metadataValid = true; // Not required
        }
      } catch (error) {
        result.errors.push('Invalid metadata format');
      }

      // Step 6: Determine overall status
      if (result.errors.length === 0) {
        if (result.blockchainRecordExists && result.hashesMatch && result.ipfsAccessible) {
          result.overallStatus = 'verified';
        } else if (result.blockchainRecordExists && !result.hashesMatch) {
          result.overallStatus = 'tampered';
        } else if (!result.blockchainRecordExists) {
          result.overallStatus = 'not_recorded';
        } else if (!result.ipfsAccessible) {
          result.overallStatus = 'unavailable';
        }
      }

      logger.info('Integrity check completed', {
        documentId,
        status: result.overallStatus,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;
    } catch (error) {
      logger.error('Integrity check failed:', error);
      result.errors.push(`Integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
      result.overallStatus = 'error';
      return result;
    }
  }

  /**
   * Batch integrity check for multiple documents
   */
  static async performBatchIntegrityCheck(documentIds: string[]): Promise<BatchIntegrityResult> {
    logger.info('📦 Starting batch integrity check', { count: documentIds.length });

    const results: IntegrityCheckResult[] = [];
    
    // Process documents in parallel (with concurrency limit)
    const concurrency = 5;
    for (let i = 0; i < documentIds.length; i += concurrency) {
      const batch = documentIds.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(docId => this.performIntegrityCheck(docId))
      );
      results.push(...batchResults);
    }

    // Aggregate results
    const summary = {
      totalDocuments: results.length,
      verified: results.filter(r => r.overallStatus === 'verified').length,
      tampered: results.filter(r => r.overallStatus === 'tampered').length,
      notRecorded: results.filter(r => r.overallStatus === 'not_recorded').length,
      unavailable: results.filter(r => r.overallStatus === 'unavailable').length,
      errors: results.filter(r => r.overallStatus === 'error').length,
      results
    };

    logger.info('Batch integrity check completed', summary);

    return summary;
  }

  /**
   * Schedule automatic integrity checks
   */
  static async scheduleIntegrityChecks(propertyId?: string): Promise<void> {
    try {
      // Get documents to check
      const documents = propertyId 
        ? await DocumentService.getDocumentsByProperty(propertyId)
        : await DocumentService.getAllDocuments(1, 100);

      const documentIds = Array.isArray(documents) 
        ? documents.map(doc => doc._id.toString())
        : documents.documents.map(doc => doc._id.toString());

      // Perform batch check
      await this.performBatchIntegrityCheck(documentIds);

      logger.info('Scheduled integrity check completed', {
        propertyId,
        documentCount: documentIds.length
      });
    } catch (error) {
      logger.error('Scheduled integrity check failed:', error);
    }
  }
}

export default DocumentIntegrityService;

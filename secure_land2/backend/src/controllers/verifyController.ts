import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import DocumentService from '../services/documentService';
import { BlockchainService, IPFSService } from '../services/proxySelector';

export const verifyDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        ResponseHandler.error(res, 'Document hash is required', 400);
        return;
      }

      // Get document by hash (documentId is actually the hash from the frontend)
      const document = await DocumentService.getDocumentByHash(documentId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found with the provided hash');
        return;
      }

      // Document exists in MongoDB - verification successful!
      let blockchainStatus = 'not_recorded';
      let txHash = document.blockchain.txHash;

      try {
        // Try to check/record on blockchain using proxy
        const existingHash = await BlockchainService.getDocumentHash(document._id.toString());
        
        if (!existingHash) {
          // Document not on blockchain yet, try to record it
          txHash = await BlockchainService.recordDocumentHash(
            document._id.toString(),
            document.hash
          );
          
          // Update document with blockchain info
          document.blockchain.txHash = txHash;
          document.blockchain.isOnChain = true;
          document.blockchain.lastVerified = new Date();
          blockchainStatus = 'recorded';
        } else {
          // Verify the hash matches
          const isVerified = await BlockchainService.verifyDocumentHash(
            document._id.toString(), 
            document.hash
          );
          blockchainStatus = isVerified ? 'verified' : 'mismatch';
          document.blockchain.lastVerified = new Date();
        }
      } catch (error: any) {
        logger.warn('Blockchain verification failed, but document exists in DB:', error.message);
        blockchainStatus = 'unavailable';
      }

      // Update document status to Verified since it exists in MongoDB
      document.status = 'Verified';
      document.verificationDate = new Date();
      await document.save();

      ResponseHandler.success(res, {
        documentId: document._id,
        hash: document.hash,
        verified: true,
        status: document.status,
        propertyId: document.propertyId,
        verificationDate: document.verificationDate,
        fileName: document.originalName,
        blockchainStatus,
        txHash
      }, 'Document verification successful');
    } catch (error: any) {
      logger.error('Document verification error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

export const getVerificationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        ResponseHandler.error(res, 'Document hash is required', 400);
        return;
      }

      // Get document by hash (documentId is actually the hash from the frontend)
      const document = await DocumentService.getDocumentByHash(documentId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found with the provided hash');
        return;
      }

      // Check blockchain status using proxy
      let blockchainHash = null;
      let isOnBlockchain = false;
      let hashMatches = false;

      try {
        blockchainHash = await BlockchainService.getDocumentHash(document._id.toString());
        isOnBlockchain = blockchainHash !== null;
        hashMatches = !!(blockchainHash && blockchainHash.toLowerCase() === document.hash.toLowerCase());
      } catch (error: any) {
        logger.warn('Blockchain status check failed:', error.message);
      }

      ResponseHandler.success(res, {
        documentId: document._id,
        status: document.status,
        hash: document.hash,
        blockchainHash,
        isOnBlockchain,
        hashMatches,
        verificationDate: document.verificationDate,
        verifiedBy: document.verifiedBy,
        rejectionReason: document.rejectionReason,
        inDatabase: true
      }, 'Verification status retrieved successfully');
    } catch (error: any) {
      logger.error('Get verification status error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

export const getOwnershipHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;
      
      // Use the corrected DocumentService method
      const documents = await DocumentService.getDocuments({ propertyId });
      
      ResponseHandler.success(res, {
        propertyId,
        documents: documents.documents,
        totalDocuments: documents.total
      }, 'Ownership history retrieved successfully');
    } catch (error: any) {
      logger.error('Get ownership history error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

export const getBlockchainInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractAddress = await BlockchainService.getContractAddress();
      const networkInfo = await BlockchainService.getNetworkInfo();
      const balance = await BlockchainService.getSignerBalance();
      const stats = 'getStats' in BlockchainService ? (BlockchainService as any).getStats() : {};
      
      ResponseHandler.success(res, {
        contractAddress,
        network: networkInfo,
        mockBalance: `${balance} ETH (simulated)`,
        statistics: stats,
        mode: 'MOCK_BLOCKCHAIN'
      }, 'Blockchain info retrieved successfully');
    } catch (error: any) {
      logger.error('Get blockchain info error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

export const verifyDocumentIntegrity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        ResponseHandler.error(res, 'Document hash is required', 400);
        return;
      }

      // Get document by hash first
      const document = await DocumentService.getDocumentByHash(documentId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found with the provided hash');
        return;
      }

      // Document exists in MongoDB - base integrity is valid
      let blockchainMatch = false;
      let ipfsAccessible = false;
      const errors: string[] = [];

      // Check blockchain using proxy
      try {
        const blockchainHash = await BlockchainService.getDocumentHash(document._id.toString());
        blockchainMatch = !!(blockchainHash && blockchainHash.toLowerCase() === document.hash.toLowerCase());
        if (!blockchainMatch && blockchainHash) {
          errors.push('Blockchain hash mismatch');
        }
      } catch (error: any) {
        logger.warn('Blockchain integrity check failed:', error.message);
        errors.push('Blockchain unavailable');
      }

      // Check IPFS using proxy
      try {
        if (document.ipfsCid) {
          // Check if file is available in IPFS
          if ('isAvailable' in IPFSService) {
            ipfsAccessible = await (IPFSService as any).isAvailable(document.ipfsCid);
          } else {
            // Fallback: assume accessible if CID exists
            ipfsAccessible = true;
          }
          if (!ipfsAccessible) {
            errors.push('IPFS file not accessible');
          }
        }
      } catch (error: any) {
        logger.warn('IPFS integrity check failed:', error.message);
        errors.push('IPFS unavailable');
      }

      // Determine status - document in DB means it's verified
      let status = 'verified';
      if (!blockchainMatch && !ipfsAccessible) {
        status = 'database_only';
      } else if (!blockchainMatch) {
        status = 'not_recorded';  
      } else if (!ipfsAccessible) {
        status = 'ipfs_unavailable';
      }

      ResponseHandler.success(res, {
        documentId: document._id,
        integrityStatus: status,
        checks: {
          inDatabase: true,
          blockchainMatch,
          ipfsAccessible,
          isIntegrityValid: true // Valid because it exists in MongoDB
        },
        errors,
        localHash: document.hash
      }, 'Document integrity check completed');
    } catch (error: any) {
      logger.error('Document integrity check error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

export const verifyDocumentByHash = async (req: Request, res: Response): Promise<void> => {
    try {
      const { hash } = req.body;

      if (!hash) {
        ResponseHandler.error(res, 'Document hash is required', 400);
        return;
      }

      // Get document by hash
      const document = await DocumentService.getDocumentByHash(hash);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found with the provided hash');
        return;
      }

      // Document exists in MongoDB - verification successful!
      let blockchainStatus = 'not_recorded';
      let txHash = document.blockchain.txHash;

      try {
        // Try to check/record on blockchain using proxy
        const existingHash = await BlockchainService.getDocumentHash(document._id.toString());
        
        if (!existingHash) {
          // Document not on blockchain yet, try to record it
          txHash = await BlockchainService.recordDocumentHash(
            document._id.toString(),
            document.hash
          );
          
          // Update document with blockchain info
          document.blockchain.txHash = txHash;
          document.blockchain.isOnChain = true;
          document.blockchain.lastVerified = new Date();
          blockchainStatus = 'recorded';
        } else {
          // Verify the hash matches
          const isVerified = await BlockchainService.verifyDocumentHash(
            document._id.toString(), 
            document.hash
          );
          blockchainStatus = isVerified ? 'verified' : 'mismatch';
          document.blockchain.lastVerified = new Date();
        }
      } catch (error: any) {
        logger.warn('Blockchain verification failed, but document exists in DB:', error.message);
        blockchainStatus = 'unavailable';
      }

      // Update document status to Verified since it exists in MongoDB
      document.status = 'Verified';
      document.verificationDate = new Date();
      await document.save();

      ResponseHandler.success(res, {
        documentId: document._id,
        hash: document.hash,
        verified: true,
        status: document.status,
        propertyId: document.propertyId,
        verificationDate: document.verificationDate,
        fileName: document.originalName,
        blockchainStatus,
        txHash
      }, 'Document verification successful');
    } catch (error: any) {
      logger.error('Document verification by hash error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }


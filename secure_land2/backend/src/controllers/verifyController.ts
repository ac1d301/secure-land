import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import DocumentService from '../services/documentService';
import BlockchainService from '../services/blockchainService';

export const verifyDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;

      if (!documentId) {
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }

      // FIX: Get document by ID, not by hash
      const document = await DocumentService.getDocumentById(documentId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Verify on blockchain using document's hash
      const isVerified = await BlockchainService.verifyDocumentHash(
        document._id.toString(), 
        document.hash
      );

      if (!isVerified) {
        ResponseHandler.error(res, 'Document verification failed on blockchain', 400);
        return;
      }

      // Update document status
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
        fileName: document.originalName
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
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }

      // FIX: Get document by ID, not by hash
      const document = await DocumentService.getDocumentById(documentId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Check blockchain status
      const blockchainHash = await BlockchainService.getDocumentHash(document._id.toString());
      const isOnBlockchain = blockchainHash !== null;
      const hashMatches = blockchainHash && blockchainHash.toLowerCase() === document.hash.toLowerCase();

      ResponseHandler.success(res, {
        documentId: document._id,
        status: document.status,
        hash: document.hash,
        blockchainHash,
        isOnBlockchain,
        hashMatches,
        verificationDate: document.verificationDate,
        verifiedBy: document.verifiedBy,
        rejectionReason: document.rejectionReason
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
      const stats = BlockchainService.getStats();
      
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
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }

      // FIX: Use DocumentService.verifyDocumentIntegrity method
      const integrityResult = await DocumentService.verifyDocumentIntegrity(documentId);

      let status = 'unknown';
      if (integrityResult.blockchainMatch && integrityResult.ipfsAccessible) {
        status = 'verified';
      } else if (!integrityResult.blockchainMatch) {
        status = 'not_recorded';  
      } else if (!integrityResult.ipfsAccessible) {
        status = 'ipfs_unavailable';
      }

      ResponseHandler.success(res, {
        documentId: integrityResult.document._id,
        integrityStatus: status,
        checks: {
          blockchainMatch: integrityResult.blockchainMatch,
          ipfsAccessible: integrityResult.ipfsAccessible,
          isIntegrityValid: integrityResult.isIntegrityValid
        },
        errors: integrityResult.errors,
        localHash: integrityResult.document.hash
      }, 'Document integrity check completed');
    } catch (error: any) {
      logger.error('Document integrity check error:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }


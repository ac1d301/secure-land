import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import DocumentService from '../services/documentService';
import BlockchainService from '../services/blockchainService';

export const verifyDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      const { hash } = req.body;

      if (!documentId) {
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }
      const docId = String(documentId);

      if (!hash) {
        ResponseHandler.error(res, 'Document hash is required', 400);
        return;
      }

      // Get document from database
      const document = await DocumentService.getDocumentById(docId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Verify hash matches
      if (document.hash !== hash) {
        ResponseHandler.error(res, 'Document hash does not match', 400);
        return;
      }

      // Verify on blockchain
      const isVerified = await BlockchainService.verifyDocumentHash(docId, hash);

      if (!isVerified) {
        ResponseHandler.error(res, 'Document verification failed on blockchain', 400);
        return;
      }

      ResponseHandler.success(res, {
        documentId,
        hash,
        verified: true,
        message: 'Document verified successfully'
      }, 'Document verification successful');
    } catch (error: any) {
      logger.error('Document verification error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

export const getVerificationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      if (!documentId) {
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }
      const docId = String(documentId);

      const document = await DocumentService.getDocumentById(docId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Get hash from blockchain
      const blockchainHash = await BlockchainService.getDocumentHash(docId);
      const isOnBlockchain = blockchainHash !== null;
      const hashMatches = blockchainHash === document.hash;

      ResponseHandler.success(res, {
        documentId: docId,
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
      ResponseHandler.error(res, error.message, 500);
    }
  }

export const getOwnershipHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;

      // Get all documents for this property
      const documents = await DocumentService.getAllDocuments(1, 100);
      const propertyDocuments = documents.documents.filter(doc => doc.propertyId === propertyId);

      // Sort by creation date
      propertyDocuments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      ResponseHandler.success(res, {
        propertyId,
        documents: propertyDocuments,
        totalDocuments: propertyDocuments.length
      }, 'Ownership history retrieved successfully');
    } catch (error: any) {
      logger.error('Get ownership history error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

export const getBlockchainInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractAddress = await BlockchainService.getContractAddress();
      const networkInfo = await BlockchainService.getNetworkInfo();

      ResponseHandler.success(res, {
        contractAddress,
        network: networkInfo,
        message: 'Blockchain information retrieved successfully'
      }, 'Blockchain info retrieved successfully');
    } catch (error: any) {
      logger.error('Get blockchain info error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

export const verifyDocumentIntegrity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId } = req.params;
      if (!documentId) {
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }
      const docId = String(documentId);

      const document = await DocumentService.getDocumentById(docId);
      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Check if document exists on blockchain
      const blockchainHash = await BlockchainService.getDocumentHash(docId);
      const isOnBlockchain = blockchainHash !== null;
      const hashMatches = blockchainHash === document.hash;

      // Determine integrity status
      let integrityStatus = 'unknown';
      if (isOnBlockchain && hashMatches) {
        integrityStatus = 'verified';
      } else if (isOnBlockchain && !hashMatches) {
        integrityStatus = 'tampered';
      } else if (!isOnBlockchain) {
        integrityStatus = 'not_recorded';
      }

      ResponseHandler.success(res, {
        documentId: docId,
        integrityStatus,
        isOnBlockchain,
        hashMatches,
        localHash: document.hash,
        blockchainHash,
        message: `Document integrity status: ${integrityStatus}`
      }, 'Document integrity check completed');
    } catch (error: any) {
      logger.error('Document integrity check error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }


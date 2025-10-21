import Document, { IDocument } from '../models/Document';
import { IPFSService } from './ipfsService';
import { BlockchainService } from './blockchainService';
import { generateHash, generatePropertyId } from '../utils/hashUtils';
import { logger } from '../utils/logger';

export interface DocumentUploadData {
  ownerId: string;
  propertyAddress: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
}

export interface DocumentResult {
  document: IDocument;
  ipfsResult: {
    cid: string;
    url: string;
  };
  blockchainTxHash?: string;
}

export class DocumentService {
  static async uploadDocument(data: DocumentUploadData): Promise<DocumentResult> {
    try {
      const { ownerId, propertyAddress, file, fileName, mimeType } = data;

      // Generate property ID
      const propertyId = generatePropertyId(propertyAddress, ownerId);

      // Generate document hash
      const documentHash = generateHash(file);

      // Check if document with same hash already exists
      const existingDocument = await Document.findOne({ hash: documentHash });
      if (existingDocument) {
        throw new Error('Document with this content already exists');
      }

      // Upload to IPFS
      logger.info(`Uploading document ${fileName} to IPFS`);
      const ipfsResult = await IPFSService.uploadFile(file, fileName);

      // Create document record
      const document = new Document({
        ownerId,
        propertyId,
        fileName: ipfsResult.cid, // Store IPFS CID as filename
        originalName: fileName,
        fileSize: file.length,
        mimeType,
        ipfsCid: ipfsResult.cid,
        hash: documentHash,
        status: 'Pending'
      });

      await document.save();

      // Record hash on blockchain (async, don't wait)
      let blockchainTxHash: string | undefined;
      try {
        blockchainTxHash = await BlockchainService.recordDocumentHash(document._id, documentHash);
        logger.info(`Document hash recorded on blockchain: ${blockchainTxHash}`);
      } catch (blockchainError) {
        logger.warn('Failed to record on blockchain, but document saved locally:', blockchainError);
      }

      logger.info(`Document uploaded successfully: ${document._id}`);

      return {
        document,
        ipfsResult: {
          cid: ipfsResult.cid,
          url: ipfsResult.url
        },
        blockchainTxHash
      };
    } catch (error) {
      logger.error('Document upload failed:', error);
      throw error;
    }
  }

  static async getDocumentById(documentId: string, userId?: string): Promise<IDocument | null> {
    try {
      const query: any = { _id: documentId };
      
      // If userId provided, ensure user can only access their own documents
      // unless they are an Official
      if (userId) {
        // This would need to be enhanced based on role checking
        query.ownerId = userId;
      }

      const document = await Document.findById(query);
      return document;
    } catch (error) {
      logger.error('Get document by ID failed:', error);
      throw error;
    }
  }

  static async getUserDocuments(userId: string, page: number = 1, limit: number = 10): Promise<{
    documents: IDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        Document.find({ ownerId: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Document.countDocuments({ ownerId: userId })
      ]);

      return {
        documents,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Get user documents failed:', error);
      throw error;
    }
  }

  static async getAllDocuments(page: number = 1, limit: number = 10, status?: string): Promise<{
    documents: IDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (status) {
        query.status = status;
      }

      const [documents, total] = await Promise.all([
        Document.find(query)
          .populate('ownerId', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Document.countDocuments(query)
      ]);

      return {
        documents,
        total,
        page,
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Get all documents failed:', error);
      throw error;
    }
  }

  static async verifyDocument(documentId: string, verifiedBy: string): Promise<IDocument | null> {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.status !== 'Pending') {
        throw new Error('Document is not in pending status');
      }

      // Verify hash on blockchain
      const isVerified = await BlockchainService.verifyDocumentHash(documentId, document.hash);
      
      if (!isVerified) {
        throw new Error('Document verification failed on blockchain');
      }

      // Update document status
      document.status = 'Verified';
      document.verificationDate = new Date();
      document.verifiedBy = verifiedBy;

      await document.save();

      logger.info(`Document verified successfully: ${documentId}`);

      return document;
    } catch (error) {
      logger.error('Document verification failed:', error);
      throw error;
    }
  }

  static async rejectDocument(documentId: string, rejectedBy: string, reason: string): Promise<IDocument | null> {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.status !== 'Pending') {
        throw new Error('Document is not in pending status');
      }

      // Update document status
      document.status = 'Rejected';
      document.verificationDate = new Date();
      document.verifiedBy = rejectedBy;
      document.rejectionReason = reason;

      await document.save();

      logger.info(`Document rejected: ${documentId}, reason: ${reason}`);

      return document;
    } catch (error) {
      logger.error('Document rejection failed:', error);
      throw error;
    }
  }

  static async getDocumentByHash(hash: string): Promise<IDocument | null> {
    try {
      const document = await Document.findOne({ hash });
      return document;
    } catch (error) {
      logger.error('Get document by hash failed:', error);
      throw error;
    }
  }
}

export default DocumentService;

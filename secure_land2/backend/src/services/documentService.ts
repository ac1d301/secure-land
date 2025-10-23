import mongoose, { ClientSession } from 'mongoose';
import Document, { IDocument, IDocumentVersion } from '../models/Document';
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
  metadata?: Record<string, any>;
}

export interface DocumentUpdateData {
  file?: Buffer;
  fileName?: string;
  mimeType?: string;
  metadata?: Record<string, any>;
  changeReason?: string;
}

export interface DocumentResult {
  document: IDocument;
  ipfsResult: {
    cid: string;
    url: string;
  };
  blockchainTxHash?: string;
}

export interface DocumentQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export class DocumentService {
  /**
   * Upload a new document with IPFS and blockchain integration
   */
  static async uploadDocument(
    data: DocumentUploadData,
    session?: ClientSession
  ): Promise<DocumentResult> {
    const sessionOption = session ? { session } : {};
    
    try {
      const { ownerId, propertyAddress, file, fileName, mimeType, metadata } = data;

      // Generate property ID and document hash
      const propertyId = generatePropertyId(propertyAddress, ownerId);
      const documentHash = generateHash(file);

      // Check for existing document with same content
      const existingDocument = await Document.findOne({ hash: documentHash }, null, sessionOption);
      if (existingDocument) {
        throw new Error('Document with this content already exists');
      }

      // Start transaction if not already in one
      const shouldCommit = !session;
      const dbSession = session || await mongoose.startSession();
      
      try {
        if (!session) {
          dbSession.startTransaction();
        }

        // Upload to IPFS
        logger.info(`Uploading document ${fileName} to IPFS`);
        const ipfsResult = await IPFSService.uploadFile(file, fileName);

        // Create document record
        const document = new Document({
          ownerId,
          propertyId,
          fileName: ipfsResult.cid,
          originalName: fileName,
          fileSize: file.length,
          mimeType,
          ipfsCid: ipfsResult.cid,
          ipfsGatewayUrl: ipfsResult.url,
          hash: documentHash,
          status: 'Pending',
          metadata,
          blockchain: {
            txHash: '0x0', // Will be updated after blockchain confirmation
            isOnChain: false
          }
        });

        // Save document
        await document.save({ ...sessionOption, validateBeforeSave: true });

        // Record hash on blockchain
        const blockchainTxHash = await BlockchainService.recordDocumentHash(
          document._id.toString(),
          documentHash,
          { waitForConfirmation: false }
        );

        // Update document with blockchain transaction hash
        document.blockchain.txHash = blockchainTxHash;
        document.blockchain.isOnChain = true;
        await document.save(sessionOption);

        logger.info(`Document uploaded successfully: ${document._id}`, {
          documentId: document._id,
          ipfsCid: ipfsResult.cid,
          txHash: blockchainTxHash
        });

        // Commit transaction if we started it
        if (shouldCommit) {
          await dbSession.commitTransaction();
        }

        return {
          document,
          ipfsResult: {
            cid: ipfsResult.cid,
            url: ipfsResult.url
          },
          blockchainTxHash
        };
      } catch (error) {
        // Abort transaction on error
        if (shouldCommit && dbSession.inTransaction()) {
          await dbSession.abortTransaction();
        }
        throw error;
      } finally {
        if (shouldCommit) {
          await dbSession.endSession();
        }
      }
    } catch (error) {
      logger.error('Document upload failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Document upload failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update an existing document with versioning support
   */
  static async updateDocument(
    documentId: string,
    userId: string,
    data: DocumentUpdateData,
    session?: ClientSession
  ): Promise<IDocument> {
    const sessionOption = session ? { session } : {};
    const shouldCommit = !session;
    const dbSession = session || await mongoose.startSession();

    try {
      if (!session) {
        dbSession.startTransaction();
      }

      // Find existing document
      const document = await Document.findById(documentId, null, sessionOption);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check permissions
      if (document.ownerId.toString() !== userId) {
        throw new Error('Not authorized to update this document');
      }

      let newHash = document.hash;
      let ipfsResult;

      // If file is being updated, process it
      if (data.file) {
        newHash = generateHash(data.file);
        
        // Check for duplicate content
        const existingDoc = await Document.findOne({ hash: newHash }, null, sessionOption);
        if (existingDoc && existingDoc._id.toString() !== documentId) {
          throw new Error('A document with this content already exists');
        }

        // Upload new version to IPFS
        ipfsResult = await IPFSService.uploadFile(
          data.file,
          data.fileName || document.originalName
        );
      }

      // Create a new version
      await document.createNewVersion(
        newHash,
        userId,
        data.changeReason
      );

      // Update document fields
      if (data.file) {
        document.fileName = ipfsResult!.cid;
        document.fileSize = data.file.length;
        document.ipfsCid = ipfsResult!.cid;
        document.ipfsGatewayUrl = ipfsResult!.url;
      }
      
      if (data.fileName) {
        document.originalName = data.fileName;
      }
      
      if (data.mimeType) {
        document.mimeType = data.mimeType;
      }
      
      if (data.metadata) {
        document.metadata = { ...document.metadata, ...data.metadata };
      }

      // Save the updated document
      await document.save(sessionOption);

      // Record new hash on blockchain
      const blockchainTxHash = await BlockchainService.recordDocumentHash(
        document._id.toString(),
        newHash,
        { waitForConfirmation: false }
      );

      // Update document with new blockchain transaction
      document.blockchain.txHash = blockchainTxHash;
      document.blockchain.isOnChain = true;
      await document.save(sessionOption);

      logger.info(`Document updated successfully: ${documentId}`, {
        documentId,
        version: document.version,
        txHash: blockchainTxHash
      });

      if (shouldCommit) {
        await dbSession.commitTransaction();
      }

      return document;
    } catch (error) {
      if (shouldCommit && dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      
      logger.error('Document update failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new Error(`Document update failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      if (shouldCommit) {
        await dbSession.endSession();
      }
    }
  }

  /**
   * Verify document integrity against blockchain
   */
  static async verifyDocumentIntegrity(
    documentId: string,
    expectedHash?: string
  ): Promise<{
    isIntegrityValid: boolean;
    document: IDocument;
    blockchainMatch: boolean;
    ipfsAccessible: boolean;
    errors: string[];
  }> {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const result = {
        isIntegrityValid: true,
        document,
        blockchainMatch: false,
        ipfsAccessible: false,
        errors: [] as string[]
      };

      // Verify hash matches if provided
      if (expectedHash && document.hash !== expectedHash) {
        result.isIntegrityValid = false;
        result.errors.push('Document hash does not match expected value');
      }

      // Verify on blockchain
      try {
        const isVerified = await BlockchainService.verifyDocumentHash(
          documentId,
          document.hash
        );
        result.blockchainMatch = isVerified;
        
        if (!isVerified) {
          result.isIntegrityValid = false;
          result.errors.push('Document hash not found on blockchain or does not match');
        }
      } catch (error) {
        result.isIntegrityValid = false;
        result.errors.push(`Blockchain verification failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Verify IPFS accessibility
      try {
        // This is a simplified check - in production, you might want to actually fetch a small part of the file
        result.ipfsAccessible = await IPFSService.isAvailable(document.ipfsCid);
        if (!result.ipfsAccessible) {
          result.isIntegrityValid = false;
          result.errors.push('Document content is not accessible on IPFS');
        }
      } catch (error) {
        result.isIntegrityValid = false;
        result.errors.push(`IPFS check failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Update last verified timestamp
      document.blockchain.lastVerified = new Date();
      document.blockchain.verificationCount += 1;
      await document.save();

      return result;
    } catch (error) {
      logger.error('Document integrity check failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error(`Integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get document by ID with optional owner check
   */
  static async getDocumentById(
    documentId: string, 
    userId?: string
  ): Promise<IDocument | null> {
    try {
      const query: any = { _id: documentId };
      if (userId) {
        query.ownerId = userId;
      }
      
      const document = await Document.findOne(query)
        .populate('ownerId', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName');
      
      if (!document) {
        return null;
      }

      // Check blockchain status if not recently verified
      const lastVerified = document.blockchain.lastVerified;
      const needsVerification = !lastVerified || 
        (Date.now() - lastVerified.getTime()) > 24 * 60 * 60 * 1000; // 24 hours
      
      if (needsVerification) {
        try {
          const isOnChain = await BlockchainService.documentExists(documentId);
          if (document.blockchain.isOnChain !== isOnChain) {
            document.blockchain.isOnChain = isOnChain;
            document.blockchain.lastVerified = new Date();
            await document.save();
          }
        } catch (error) {
          logger.warn('Failed to check blockchain status:', {
            documentId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return document;
    } catch (error) {
      logger.error('Get document by ID failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to retrieve document');
    }
  }

  /**
   * Get documents with pagination and filtering
   */
  static async getDocuments(
    query: Record<string, any> = {},
    options: DocumentQueryOptions = {}
  ): Promise<{
    documents: IDocument[];
    total: number;
    page: number;
    pages: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
      } = options;

      const skip = (page - 1) * limit;
      const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      // Build query
      const dbQuery: any = { ...query };
      
      // Apply text search if provided
      if (filters.search) {
        dbQuery.$text = { $search: filters.search };
      }
      
      // Apply status filter
      if (filters.status) {
        dbQuery.status = filters.status;
      }

      // Execute queries in parallel
      const [documents, total] = await Promise.all([
        Document.find(dbQuery)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('ownerId', 'firstName lastName email')
          .lean(),
        Document.countDocuments(dbQuery)
      ]);

      return {
        documents,
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      };
    } catch (error) {
      logger.error('Get documents failed:', {
        error: error instanceof Error ? error.message : String(error),
        query,
        options
      });
      throw new Error('Failed to retrieve documents');
    }
  }

  /**
   * Get document history with version information
   */
  static async getDocumentHistory(
    documentId: string,
    userId: string
  ): Promise<{
    current: IDocument;
    versions: Array<IDocumentVersion & { version: number }>;
  }> {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check permissions
      if (document.ownerId.toString() !== userId) {
        throw new Error('Not authorized to view this document');
      }

      // Get all versions (current + previous)
      const versions = [
        ...document.previousVersions.map((v, i) => ({
          ...v.toObject(),
          version: document.version - i - 1
        })),
        {
          hash: document.hash,
          timestamp: document.updatedAt,
          txHash: document.blockchain.txHash,
          changedBy: document.verifiedBy,
          changeReason: 'Current version',
          version: document.version
        }
      ].sort((a, b) => b.version - a.version);

      return {
        current: document,
        versions
      };
    } catch (error) {
      logger.error('Get document history failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to retrieve document history');
    }
  }

  /**
   * Verify a document (admin function)
   */
  static async verifyDocument(
    documentId: string,
    verifiedBy: string,
    session?: ClientSession
  ): Promise<IDocument> {
    const sessionOption = session ? { session } : {};
    
    try {
      const document = await Document.findById(documentId, null, sessionOption);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.status !== 'Pending') {
        throw new Error(`Document is not in pending status (current: ${document.status})`);
      }

      // Verify on blockchain
      const isVerified = await BlockchainService.verifyDocumentHash(
        documentId,
        document.hash
      );
      
      if (!isVerified) {
        throw new Error('Document verification failed on blockchain');
      }

      // Update document status
      await document.verifyDocument(verifiedBy);
      
      logger.info(`Document verified: ${documentId}`, {
        documentId,
        verifiedBy
      });

      return document;
    } catch (error) {
      logger.error('Document verification failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reject a document (admin function)
   */
  static async rejectDocument(
    documentId: string,
    rejectedBy: string,
    reason: string,
    session?: ClientSession
  ): Promise<IDocument> {
    const sessionOption = session ? { session } : {};
    
    try {
      const document = await Document.findById(documentId, null, sessionOption);
      if (!document) {
        throw new Error('Document not found');
      }

      if (document.status !== 'Pending') {
        throw new Error(`Document is not in pending status (current: ${document.status})`);
      }

      // Update document status
      await document.rejectDocument(rejectedBy, reason);
      
      logger.info(`Document rejected: ${documentId}`, {
        documentId,
        rejectedBy,
        reason
      });

      return document;
    } catch (error) {
      logger.error('Document rejection failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Rejection failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a document (soft delete)
   */
  static async deleteDocument(
    documentId: string,
    userId: string,
    reason?: string
  ): Promise<IDocument> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const document = await Document.findById(documentId).session(session);
      if (!document) {
        throw new Error('Document not found');
      }

      // Check permissions
      if (document.ownerId.toString() !== userId) {
        throw new Error('Not authorized to delete this document');
      }

      // Soft delete by archiving
      document.status = 'Archived';
      document.updatedAt = new Date();
      
      // Add to version history
      document.previousVersions.push({
        hash: document.hash,
        timestamp: new Date(),
        txHash: document.blockchain.txHash,
        changedBy: userId,
        changeReason: `Document archived${reason ? `: ${reason}` : ''}`
      });

      await document.save({ session });
      await session.commitTransaction();
      
      logger.info(`Document archived: ${documentId}`, {
        documentId,
        userId,
        reason
      });

      return document;
    } catch (error) {
      await session.abortTransaction();
      
      logger.error('Document deletion failed:', {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new Error(`Deletion failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await session.endSession();
    }
  }

  /**
   * Batch verify multiple documents
   */
  static async batchVerifyDocuments(
    documentIds: string[],
    verifiedBy: string
  ): Promise<{
    success: string[];
    failed: Array<{ documentId: string; error: string }>;
  }> {
    const result = {
      success: [] as string[],
      failed: [] as Array<{ documentId: string; error: string }>
    };

    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        for (const docId of documentIds) {
          try {
            await this.verifyDocument(docId, verifiedBy, session);
            result.success.push(docId);
          } catch (error) {
            result.failed.push({
              documentId: docId,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get document by blockchain transaction hash
   */
  static async getDocumentByTxHash(txHash: string): Promise<IDocument | null> {
    try {
      return await Document.findOne({ 'blockchain.txHash': txHash })
        .populate('ownerId', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName');
    } catch (error) {
      logger.error('Get document by tx hash failed:', {
        txHash,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to retrieve document by transaction hash');
    }
  }

  /**
   * Get document by IPFS CID
   */
  static async getDocumentByIpfsCid(ipfsCid: string): Promise<IDocument | null> {
    try {
      return await Document.findOne({ ipfsCid })
        .populate('ownerId', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName');
    } catch (error) {
      logger.error('Get document by IPFS CID failed:', {
        ipfsCid,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to retrieve document by IPFS CID');
    }
  }

  /**
   * Get document by hash
   */
  static async getDocumentByHash(hash: string): Promise<IDocument | null> {
    try {
      return await Document.findOne({ hash })
        .populate('ownerId', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName');
    } catch (error) {
      logger.error('Get document by hash failed:', {
        hash,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to retrieve document by hash');
    }
  }

  /**
   * Check if a document exists with the given hash
   */
  static async documentExists(hash: string): Promise<boolean> {
    try {
      const count = await Document.countDocuments({ hash });
      return count > 0;
    } catch (error) {
      logger.error('Document existence check failed:', {
        hash,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to check document existence');
    }
  }

  /**
   * Update blockchain confirmation count for a document
   */
  static async updateBlockchainConfirmation(
    documentId: string,
    confirmations: number
  ): Promise<IDocument | null> {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        return null;
      }

      document.blockchain.confirmations = confirmations;
      document.blockchain.lastVerified = new Date();
      
      return document.save();
    } catch (error) {
      logger.error('Update blockchain confirmation failed:', {
        documentId,
        confirmations,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to update blockchain confirmation');
    }
  }
}

export default DocumentService;

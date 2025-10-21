import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import DocumentService, { DocumentUploadData } from '../services/documentService';
import NotificationService from '../services/notificationService';
import AuditLog from '../models/AuditLog';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and Word documents are allowed.'));
    }
  }
});

export class DocumentController {
  // Multer middleware for single file upload
  static uploadMiddleware = upload.single('document');

  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        ResponseHandler.error(res, 'No file uploaded', 400);
        return;
      }

      const userId = (req as any).user.id;
      const { propertyAddress } = req.body;

      if (!propertyAddress) {
        ResponseHandler.error(res, 'Property address is required', 400);
        return;
      }

      const uploadData: DocumentUploadData = {
        ownerId: userId,
        propertyAddress,
        file: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype
      };

      const result = await DocumentService.uploadDocument(uploadData);

      // Log document upload
      await AuditLog.create({
        userId,
        action: 'UPLOAD',
        resourceType: 'DOCUMENT',
        resourceId: result.document._id,
        details: {
          propertyId: result.document.propertyId,
          documentId: result.document._id,
          fileName: result.document.originalName,
          hash: result.document.hash,
          ipfsCid: result.document.ipfsCid,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Send notification (async)
      try {
        const user = (req as any).user;
        await NotificationService.notifyDocumentUpload({
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          documentId: result.document._id,
          documentName: result.document.originalName,
          status: 'uploaded'
        });
      } catch (notificationError) {
        logger.warn('Notification failed:', notificationError);
      }

      ResponseHandler.success(res, {
        document: result.document,
        ipfsUrl: result.ipfsResult.url,
        blockchainTxHash: result.blockchainTxHash
      }, 'Document uploaded successfully', 201);
    } catch (error: any) {
      logger.error('Document upload error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async getUserDocuments(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await DocumentService.getUserDocuments(userId, page, limit);

      ResponseHandler.success(res, result, 'User documents retrieved successfully');
    } catch (error: any) {
      logger.error('Get user documents error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async getAllDocuments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      const result = await DocumentService.getAllDocuments(page, limit, status);

      ResponseHandler.success(res, result, 'All documents retrieved successfully');
    } catch (error: any) {
      logger.error('Get all documents error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async getDocumentById(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = (req as any).user?.id;

      const document = await DocumentService.getDocumentById(documentId, userId);

      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      ResponseHandler.success(res, document, 'Document retrieved successfully');
    } catch (error: any) {
      logger.error('Get document by ID error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async getDocumentByHash(req: Request, res: Response): Promise<void> {
    try {
      const { hash } = req.params;

      const document = await DocumentService.getDocumentByHash(hash);

      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      ResponseHandler.success(res, document, 'Document retrieved successfully');
    } catch (error: any) {
      logger.error('Get document by hash error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async verifyDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const verifiedBy = (req as any).user.id;

      const document = await DocumentService.verifyDocument(documentId, verifiedBy);

      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Log verification
      await AuditLog.create({
        userId: verifiedBy,
        action: 'VERIFY',
        resourceType: 'DOCUMENT',
        resourceId: documentId,
        details: {
          propertyId: document.propertyId,
          documentId: documentId,
          fileName: document.originalName,
          hash: document.hash,
          verificationResult: true,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Send notification (async)
      try {
        const user = (req as any).user;
        await NotificationService.notifyDocumentVerification({
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          documentId: document._id,
          documentName: document.originalName,
          status: 'verified'
        });
      } catch (notificationError) {
        logger.warn('Notification failed:', notificationError);
      }

      ResponseHandler.success(res, document, 'Document verified successfully');
    } catch (error: any) {
      logger.error('Document verification error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async rejectDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const { reason } = req.body;
      const rejectedBy = (req as any).user.id;

      if (!reason) {
        ResponseHandler.error(res, 'Rejection reason is required', 400);
        return;
      }

      const document = await DocumentService.rejectDocument(documentId, rejectedBy, reason);

      if (!document) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      // Log rejection
      await AuditLog.create({
        userId: rejectedBy,
        action: 'REJECT',
        resourceType: 'DOCUMENT',
        resourceId: documentId,
        details: {
          propertyId: document.propertyId,
          documentId: documentId,
          fileName: document.originalName,
          hash: document.hash,
          verificationResult: false,
          rejectionReason: reason,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Send notification (async)
      try {
        const user = (req as any).user;
        await NotificationService.notifyDocumentRejection({
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          documentId: document._id,
          documentName: document.originalName,
          status: 'rejected',
          rejectionReason: reason
        });
      } catch (notificationError) {
        logger.warn('Notification failed:', notificationError);
      }

      ResponseHandler.success(res, document, 'Document rejected successfully');
    } catch (error: any) {
      logger.error('Document rejection error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }
}

export default DocumentController;

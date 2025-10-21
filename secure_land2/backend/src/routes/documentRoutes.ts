import { Router } from 'express';
import DocumentController from '../controllers/documentController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireOfficial, requireSeller } from '../middleware/roleMiddleware';

const router = Router();

// All document routes require authentication
router.use(authenticateToken);

// Upload document (Sellers and Officials)
router.post('/upload', requireSeller, DocumentController.uploadMiddleware, DocumentController.uploadDocument);

// Get user's own documents
router.get('/my-documents', DocumentController.getUserDocuments);

// Get specific document by ID
router.get('/:documentId', DocumentController.getDocumentById);

// Get document by hash (public verification)
router.get('/hash/:hash', DocumentController.getDocumentByHash);

// Admin routes (Officials only)
router.get('/', requireOfficial, DocumentController.getAllDocuments);

// Verify document (Officials only)
router.post('/:documentId/verify', requireOfficial, DocumentController.verifyDocument);

// Reject document (Officials only)
router.post('/:documentId/reject', requireOfficial, DocumentController.rejectDocument);

export default router;

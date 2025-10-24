import { Router } from 'express';
import { body } from 'express-validator';
import { verifyDocument, getVerificationStatus, verifyDocumentIntegrity, getOwnershipHistory, getBlockchainInfo, verifyDocumentByHash } from '../controllers/verifyController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Verification routes (requires authentication)
router.post('/document/:documentId', authenticateToken, verifyDocument);
router.post('/hash', authenticateToken, verifyDocumentByHash);
router.get('/document/:documentId/status', getVerificationStatus);
router.get('/document/:documentId/integrity', verifyDocumentIntegrity);

// Ownership history (requires authentication)
router.get('/property/:propertyId/history', authenticateToken, getOwnershipHistory);

// Blockchain info (public)
router.get('/blockchain/info', getBlockchainInfo);

export default router;

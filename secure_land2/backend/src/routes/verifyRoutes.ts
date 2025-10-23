import { Router } from 'express';
import { body } from 'express-validator';
import { verifyDocument, getVerificationStatus, verifyDocumentIntegrity, getOwnershipHistory, getBlockchainInfo } from '../controllers/verifyController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Verification routes (requires authentication)
router.post('/:documentId', authenticateToken, verifyDocument);
router.get('/:documentId/status', getVerificationStatus);
router.get('/:documentId/integrity', verifyDocumentIntegrity);

// Ownership history (requires authentication)
router.get('/property/:propertyId/history', authenticateToken, getOwnershipHistory);

// Blockchain info (public)
router.get('/blockchain/info', getBlockchainInfo);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import { verifyDocument, getVerificationStatus, verifyDocumentIntegrity, getOwnershipHistory, getBlockchainInfo } from '../controllers/verifyController';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware';

const router = Router();

// Validation rules
const verifyDocumentValidation = [
  body('hash')
    .isLength({ min: 64, max: 64 })
    .withMessage('Hash must be exactly 64 characters (SHA-256)')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Hash must be a valid hexadecimal string')
];

// Public verification routes (no authentication required)
router.post('/:documentId', verifyDocumentValidation, verifyDocument);
router.get('/:documentId/status', getVerificationStatus);
router.get('/:documentId/integrity', verifyDocumentIntegrity);

// Ownership history (requires authentication)
router.get('/property/:propertyId/history', authenticateToken, getOwnershipHistory);

// Blockchain info (public)
router.get('/blockchain/info', getBlockchainInfo);

export default router;

import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import IntegrityController from '../controllers/integrityController';

const router = Router();

// Document integrity check (available to document owners and officials)
router.post('/document/:documentId', authenticateToken, IntegrityController.checkDocumentIntegrity);

// Batch integrity check (admin/official only)
router.post('/batch', authenticateToken, requireRole(['Official', 'Admin']), IntegrityController.batchCheckIntegrity);

// Property integrity check (admin/official only)  
router.post('/property/:propertyId', authenticateToken, requireRole(['Official', 'Admin']), IntegrityController.checkPropertyIntegrity);

export default router;

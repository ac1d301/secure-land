import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';
import AdminController from '../controllers/adminController';

const router = Router();

// All admin routes require Official or Admin role
router.use(authenticateToken, requireRole(['Official', 'Admin']));

// Dashboard statistics
router.get('/dashboard/stats', AdminController.getDashboardStats);

// Pending documents for review
router.get('/documents/pending', AdminController.getPendingDocuments);

// Bulk operations
router.post('/documents/bulk-verify', AdminController.bulkVerifyDocuments);
router.post('/documents/bulk-reject', AdminController.bulkRejectDocuments);

// System health
router.get('/system/health', AdminController.getSystemHealth);

export default router;

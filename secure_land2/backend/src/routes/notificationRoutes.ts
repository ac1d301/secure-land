import { Router } from 'express';
import { body } from 'express-validator';
import NotificationController from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireOfficial } from '../middleware/roleMiddleware';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Validation rules
const sendNotificationValidation = [
  body('to')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be less than 200 characters'),
  body('text')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Text content must be less than 10000 characters'),
  body('html')
    .optional()
    .trim()
    .isLength({ max: 50000 })
    .withMessage('HTML content must be less than 50000 characters')
];

const documentNotificationValidation = [
  body('userEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('userName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('User name is required and must be less than 100 characters'),
  body('documentId')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Document ID is required'),
  body('documentName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Document name is required and must be less than 200 characters'),
  body('status')
    .isIn(['uploaded', 'verified', 'rejected'])
    .withMessage('Status must be uploaded, verified, or rejected'),
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be less than 500 characters')
];

const testEmailValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

// Send general notification (Officials only)
router.post('/send', requireOfficial, sendNotificationValidation, NotificationController.sendNotification);

// Send document-specific notification (Officials only)
router.post('/document', requireOfficial, documentNotificationValidation, NotificationController.sendDocumentNotification);

// Test email functionality (Officials only)
router.post('/test', requireOfficial, testEmailValidation, NotificationController.testEmail);

// Get notification service status (Officials only)
router.get('/status', requireOfficial, NotificationController.getNotificationStatus);

export default router;

import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import NotificationService, { NotificationData, DocumentNotificationData } from '../services/notificationService';

export class NotificationController {
  // STUB: Mailtrap Email Simulation
  static async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const { to, subject, text, html, template, data } = req.body;

      if (!to || !subject) {
        ResponseHandler.error(res, 'To and subject are required', 400);
        return;
      }

      const notificationData: NotificationData = {
        to,
        subject,
        text,
        html,
        template,
        data
      };

      const success = await NotificationService.sendEmail(notificationData);

      if (success) {
        ResponseHandler.success(res, { sent: true }, 'Notification sent successfully');
      } else {
        ResponseHandler.error(res, 'Failed to send notification', 500);
      }
    } catch (error: any) {
      logger.error('Send notification error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async sendDocumentNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userEmail, userName, documentId, documentName, status, rejectionReason } = req.body;

      if (!userEmail || !userName || !documentId || !documentName || !status) {
        ResponseHandler.error(res, 'Missing required fields', 400);
        return;
      }

      const notificationData: DocumentNotificationData = {
        userEmail,
        userName,
        documentId,
        documentName,
        status,
        rejectionReason
      };

      let success = false;

      switch (status) {
        case 'uploaded':
          success = await NotificationService.notifyDocumentUpload(notificationData);
          break;
        case 'verified':
          success = await NotificationService.notifyDocumentVerification(notificationData);
          break;
        case 'rejected':
          success = await NotificationService.notifyDocumentRejection(notificationData);
          break;
        default:
          ResponseHandler.error(res, 'Invalid status', 400);
          return;
      }

      if (success) {
        ResponseHandler.success(res, { sent: true }, 'Document notification sent successfully');
      } else {
        ResponseHandler.error(res, 'Failed to send document notification', 500);
      }
    } catch (error: any) {
      logger.error('Send document notification error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async testEmail(req: Request, res: Response): Promise<void> {
    try {
      const testData: NotificationData = {
        to: req.body.email || 'test@example.com',
        subject: 'Secure Land - Test Email',
        text: 'This is a test email from Secure Land.',
        html: `
          <h2>Secure Land - Test Email</h2>
          <p>This is a test email from Secure Land.</p>
          <p>If you received this email, the notification system is working correctly.</p>
        `
      };

      const success = await NotificationService.sendEmail(testData);

      if (success) {
        ResponseHandler.success(res, { sent: true }, 'Test email sent successfully');
      } else {
        ResponseHandler.error(res, 'Failed to send test email', 500);
      }
    } catch (error: any) {
      logger.error('Test email error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async getNotificationStatus(req: Request, res: Response): Promise<void> {
    try {
      // This would typically check the status of sent notifications
      // For now, we'll return a simple status
      ResponseHandler.success(res, {
        service: 'Mailtrap (Simulation)',
        status: 'active',
        environment: process.env.NODE_ENV || 'development',
        message: 'Notification service is running'
      }, 'Notification status retrieved successfully');
    } catch (error: any) {
      logger.error('Get notification status error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }
}

export default NotificationController;

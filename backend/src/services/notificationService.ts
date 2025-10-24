import { createTransporter } from '../config/mailer';
import { logger } from '../utils/logger';

export interface NotificationData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

export interface DocumentNotificationData {
  userEmail: string;
  userName: string;
  documentId: string;
  documentName: string;
  status: 'uploaded' | 'verified' | 'rejected';
  rejectionReason?: string;
}

export class NotificationService {
  // STUB: Mailtrap Email Simulation
  static async sendEmail(notificationData: NotificationData): Promise<boolean> {
    try {
      const transporter = createTransporter();

      const mailOptions = {
        from: 'Secure Land <noreply@secureland.com>',
        to: notificationData.to,
        subject: notificationData.subject,
        text: notificationData.text,
        html: notificationData.html
      };

      logger.info(`STUB: Would send email to ${notificationData.to} with subject: ${notificationData.subject}`);
      
      // In development, just log the email
      if (process.env.NODE_ENV === 'development') {
        logger.info('Email content:', {
          to: notificationData.to,
          subject: notificationData.subject,
          text: notificationData.text,
          html: notificationData.html
        });
        return true;
      }

      // In production, actually send the email
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId}`);
      
      return true;
    } catch (error) {
      logger.error('Email sending failed:', error);
      return false;
    }
  }

  static async notifyDocumentUpload(data: DocumentNotificationData): Promise<boolean> {
    try {
      const subject = 'Document Uploaded - Secure Land';
      const html = this.generateDocumentUploadHTML(data);
      const text = this.generateDocumentUploadText(data);

      return await this.sendEmail({
        to: data.userEmail,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Document upload notification failed:', error);
      return false;
    }
  }

  static async notifyDocumentVerification(data: DocumentNotificationData): Promise<boolean> {
    try {
      const subject = 'Document Verification Update - Secure Land';
      const html = this.generateDocumentVerificationHTML(data);
      const text = this.generateDocumentVerificationText(data);

      return await this.sendEmail({
        to: data.userEmail,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Document verification notification failed:', error);
      return false;
    }
  }

  static async notifyDocumentRejection(data: DocumentNotificationData): Promise<boolean> {
    try {
      const subject = 'Document Rejected - Secure Land';
      const html = this.generateDocumentRejectionHTML(data);
      const text = this.generateDocumentRejectionText(data);

      return await this.sendEmail({
        to: data.userEmail,
        subject,
        html,
        text
      });
    } catch (error) {
      logger.error('Document rejection notification failed:', error);
      return false;
    }
  }

  private static generateDocumentUploadHTML(data: DocumentNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Uploaded</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Document Uploaded Successfully</h2>
          <p>Hello ${data.userName},</p>
          <p>Your document has been uploaded successfully to Secure Land.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Document ID:</strong> ${data.documentId}</p>
            <p><strong>Document Name:</strong> ${data.documentName}</p>
            <p><strong>Status:</strong> Pending Verification</p>
          </div>
          <p>Your document is now pending verification by an official. You will be notified once the verification process is complete.</p>
          <p>Thank you for using Secure Land!</p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateDocumentUploadText(data: DocumentNotificationData): string {
    return `
Document Uploaded Successfully

Hello ${data.userName},

Your document has been uploaded successfully to Secure Land.

Document ID: ${data.documentId}
Document Name: ${data.documentName}
Status: Pending Verification

Your document is now pending verification by an official. You will be notified once the verification process is complete.

Thank you for using Secure Land!
    `;
  }

  private static generateDocumentVerificationHTML(data: DocumentNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Verified</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #27ae60;">Document Verified Successfully</h2>
          <p>Hello ${data.userName},</p>
          <p>Great news! Your document has been verified and is now part of the blockchain.</p>
          <div style="background: #d5f4e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Document ID:</strong> ${data.documentId}</p>
            <p><strong>Document Name:</strong> ${data.documentName}</p>
            <p><strong>Status:</strong> Verified ✓</p>
          </div>
          <p>Your document is now immutable and can be trusted for land transactions.</p>
          <p>Thank you for using Secure Land!</p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateDocumentVerificationText(data: DocumentNotificationData): string {
    return `
Document Verified Successfully

Hello ${data.userName},

Great news! Your document has been verified and is now part of the blockchain.

Document ID: ${data.documentId}
Document Name: ${data.documentName}
Status: Verified ✓

Your document is now immutable and can be trusted for land transactions.

Thank you for using Secure Land!
    `;
  }

  private static generateDocumentRejectionHTML(data: DocumentNotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Document Rejected</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e74c3c;">Document Rejected</h2>
          <p>Hello ${data.userName},</p>
          <p>Unfortunately, your document could not be verified and has been rejected.</p>
          <div style="background: #fadbd8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Document ID:</strong> ${data.documentId}</p>
            <p><strong>Document Name:</strong> ${data.documentName}</p>
            <p><strong>Status:</strong> Rejected ✗</p>
            <p><strong>Reason:</strong> ${data.rejectionReason || 'Not specified'}</p>
          </div>
          <p>Please review the reason and upload a corrected document if necessary.</p>
          <p>Thank you for using Secure Land!</p>
        </div>
      </body>
      </html>
    `;
  }

  private static generateDocumentRejectionText(data: DocumentNotificationData): string {
    return `
Document Rejected

Hello ${data.userName},

Unfortunately, your document could not be verified and has been rejected.

Document ID: ${data.documentId}
Document Name: ${data.documentName}
Status: Rejected ✗
Reason: ${data.rejectionReason || 'Not specified'}

Please review the reason and upload a corrected document if necessary.

Thank you for using Secure Land!
    `;
  }
}

export default NotificationService;

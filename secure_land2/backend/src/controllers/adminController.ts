import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import DocumentService from '../services/documentService';
import DocumentIntegrityService from '../services/documentIntegrityService';
import { BlockchainService, IPFSService, getCurrentProxyMode } from '../services/proxySelector';

export class AdminController {

  /**
   * Get admin dashboard statistics
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        allDocs,
        pendingDocs,
        verifiedDocs,
        rejectedDocs
      ] = await Promise.all([
        DocumentService.getAllDocuments(1, 1), // Just get count
        DocumentService.getAllDocuments(1, 1, 'Pending'),
        DocumentService.getAllDocuments(1, 1, 'Verified'),
        DocumentService.getAllDocuments(1, 1, 'Rejected')
      ]);

      const stats = {
        documents: {
          total: allDocs.total,
          pending: pendingDocs.total,
          verified: verifiedDocs.total,
          rejected: rejectedDocs.total,
          verificationRate: allDocs.total > 0 ? ((verifiedDocs.total / allDocs.total) * 100).toFixed(1) + '%' : '0%'
        },
        users: {
          total: 0 // Placeholder - implement user count if needed
        },
        system: {
          proxyMode: process.env.PROXY_MODE || 'mock',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          lastUpdated: new Date().toISOString()
        }
      };

      ResponseHandler.success(res, stats, 'Dashboard statistics retrieved successfully');

    } catch (error: any) {
      logger.error('Get dashboard stats failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Get pending documents for review
   */
  static async getPendingDocuments(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await DocumentService.getAllDocuments(page, limit, 'Pending');

      ResponseHandler.success(res, {
        documents: result.documents,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit
        }
      }, 'Pending documents retrieved successfully');

    } catch (error: any) {
      logger.error('Get pending documents failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Bulk verify documents
   */
  static async bulkVerifyDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { documentIds } = req.body;
      const verifiedBy = (req as any).user?.id;

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        ResponseHandler.error(res, 'Document IDs array is required', 400);
        return;
      }

      if (documentIds.length > 20) {
        ResponseHandler.error(res, 'Maximum 20 documents per bulk operation', 400);
        return;
      }

      const results = await DocumentService.batchVerifyDocuments(documentIds, verifiedBy);

      ResponseHandler.success(res, {
        verified: results.success,
        failed: results.failed,
        summary: {
          totalProcessed: documentIds.length,
          successCount: results.success.length,
          failedCount: results.failed.length,
          successRate: ((results.success.length / documentIds.length) * 100).toFixed(1) + '%'
        }
      }, 'Bulk verification completed');

    } catch (error: any) {
      logger.error('Bulk verify documents failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Bulk reject documents
   */
  static async bulkRejectDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { documentIds, reason } = req.body;
      const rejectedBy = (req as any).user?.id;

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        ResponseHandler.error(res, 'Document IDs array is required', 400);
        return;
      }

      if (!reason) {
        ResponseHandler.error(res, 'Rejection reason is required', 400);
        return;
      }

      const results = {
        success: [] as string[],
        failed: [] as Array<{ documentId: string; error: string }>
      };

      for (const docId of documentIds) {
        try {
          await DocumentService.rejectDocument(docId, rejectedBy, reason);
          results.success.push(docId);
        } catch (error) {
          results.failed.push({
            documentId: docId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      ResponseHandler.success(res, {
        rejected: results.success,
        failed: results.failed,
        summary: {
          totalProcessed: documentIds.length,
          successCount: results.success.length,
          failedCount: results.failed.length
        }
      }, 'Bulk rejection completed');

    } catch (error: any) {
      logger.error('Bulk reject documents failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * System health check for admins
   */
  static async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const [networkInfo] = await Promise.all([
        BlockchainService.getNetworkInfo()
      ]);

      const health = {
        services: {
          blockchain: {
            healthy: true,
            network: networkInfo,
            mode: getCurrentProxyMode()
          },
          ipfs: {
            healthy: true
          },
          database: {
            healthy: true, // MongoDB connection is checked at startup
            connected: true
          }
        },
        system: {
          environment: process.env.NODE_ENV,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          version: process.version
        }
      };

      ResponseHandler.success(res, health, 'System health retrieved successfully');

    } catch (error: any) {
      logger.error('Get system health failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }
}

export default AdminController;

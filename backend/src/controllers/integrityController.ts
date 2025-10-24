import { Request, Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import DocumentIntegrityService, { IntegrityCheckResult, BatchIntegrityResult } from '../services/documentIntegrityService';

export class IntegrityController {
  
  /**
   * Perform comprehensive document integrity check
   */
  static async checkDocumentIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      
      if (!documentId) {
        ResponseHandler.error(res, 'Document ID is required', 400);
        return;
      }

      const result = await DocumentIntegrityService.performIntegrityCheck(documentId);

      ResponseHandler.success(res, {
        integrity: result,
        recommendations: IntegrityController.getRecommendations(result)
      }, 'Document integrity check completed');

    } catch (error: any) {
      logger.error('Document integrity check failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Batch integrity check for multiple documents
   */
  static async batchCheckIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { documentIds } = req.body;
      
      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        ResponseHandler.error(res, 'Document IDs array is required', 400);
        return;
      }

      if (documentIds.length > 50) {
        ResponseHandler.error(res, 'Maximum 50 documents per batch', 400);
        return;
      }

      const result = await DocumentIntegrityService.performBatchIntegrityCheck(documentIds);

      ResponseHandler.success(res, {
        batch: result,
        summary: {
          totalDocuments: result.totalDocuments,
          verifiedPercentage: ((result.verified / result.totalDocuments) * 100).toFixed(1) + '%',
          issuesFound: result.tampered + result.errors,
          recommendations: IntegrityController.getBatchRecommendations(result)
        }
      }, 'Batch integrity check completed');

    } catch (error: any) {
      logger.error('Batch integrity check failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Check integrity for all documents of a property
   */
  static async checkPropertyIntegrity(req: Request, res: Response): Promise<void> {
    try {
      const { propertyId } = req.params;
      
      if (!propertyId) {
        ResponseHandler.error(res, 'Property ID is required', 400);
        return;
      }

      // Schedule integrity check for the property
      await DocumentIntegrityService.scheduleIntegrityChecks(propertyId);

      ResponseHandler.success(res, {
        propertyId,
        status: 'Integrity check scheduled and completed',
        timestamp: new Date().toISOString()
      }, 'Property integrity check completed');

    } catch (error: any) {
      logger.error('Property integrity check failed:', error);
      ResponseHandler.error(res, error.message || 'Internal server error', 500);
    }
  }

  /**
   * Get recommendations based on integrity results
   */
  private static getRecommendations(result: IntegrityCheckResult): string[] {
    const recommendations: string[] = [];

    if (!result.blockchainRecordExists) {
      recommendations.push('Document should be recorded on blockchain for verification');
    }

    if (!result.hashesMatch) {
      recommendations.push('Hash mismatch detected - document may have been tampered with');
    }

    if (!result.ipfsAccessible) {
      recommendations.push('Document content should be re-uploaded to IPFS for accessibility');
    }

    if (result.errors.length > 0) {
      recommendations.push('Critical errors found - immediate investigation required');
    }

    if (recommendations.length === 0) {
      recommendations.push('Document integrity is excellent - no action required');
    }

    return recommendations;
  }

  /**
   * Get batch recommendations
   */
  private static getBatchRecommendations(result: BatchIntegrityResult): string[] {
    const recommendations: string[] = [];

    if (result.tampered > 0) {
      recommendations.push(`${result.tampered} documents show signs of tampering - urgent review required`);
    }

    if (result.notRecorded > 0) {
      recommendations.push(`${result.notRecorded} documents need blockchain recording`);
    }

    if (result.unavailable > 0) {
      recommendations.push(`${result.unavailable} documents need IPFS re-upload`);
    }

    if (result.errors > 0) {
      recommendations.push(`${result.errors} documents have critical errors`);
    }

    const verificationRate = (result.verified / result.totalDocuments) * 100;
    if (verificationRate < 80) {
      recommendations.push('Low verification rate - system integrity review recommended');
    }

    return recommendations;
  }
}

export default IntegrityController;

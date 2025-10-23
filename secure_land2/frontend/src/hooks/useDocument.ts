import { useState, useCallback } from 'react';
import { Document, DocumentUploadData, PaginatedResponse, VerificationStatus, DocumentIntegrity, OwnershipHistory } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const useDocument = () => {
  const [isLoading, setIsLoading] = useState(false);

  const uploadDocument = useCallback(async (data: DocumentUploadData) => {
    try {
      setIsLoading(true);
      const result = await apiService.uploadDocument(data);
      toast.success('Document uploaded successfully!');
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUserDocuments = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setIsLoading(true);
      const result = await apiService.getUserDocuments(page, limit);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch documents';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAllDocuments = useCallback(async (page: number = 1, limit: number = 10, status?: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.getAllDocuments(page, limit, status);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch documents';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocumentById = useCallback(async (documentId: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.getDocumentById(documentId);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch document';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocumentByHash = useCallback(async (hash: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.getDocumentByHash(hash);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch document';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyDocument = useCallback(async (documentId: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.verifyDocument(documentId);
      toast.success('Document verified successfully!');
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rejectDocument = useCallback(async (documentId: string, reason: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.rejectDocument(documentId, reason);
      toast.success('Document rejected successfully!');
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Rejection failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyDocumentHash = useCallback(async (documentId: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.verifyDocumentHash(documentId);
      if (result.verified) {
        toast.success('Document hash verified successfully!');
      } else {
        toast.error('Document hash verification failed!');
      }
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Hash verification failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getVerificationStatus = useCallback(async (documentId: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.getVerificationStatus(documentId);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get verification status';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDocumentIntegrity = useCallback(async (documentId: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.getDocumentIntegrity(documentId);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to check document integrity';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getOwnershipHistory = useCallback(async (propertyId: string) => {
    try {
      setIsLoading(true);
      const result = await apiService.getOwnershipHistory(propertyId);
      return result;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get ownership history';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    uploadDocument,
    getUserDocuments,
    getAllDocuments,
    getDocumentById,
    getDocumentByHash,
    verifyDocument,
    rejectDocument,
    verifyDocumentHash,
    getVerificationStatus,
    getDocumentIntegrity,
    getOwnershipHistory,
  };
};

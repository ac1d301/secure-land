import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  User, 
  Document, 
  PaginatedResponse, 
  VerificationStatus, 
  BlockchainInfo, 
  DocumentIntegrity, 
  OwnershipHistory,
  LoginCredentials,
  RegisterData,
  DocumentUploadData,
  NotificationData,
  ApiResponse
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  }

  async getUser(): Promise<User> {
    const response = await this.api.get<ApiResponse<User>>('/auth/user');
    return response.data.data!;
  }

  async updateUser(data: Partial<RegisterData>): Promise<User> {
    const response = await this.api.put<ApiResponse<User>>('/auth/user', data);
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  // Document endpoints
  async uploadDocument(data: DocumentUploadData): Promise<{ document: Document; ipfsUrl: string; blockchainTxHash?: string }> {
    const formData = new FormData();
    formData.append('document', data.file);
    formData.append('propertyAddress', data.propertyAddress);

    const response = await this.api.post<ApiResponse<{ document: Document; ipfsUrl: string; blockchainTxHash?: string }>>(
      '/documents/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  }

  async getUserDocuments(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Document>> {
    const response = await this.api.get<ApiResponse<PaginatedResponse<Document>>>(
      `/documents/my-documents?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  }

  async getAllDocuments(page: number = 1, limit: number = 10, status?: string): Promise<PaginatedResponse<Document>> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (status) params.append('status', status);
    
    const response = await this.api.get<ApiResponse<PaginatedResponse<Document>>>(
      `/documents?${params.toString()}`
    );
    return response.data.data!;
  }

  async getDocumentById(documentId: string): Promise<Document> {
    const response = await this.api.get<ApiResponse<Document>>(`/documents/${documentId}`);
    return response.data.data!;
  }

  async getDocumentByHash(hash: string): Promise<Document> {
    const response = await this.api.get<ApiResponse<Document>>(`/documents/hash/${hash}`);
    return response.data.data!;
  }

  async verifyDocument(documentId: string): Promise<Document> {
    const response = await this.api.post<ApiResponse<Document>>(`/documents/${documentId}/verify`);
    return response.data.data!;
  }

  async rejectDocument(documentId: string, reason: string): Promise<Document> {
    const response = await this.api.post<ApiResponse<Document>>(`/documents/${documentId}/reject`, { reason });
    return response.data.data!;
  }

  // Verification endpoints
  async verifyDocumentHash(documentId: string, hash: string): Promise<{ verified: boolean; message: string }> {
    const response = await this.api.post<ApiResponse<{ verified: boolean; message: string }>>(
      `/verify/${documentId}`,
      { hash }
    );
    return response.data.data!;
  }

  async getVerificationStatus(documentId: string): Promise<VerificationStatus> {
    const response = await this.api.get<ApiResponse<VerificationStatus>>(`/verify/${documentId}/status`);
    return response.data.data!;
  }

  async getDocumentIntegrity(documentId: string): Promise<DocumentIntegrity> {
    const response = await this.api.get<ApiResponse<DocumentIntegrity>>(`/verify/${documentId}/integrity`);
    return response.data.data!;
  }

  async getOwnershipHistory(propertyId: string): Promise<OwnershipHistory> {
    const response = await this.api.get<ApiResponse<OwnershipHistory>>(`/verify/property/${propertyId}/history`);
    return response.data.data!;
  }

  async getBlockchainInfo(): Promise<BlockchainInfo> {
    const response = await this.api.get<ApiResponse<BlockchainInfo>>('/verify/blockchain/info');
    return response.data.data!;
  }

  // Notification endpoints
  async sendNotification(data: NotificationData): Promise<{ sent: boolean }> {
    const response = await this.api.post<ApiResponse<{ sent: boolean }>>('/notify/send', data);
    return response.data.data!;
  }

  async sendDocumentNotification(data: {
    userEmail: string;
    userName: string;
    documentId: string;
    documentName: string;
    status: 'uploaded' | 'verified' | 'rejected';
    rejectionReason?: string;
  }): Promise<{ sent: boolean }> {
    const response = await this.api.post<ApiResponse<{ sent: boolean }>>('/notify/document', data);
    return response.data.data!;
  }

  async testEmail(email?: string): Promise<{ sent: boolean }> {
    const response = await this.api.post<ApiResponse<{ sent: boolean }>>('/notify/test', { email });
    return response.data.data!;
  }

  async getNotificationStatus(): Promise<{
    service: string;
    status: string;
    environment: string;
    message: string;
  }> {
    const response = await this.api.get<ApiResponse<{
      service: string;
      status: string;
      environment: string;
      message: string;
    }>>('/notify/status');
    return response.data.data!;
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  }> {
    const response = await this.api.get<ApiResponse<{
      status: string;
      timestamp: string;
      uptime: number;
      environment: string;
    }>>('/health');
    return response.data.data!;
  }
}

export const apiService = new ApiService();
export default apiService;

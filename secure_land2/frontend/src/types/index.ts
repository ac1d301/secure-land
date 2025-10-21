export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Buyer' | 'Seller' | 'Official';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  _id: string;
  ownerId: string;
  propertyId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  ipfsCid: string;
  hash: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  verificationDate?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  userId: string;
  action: 'UPLOAD' | 'VERIFY' | 'REJECT' | 'LOGIN' | 'LOGOUT' | 'REGISTER';
  resourceType: 'DOCUMENT' | 'USER' | 'AUTH';
  resourceId?: string;
  details: {
    propertyId?: string;
    documentId?: string;
    fileName?: string;
    hash?: string;
    ipfsCid?: string;
    verificationResult?: boolean;
    rejectionReason?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  documents: T[];
  total: number;
  page: number;
  pages: number;
}

export interface VerificationStatus {
  documentId: string;
  status: string;
  hash: string;
  blockchainHash: string | null;
  isOnBlockchain: boolean;
  hashMatches: boolean;
  verificationDate?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface BlockchainInfo {
  contractAddress: string;
  network: {
    name: string;
    chainId: number;
  };
  message: string;
}

export interface DocumentIntegrity {
  documentId: string;
  integrityStatus: 'verified' | 'tampered' | 'not_recorded' | 'unknown';
  isOnBlockchain: boolean;
  hashMatches: boolean;
  localHash: string;
  blockchainHash: string | null;
  message: string;
}

export interface OwnershipHistory {
  propertyId: string;
  documents: Document[];
  totalDocuments: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'Buyer' | 'Seller' | 'Official';
}

export interface DocumentUploadData {
  propertyAddress: string;
  file: File;
}

export interface NotificationData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  data?: Record<string, any>;
}

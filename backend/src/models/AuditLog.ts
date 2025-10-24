import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
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
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  action: {
    type: String,
    enum: ['UPLOAD', 'VERIFY', 'REJECT', 'LOGIN', 'LOGOUT', 'REGISTER'],
    required: [true, 'Action is required']
  },
  resourceType: {
    type: String,
    enum: ['DOCUMENT', 'USER', 'AUTH'],
    required: [true, 'Resource type is required']
  },
  resourceId: {
    type: String,
    trim: true
  },
  details: {
    propertyId: {
      type: String,
      trim: true
    },
    documentId: {
      type: String,
      trim: true
    },
    fileName: {
      type: String,
      trim: true
    },
    hash: {
      type: String,
      trim: true
    },
    ipfsCid: {
      type: String,
      trim: true
    },
    verificationResult: {
      type: Boolean
    },
    rejectionReason: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: false // We use custom timestamp field
});

// Index for efficient queries
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ resourceType: 1 });
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ resourceId: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

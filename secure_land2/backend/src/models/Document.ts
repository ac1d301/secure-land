import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
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
  verificationDate?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  ownerId: {
    type: String,
    required: [true, 'Owner ID is required'],
    ref: 'User'
  },
  propertyId: {
    type: String,
    required: [true, 'Property ID is required'],
    trim: true,
    maxlength: [100, 'Property ID cannot exceed 100 characters']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be greater than 0']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true
  },
  ipfsCid: {
    type: String,
    required: [true, 'IPFS CID is required'],
    unique: true,
    trim: true
  },
  hash: {
    type: String,
    required: [true, 'Document hash is required'],
    unique: true,
    trim: true,
    length: [64, 'Hash must be exactly 64 characters (SHA-256)']
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
    required: true
  },
  verificationDate: {
    type: Date
  },
  verifiedBy: {
    type: String,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
DocumentSchema.index({ ownerId: 1 });
DocumentSchema.index({ propertyId: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ createdAt: -1 });

export default mongoose.model<IDocument>('Document', DocumentSchema);

import mongoose, { Document, Schema, ClientSession } from 'mongoose';

export interface IBlockchainMetadata {
  txHash: string;
  blockNumber?: number;
  confirmations: number;
  lastVerified: Date;
  verificationCount: number;
  isOnChain: boolean;
}

export interface IDocumentVersion {
  hash: string;
  timestamp: Date;
  txHash?: string;
  changedBy: string;
  changeReason?: string;
}

export interface IDocument extends Document {
  _id: string;
  ownerId: string;
  propertyId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  ipfsCid: string;
  ipfsGatewayUrl: string;
  hash: string;
  status: 'Draft' | 'Pending' | 'Verified' | 'Rejected' | 'Archived';
  verificationDate?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  
  // Blockchain metadata
  blockchain: IBlockchainMetadata;
  
  // Document versioning
  version: number;
  previousVersions: IDocumentVersion[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  createNewVersion(newHash: string, userId: string, reason?: string): Promise<IDocument>;
  verifyDocument(verifiedBy: string): Promise<IDocument>;
  rejectDocument(rejectedBy: string, reason: string): Promise<IDocument>;
  updateOnChainStatus(isOnChain: boolean): Promise<IDocument>;
}

const BlockchainMetadataSchema = new Schema<IBlockchainMetadata>({
  txHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    trim: true,
    match: [/^0x([A-Fa-f0-9]{64})$/, 'Invalid transaction hash format']
  },
  blockNumber: {
    type: Number,
    min: [0, 'Block number must be positive']
  },
  confirmations: {
    type: Number,
    default: 0,
    min: [0, 'Confirmations must be positive']
  },
  lastVerified: {
    type: Date,
    default: Date.now
  },
  verificationCount: {
    type: Number,
    default: 0,
    min: [0, 'Verification count must be positive']
  },
  isOnChain: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const DocumentVersionSchema = new Schema<IDocumentVersion>({
  hash: {
    type: String,
    required: true,
    trim: true,
    length: [64, 'Hash must be exactly 64 characters (SHA-256)']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  txHash: {
    type: String,
    trim: true,
    match: [/^0x([A-Fa-f0-9]{64})?$/, 'Invalid transaction hash format']
  },
  changedBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  changeReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Change reason cannot exceed 500 characters']
  }
}, { _id: false });

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
    maxlength: [100, 'Property ID cannot exceed 100 characters'],
    index: true
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
    trim: true,
    index: true
  },
  ipfsGatewayUrl: {
    type: String,
    trim: true
  },
  hash: {
    type: String,
    required: [true, 'Document hash is required'],
    unique: true,
    trim: true,
    length: [64, 'Hash must be exactly 64 characters (SHA-256)'],
    index: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Verified', 'Rejected', 'Archived'],
    default: 'Draft',
    required: true,
    index: true
  },
  verificationDate: {
    type: Date,
    index: true
  },
  verifiedBy: {
    type: String,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  blockchain: {
    type: BlockchainMetadataSchema,
    required: true,
    default: () => ({
      txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      confirmations: 0,
      lastVerified: new Date(),
      verificationCount: 0,
      isOnChain: false
    })
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  previousVersions: [DocumentVersionSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Document versioning methods
DocumentSchema.methods.createNewVersion = async function(
  newHash: string,
  userId: string,
  reason?: string
): Promise<IDocument> {
  // Add current version to history
  this.previousVersions.push({
    hash: this.hash,
    timestamp: new Date(),
    txHash: this.blockchain.txHash,
    changedBy: userId,
    changeReason: reason
  });

  // Update current hash and increment version
  this.hash = newHash;
  this.version += 1;
  this.status = 'Pending'; // Reset status when updated
  this.verificationDate = undefined;
  this.verifiedBy = undefined;
  this.rejectionReason = undefined;
  this.blockchain.confirmations = 0;
  this.blockchain.isOnChain = false;

  return this.save();
};

// Document status methods
DocumentSchema.methods.verifyDocument = async function(
  verifiedBy: string
): Promise<IDocument> {
  this.status = 'Verified';
  this.verificationDate = new Date();
  this.verifiedBy = verifiedBy;
  this.rejectionReason = undefined;
  this.blockchain.lastVerified = new Date();
  this.blockchain.verificationCount += 1;
  
  return this.save();
};

DocumentSchema.methods.rejectDocument = async function(
  rejectedBy: string,
  reason: string
): Promise<IDocument> {
  this.status = 'Rejected';
  this.verificationDate = new Date();
  this.verifiedBy = rejectedBy;
  this.rejectionReason = reason;
  
  return this.save();
};

DocumentSchema.methods.updateOnChainStatus = async function(
  isOnChain: boolean
): Promise<IDocument> {
  this.blockchain.isOnChain = isOnChain;
  this.blockchain.lastVerified = new Date();
  if (isOnChain) {
    this.blockchain.verificationCount += 1;
  }
  return this.save();
};

// Indexes for efficient queries
DocumentSchema.index({ ownerId: 1, status: 1 });
DocumentSchema.index({ propertyId: 1, status: 1 });
DocumentSchema.index({ 'blockchain.txHash': 1 }, { unique: true, sparse: true });
DocumentSchema.index({ 'blockchain.isOnChain': 1 });
DocumentSchema.index({ 'blockchain.lastVerified': 1 });
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ updatedAt: -1 });

// Text index for search
DocumentSchema.index(
  { 
    originalName: 'text',
    propertyId: 'text',
    'blockchain.txHash': 'text',
    ipfsCid: 'text'
  },
  {
    weights: {
      originalName: 5,
      propertyId: 3,
      'blockchain.txHash': 1,
      ipfsCid: 1
    },
    name: 'document_search_index'
  }
);

// Pre-save hook to set IPFS gateway URL if not set
DocumentSchema.pre<IDocument>('save', function(next) {
  if (this.isModified('ipfsCid') && !this.ipfsGatewayUrl) {
    const gateway = process.env.IPFS_GATEWAY_URL || 'https://ipfs.io/ipfs/';
    this.ipfsGatewayUrl = `${gateway}${this.ipfsCid}`;
  }
  next();
});

// Static methods for common queries
DocumentSchema.statics.findByOwner = function(ownerId: string) {
  return this.find({ ownerId });
};

DocumentSchema.statics.findByProperty = function(propertyId: string) {
  return this.find({ propertyId }).sort({ version: -1 });
};

DocumentSchema.statics.findByStatus = function(status: string) {
  return this.find({ status });
};

DocumentSchema.statics.findByTxHash = function(txHash: string) {
  return this.findOne({ 'blockchain.txHash': txHash });
};

export default mongoose.model<IDocument>('Document', DocumentSchema);

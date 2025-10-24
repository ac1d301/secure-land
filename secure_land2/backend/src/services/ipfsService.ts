import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface IPFSUploadResult {
  cid: string;
  size: number;
  url: string;
}

type StoredFile = {
  content: Buffer;
  metadata: {
    originalName: string;
    mimeType: string;
    uploadTime: Date;
    size: number;
  };
};

const mockIPFSStorage = new Map<string, StoredFile>();

const DEFAULT_MIN_DELAY = 200;
const DEFAULT_MAX_DELAY = 1500;

const parseDelay = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const delaysEnabled = (): boolean => {
  const flag = process.env.MOCK_ENABLE_REALISTIC_DELAYS;
  if (!flag) {
    return true;
  }
  return flag.toLowerCase() !== 'false';
};

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

class IPFSService {
  private static detectMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      json: 'application/json'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private static getDelay(): number {
    if (!delaysEnabled()) {
      return 0;
    }
    const min = parseDelay(process.env.MOCK_IPFS_MIN_DELAY, DEFAULT_MIN_DELAY);
    const max = parseDelay(process.env.MOCK_IPFS_MAX_DELAY, DEFAULT_MAX_DELAY);
    return min + Math.random() * Math.max(max - min, 0);
  }

  static async uploadFile(file: Buffer, fileName: string): Promise<IPFSUploadResult> {
    try {
      const delay = this.getDelay();
      if (delay > 0) {
        await wait(delay);
      }

      const contentHash = crypto.createHash('sha256').update(file).digest('hex');
      const cid = `Qm${contentHash.slice(0, 44)}`;
      const mimeType = this.detectMimeType(fileName);

      mockIPFSStorage.set(cid, {
        content: file,
        metadata: {
          originalName: fileName,
          mimeType,
          uploadTime: new Date(),
          size: file.length
        }
      });

      const url = this.getIPFSURL(cid);

      logger.info('📁 Mock IPFS: File uploaded successfully', {
        fileName,
        cid: cid.slice(0, 10),
        size: file.length,
        mimeType
      });

      return { cid, size: file.length, url };
    } catch (error) {
      logger.error('📁 Mock IPFS: Upload failed:', error);
      throw new Error(`Mock IPFS upload failed: ${error}`);
    }
  }

  static async uploadDocument(file: Buffer, fileName: string, metadata?: Record<string, any>): Promise<IPFSUploadResult> {
    try {
      const finalFileName = metadata ? `${fileName}_${JSON.stringify(metadata)}` : fileName;
      return await this.uploadFile(file, finalFileName);
    } catch (error) {
      logger.error('📁 Mock IPFS: Document upload failed:', error);
      throw error;
    }
  }

  static async isAvailable(cid: string): Promise<boolean> {
    const delay = this.getDelay();
    if (delay > 0) {
      await wait(Math.min(delay, 500));
    }
    const exists = mockIPFSStorage.has(cid);
    logger.debug('📁 Mock IPFS: Availability check', {
      cid: cid.slice(0, 10),
      available: exists
    });
    return exists;
  }

  static async getFileMetadata(cid: string): Promise<{ size?: number; contentType?: string; lastModified?: string }> {
    const stored = mockIPFSStorage.get(cid);
    if (!stored) {
      return {};
    }
    return {
      size: stored.metadata.size,
      contentType: stored.metadata.mimeType,
      lastModified: stored.metadata.uploadTime.toISOString()
    };
  }

  static async downloadFile(cid: string): Promise<Buffer> {
    const stored = mockIPFSStorage.get(cid);
    if (!stored) {
      throw new Error(`File not found in mock IPFS: ${cid}`);
    }
    const delay = this.getDelay();
    if (delay > 0) {
      await wait(delay);
    }
    logger.info('📁 Mock IPFS: File downloaded', {
      cid: cid.slice(0, 10),
      size: stored.metadata.size
    });
    return stored.content;
  }

  static getIPFSURL(cid: string): string {
    return `https://mock-gateway.ipfs.local/ipfs/${cid}`;
  }

  static getIPFSGatewayURL(cid: string, _gateway: string = 'mock'): string {
    return this.getIPFSURL(cid);
  }

  static async validateCID(cid: string): Promise<boolean> {
    try {
      const cidPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{50,})$/;
      return cidPattern.test(cid);
    } catch (error) {
      logger.error('📁 Mock IPFS: CID validation failed:', error);
      return false;
    }
  }

  static getStats(): {
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
  } {
    const files = Array.from(mockIPFSStorage.values());
    const totalSize = files.reduce((sum, file) => sum + file.metadata.size, 0);
    return {
      totalFiles: files.length,
      totalSize,
      averageFileSize: files.length > 0 ? Math.round(totalSize / files.length) : 0
    };
  }

  static clearAllData(): void {
    mockIPFSStorage.clear();
    logger.info('📁 Mock IPFS: All data cleared');
  }

  static async healthCheck(): Promise<boolean> {
    return true;
  }

  static getAllRecords(): Array<{ cid: string; metadata: any }> {
    return Array.from(mockIPFSStorage.entries()).map(([cid, data]) => ({ 
      cid, 
      metadata: data.metadata 
    }));
  }
}

export default IPFSService;
export { IPFSService };

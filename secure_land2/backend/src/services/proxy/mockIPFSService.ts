import crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface IPFSUploadResult {
  cid: string;
  size: number;
  url: string;
}

const mockIPFSStorage = new Map<string, {
  content: Buffer;
  metadata: {
    originalName: string;
    mimeType: string;
    uploadTime: Date;
    size: number;
  };
}>();

export default class MockIPFSService {
  static async uploadFile(file: Buffer, fileName: string): Promise<IPFSUploadResult> {
    try {
      const delay = Math.min(500 + (file.length / 1024), 3000);
      await new Promise(resolve => setTimeout(resolve, delay));

      const contentHash = crypto.createHash('sha256').update(file).digest('hex');
      const cid = 'Qm' + contentHash.slice(0, 44);
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
        cid: cid.slice(0, 10) + '...',
        size: file.length,
        mimeType,
        provider: 'mock-ipfs'
      });

      return { cid, size: file.length, url };
    } catch (error) {
      logger.error('📁 Mock IPFS: Upload failed:', error);
      throw new Error(`Mock IPFS upload failed: ${error}`);
    }
  }

  static async isAvailable(cid: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300));
    const exists = mockIPFSStorage.has(cid);

    logger.debug('📁 Mock IPFS: Availability check', {
      cid: cid.slice(0, 10) + '...',
      available: exists,
      provider: 'mock-ipfs'
    });

    return exists;
  }

  static async getFileMetadata(cid: string): Promise<{size?: number, contentType?: string, lastModified?: string}> {
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

    const delay = Math.min(200 + (stored.content.length / 1024), 2000);
    await new Promise(resolve => setTimeout(resolve, delay));

    logger.info('📁 Mock IPFS: File downloaded', {
      cid: cid.slice(0, 10) + '...',
      size: stored.content.length
    });

    return stored.content;
  }

  static getIPFSURL(cid: string): string {
    return `https://mock-gateway.ipfs.local/ipfs/${cid}`;
  }

  static getIPFSGatewayURL(cid: string, gateway: string = 'mock'): string {
    return `https://mock-gateway.ipfs.local/ipfs/${cid}`;
  }

  private static detectMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: {[key: string]: string} = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'json': 'application/json'
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  static getAllRecords(): Array<{cid: string, metadata: any}> {
    return Array.from(mockIPFSStorage.entries()).map(([cid, data]) => ({
      cid,
      metadata: data.metadata
    }));
  }

  static clearAllData(): void {
    mockIPFSStorage.clear();
    logger.info('📁 Mock IPFS: All data cleared');
  }

  static getStats(): {
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
  } {
    const files = Array.from(mockIPFSStorage.values());
    const totalSize = files.reduce((sum, file) => sum + file.content.length, 0);

    return {
      totalFiles: files.length,
      totalSize,
      averageFileSize: files.length > 0 ? Math.round(totalSize / files.length) : 0
    };
  }

  static async healthCheck(): Promise<boolean> {
    return true;
  }
}

import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../../utils/logger';

export interface IPFSUploadResult {
  cid: string;
  size: number;
  url: string;
}

const IPFS_API_BASE = process.env.IPFS_API_BASE || 'https://api.secureland.io';
const IPFS_API_KEY = process.env.IPFS_API_KEY || '';

const apiClient = axios.create({
  baseURL: IPFS_API_BASE,
  timeout: 60000,
  headers: {
    ...(IPFS_API_KEY && { 'Authorization': `Bearer ${IPFS_API_KEY}` })
  }
});

apiClient.interceptors.request.use(
  (config) => {
    logger.debug('📡 IPFS API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url
    });
    return config;
  }
);

apiClient.interceptors.response.use(
  (response) => {
    logger.debug('📡 IPFS API Response:', {
      status: response.status,
      url: response.config.url
    });
    return response;
  },
  (error) => {
    logger.error('📡 IPFS API Error:', {
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export default class ExternalIPFSProxy {
  static async uploadFile(file: Buffer, fileName: string): Promise<IPFSUploadResult> {
    try {
      logger.info('📡 External API: Uploading file to IPFS', { fileName });

      const formData = new FormData();
      formData.append('file', file, {
        filename: fileName,
        contentType: this.detectMimeType(fileName)
      });

      formData.append('metadata', JSON.stringify({
        originalName: fileName,
        uploadTime: new Date().toISOString(),
        size: file.length
      }));

      const response = await apiClient.post('/ipfs/upload', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Length': formData.getLengthSync()
        },
        maxContentLength: 100 * 1024 * 1024,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            logger.debug(`📡 Upload progress: ${percentCompleted}%`);
          }
        }
      });

      const { cid, size, url, status } = response.data;

      if (status !== 'success') {
        throw new Error(`Upload failed with status: ${status}`);
      }

      logger.info('📡 External API: File uploaded to IPFS successfully', {
        fileName,
        cid: cid?.slice(0, 10) + '...',
        size: size || file.length,
        provider: 'external-ipfs-api'
      });

      return {
        cid,
        size: size || file.length,
        url: url || this.getIPFSURL(cid)
      };
    } catch (error: any) {
      logger.error('📡 External API: IPFS upload failed:', error);

      if (error.response?.status === 413) {
        throw new Error('File too large: Exceeds maximum upload size');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid IPFS API key');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded: Too many uploads');
      }

      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  static async isAvailable(cid: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/ipfs/availability/${cid}`, {
        timeout: 10000
      });

      const { available, gateways } = response.data;

      logger.debug('📡 External API: IPFS availability check', {
        cid: cid.slice(0, 10) + '...',
        available,
        gateways: gateways?.length
      });

      return Boolean(available);
    } catch (error: any) {
      logger.error('📡 External API: IPFS availability check failed:', error);

      if (error.response?.status === 404) {
        return false;
      }

      return false;
    }
  }

  static async getFileMetadata(cid: string): Promise<{size?: number, contentType?: string, lastModified?: string}> {
    try {
      const response = await apiClient.get(`/ipfs/metadata/${cid}`);

      const { size, contentType, uploadTime } = response.data;

      return {
        size,
        contentType,
        lastModified: uploadTime
      };
    } catch (error: any) {
      logger.error('📡 External API: IPFS metadata fetch failed:', error);
      return {};
    }
  }

  static async downloadFile(cid: string): Promise<Buffer> {
    try {
      const response = await apiClient.get(`/ipfs/download/${cid}`, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024
      });

      logger.info('📡 External API: File downloaded from IPFS', {
        cid: cid.slice(0, 10) + '...',
        size: response.data.byteLength
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('📡 External API: IPFS file download failed:', error);
      throw new Error(`Failed to download file from IPFS: ${error.message}`);
    }
  }

  static getIPFSURL(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  static getIPFSGatewayURL(cid: string, gateway: 'pinata' | 'ipfs' | 'cloudflare' | 'dweb' = 'pinata'): string {
    const gateways = {
      pinata: `https://gateway.pinata.cloud/ipfs/${cid}`,
      ipfs: `https://ipfs.io/ipfs/${cid}`,
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
      dweb: `https://dweb.link/ipfs/${cid}`
    };

    return gateways[gateway];
  }

  static async pinFile(cid: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/ipfs/pin', { cid });

      logger.info('📡 External API: File pinned successfully', {
        cid: cid.slice(0, 10) + '...',
        status: response.data.status
      });

      return response.data.status === 'pinned';
    } catch (error: any) {
      logger.error('📡 External API: File pinning failed:', error);
      return false;
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health', { timeout: 5000 });

      logger.info('📡 External API: IPFS health check passed', {
        status: response.status
      });

      return response.status === 200;
    } catch (error) {
      logger.error('📡 External API: IPFS health check failed:', error);
      return false;
    }
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

  static getAllGatewayURLs(cid: string): string[] {
    return [
      this.getIPFSGatewayURL(cid, 'pinata'),
      this.getIPFSGatewayURL(cid, 'ipfs'),
      this.getIPFSGatewayURL(cid, 'cloudflare'),
      this.getIPFSGatewayURL(cid, 'dweb')
    ];
  }
}

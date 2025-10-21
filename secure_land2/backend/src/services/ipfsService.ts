import { uploadToIPFS } from '../config/ipfs';
import { logger } from '../utils/logger';

export interface IPFSUploadResult {
  cid: string;
  size: number;
  url: string;
}

export class IPFSService {
  // PROXY: IPFS Upload via Pinata
  static async uploadFile(file: Buffer, fileName: string): Promise<IPFSUploadResult> {
    try {
      logger.info(`PROXY: Uploading file ${fileName} to IPFS via Pinata`);
      
      // Upload to IPFS using Pinata proxy
      const cid = await uploadToIPFS(file, fileName);
      
      // Construct IPFS URL
      const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
      
      const result: IPFSUploadResult = {
        cid,
        size: file.length,
        url
      };

      logger.info(`File uploaded to IPFS successfully: ${cid}`);
      
      return result;
    } catch (error) {
      logger.error('IPFS upload failed:', error);
      throw new Error(`Failed to upload file to IPFS: ${error}`);
    }
  }

  static async uploadDocument(file: Buffer, fileName: string, metadata?: Record<string, any>): Promise<IPFSUploadResult> {
    try {
      // Add metadata to filename if provided
      const finalFileName = metadata ? `${fileName}_${JSON.stringify(metadata)}` : fileName;
      
      return await this.uploadFile(file, finalFileName);
    } catch (error) {
      logger.error('Document upload to IPFS failed:', error);
      throw error;
    }
  }

  static getIPFSURL(cid: string): string {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  static getIPFSGatewayURL(cid: string, gateway: string = 'pinata'): string {
    const gateways: Record<string, string> = {
      pinata: `https://gateway.pinata.cloud/ipfs/${cid}`,
      ipfs: `https://ipfs.io/ipfs/${cid}`,
      cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`
    };

    return gateways[gateway] || gateways.pinata;
  }

  static async validateCID(cid: string): Promise<boolean> {
    try {
      // Basic CID validation (starts with Qm for v0 or bafy for v1)
      const cidPattern = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z0-9]{50,})$/;
      return cidPattern.test(cid);
    } catch (error) {
      logger.error('CID validation failed:', error);
      return false;
    }
  }
}

export default IPFSService;

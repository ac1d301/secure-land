import axios from 'axios';

export interface IPFSConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export const getIPFSConfig = (): IPFSConfig => {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_API_KEY;
  
  if (!apiKey || !secretKey) {
    throw new Error('PINATA_API_KEY and PINATA_SECRET_API_KEY are required');
  }

  return {
    apiKey,
    secretKey,
    baseUrl: 'https://api.pinata.cloud'
  };
};

// PROXY: IPFS Upload via Pinata
export const uploadToIPFS = async (file: Buffer, fileName: string): Promise<string> => {
  const config = getIPFSConfig();
  
  try {
    const formData = new FormData();
    formData.append('file', new Blob([file]), fileName);
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        app: 'secure-land'
      }
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 0
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      `${config.baseUrl}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'pinata_api_key': config.apiKey,
          'pinata_secret_api_key': config.secretKey
        }
      }
    );

    return response.data.IpfsHash;
  } catch (error) {
    throw new Error(`IPFS upload failed: ${error}`);
  }
};

export default getIPFSConfig;

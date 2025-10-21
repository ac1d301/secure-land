import { ethers } from 'ethers';

export interface BlockchainConfig {
  provider: ethers.JsonRpcProvider;
  network: string;
  contractAddress: string;
}

export const getBlockchainConfig = (): BlockchainConfig => {
  const infuraProjectId = process.env.INFURA_PROJECT_ID;
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!infuraProjectId) {
    throw new Error('INFURA_PROJECT_ID is required');
  }
  
  if (!contractAddress) {
    throw new Error('CONTRACT_ADDRESS is required');
  }

  // PROXY: Ethereum Smart Contract via Infura
  const provider = new ethers.JsonRpcProvider(
    `https://sepolia.infura.io/v3/${infuraProjectId}`
  );

  return {
    provider,
    network: 'sepolia',
    contractAddress
  };
};

export default getBlockchainConfig;

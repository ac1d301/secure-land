import { logger } from '../utils/logger';

export interface BlockchainConfig {
  provider: any;
  signer: any;
  contractAddress: string;
  network: string;
  gasLimit: number;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  requiredConfirmations: number;
}

const validateConfig = () => {
  const requiredVars = [
    'INFURA_PROJECT_ID',
    'CONTRACT_ADDRESS',
    'PRIVATE_KEY',
    'GAS_LIMIT',
    'MAX_FEE_PER_GAS',
    'MAX_PRIORITY_FEE_PER_GAS',
    'REQUIRED_CONFIRMATIONS'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY || '')) {
    throw new Error('Invalid PRIVATE_KEY format. Must be a 64-character hex string with 0x prefix');
  }

  if (!/^0x[0-9a-fA-F]{40}$/.test(process.env.CONTRACT_ADDRESS || '')) {
    throw new Error('Invalid CONTRACT_ADDRESS format');
  }
};

export const getBlockchainConfig = (): BlockchainConfig => {
  // Check if we're in mock mode
  const proxyMode = process.env.PROXY_MODE || 'mock';
  
  if (proxyMode === 'mock') {
    logger.info('📝 Blockchain config: Using mock mode (no external dependencies)');
    return {
      provider: null,
      signer: null,
      contractAddress: '0xMockContractAddress',
      network: 'mock-local',
      gasLimit: 300000,
      maxFeePerGas: '15',
      maxPriorityFeePerGas: '1.5',
      requiredConfirmations: 3
    };
  }

  // For ethers mode, require ethers library
  try {
    const { ethers } = require('ethers');
    validateConfig();

    const provider = new ethers.JsonRpcProvider(
      `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      'sepolia',
      { staticNetwork: true }
    );

    const signer = new ethers.Wallet(
      process.env.PRIVATE_KEY!,
      provider
    );

    return {
      provider,
      signer,
      contractAddress: process.env.CONTRACT_ADDRESS!,
      network: 'sepolia',
      gasLimit: parseInt(process.env.GAS_LIMIT || '300000'),
      maxFeePerGas: process.env.MAX_FEE_PER_GAS!,
      maxPriorityFeePerGas: process.env.MAX_PRIORITY_FEE_PER_GAS!,
      requiredConfirmations: parseInt(process.env.REQUIRED_CONFIRMATIONS || '3')
    };
  } catch (error) {
    logger.error('Failed to initialize blockchain config:', error);
    throw new Error(`Blockchain configuration error: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const getRetryConfig = () => ({
  maxRetries: 3,
  initialBackoff: 1000, // 1 second
  maxBackoff: 10000,    // 10 seconds
  factor: 2
});

export const getGasSettings = () => {
  const proxyMode = process.env.PROXY_MODE || 'mock';
  
  if (proxyMode === 'mock') {
    return {
      maxFeePerGas: '15',
      maxPriorityFeePerGas: '1.5',
      gasLimit: 300000
    };
  }
  
  // For ethers mode
  const { ethers } = require('ethers');
  return {
    maxFeePerGas: ethers.parseUnits(process.env.MAX_FEE_PER_GAS || '15', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits(process.env.MAX_PRIORITY_FEE_PER_GAS || '1.5', 'gwei'),
    gasLimit: parseInt(process.env.GAS_LIMIT || '300000')
  };
};

export const isEthereumAddress = (address: string): boolean => {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

export const isTransactionHash = (hash: string): boolean => {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
};

export default getBlockchainConfig;

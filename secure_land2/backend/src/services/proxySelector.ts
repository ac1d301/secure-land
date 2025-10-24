import { logger } from '../utils/logger';

// Import all service implementations
import EthersBlockchainService from './blockchainService';
import ExternalBlockchainProxy from './proxy/blockchainProxy';
import MockBlockchainService from './proxy/mockBlockchainService';

import RealIPFSService from './ipfsService';
import ExternalIPFSProxy from './proxy/ipfsProxy';
import MockIPFSService from './proxy/mockIPFSService';

const PROXY_MODE = (process.env.PROXY_MODE || 'mock').toLowerCase();

export function getBlockchainService() {
  switch (PROXY_MODE) {
    case 'external':
    case 'external-api':
      logger.info('🔗 Blockchain: using external API proxy');
      return ExternalBlockchainProxy;
    case 'ethers':
    case 'direct':
      logger.info('🔗 Blockchain: using direct ethers provider');
      return EthersBlockchainService;
    case 'mock':
    default:
      logger.info('🔗 Blockchain: using mock service');
      return MockBlockchainService;
  }
}

export function getIPFSService() {
  switch (PROXY_MODE) {
    case 'external':
    case 'external-api':
      logger.info('📁 IPFS: using external API proxy');
      return ExternalIPFSProxy;
    case 'real':
    case 'native':
      logger.info('📁 IPFS: using native IPFS service');
      return RealIPFSService;
    case 'mock':
    default:
      logger.info('📁 IPFS: using mock IPFS service');
      return MockIPFSService;
  }
}

export async function initializeProxyServices(): Promise<void> {
  logger.info(`🚀 Initializing services in ${PROXY_MODE.toUpperCase()} mode`);

  try {
    if (PROXY_MODE === 'external' || PROXY_MODE === 'external-api') {
      const BlockchainService = getBlockchainService();
      const IPFSService = getIPFSService();

      if ('healthCheck' in BlockchainService) {
        await (BlockchainService as any).healthCheck();
      }

      if ('healthCheck' in IPFSService) {
        await (IPFSService as any).healthCheck();
      }
    }

    logger.info('✅ Proxy services initialized successfully');
  } catch (error) {
    logger.error('❌ Proxy service initialization failed:', error);
    throw error;
  }
}

export const BlockchainService = getBlockchainService();
export const IPFSService = getIPFSService();

export const getCurrentProxyMode = () => PROXY_MODE;

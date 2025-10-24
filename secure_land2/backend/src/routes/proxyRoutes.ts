import { Router } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { BlockchainService, IPFSService, getCurrentProxyMode } from '../services/proxySelector';
import MockBlockchainService from '../services/proxy/mockBlockchainService';
import MockIPFSService from '../services/proxy/mockIPFSService';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    const mode = getCurrentProxyMode();

    let blockchainHealth = false;
    let ipfsHealth = false;

    if ('healthCheck' in BlockchainService) {
      blockchainHealth = await (BlockchainService as any).healthCheck();
    }

    if ('healthCheck' in IPFSService) {
      ipfsHealth = await (IPFSService as any).healthCheck();
    }

    const networkInfo = await BlockchainService.getNetworkInfo();

    return ResponseHandler.success(res, {
      proxyMode: mode,
      services: {
        blockchain: {
          healthy: blockchainHealth,
          network: networkInfo
        },
        ipfs: {
          healthy: ipfsHealth
        }
      },
      timestamp: new Date().toISOString()
    }, 'Proxy status retrieved successfully');
  } catch (error: any) {
    return ResponseHandler.error(res, error.message, 500);
  }
});

router.get('/mock/stats', async (req, res) => {
  try {
    const mode = getCurrentProxyMode();

    if (mode !== 'mock') {
      return ResponseHandler.error(res, 'Mock stats only available in mock mode', 400);
    }

    const blockchainStats = MockBlockchainService.getStats();
    const ipfsStats = MockIPFSService.getStats();

    return ResponseHandler.success(res, {
      blockchain: blockchainStats,
      ipfs: ipfsStats
    }, 'Mock statistics retrieved successfully');
  } catch (error: any) {
    return ResponseHandler.error(res, error.message, 500);
  }
});

router.post('/mock/clear', async (req, res) => {
  try {
    const mode = getCurrentProxyMode();

    if (mode !== 'mock') {
      return ResponseHandler.error(res, 'Clear only available in mock mode', 400);
    }

    if (process.env.NODE_ENV === 'production') {
      return ResponseHandler.error(res, 'Clear not available in production', 403);
    }

    MockBlockchainService.clearAllData();
    MockIPFSService.clearAllData();

    return ResponseHandler.success(res, {
      cleared: true,
      timestamp: new Date().toISOString()
    }, 'All mock data cleared successfully');
  } catch (error: any) {
    return ResponseHandler.error(res, error.message, 500);
  }
});

router.post('/mode/:newMode', async (req, res) => {
  try {
    const { newMode } = req.params;

    if (process.env.NODE_ENV === 'production') {
      return ResponseHandler.error(res, 'Mode switching not available in production', 403);
    }

    const validModes = ['mock', 'external-api', 'ethers'];
    if (!validModes.includes(newMode)) {
      return ResponseHandler.error(res, `Invalid mode. Valid modes: ${validModes.join(', ')}`, 400);
    }

    process.env.PROXY_MODE = newMode;

    return ResponseHandler.success(res, {
      previousMode: getCurrentProxyMode(),
      newMode,
      message: 'Mode switched. Restart server to apply changes.'
    }, 'Proxy mode updated successfully');
  } catch (error: any) {
    return ResponseHandler.error(res, error.message, 500);
  }
});

export default router;

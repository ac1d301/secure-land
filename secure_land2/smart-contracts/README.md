# Secure Land Smart Contracts

Solidity smart contracts for the Secure Land blockchain-based land document verification platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Hardhat
- Infura account
- Ethereum wallet with testnet ETH

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your actual values
```

3. Compile contracts:
```bash
npm run compile
```

## 🔧 Environment Variables

```env
# Infura Configuration
INFURA_PROJECT_ID=your_infura_project_id_here
INFURA_PROJECT_SECRET=your_infura_secret_here

# Private Key for Deployment (DO NOT COMMIT TO VERSION CONTROL)
PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Gas Reporting
REPORT_GAS=true
```

## 📦 Contract Features

### SecureLand.sol
- Document hash recording and verification
- Role-based access control (Owner, Officials, Authorized Users)
- Immutable document storage
- Event logging for transparency
- Emergency functions

### Key Functions
- `recordDocumentHash()` - Record a document hash (Officials only)
- `verifyDocumentHash()` - Verify a document hash
- `getDocumentHash()` - Retrieve stored document hash
- `addOfficial()` - Add new official (Owner only)
- `removeOfficial()` - Remove official (Owner only)

## 🚀 Deployment

### Local Development
```bash
# Start local Hardhat node
npm run node

# Deploy to local network
npm run deploy:local
```

### Sepolia Testnet
```bash
# Deploy to Sepolia
npm run deploy:sepolia
```

### Contract Verification
```bash
# Verify on Etherscan
npm run verify:sepolia <CONTRACT_ADDRESS>
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test
```

## 📊 Gas Optimization

The contract is optimized for gas efficiency:
- Uses `bytes32` for hashes (32 bytes)
- Minimal storage operations
- Efficient event logging
- Optimized function visibility

## 🔐 Security Features

- Role-based access control
- Input validation
- Owner-only administrative functions
- Immutable document storage
- Event logging for transparency

## 📁 Project Structure

```
smart-contracts/
├── contracts/
│   └── SecureLand.sol      # Main contract
├── scripts/
│   └── deploy.js           # Deployment script
├── test/                   # Test files
├── deployments/            # Deployment artifacts
├── hardhat.config.js       # Hardhat configuration
└── package.json
```

## 🔧 Development

### Scripts
- `npm run compile` - Compile contracts
- `npm run test` - Run tests
- `npm run deploy:sepolia` - Deploy to Sepolia
- `npm run deploy:local` - Deploy to local network
- `npm run node` - Start local Hardhat node
- `npm run clean` - Clean build artifacts

### Contract Interaction

After deployment, you can interact with the contract:

```javascript
// Get contract instance
const contract = await ethers.getContractAt("SecureLand", contractAddress);

// Record a document hash
await contract.recordDocumentHash("doc123", ethers.keccak256(ethers.toUtf8Bytes("document content")));

// Verify a document hash
const isValid = await contract.verifyDocumentHash("doc123", ethers.keccak256(ethers.toUtf8Bytes("document content")));

// Get document hash
const hash = await contract.getDocumentHash("doc123");
```

## 🌐 Network Configuration

### Supported Networks
- Hardhat (Local)
- Sepolia (Testnet)
- Goerli (Testnet)

### Adding New Networks
Edit `hardhat.config.js` to add new networks:

```javascript
networks: {
  yourNetwork: {
    url: "YOUR_RPC_URL",
    accounts: [process.env.PRIVATE_KEY],
    chainId: YOUR_CHAIN_ID
  }
}
```

## 📋 Deployment Checklist

- [ ] Set up environment variables
- [ ] Compile contracts
- [ ] Run tests
- [ ] Deploy to testnet
- [ ] Verify contract on Etherscan
- [ ] Update backend with contract address
- [ ] Test end-to-end functionality

## 🚨 Security Considerations

- Never commit private keys to version control
- Use testnet for development
- Verify contracts on Etherscan
- Test thoroughly before mainnet deployment
- Consider upgrade patterns for production

## 📄 License

MIT License - see LICENSE file for details

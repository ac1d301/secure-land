# SECURE LAND - Complete Setup Guide

This guide will walk you through setting up the complete Secure Land blockchain-based land document verification platform.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)

### Optional but Recommended:
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing
- **VS Code** - Code editor

## 🔧 Required Accounts

You'll need accounts for the following services:

1. **Infura** - Ethereum blockchain access
   - Sign up at [infura.io](https://infura.io/)
   - Create a new project
   - Get your Project ID and Secret

2. **Pinata** - IPFS storage
   - Sign up at [pinata.cloud](https://pinata.cloud/)
   - Get your API Key and Secret

3. **Mailtrap** - Email testing (optional)
   - Sign up at [mailtrap.io](https://mailtrap.io/)
   - Get your username and password

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd secure-land
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Edit .env with your actual values
# See Backend Environment Variables section below
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Edit .env with your actual values
# See Frontend Environment Variables section below
```

### 4. Smart Contract Setup

```bash
# Navigate to smart-contracts directory
cd ../smart-contracts

# Install dependencies
npm install

# Set up environment variables
cp env.example .env

# Edit .env with your actual values
# See Smart Contract Environment Variables section below
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
MONGO_URI=mongodb://localhost:27017/secureland

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Infura (Ethereum)
INFURA_PROJECT_ID=your_infura_project_id
INFURA_PROJECT_SECRET=your_infura_secret
CONTRACT_ADDRESS=0x... # Will be set after contract deployment

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Email (Mailtrap)
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password

# Server
PORT=5000
NODE_ENV=development
```

### Frontend (.env)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

### Smart Contracts (.env)

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

## 🗄️ Database Setup

### MongoDB Installation

1. **Download and Install MongoDB**
   - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB Service**
   ```bash
   # On Windows
   net start MongoDB
   
   # On macOS (with Homebrew)
   brew services start mongodb-community
   
   # On Linux
   sudo systemctl start mongod
   ```

3. **Verify Installation**
   ```bash
   mongosh
   # Should connect to MongoDB shell
   ```

### Database Configuration

The application will automatically create the database and collections when you first run it. No manual database setup is required.

## ⛓️ Smart Contract Deployment

### 1. Get Testnet ETH

You'll need Sepolia testnet ETH for deployment:

1. Get Sepolia ETH from a faucet:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Faucet](https://sepoliafaucet.com/)

2. Add Sepolia network to MetaMask:
   - Network Name: Sepolia Test Network
   - RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
   - Chain ID: 11155111
   - Currency Symbol: ETH

### 2. Deploy Contract

```bash
# Navigate to smart-contracts directory
cd smart-contracts

# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy:sepolia
```

### 3. Update Backend Configuration

After deployment, copy the contract address and update your backend `.env`:

```env
CONTRACT_ADDRESS=0x... # Replace with actual deployed address
```

## 🚀 Running the Application

### 1. Start MongoDB

Make sure MongoDB is running on your system.

### 2. Start Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

## 🧪 Testing the Application

### 1. Create Test Users

1. Register as a **Buyer**:
   - Email: `buyer@test.com`
   - Password: `password123`
   - Role: Buyer

2. Register as a **Seller**:
   - Email: `seller@test.com`
   - Password: `password123`
   - Role: Seller

3. Register as an **Official**:
   - Email: `official@test.com`
   - Password: `password123`
   - Role: Official

### 2. Test Document Upload

1. Login as a Seller
2. Go to Dashboard
3. Click "Upload Document"
4. Fill in property address
5. Upload a PDF or image file
6. Submit the form

### 3. Test Document Verification

1. Login as an Official
2. Go to Admin page
3. View pending documents
4. Click verify or reject buttons

### 4. Test Public Verification

1. Go to Verify page
2. Enter document ID and hash
3. Test different verification methods

## 🔍 API Testing

### Using Postman

1. Import the API collection (if available)
2. Set base URL to `http://localhost:5000/api`
3. Test authentication endpoints first
4. Use JWT token for protected endpoints

### Using curl

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "Buyer"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify MongoDB is accessible

2. **Infura Connection Error**
   - Verify Project ID and Secret
   - Check network connectivity
   - Ensure account has sufficient credits

3. **IPFS Upload Error**
   - Verify Pinata API credentials
   - Check file size limits
   - Ensure file format is supported

4. **Contract Deployment Error**
   - Verify private key has testnet ETH
   - Check Infura configuration
   - Ensure contract compiles without errors

5. **Frontend Build Error**
   - Clear node_modules and reinstall
   - Check Node.js version
   - Verify all environment variables

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

### Logs

Check application logs for detailed error information:

- Backend: Console output
- Frontend: Browser console
- Smart Contract: Hardhat console

## 📊 Monitoring

### Health Checks

- Backend: `http://localhost:5000/health`
- Frontend: Check browser console for errors

### Database Monitoring

Use MongoDB Compass to monitor:
- Database connections
- Collection sizes
- Query performance

## 🚀 Production Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch
4. Update frontend API URL

### Frontend (Vercel)

1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch
4. Configure custom domain (optional)

### Smart Contract (Ethereum Mainnet)

1. Get mainnet ETH
2. Update Hardhat config
3. Deploy to mainnet
4. Verify on Etherscan
5. Update contract address

## 📚 Additional Resources

### Documentation
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Ethereum Documentation](https://ethereum.org/developers/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [React Documentation](https://reactjs.org/docs/)

### Community
- [Ethereum Discord](https://discord.gg/ethereum)
- [IPFS Discord](https://discord.gg/ipfs)
- [React Discord](https://discord.gg/react)

## 🆘 Support

If you encounter issues:

1. Check this troubleshooting guide
2. Search existing issues
3. Create a new issue with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Logs (if applicable)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy coding! 🚀**

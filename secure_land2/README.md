# SECURE LAND - Blockchain-Based Land Document Verification Platform

A comprehensive full-stack application that prevents document forgery and ensures immutability using Ethereum smart contracts, IPFS, Node.js, MongoDB, and React.

## 🏗️ Architecture

- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend:** Node.js + Express + TypeScript + MongoDB (Mongoose)
- **Blockchain:** Ethereum Testnet via Infura (using ethers.js proxy)
- **Storage:** IPFS via Pinata/web3.storage (proxy)
- **Notifications:** Nodemailer (Mailtrap simulation proxy)
- **Hashing:** SHA-256

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd secure-land
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your environment variables
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Fill in your environment variables
npm run dev
```

### 4. Smart Contract Deployment
```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

## 📁 Project Structure

```
secure-land/
├── backend/           # Node.js + Express + MongoDB API
├── frontend/          # React + Vite + TypeScript frontend
├── smart-contracts/   # Solidity smart contracts
└── README.md
```

## 🔧 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017/secureland
JWT_SECRET=your_jwt_secret_here
INFURA_PROJECT_ID=your_infura_project_id
INFURA_PROJECT_SECRET=your_infura_secret
CONTRACT_ADDRESS=0x...
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key
MAILTRAP_USER=your_mailtrap_username
MAILTRAP_PASS=your_mailtrap_password
PORT=5000
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get specific document

### Verification
- `POST /api/verify/:documentId` - Verify document
- `GET /api/verify/status/:documentId` - Get verification status

### Notifications
- `POST /api/notify` - Send notification (stub)

## 🔐 User Roles

- **Buyer:** Can view and verify documents
- **Seller:** Can upload and manage documents
- **Official:** Can verify and approve documents

## 🛡️ Security Features

- JWT-based authentication
- SHA-256 document hashing
- Blockchain immutability
- IPFS decentralized storage
- Role-based access control
- Comprehensive audit logging

## 📱 Features

- Document upload and verification
- Real-time verification status
- Ownership history tracking
- Audit trail for all actions
- Responsive web interface
- Email notifications (simulated)

## 🚀 Deployment

### Backend (Render)
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch

### Frontend (Vercel)
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch

### Smart Contract (Ethereum Sepolia)
1. Deploy using Hardhat
2. Update contract address in backend .env

## 📄 License

MIT License - see LICENSE file for details

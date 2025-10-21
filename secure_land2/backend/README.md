# Secure Land Backend API

Backend API for the Secure Land blockchain-based land document verification platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB
- Infura account (for Ethereum)
- Pinata account (for IPFS)

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

3. Start the development server:
```bash
npm run dev
```

## 🔧 Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/secureland

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Infura (Ethereum)
INFURA_PROJECT_ID=your_infura_project_id
INFURA_PROJECT_SECRET=your_infura_secret
CONTRACT_ADDRESS=0x...

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

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user
- `PUT /api/auth/user` - Update user profile
- `POST /api/auth/logout` - Logout user

### Documents
- `POST /api/documents/upload` - Upload document (Sellers/Officials)
- `GET /api/documents/my-documents` - Get user's documents
- `GET /api/documents/:documentId` - Get specific document
- `GET /api/documents/hash/:hash` - Get document by hash
- `GET /api/documents` - Get all documents (Officials only)
- `POST /api/documents/:documentId/verify` - Verify document (Officials only)
- `POST /api/documents/:documentId/reject` - Reject document (Officials only)

### Verification
- `POST /api/verify/:documentId` - Verify document hash
- `GET /api/verify/:documentId/status` - Get verification status
- `GET /api/verify/:documentId/integrity` - Check document integrity
- `GET /api/verify/property/:propertyId/history` - Get ownership history
- `GET /api/verify/blockchain/info` - Get blockchain information

### Notifications
- `POST /api/notify/send` - Send notification (Officials only)
- `POST /api/notify/document` - Send document notification (Officials only)
- `POST /api/notify/test` - Test email (Officials only)
- `GET /api/notify/status` - Get notification status (Officials only)

## 🔐 User Roles

- **Buyer**: Can view and verify documents
- **Seller**: Can upload and manage documents
- **Official**: Can verify, reject, and manage all documents

## 🛡️ Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation
- File upload restrictions

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up production Infura and Pinata credentials
4. Configure email service for production

## 📊 Monitoring

- Health check: `GET /health`
- Request logging with Morgan
- Error logging with custom logger
- Audit trail for all actions

## 🔧 Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Consistent error handling

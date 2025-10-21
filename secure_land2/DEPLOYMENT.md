# SECURE LAND - Deployment Guide

This guide covers deploying the Secure Land application to production environments.

## 🌐 Deployment Overview

The application consists of three main components:

1. **Backend API** - Node.js/Express server
2. **Frontend** - React application
3. **Smart Contract** - Ethereum blockchain contract

## 🚀 Backend Deployment (Render)

### Prerequisites

- GitHub repository with your code
- Render account
- MongoDB Atlas account (for production database)

### Step 1: Prepare Backend

1. **Update package.json scripts**:
   ```json
   {
     "scripts": {
       "start": "node dist/server.js",
       "build": "tsc",
       "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
     }
   }
   ```

2. **Create render.yaml** (optional):
   ```yaml
   services:
     - type: web
       name: secure-land-backend
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
   ```

### Step 2: Deploy to Render

1. **Connect Repository**:
   - Go to [render.com](https://render.com/)
   - Sign up/Login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `secure-land-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

3. **Set Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/secureland
   JWT_SECRET=your_production_jwt_secret_here
   INFURA_PROJECT_ID=your_infura_project_id
   INFURA_PROJECT_SECRET=your_infura_secret
   CONTRACT_ADDRESS=0x...
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_key
   MAILTRAP_USER=your_mailtrap_username
   MAILTRAP_PASS=your_mailtrap_password
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://secure-land-backend.onrender.com`)

### Step 3: Configure MongoDB Atlas

1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster
   - Choose your region

2. **Set Up Database User**:
   - Go to "Database Access"
   - Add new user
   - Set username and password
   - Grant "Read and write to any database" permission

3. **Configure Network Access**:
   - Go to "Network Access"
   - Add IP address `0.0.0.0/0` (for Render)
   - Or add Render's IP ranges

4. **Get Connection String**:
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user password

## 🌐 Frontend Deployment (Vercel)

### Prerequisites

- GitHub repository with your code
- Vercel account
- Backend API URL

### Step 1: Prepare Frontend

1. **Update vite.config.ts**:
   ```typescript
   export default defineConfig({
     plugins: [react()],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     build: {
       outDir: 'dist',
       sourcemap: false,
     },
   })
   ```

2. **Create vercel.json** (optional):
   ```json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

### Step 2: Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com/)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository

2. **Configure Project**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables**:
   ```env
   VITE_API_BASE_URL=https://secure-land-backend.onrender.com/api
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the deployment URL

### Step 3: Configure Custom Domain (Optional)

1. **Add Domain**:
   - Go to project settings
   - Click "Domains"
   - Add your custom domain
   - Configure DNS records

2. **SSL Certificate**:
   - Vercel automatically provides SSL
   - No additional configuration needed

## ⛓️ Smart Contract Deployment

### Prerequisites

- MetaMask wallet with mainnet ETH
- Etherscan account
- Infura mainnet project

### Step 1: Prepare for Mainnet

1. **Update hardhat.config.js**:
   ```javascript
   networks: {
     mainnet: {
       url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
       accounts: [process.env.PRIVATE_KEY],
       chainId: 1
     }
   }
   ```

2. **Set Environment Variables**:
   ```env
   INFURA_PROJECT_ID=your_mainnet_project_id
   PRIVATE_KEY=your_mainnet_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Step 2: Deploy to Mainnet

1. **Deploy Contract**:
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

2. **Verify Contract**:
   ```bash
   npx hardhat verify --network mainnet <CONTRACT_ADDRESS>
   ```

3. **Update Backend**:
   - Update `CONTRACT_ADDRESS` in backend environment variables
   - Redeploy backend

## 🔧 Production Configuration

### Backend Optimizations

1. **Enable Compression**:
   ```javascript
   app.use(compression());
   ```

2. **Set Security Headers**:
   ```javascript
   app.use(helmet({
     contentSecurityPolicy: {
       directives: {
         defaultSrc: ["'self'"],
         styleSrc: ["'self'", "'unsafe-inline'"],
         scriptSrc: ["'self'"],
         imgSrc: ["'self'", "data:", "https:"],
       },
     },
   }));
   ```

3. **Rate Limiting**:
   ```javascript
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   app.use(limiter);
   ```

### Frontend Optimizations

1. **Enable Gzip Compression**:
   - Vercel handles this automatically
   - No additional configuration needed

2. **Set Cache Headers**:
   ```json
   {
     "headers": [
       {
         "source": "/static/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

3. **Environment Variables**:
   - Use Vercel's environment variable system
   - Set different values for preview/production

## 📊 Monitoring and Analytics

### Backend Monitoring

1. **Render Metrics**:
   - CPU usage
   - Memory usage
   - Response times
   - Error rates

2. **Custom Logging**:
   ```javascript
   // Add to your backend
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

### Frontend Monitoring

1. **Vercel Analytics**:
   - Enable in project settings
   - View performance metrics
   - Monitor user behavior

2. **Error Tracking**:
   ```javascript
   // Add Sentry or similar
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
   });
   ```

## 🔒 Security Considerations

### Backend Security

1. **Environment Variables**:
   - Never commit `.env` files
   - Use secure secret management
   - Rotate secrets regularly

2. **CORS Configuration**:
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true,
   }));
   ```

3. **Input Validation**:
   - Validate all inputs
   - Sanitize user data
   - Use parameterized queries

### Frontend Security

1. **Content Security Policy**:
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline';">
   ```

2. **HTTPS Only**:
   - Force HTTPS redirects
   - Use secure cookies
   - Enable HSTS

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variable Issues**:
   - Verify all required variables are set
   - Check variable names and values
   - Ensure no trailing spaces

3. **Database Connection Issues**:
   - Verify MongoDB Atlas configuration
   - Check network access settings
   - Test connection string

4. **API CORS Issues**:
   - Update CORS configuration
   - Check frontend URL in backend
   - Verify preflight requests

### Debugging Steps

1. **Check Logs**:
   - Render: View service logs
   - Vercel: Check function logs
   - Browser: Check console errors

2. **Test Endpoints**:
   - Use Postman or curl
   - Test health check endpoint
   - Verify API responses

3. **Monitor Performance**:
   - Check response times
   - Monitor error rates
   - Review resource usage

## 📈 Scaling Considerations

### Backend Scaling

1. **Horizontal Scaling**:
   - Use multiple Render instances
   - Implement load balancing
   - Consider microservices

2. **Database Scaling**:
   - Upgrade MongoDB Atlas tier
   - Implement read replicas
   - Use connection pooling

3. **Caching**:
   - Implement Redis caching
   - Use CDN for static assets
   - Cache API responses

### Frontend Scaling

1. **CDN Configuration**:
   - Use Vercel's global CDN
   - Configure edge caching
   - Optimize asset delivery

2. **Performance Optimization**:
   - Implement code splitting
   - Use lazy loading
   - Optimize bundle size

## 🔄 CI/CD Pipeline

### GitHub Actions

1. **Create .github/workflows/deploy.yml**:
   ```yaml
   name: Deploy to Production
   
   on:
     push:
       branches: [main]
   
   jobs:
     deploy-backend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy Backend
           run: |
             # Add deployment commands
   
     deploy-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Deploy Frontend
           run: |
             # Add deployment commands
   ```

2. **Automated Testing**:
   - Run tests before deployment
   - Check code quality
   - Verify security scans

## 📚 Additional Resources

### Documentation
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Ethereum Documentation](https://ethereum.org/developers/)

### Tools
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Etherscan](https://etherscan.io/)
- [Postman](https://www.postman.com/)
- [Sentry](https://sentry.io/)

---

**Deployment Complete! 🎉**

Your Secure Land application should now be live and accessible to users worldwide.

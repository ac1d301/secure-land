# Secure Land Frontend

React frontend for the Secure Land blockchain-based land document verification platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

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
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📚 Features

### Authentication
- User registration and login
- JWT-based authentication
- Role-based access control (Buyer, Seller, Official)
- Protected routes

### Document Management
- Upload documents with drag & drop
- View document list and status
- File type validation and size limits
- IPFS integration for decentralized storage

### Verification
- Hash verification against blockchain
- Document integrity checking
- Real-time status updates
- Verification history

### Admin Panel
- Document approval/rejection workflow
- User management
- Audit trail
- Statistics dashboard

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **React Router** - Routing
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript type definitions
├── styles/             # Global styles
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```

## 🎨 UI Components

### Design System
- Consistent color palette
- Responsive design
- Accessible components
- Dark/light mode support

### Key Components
- `LoadingSpinner` - Loading states
- `UploadForm` - Document upload modal
- `Navbar` - Navigation with role-based menu
- Form components with validation

## 🔐 Authentication Flow

1. **Registration**: Users can register with email, password, and role
2. **Login**: JWT-based authentication with role checking
3. **Protected Routes**: Role-based access to different pages
4. **Token Management**: Automatic token refresh and logout

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🧪 Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Consistent naming conventions

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set `VITE_API_BASE_URL` to production API URL
2. Configure CORS on backend
3. Set up CDN for static assets

### Deployment Platforms
- **Vercel** (Recommended)
- **Netlify**
- **AWS S3 + CloudFront**
- **GitHub Pages**

## 🔧 Configuration

### Vite Configuration
- Path aliases (`@/` for `src/`)
- Proxy configuration for API calls
- Build optimizations
- Source maps for debugging

### Tailwind Configuration
- Custom color palette
- Extended utilities
- Component classes
- Responsive breakpoints

## 📊 Performance

### Optimizations
- Code splitting with React.lazy
- Image optimization
- Bundle size analysis
- Lazy loading components

### Monitoring
- Error boundaries
- Performance metrics
- User analytics
- API response times

## 🧪 Testing

### Test Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### Test Coverage
- Component unit tests
- Hook testing
- Integration tests
- E2E tests with Playwright

## 🔒 Security

### Best Practices
- Input validation
- XSS protection
- CSRF protection
- Secure token storage
- HTTPS enforcement

### Content Security Policy
- Strict CSP headers
- Nonce-based scripts
- Resource integrity
- Safe inline styles

## 📈 Analytics

### User Tracking
- Page views
- User interactions
- Error tracking
- Performance metrics

### Business Metrics
- Document uploads
- Verification success rate
- User engagement
- Feature usage

## 🐛 Debugging

### Development Tools
- React DevTools
- Redux DevTools
- Network tab
- Console logging

### Error Handling
- Global error boundary
- API error handling
- User-friendly error messages
- Error reporting

## 📚 Documentation

### API Documentation
- Swagger/OpenAPI integration
- Interactive API explorer
- Request/response examples
- Error codes

### User Guide
- Getting started guide
- Feature documentation
- FAQ section
- Video tutorials

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use meaningful commit messages
- Write comprehensive tests
- Update documentation

## 📄 License

MIT License - see LICENSE file for details

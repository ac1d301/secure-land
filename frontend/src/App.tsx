import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import VerifyEnhanced from './pages/VerifyEnhanced';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        {isAuthenticated && <Navbar />}
        
        <main className={isAuthenticated ? 'pt-16' : ''}>
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} 
            />
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
            />
            <Route 
              path="/dashboard" 
              element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/verify" 
              element={isAuthenticated ? <VerifyEnhanced /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/verify-old" 
              element={isAuthenticated ? <Verify /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/admin" 
              element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/admin-old" 
              element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

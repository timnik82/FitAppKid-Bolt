import React, { Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/auth/AuthScreen';
import ProtectedRoute from './components/ProtectedRoute';
import SessionManager from './components/SessionManager';
import ErrorBoundary from './components/ErrorBoundary';
import { Loader2, LogOut } from 'lucide-react';

// Lazy load dashboard for code splitting
const ParentDashboard = React.lazy(() => import('./components/dashboard/ParentDashboard'));

const AppContent: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [showForceLogout, setShowForceLogout] = useState(false);

  // Debug logging for loading states
  console.log('🔵 AppContent render:', { 
    user: user ? 'present' : 'null', 
    profile: profile ? 'present' : 'null', 
    loading 
  });

  // Show force logout after 5 seconds of loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowForceLogout(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowForceLogout(false);
    }
  }, [loading]);

  const handleForceLogout = async () => {
    console.log('🔴 Force logout initiated by user');
    try {
      await signOut();
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      // Don't force reload - let React handle state cleanup
      setShowForceLogout(false);
    } catch (error) {
      console.error('🔴 Force logout failed:', error);
      // Clear storage and reset state instead of force reload
      localStorage.clear();
      sessionStorage.clear();
      setShowForceLogout(false);
    }
  };

  if (loading) {
    console.log('🔵 App in loading state...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Loading KidsFit...</p>
          
          {showForceLogout && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                Taking longer than usual? You can force logout and try again.
              </p>
              <button
                onClick={handleForceLogout}
                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Force Logout & Reset
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthScreen />;
  }

  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      }>
        <ParentDashboard />
      </Suspense>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SessionManager>
          <AppContent />
        </SessionManager>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
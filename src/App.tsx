import React, { Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthScreen from './components/auth/AuthScreen';
import ProtectedRoute from './components/ProtectedRoute';
import SessionManager from './components/SessionManager';
import { Loader2 } from 'lucide-react';

// Lazy load dashboard for code splitting
const ParentDashboard = React.lazy(() => import('./components/dashboard/ParentDashboard'));

const AppContent: React.FC = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading KidsFit...</p>
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
    <AuthProvider>
      <SessionManager>
        <AppContent />
      </SessionManager>
    </AuthProvider>
  );
}

export default App;
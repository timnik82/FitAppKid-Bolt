import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SessionManagerProps {
  children: React.ReactNode;
}

const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set up automatic session refresh
    const refreshSession = async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Session refresh failed:', error);
          // Force logout on session refresh failure
          await signOut();
        }
      } catch (err) {
        console.error('Session refresh error:', err);
        await signOut();
      }
    };

    // Refresh session every 30 minutes
    const refreshInterval = setInterval(refreshSession, 30 * 60 * 1000);

    // Set up session timeout (24 hours of inactivity)
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Auto logout after 24 hours of inactivity
      timeoutId = setTimeout(async () => {
        console.log('Session timeout - logging out user');
        await signOut();
      }, 24 * 60 * 60 * 1000); // 24 hours
    };

    // Reset timeout on user activity
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Set initial timeout
    resetTimeout();

    // Add activity listeners
    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity, true);
      });
    };
  }, [user, signOut]);

  // Handle visibility change (tab switching)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Check if session is still valid when tab becomes visible
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session) {
            console.log('Session invalid on visibility change - logging out');
            await signOut();
          }
        } catch (err) {
          console.error('Session check error:', err);
          await signOut();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, signOut]);

  return <>{children}</>;
};

export default SessionManager;
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface PrivacySettings {
  dataSharing: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface Profile {
  profile_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string;
  date_of_birth: string | null;
  is_child: boolean | null;
  parent_consent_given: boolean | null;
  parent_consent_date: string | null;
  privacy_settings: PrivacySettings | null;
  preferred_language: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Child {
  profile_id: string;
  display_name: string;
  date_of_birth: string | null;
  age: number;
  parent_consent_given: boolean | null;
  parent_consent_date: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  children: Child[];
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  addChild: (name: string, dateOfBirth: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshChildren: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  // Add loading timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Wrap loadProfile in useCallback to prevent re-renders
  const loadProfile = useCallback(async (userId: string, retryCount = 0) => {
    try {
      console.log('🔵 Loading profile for userId:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('🔴 Error loading profile:', error);
        
        // Retry up to 2 times for network errors
        if (retryCount < 2 && (error.message.includes('network') || error.message.includes('timeout'))) {
          console.log('🔄 Retrying profile load...');
          setTimeout(() => loadProfile(userId, retryCount + 1), 1000);
          return;
        }
        
        console.warn('⚠️ Profile load failed, setting profile to null');
        setProfile(null);
        return;
      }
      
      console.log('✅ Profile loaded:', data ? 'found' : 'not found');
      setProfile(data);
    } catch (err) {
      console.error('🔴 Error loading profile:', err);
      
      // Retry for unexpected errors
      if (retryCount < 2) {
        console.log('🔄 Retrying profile load due to error...');
        setTimeout(() => loadProfile(userId, retryCount + 1), 1000);
        return;
      }
      
      console.warn('⚠️ Profile load failed after retries, setting profile to null');
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔵 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔴 Session retrieval error:', error);
          console.log('🔵 Clearing invalid session and setting loading to false');
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        
        console.log('🔵 Initial session:', session ? 'found' : 'not found');
        
        if (session?.user) {
          // Validate session is not expired
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.warn('⚠️ Session expired, clearing...');
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          
          console.log('🔵 Loading profile for user:', session.user.id);
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        console.log('🔵 Setting loading to false');
        setLoading(false);
      } catch (err) {
        console.error('🔴 Initial session error:', err);
        console.log('🔵 Setting loading to false due to error');
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔵 Auth state change:', event, session ? 'session present' : 'no session');
        
        try {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('🔵 Auth change: loading profile for user:', session.user.id);
            await loadProfile(session.user.id);
          } else {
            console.log('🔵 Auth change: clearing profile and children');
            setProfile(null);
            setChildrenList([]);
          }
          
          console.log('🔵 Auth change: setting loading to false');
          setLoading(false);
        } catch (err) {
          console.error('🔴 Auth state change error:', err);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Move loadChildren definition up
  const loadChildren = useCallback(async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('parent_child_relationships')
        .select(`
          child_id,
          profiles!parent_child_relationships_child_id_fkey (
            profile_id,
            display_name,
            date_of_birth,
            is_child,
            parent_consent_given,
            parent_consent_date
          )
        `)
        .eq('parent_id', profile.profile_id)
        .eq('active', true);

      if (error) {
        console.error('Error loading children:', error);
        return;
      }

      const children = data.map(item => {
        const childProfile = item.profiles;
        const birthDate = childProfile.date_of_birth ? new Date(childProfile.date_of_birth) : null;
        const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 0;
        
        return {
          profile_id: childProfile.profile_id,
          display_name: childProfile.display_name,
          date_of_birth: childProfile.date_of_birth,
          age,
          parent_consent_given: childProfile.parent_consent_given,
          parent_consent_date: childProfile.parent_consent_date,
        };
      });

      setChildrenList(children);
    } catch (error) {
      console.error('Error loading children:', error);
      setChildrenList([]);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      loadChildren();
    }
  }, [profile, loadChildren]);



  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message?.includes('User already registered') || 
            'code' in authError && authError.code === 'user_already_exists') {
          // Try to sign in instead
          await signIn(email, password);
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email,
          display_name: displayName,
          is_child: false,
          privacy_settings: { data_sharing: false, analytics: false },
          preferred_language: 'en'
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      // Initialize user progress
      await supabase
        .from('user_progress')
        .insert({
          user_id: profileData.profile_id,
          weekly_points_goal: 100,
          monthly_goal_exercises: 20
        });

    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Sign in failed');
      }

      // Check if profile exists, create if missing
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile for existing auth user
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            email: data.user.email,
            display_name: data.user.email?.split('@')[0] || 'User',
            is_child: false,
            privacy_settings: { data_sharing: false, analytics: false },
            preferred_language: 'en'
          })
          .select()
          .single();

        if (profileError) {
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Initialize user progress
        await supabase
          .from('user_progress')
          .insert({
            user_id: newProfile.profile_id,
            weekly_points_goal: 100,
            monthly_goal_exercises: 20
          });
      }

    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign in failed');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setProfile(null);
      setChildrenList([]);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Sign out failed');
    }
  };

  const addChild = async (name: string, dateOfBirth: string) => {
    if (!profile) {
      throw new Error('Must be logged in to add children');
    }

    console.log('🔵 Starting addChild process:', { name, dateOfBirth, parentProfileId: profile.profile_id });

    try {
      // Use the database function for reliable child creation
      console.log('🔵 Calling create_child_profile_and_link function...');
      const { data: childProfile, error: childError } = await supabase
        .rpc('create_child_profile_and_link', {
          parent_profile_id: profile.profile_id,
          child_display_name: name,
          child_date_of_birth: dateOfBirth
        })
        .single();

      if (childError) {
        console.error('🔴 Child profile creation failed:', childError);
        throw new Error(`Failed to create child profile: ${childError.message}`);
      }

      console.log('✅ Child profile created:', childProfile);

      // Refresh children list
      console.log('🔵 Refreshing children list...');
      await loadChildren();
      console.log('✅ addChild process completed successfully');
    } catch (error: unknown) {
      console.error('🔴 addChild process failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to add child');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const refreshChildren = async () => {
    await loadChildren();
  };

  const value: AuthContextType = {
    user,
    profile,
    children: childrenList,
    loading,
    signUp,
    signIn,
    signOut,
    addChild,
    refreshProfile,
    refreshChildren,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
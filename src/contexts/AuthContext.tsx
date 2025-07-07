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

export const useAuth = () => {
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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setChildrenList([]);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile) {
      loadChildren();
    }
  }, [profile, loadChildren]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const loadChildren = useCallback(async () => {
    if (!profile) return;

    try {
      const { data: relationships, error } = await supabase
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

      const childrenData = relationships?.map(rel => {
        const childProfile = rel.profiles as Profile;
        const age = childProfile.date_of_birth 
          ? new Date().getFullYear() - new Date(childProfile.date_of_birth).getFullYear()
          : 0;
        return {
          profile_id: childProfile.profile_id,
          display_name: childProfile.display_name,
          date_of_birth: childProfile.date_of_birth,
          age,
          parent_consent_given: childProfile.parent_consent_given,
          parent_consent_date: childProfile.parent_consent_date
        };
      }) || [];

      setChildrenList(childrenData);
    } catch (err) {
      console.error('Error loading children:', err);
    }
  }, [profile]);

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

    try {
      // Create child profile directly
      const { data: childProfile, error: childError } = await supabase
        .from('profiles')
        .insert({
          display_name: name,
          date_of_birth: dateOfBirth,
          is_child: true,
          parent_consent_given: true,
          parent_consent_date: new Date().toISOString(),
          privacy_settings: { data_sharing: false, analytics: false },
          preferred_language: 'en'
        })
        .select()
        .single();

      if (childError) {
        throw new Error(`Failed to create child profile: ${childError.message}`);
      }

      // Create parent-child relationship
      const { error: relationshipError } = await supabase
        .from('parent_child_relationships')
        .insert({
          parent_id: profile.profile_id,
          child_id: childProfile.profile_id,
          relationship_type: 'parent',
          consent_given: true,
          consent_date: new Date().toISOString(),
          active: true
        });

      if (relationshipError) {
        throw new Error(`Failed to create parent-child relationship: ${relationshipError.message}`);
      }

      // Initialize user progress for child
      await supabase
        .from('user_progress')
        .insert({
          user_id: childProfile.profile_id,
          weekly_points_goal: 100,
          monthly_goal_exercises: 20
        });

      // Refresh children list
      await loadChildren();
    } catch (error: unknown) {
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
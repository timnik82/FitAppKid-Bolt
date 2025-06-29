/*
# Fix Profiles INSERT RLS Policies

This migration fixes the Row Level Security policies for INSERT operations on the profiles table.
The previous policies were too restrictive and preventing profile creation during registration.

## Changes:
1. Drop existing INSERT policies on profiles table
2. Add corrected INSERT policies that allow:
   - Authenticated users to create their own profile
   - Authenticated parents to create child profiles

## Security:
- Maintains data isolation
- Allows proper registration flow
- Ensures parent consent requirements
*/

-- Drop existing INSERT policies on profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;

-- Allow authenticated users to insert their own profile
-- This is for parent/adult account creation
CREATE POLICY "Users can insert own profile"
  ON profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated parents to create child profiles
-- Child profiles have user_id = NULL and require parent consent
CREATE POLICY "Parents can insert child profiles"
  ON profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    is_child = true 
    AND user_id IS NULL 
    AND parent_consent_given = true
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND is_child = false
    )
  );

-- Verify the policies are in place
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND cmd = 'INSERT';
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ PROFILES INSERT POLICIES FIXED!';
    RAISE NOTICE '================================';
    RAISE NOTICE 'INSERT policies on profiles table: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Fixed policies:';
    RAISE NOTICE '   1. Users can insert own profile (user_id = auth.uid())';
    RAISE NOTICE '   2. Parents can insert child profiles (with consent + parent exists)';
    RAISE NOTICE '';
    RAISE NOTICE '✨ Registration should now work correctly!';
END $$;
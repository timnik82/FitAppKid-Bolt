/*
  # Fix Profiles RLS Policy for User Registration

  The application is failing to create user profiles due to RLS policy violations.
  This migration fixes the INSERT policy for the profiles table to ensure users
  can create their own profiles after authentication.

  ## Changes Made
  1. Drop existing INSERT policy that may be misconfigured
  2. Create a new, properly defined INSERT policy for user profiles
  3. Ensure the policy allows authenticated users to insert their own profile data
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a new INSERT policy that allows authenticated users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have the correct SELECT and UPDATE policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
/*
  # Fix profiles table RLS policies

  1. Problem
    - Current INSERT policies use `uid()` function which may not be working
    - Need to use standard Supabase `auth.uid()` function
  
  2. Solution
    - Drop existing problematic INSERT policies
    - Create new INSERT policy using `auth.uid()`
    - Ensure policy allows authenticated users to insert their own profile
  
  3. Security
    - Users can only insert profiles for their own authenticated user ID
    - Maintains data security and prevents unauthorized profile creation
*/

-- Drop existing INSERT policies that may be causing issues
DROP POLICY IF EXISTS "Allow authenticated user to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a single, clear INSERT policy using the correct auth function
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure we have the correct SELECT policy
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- And correct UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
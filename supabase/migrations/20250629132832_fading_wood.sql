/*
# Fix profiles table INSERT policy

This migration ensures that authenticated users can create their own profile
by adding the necessary RLS policy for INSERT operations.

## Changes Made
1. Ensure INSERT policy exists for profiles table
2. Allow authenticated users to insert their own profile data

## Security
- Users can only insert profiles where the ID matches their auth.uid()
- Maintains data isolation between users
*/

-- Drop existing INSERT policy if it exists (in case it's malformed)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create the INSERT policy for profiles table
CREATE POLICY "Users can insert own profile" 
    ON profiles 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = id);

-- Ensure the table has RLS enabled (should already be enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
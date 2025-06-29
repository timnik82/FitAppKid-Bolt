/*
# Add INSERT policy for profiles table

This migration adds a Row Level Security policy that allows authenticated users 
to insert their own profile record during the registration process.

## Changes
1. Add INSERT policy for profiles table
   - Allows authenticated users to create their own profile
   - Ensures the profile id matches the authenticated user's id (auth.uid())

## Security
- Users can only create a profile for themselves (id must match auth.uid())
- Prevents users from creating profiles for other users
- Maintains data isolation and security
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Allow individual profile creation" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);
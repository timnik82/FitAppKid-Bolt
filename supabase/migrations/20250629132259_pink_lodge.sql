/*
# Allow Profile Insert Policy

This migration adds a specific RLS policy to allow authenticated users to insert their own profile records.

## Changes
1. Add INSERT policy for profiles table to allow users to create their own profile

## Security
- Users can only insert profiles where the id matches their auth.uid()
- Prevents users from creating profiles for other users
*/

-- Add policy to allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated user to insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);
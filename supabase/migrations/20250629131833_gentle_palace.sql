/*
# Add INSERT policies for profiles table

## Overview
This migration adds missing INSERT policies for the profiles table to allow:
1. Authenticated users to create their own profile (parent accounts)
2. Parents to create child profiles

## Changes
1. Added policy for authenticated users to insert their own profile
2. Added policy for parents to insert child profiles

## Security
- Users can only create profiles with their own auth.uid()
- Parents can create child profiles (is_child = true)
- Child profiles require existing parent profile
*/

-- Allow authenticated users to create their own profile (parent accounts)
CREATE POLICY "Allow authenticated users to create their own profile" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id AND is_child = false);

-- Allow parents to create child profiles
CREATE POLICY "Allow parents to create child profiles" 
  ON public.profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    is_child = true 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND is_child = false
    )
  );
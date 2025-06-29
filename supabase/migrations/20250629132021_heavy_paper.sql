/*
# Fix RLS Infinite Recursion in Profiles Table

This migration fixes the infinite recursion error in the profiles table RLS policies.
The issue was caused by a policy that queries the profiles table from within a profiles table policy.

## Problem
The "Allow parents to create child profiles" policy had a condition that checked the profiles table:
- EXISTS (SELECT 1 FROM profiles WHERE profiles.id = uid() AND profiles.is_child = false)

This created infinite recursion when inserting child profiles.

## Solution
1. Remove the recursive policy
2. Create a simpler policy structure that avoids self-referential queries
3. Handle parent verification at the application level instead of database level
*/

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Allow parents to create child profiles" ON profiles;

-- Drop other potentially conflicting policies to clean slate
DROP POLICY IF EXISTS "Allow individual profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON profiles;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Parents can read children profiles (this one is safe as it queries parent_child_relationships, not profiles)
CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = profiles.id
      AND pcr.active = true
    )
  );

-- Parents can update children profiles
CREATE POLICY "Parents can update children profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = profiles.id
      AND pcr.active = true
    )
  );

-- Ensure parent_child_relationships policies are simple and non-recursive
DROP POLICY IF EXISTS "Parents can manage their relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Children can view their parent relationships" ON parent_child_relationships;

-- Simple policies for parent_child_relationships that don't reference other tables
CREATE POLICY "Parents can manage relationships"
  ON parent_child_relationships
  FOR ALL
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Children can view relationships"
  ON parent_child_relationships
  FOR SELECT
  TO authenticated
  USING (child_id = auth.uid());

-- Create policy for parents to insert relationships for their children
CREATE POLICY "Parents can create relationships"
  ON parent_child_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());
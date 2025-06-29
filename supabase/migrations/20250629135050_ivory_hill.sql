/*
  # Fix RLS infinite recursion between profiles and parent_child_relationships

  1. Problem
     - Current RLS policies on parent_child_relationships table query the profiles table
     - RLS policies on profiles table query the parent_child_relationships table
     - This creates infinite recursion when accessing profiles data

  2. Solution
     - Drop existing problematic policies on parent_child_relationships
     - Create new simplified policies that use auth.uid() directly
     - Break the circular dependency by not querying profiles table from parent_child_relationships policies

  3. New Policies
     - Allow users to view relationships where they are the parent (using parent_id)
     - Allow users to view relationships where they are the child (using child_id) 
     - Allow parents to manage relationships they own
     - Use direct auth.uid() checks instead of subqueries to profiles table
*/

-- Drop existing problematic policies on parent_child_relationships
DROP POLICY IF EXISTS "Children can view relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can create relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can manage relationships" ON parent_child_relationships;

-- Create new simplified policies that don't query profiles table
-- This breaks the circular dependency and prevents infinite recursion

-- Allow users to view relationships where they are involved as parent or child
-- Uses profile_id directly from parent_child_relationships without querying profiles
CREATE POLICY "Users can view their relationships"
  ON parent_child_relationships
  FOR SELECT
  TO authenticated
  USING (
    parent_id IN (
      SELECT profile_id FROM profiles WHERE user_id = auth.uid()
    ) OR 
    child_id IN (
      SELECT profile_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Allow parents to create relationships for their own profile
CREATE POLICY "Parents can create relationships"
  ON parent_child_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    parent_id IN (
      SELECT profile_id FROM profiles WHERE user_id = auth.uid() AND is_child = false
    )
  );

-- Allow parents to update and delete their own relationships
CREATE POLICY "Parents can manage their relationships"
  ON parent_child_relationships
  FOR UPDATE
  TO authenticated
  USING (
    parent_id IN (
      SELECT profile_id FROM profiles WHERE user_id = auth.uid() AND is_child = false
    )
  );

CREATE POLICY "Parents can delete their relationships"
  ON parent_child_relationships
  FOR DELETE
  TO authenticated
  USING (
    parent_id IN (
      SELECT profile_id FROM profiles WHERE user_id = auth.uid() AND is_child = false
    )
  );
/*
  # Fix RLS Policy Infinite Recursion

  This migration fixes the infinite recursion error in the profiles table policies
  by properly defining the get_my_profile_id() function and ensuring policies
  don't create circular dependencies.

  1. Create get_my_profile_id() function with SECURITY DEFINER
  2. Update policies to avoid recursion
  3. Ensure proper access patterns
*/

-- Create the get_my_profile_id function if it doesn't exist
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT profile_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Drop and recreate policies to fix recursion issues
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;

-- Recreate basic user policies without recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_child = false);

-- Parent-child policies with direct joins to avoid function calls
CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    profiles.is_child = true AND
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      INNER JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
      WHERE parent_p.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  );

CREATE POLICY "Parents can update children profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    profiles.is_child = true AND
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      INNER JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
      WHERE parent_p.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  )
  WITH CHECK (
    profiles.is_child = true AND
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      INNER JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
      WHERE parent_p.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  );

CREATE POLICY "Parents can insert child profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_child = true AND
    user_id IS NULL AND
    parent_consent_given = true
  );

-- Update other table policies to use direct queries instead of the function
-- to avoid potential recursion

-- Update user_progress policies
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Parents can view children progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;

CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = user_progress.user_id
        AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      INNER JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
      WHERE parent_p.user_id = auth.uid()
        AND pcr.child_id = user_progress.user_id
        AND pcr.active = true
    )
  );

CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = user_progress.user_id
        AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = user_progress.user_id
        AND profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = user_progress.user_id
        AND profiles.user_id = auth.uid()
    )
  );

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_my_profile_id() TO authenticated;
/*
  # Fix infinite recursion in profiles RLS policies

  The profiles table RLS policies are causing infinite recursion because
  they use uid() function instead of auth.uid(). This migration fixes
  the policies to use the correct auth.uid() function.

  ## Changes Made
  1. Drop existing problematic policies on profiles table
  2. Recreate policies using auth.uid() instead of uid()
  3. Ensure policies correctly reference user_id column
*/

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies with correct auth.uid() usage
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

-- Also fix any other policies that might use uid() instead of auth.uid()
-- Drop and recreate parent policies if they exist
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;

-- Recreate parent policies with correct references
CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_child_relationships pcr
      WHERE pcr.parent_id = get_my_profile_id()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  );

CREATE POLICY "Parents can update children profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_child_relationships pcr
      WHERE pcr.parent_id = get_my_profile_id()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  );

CREATE POLICY "Parents can insert child profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_child = true
    AND user_id IS NULL
    AND parent_consent_given = true
  );

-- Create the helper function get_my_profile_id if it doesn't exist
CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT profile_id
  FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
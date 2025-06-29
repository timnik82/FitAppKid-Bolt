/*
  # Fix RLS Policies for Profiles Table

  This migration fixes the Row Level Security policies on the profiles table
  to use the correct auth.uid() function instead of uid().

  ## Changes Made
  1. Drop existing policies that use uid()
  2. Recreate policies with correct auth.uid() function
  3. Ensure users can insert, select, and update their own profiles
  4. Maintain parent-child relationship policies
*/

-- Drop existing policies that use incorrect uid() function
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;

-- Recreate policies with correct auth.uid() function
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
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
        AND pcr.child_id = profiles.id
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
      WHERE pcr.parent_id = auth.uid()
        AND pcr.child_id = profiles.id
        AND pcr.active = true
    )
  );
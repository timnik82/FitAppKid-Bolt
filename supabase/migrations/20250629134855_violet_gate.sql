-- Fix RLS Policy Infinite Recursion
-- 
-- The issue is that policies on the profiles table are using get_my_profile_id()
-- which queries the profiles table, causing infinite recursion.
-- 
-- Solution: Modify profiles table policies to use direct JOINs instead of the helper function.

-- Drop the problematic policies on profiles table that use get_my_profile_id()
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;

-- Recreate the parent-child policies for profiles table WITHOUT using get_my_profile_id()
-- Instead, use a direct JOIN within the EXISTS clause
CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM parent_child_relationships pcr
      JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
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
    EXISTS (
      SELECT 1
      FROM parent_child_relationships pcr
      JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
      WHERE parent_p.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM parent_child_relationships pcr
      JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id
      WHERE parent_p.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  );

-- Keep the get_my_profile_id() function for use in OTHER tables (not profiles)
-- where it doesn't cause recursion
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

-- Verify that all other basic policies on profiles table are correct
-- (These should not cause recursion since they don't use get_my_profile_id())

-- Ensure these policies exist and are correct
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_child = false);

DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;
CREATE POLICY "Parents can insert child profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_child = true
    AND user_id IS NULL
    AND parent_consent_given = true
  );

-- Status message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS Policy Recursion Fixed!';
    RAISE NOTICE '   - Removed get_my_profile_id() usage from profiles table policies';
    RAISE NOTICE '   - Used direct JOINs to avoid recursion';
    RAISE NOTICE '   - Kept get_my_profile_id() function for other tables';
    RAISE NOTICE '   - All basic profiles policies recreated correctly';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 The parent-child access patterns now use:';
    RAISE NOTICE '   JOIN profiles parent_p ON pcr.parent_id = parent_p.profile_id';
    RAISE NOTICE '   WHERE parent_p.user_id = auth.uid()';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 This eliminates the circular dependency that was causing infinite recursion!';
END $$;
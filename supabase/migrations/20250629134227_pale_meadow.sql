/*
# Fix RLS Policies for Profiles Table

This migration fixes the infinite recursion error in the profiles table RLS policies.
The issue was that policies were using `id = auth.uid()` instead of `user_id = auth.uid()`.

## Changes Made
1. Drop existing problematic RLS policies for profiles table
2. Recreate policies with correct column references
3. Fix related policies that reference profile relationships

## Security
- Users can read/update their own profile data
- Parents can read/update their children's profiles
- Child profile creation requires parent consent
*/

-- Drop existing problematic policies for profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;

-- Create corrected RLS policies for profiles table
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
      AND pcr.child_id = profiles.profile_id
      AND pcr.active = true
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Parents can update children profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
      AND pcr.child_id = profiles.profile_id
      AND pcr.active = true
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_child = false);

CREATE POLICY "Parents can insert child profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_child = true AND user_id IS NULL AND parent_consent_given = true);

-- Fix related policies that may have similar issues
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Parents can view children progress" ON user_progress;

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

CREATE POLICY "Parents can view children progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
      AND pcr.child_id = user_progress.user_id
      AND pcr.active = true
    )
  );

-- Fix other user-specific table policies
DROP POLICY IF EXISTS "Users can manage own adventure progress" ON user_adventures;
DROP POLICY IF EXISTS "Parents can view children adventure progress" ON user_adventures;

CREATE POLICY "Users can manage own adventure progress"
  ON user_adventures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = user_adventures.user_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children adventure progress"
  ON user_adventures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
      AND pcr.child_id = user_adventures.user_id
      AND pcr.active = true
    )
  );

-- Fix exercise sessions policies
DROP POLICY IF EXISTS "Users can manage own exercise sessions" ON exercise_sessions;
DROP POLICY IF EXISTS "Parents can view children exercise sessions" ON exercise_sessions;

CREATE POLICY "Users can manage own exercise sessions"
  ON exercise_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = exercise_sessions.user_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children exercise sessions"
  ON exercise_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
      AND pcr.child_id = exercise_sessions.user_id
      AND pcr.active = true
    )
  );

-- Fix user rewards policies
DROP POLICY IF EXISTS "Users can manage own rewards" ON user_rewards;
DROP POLICY IF EXISTS "Parents can view children rewards" ON user_rewards;

CREATE POLICY "Users can manage own rewards"
  ON user_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = user_rewards.user_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children rewards"
  ON user_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
      AND pcr.child_id = user_rewards.user_id
      AND pcr.active = true
    )
  );

-- Fix parent-child relationships policies
DROP POLICY IF EXISTS "Parents can manage their relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Children can view their parent relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can manage relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can create relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Children can view relationships" ON parent_child_relationships;

CREATE POLICY "Parents can manage relationships"
  ON parent_child_relationships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = parent_child_relationships.parent_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create relationships"
  ON parent_child_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = parent_child_relationships.parent_id
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Children can view relationships"
  ON parent_child_relationships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.profile_id = parent_child_relationships.child_id
      AND profiles.user_id = auth.uid()
    )
  );
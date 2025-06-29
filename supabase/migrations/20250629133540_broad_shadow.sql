/*
# Decouple Child Profiles from Auth Users

This migration implements a comprehensive solution to support COPPA-compliant 
child profiles that don't require their own authentication accounts.

## Changes Made
1. **Schema Restructure**: 
   - Add `profile_id` as new primary key for profiles
   - Make `id` nullable and rename to `user_id` (only for parent accounts)
   - Update all foreign key references
   
2. **RLS Policy Updates**:
   - New policies that support both parent and child profiles
   - Proper access control for family data

3. **Data Migration**:
   - Safely migrate existing data to new structure
   - Maintain referential integrity

## Security
- Complete data isolation between families
- Parents can manage child profiles
- Children don't need auth accounts (COPPA compliant)
*/

-- Step 1: Begin transaction for safety
BEGIN;

-- Step 2: Disable RLS temporarily to perform schema changes
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_adventures DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can manage relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Children can view relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can create relationships" ON parent_child_relationships;

-- Step 4: Drop foreign key constraints that reference profiles.id
ALTER TABLE parent_child_relationships DROP CONSTRAINT IF EXISTS parent_child_relationships_parent_id_fkey;
ALTER TABLE parent_child_relationships DROP CONSTRAINT IF EXISTS parent_child_relationships_child_id_fkey;
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey;
ALTER TABLE user_adventures DROP CONSTRAINT IF EXISTS user_adventures_user_id_fkey;
ALTER TABLE user_path_progress DROP CONSTRAINT IF EXISTS user_path_progress_user_id_fkey;
ALTER TABLE user_rewards DROP CONSTRAINT IF EXISTS user_rewards_user_id_fkey;
ALTER TABLE exercise_sessions DROP CONSTRAINT IF EXISTS exercise_sessions_user_id_fkey;

-- Step 5: Add new profile_id column as the new primary key
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_id uuid DEFAULT gen_random_uuid();

-- Step 6: Populate profile_id for existing records
UPDATE profiles SET profile_id = gen_random_uuid() WHERE profile_id IS NULL;

-- Step 7: Make profile_id NOT NULL and set as primary key
ALTER TABLE profiles ALTER COLUMN profile_id SET NOT NULL;

-- Step 8: Drop the old primary key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Step 9: Set profile_id as the new primary key
ALTER TABLE profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (profile_id);

-- Step 10: Rename id column to user_id and make it nullable
ALTER TABLE profiles RENAME COLUMN id TO user_id;
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;

-- Step 11: Add foreign key constraint for user_id to auth.users (allows NULL for children)
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 12: Update parent_child_relationships table to use profile_id
-- Add new columns
ALTER TABLE parent_child_relationships ADD COLUMN IF NOT EXISTS parent_profile_id uuid;
ALTER TABLE parent_child_relationships ADD COLUMN IF NOT EXISTS child_profile_id uuid;

-- Migrate existing data by matching user_id to profile_id
UPDATE parent_child_relationships 
SET parent_profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = parent_child_relationships.parent_id
);

UPDATE parent_child_relationships 
SET child_profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = parent_child_relationships.child_id
);

-- Make the new columns NOT NULL
ALTER TABLE parent_child_relationships ALTER COLUMN parent_profile_id SET NOT NULL;
ALTER TABLE parent_child_relationships ALTER COLUMN child_profile_id SET NOT NULL;

-- Drop old columns
ALTER TABLE parent_child_relationships DROP COLUMN parent_id;
ALTER TABLE parent_child_relationships DROP COLUMN child_id;

-- Rename new columns
ALTER TABLE parent_child_relationships RENAME COLUMN parent_profile_id TO parent_id;
ALTER TABLE parent_child_relationships RENAME COLUMN child_profile_id TO child_id;

-- Add foreign key constraints
ALTER TABLE parent_child_relationships ADD CONSTRAINT parent_child_relationships_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

ALTER TABLE parent_child_relationships ADD CONSTRAINT parent_child_relationships_child_id_fkey
  FOREIGN KEY (child_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Step 13: Update user_progress table
-- Add new column
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Migrate existing data
UPDATE user_progress 
SET profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = user_progress.user_id
);

-- Make the new column NOT NULL
ALTER TABLE user_progress ALTER COLUMN profile_id SET NOT NULL;

-- Drop old column and rename
ALTER TABLE user_progress DROP COLUMN user_id;
ALTER TABLE user_progress RENAME COLUMN profile_id TO user_id;

-- Add foreign key constraint
ALTER TABLE user_progress ADD CONSTRAINT user_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Step 14: Update user_adventures table
-- Add new column
ALTER TABLE user_adventures ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Migrate existing data
UPDATE user_adventures 
SET profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = user_adventures.user_id
);

-- Make the new column NOT NULL where it has data
UPDATE user_adventures SET profile_id = gen_random_uuid() WHERE profile_id IS NULL;
ALTER TABLE user_adventures ALTER COLUMN profile_id SET NOT NULL;

-- Drop old column and rename
ALTER TABLE user_adventures DROP COLUMN user_id;
ALTER TABLE user_adventures RENAME COLUMN profile_id TO user_id;

-- Add foreign key constraint
ALTER TABLE user_adventures ADD CONSTRAINT user_adventures_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Step 15: Update user_path_progress table
-- Add new column
ALTER TABLE user_path_progress ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Migrate existing data
UPDATE user_path_progress 
SET profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = user_path_progress.user_id
);

-- Make the new column NOT NULL where it has data
UPDATE user_path_progress SET profile_id = gen_random_uuid() WHERE profile_id IS NULL;
ALTER TABLE user_path_progress ALTER COLUMN profile_id SET NOT NULL;

-- Drop old column and rename
ALTER TABLE user_path_progress DROP COLUMN user_id;
ALTER TABLE user_path_progress RENAME COLUMN profile_id TO user_id;

-- Add foreign key constraint
ALTER TABLE user_path_progress ADD CONSTRAINT user_path_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Step 16: Update user_rewards table
-- Add new column
ALTER TABLE user_rewards ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Migrate existing data
UPDATE user_rewards 
SET profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = user_rewards.user_id
);

-- Make the new column NOT NULL where it has data
UPDATE user_rewards SET profile_id = gen_random_uuid() WHERE profile_id IS NULL;
ALTER TABLE user_rewards ALTER COLUMN profile_id SET NOT NULL;

-- Drop old column and rename
ALTER TABLE user_rewards DROP COLUMN user_id;
ALTER TABLE user_rewards RENAME COLUMN profile_id TO user_id;

-- Add foreign key constraint
ALTER TABLE user_rewards ADD CONSTRAINT user_rewards_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Step 17: Update exercise_sessions table
-- Add new column
ALTER TABLE exercise_sessions ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Migrate existing data
UPDATE exercise_sessions 
SET profile_id = (
  SELECT profile_id FROM profiles WHERE user_id = exercise_sessions.user_id
);

-- Make the new column NOT NULL where it has data
UPDATE exercise_sessions SET profile_id = gen_random_uuid() WHERE profile_id IS NULL;
ALTER TABLE exercise_sessions ALTER COLUMN profile_id SET NOT NULL;

-- Drop old column and rename
ALTER TABLE exercise_sessions DROP COLUMN user_id;
ALTER TABLE exercise_sessions RENAME COLUMN profile_id TO user_id;

-- Add foreign key constraint
ALTER TABLE exercise_sessions ADD CONSTRAINT exercise_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(profile_id) ON DELETE CASCADE;

-- Step 18: Create new RLS policies for the restructured schema

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Parents can insert their own profile (linked to auth.users)
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_child = false);

-- Parents can insert child profiles (not linked to auth.users)
CREATE POLICY "Parents can insert child profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_child = true 
    AND user_id IS NULL 
    AND parent_consent_given = true
  );

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Parents can read children profiles
CREATE POLICY "Parents can read children profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
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
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
  );

-- Parent-child relationships policies
CREATE POLICY "Parents can manage relationships"
  ON parent_child_relationships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = parent_child_relationships.parent_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can create relationships"
  ON parent_child_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = parent_child_relationships.parent_id 
        AND user_id = auth.uid()
    )
  );

-- User progress policies (using profile_id)
CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = user_progress.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = user_progress.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = user_progress.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = user_progress.user_id
        AND pcr.active = true
    )
  );

-- Similar policies for other tables (user_adventures, user_path_progress, user_rewards, exercise_sessions)
-- Exercise sessions policies
CREATE POLICY "Users can manage own exercise sessions"
  ON exercise_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = exercise_sessions.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children exercise sessions"
  ON exercise_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = exercise_sessions.user_id
        AND pcr.active = true
    )
  );

-- User adventures policies
CREATE POLICY "Users can manage own adventure progress"
  ON user_adventures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = user_adventures.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children adventure progress"
  ON user_adventures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = user_adventures.user_id
        AND pcr.active = true
    )
  );

-- User path progress policies
CREATE POLICY "Users can manage own path progress"
  ON user_path_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = user_path_progress.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children path progress"
  ON user_path_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = user_path_progress.user_id
        AND pcr.active = true
    )
  );

-- User rewards policies
CREATE POLICY "Users can manage own rewards"
  ON user_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profile_id = user_rewards.user_id 
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can view children rewards"
  ON user_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM parent_child_relationships pcr
      JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
      WHERE parent_profile.user_id = auth.uid()
        AND pcr.child_id = user_rewards.user_id
        AND pcr.active = true
    )
  );

-- Step 19: Update unique constraints
-- Update unique constraint for parent_child_relationships
ALTER TABLE parent_child_relationships DROP CONSTRAINT IF EXISTS parent_child_relationships_parent_id_child_id_key;
ALTER TABLE parent_child_relationships ADD CONSTRAINT parent_child_relationships_parent_id_child_id_key 
  UNIQUE (parent_id, child_id);

-- Update unique constraint for user_progress
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_user_id_key;
ALTER TABLE user_progress ADD CONSTRAINT user_progress_user_id_key UNIQUE (user_id);

-- Step 20: Create helper function for profile access
CREATE OR REPLACE FUNCTION get_accessible_profile_ids(check_user_id uuid DEFAULT auth.uid())
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    accessible_ids uuid[];
BEGIN
    -- Get user's own profile_id and their children's profile_ids
    SELECT ARRAY(
        -- User's own profile
        SELECT profile_id FROM profiles WHERE user_id = check_user_id
        UNION
        -- Children's profiles
        SELECT pcr.child_id 
        FROM parent_child_relationships pcr
        JOIN profiles p ON pcr.parent_id = p.profile_id
        WHERE p.user_id = check_user_id AND pcr.active = true
    ) INTO accessible_ids;
    
    RETURN accessible_ids;
END;
$$;

-- Commit the transaction
COMMIT;

-- Final verification
DO $$
DECLARE
    profile_count integer;
    auth_user_count integer;
    child_profile_count integer;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO auth_user_count FROM profiles WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO child_profile_count FROM profiles WHERE is_child = true;
    
    RAISE NOTICE '✅ Schema migration completed successfully!';
    RAISE NOTICE '   Total profiles: %', profile_count;
    RAISE NOTICE '   Profiles with auth users: %', auth_user_count;
    RAISE NOTICE '   Child profiles: %', child_profile_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔧 New schema structure:';
    RAISE NOTICE '   - profiles.profile_id: Primary key for all profiles';
    RAISE NOTICE '   - profiles.user_id: Foreign key to auth.users (NULL for children)';
    RAISE NOTICE '   - Parent profiles: user_id = auth.uid(), is_child = false';
    RAISE NOTICE '   - Child profiles: user_id = NULL, is_child = true';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 COPPA-compliant child profiles are now fully supported!';
END $$;
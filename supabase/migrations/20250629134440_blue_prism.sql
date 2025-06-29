/*
# Fix Infinite Recursion in Profiles RLS Policies

This migration resolves the infinite recursion error in the profiles table RLS policies
by creating a SECURITY DEFINER function and updating the problematic policies.

## Changes Made
1. Create a SECURITY DEFINER function to safely get current user's profile_id
2. Drop and recreate parent-child relationship policies to eliminate recursion
3. Ensure policies use correct column references

## Security
- The SECURITY DEFINER function bypasses RLS only for the specific lookup needed
- All other security constraints remain intact
*/

-- Create a SECURITY DEFINER function to get current user's profile_id safely
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    my_profile_id uuid;
BEGIN
    SELECT profile_id INTO my_profile_id 
    FROM public.profiles 
    WHERE user_id = auth.uid();
    RETURN my_profile_id;
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;

-- Recreate parent-child policies without recursion
CREATE POLICY "Parents can read children profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
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
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
        AND pcr.child_id = profiles.profile_id
        AND pcr.active = true
    )
);

-- Also update other tables that reference profiles to use the function
-- Update user_progress policies
DROP POLICY IF EXISTS "Parents can view children progress" ON user_progress;
CREATE POLICY "Parents can view children progress"
ON user_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
        AND pcr.child_id = user_progress.user_id
        AND pcr.active = true
    )
);

-- Update user_adventures policies
DROP POLICY IF EXISTS "Parents can view children adventure progress" ON user_adventures;
CREATE POLICY "Parents can view children adventure progress"
ON user_adventures
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
        AND pcr.child_id = user_adventures.user_id
        AND pcr.active = true
    )
);

-- Update user_path_progress policies
DROP POLICY IF EXISTS "Parents can view children path progress" ON user_path_progress;
CREATE POLICY "Parents can view children path progress"
ON user_path_progress
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
        AND pcr.child_id = user_path_progress.user_id
        AND pcr.active = true
    )
);

-- Update user_rewards policies
DROP POLICY IF EXISTS "Parents can view children rewards" ON user_rewards;
CREATE POLICY "Parents can view children rewards"
ON user_rewards
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
        AND pcr.child_id = user_rewards.user_id
        AND pcr.active = true
    )
);

-- Update exercise_sessions policies
DROP POLICY IF EXISTS "Parents can view children exercise sessions" ON exercise_sessions;
CREATE POLICY "Parents can view children exercise sessions"
ON exercise_sessions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = public.get_my_profile_id()
        AND pcr.child_id = exercise_sessions.user_id
        AND pcr.active = true
    )
);
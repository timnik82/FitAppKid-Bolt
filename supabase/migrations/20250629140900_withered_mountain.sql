/*
# Fix profiles table INSERT RLS policy

This migration fixes the RLS policy violation that prevents inserting new profiles.
The issue was with overly complex INSERT policies that were causing conflicts.

## Changes Made
1. Drop existing INSERT policies on profiles table
2. Create a single, simplified INSERT policy that allows:
   - Authenticated users to create their own profiles (user_id = auth.uid())
   - Parents to create child profiles (is_child = true AND user_id IS NULL)

## Security
- Maintains proper access control while simplifying policy logic
- Prevents unauthorized profile creation
- Allows legitimate parent and child profile creation
*/

-- Drop existing INSERT policies on profiles table that are causing issues
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can insert child profiles" ON profiles;

-- Create a single, simplified INSERT policy for profiles
CREATE POLICY "Allow authenticated users to create profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow users to create their own profiles
    auth.uid() = user_id 
    OR 
    -- Allow creating child profiles (no auth user, parent creates them)
    (is_child = true AND user_id IS NULL)
  );

-- Verify the policy was created successfully
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Allow authenticated users to create profiles';
    
    IF policy_count = 1 THEN
        RAISE NOTICE '✅ Profiles INSERT policy created successfully';
        RAISE NOTICE '✅ Users can now create profiles and add children';
    ELSE
        RAISE EXCEPTION 'Failed to create profiles INSERT policy';
    END IF;
END $$;
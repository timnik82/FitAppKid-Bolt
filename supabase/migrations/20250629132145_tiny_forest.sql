-- Fix RLS infinite recursion by dropping and recreating all policies safely

-- Drop ALL existing policies on profiles table to ensure clean slate
DROP POLICY IF EXISTS "Allow parents to create child profiles" ON profiles;
DROP POLICY IF EXISTS "Allow individual profile creation" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Parents can read children profiles" ON profiles;
DROP POLICY IF EXISTS "Parents can update children profiles" ON profiles;

-- Drop ALL existing policies on parent_child_relationships table
DROP POLICY IF EXISTS "Parents can manage their relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Children can view their parent relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can manage relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Children can view relationships" ON parent_child_relationships;
DROP POLICY IF EXISTS "Parents can create relationships" ON parent_child_relationships;

-- Create simplified, non-recursive policies for profiles
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

-- Parents can read children profiles (safe - queries parent_child_relationships, not profiles)
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

CREATE POLICY "Parents can create relationships"
  ON parent_child_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());
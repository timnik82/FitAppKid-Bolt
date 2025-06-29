/*
# Fix user_progress INSERT policy

This migration adds the missing INSERT policy for the user_progress table
to allow authenticated users to create their own progress records.

## Changes Made
1. Add INSERT policy for user_progress table
2. Allow authenticated users to insert their own progress records

## Security
- Users can only insert progress records for themselves (user_id = auth.uid())
- Maintains data isolation between families
*/

-- Add INSERT policy for user_progress table
CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
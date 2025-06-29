/*
# Remove Calorie Tracking and Add Gamified Points System

This migration removes health-related calorie tracking to ensure COPPA compliance
and replaces it with a gamified points system focused on completion and consistency.

## Changes Made
1. Remove calories_per_minute from exercises table
2. Add adventure_points to exercises table for gamification
3. Update exercise_sessions to remove calorie calculations
4. Update user_progress to focus on points and achievements instead of calories
5. Update existing data to use points-based system

## COPPA Compliance
- Removes health data collection (calories)
- Focuses on engagement and fun rather than fitness metrics
- Maintains educational and motivational aspects through points
*/

-- Remove calories_per_minute column from exercises table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'calories_per_minute'
  ) THEN
    ALTER TABLE exercises DROP COLUMN calories_per_minute;
  END IF;
END $$;

-- Add adventure_points column to exercises table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'adventure_points'
  ) THEN
    ALTER TABLE exercises ADD COLUMN adventure_points integer DEFAULT 10;
  END IF;
END $$;

-- Update adventure_points based on exercise difficulty and duration
DO $$
BEGIN
    -- Easy exercises: 10-15 points
    UPDATE exercises 
    SET adventure_points = CASE 
        WHEN duration_seconds <= 45 THEN 10
        WHEN duration_seconds <= 90 THEN 12
        ELSE 15
    END
    WHERE difficulty = 'Easy';
    
    -- Medium exercises: 15-25 points
    UPDATE exercises 
    SET adventure_points = CASE 
        WHEN duration_seconds <= 45 THEN 15
        WHEN duration_seconds <= 90 THEN 20
        ELSE 25
    END
    WHERE difficulty = 'Medium';
    
    -- Hard exercises: 25-35 points
    UPDATE exercises 
    SET adventure_points = CASE 
        WHEN duration_seconds <= 45 THEN 25
        WHEN duration_seconds <= 90 THEN 30
        ELSE 35
    END
    WHERE difficulty = 'Hard';
    
    -- Balance-focused exercises get bonus points
    UPDATE exercises 
    SET adventure_points = adventure_points + 5
    WHERE is_balance_focused = true;
END $$;

-- Remove any calorie-related columns from exercise_sessions if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercise_sessions' AND column_name = 'calories_burned'
  ) THEN
    ALTER TABLE exercise_sessions DROP COLUMN calories_burned;
  END IF;
END $$;

-- Update user_progress table to remove calorie tracking
DO $$
BEGIN
  -- Remove calories_burned column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'calories_burned'
  ) THEN
    ALTER TABLE user_progress DROP COLUMN calories_burned;
  END IF;
  
  -- Remove weekly_calories_goal if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'weekly_calories_goal'
  ) THEN
    ALTER TABLE user_progress DROP COLUMN weekly_calories_goal;
  END IF;
END $$;

-- Add new gamification columns to user_progress if they don't exist
DO $$
BEGIN
  -- Add weekly adventure points goal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'weekly_points_goal'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN weekly_points_goal integer DEFAULT 100;
  END IF;
  
  -- Add consistency tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'weekly_exercise_days'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN weekly_exercise_days integer DEFAULT 0;
  END IF;
  
  -- Add fun rating average
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'average_fun_rating'
  ) THEN
    ALTER TABLE user_progress ADD COLUMN average_fun_rating decimal(3,2) DEFAULT 0.00;
  END IF;
END $$;

-- Update existing rewards to focus on engagement rather than health metrics
UPDATE rewards 
SET unlock_criteria = jsonb_set(
    unlock_criteria, 
    '{description}', 
    '"Complete exercises to earn adventure points and unlock new challenges!"'
)
WHERE unlock_criteria ? 'calories_burned';

-- Update any calorie-based reward criteria to use points instead
UPDATE rewards 
SET unlock_criteria = jsonb_set(
    unlock_criteria - 'calories_burned',
    '{points_earned}',
    (unlock_criteria->>'calories_burned')::jsonb
)
WHERE unlock_criteria ? 'calories_burned';

-- Add new engagement-focused rewards
INSERT INTO rewards (title, description, reward_type, icon, rarity, unlock_criteria, points_value) VALUES
('Consistency Champion', 'Exercise 3 days this week!', 'badge', 'calendar-check', 'common', '{"weekly_exercise_days": 3}', 30),
('Fun Seeker', 'Rate 5 exercises as super fun!', 'badge', 'smile', 'common', '{"fun_ratings_given": 5}', 25),
('Adventure Collector', 'Earn 100 adventure points!', 'badge', 'star', 'rare', '{"points_earned": 100}', 50),
('Weekly Explorer', 'Complete exercises 5 days this week!', 'trophy', 'calendar-days', 'rare', '{"weekly_exercise_days": 5}', 75),
('Point Master', 'Earn 500 adventure points total!', 'trophy', 'gem', 'epic', '{"points_earned": 500}', 150),
('Super Consistent', 'Exercise every day for a week!', 'trophy', 'flame', 'epic', '{"weekly_exercise_days": 7}', 200);

-- Update adventure exercises points to match new system
UPDATE adventure_exercises 
SET points_reward = (
    SELECT adventure_points 
    FROM exercises 
    WHERE exercises.id = adventure_exercises.exercise_id
)
WHERE points_reward < 10;

-- Add comment to document the change
COMMENT ON COLUMN exercises.adventure_points IS 'Gamified points earned for completing exercise - replaces calorie tracking for COPPA compliance';
COMMENT ON COLUMN user_progress.weekly_points_goal IS 'Weekly adventure points goal for gamification';
COMMENT ON COLUMN user_progress.weekly_exercise_days IS 'Number of days exercised this week for consistency tracking';
COMMENT ON COLUMN user_progress.average_fun_rating IS 'Average fun rating given by user to track engagement';
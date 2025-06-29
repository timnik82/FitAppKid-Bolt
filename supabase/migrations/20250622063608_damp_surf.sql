/*
# Add duration_seconds field to exercises table

## Overview
Adds a duration_seconds integer field to the exercises table with appropriate default values based on exercise categories.

## Changes
1. Add duration_seconds column to exercises table
2. Set default values based on exercise categories:
   - Warm-up exercises: 45 seconds (middle of 30-60 range)
   - Main exercises: 90 seconds (middle of 60-120 range)  
   - Cool-down exercises: 45 seconds (middle of 30-60 range)
   - Posture exercises: 45 seconds (similar to warm-up)

## Notes
- Uses category-based defaults for now
- Can be updated with specific values later
- Maintains consistency with existing exercise data
*/

-- Add duration_seconds column to exercises table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exercises' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE exercises ADD COLUMN duration_seconds integer;
  END IF;
END $$;

-- Update duration_seconds based on exercise categories
DO $$
DECLARE
    warmup_id uuid;
    main_id uuid;
    cooldown_id uuid;
    posture_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO warmup_id FROM exercise_categories WHERE name_en = 'Warm-up';
    SELECT id INTO main_id FROM exercise_categories WHERE name_en = 'Main';
    SELECT id INTO cooldown_id FROM exercise_categories WHERE name_en = 'Cool-down';
    SELECT id INTO posture_id FROM exercise_categories WHERE name_en = 'Posture';
    
    -- Set default duration values based on category
    -- Warm-up exercises: 45 seconds (middle of 30-60 range)
    UPDATE exercises 
    SET duration_seconds = 45 
    WHERE category_id = warmup_id AND duration_seconds IS NULL;
    
    -- Main exercises: 90 seconds (middle of 60-120 range)
    UPDATE exercises 
    SET duration_seconds = 90 
    WHERE category_id = main_id AND duration_seconds IS NULL;
    
    -- Cool-down exercises: 45 seconds (middle of 30-60 range)
    UPDATE exercises 
    SET duration_seconds = 45 
    WHERE category_id = cooldown_id AND duration_seconds IS NULL;
    
    -- Posture exercises: 45 seconds (similar to warm-up)
    UPDATE exercises 
    SET duration_seconds = 45 
    WHERE category_id = posture_id AND duration_seconds IS NULL;
    
END $$;

-- Set default value for future inserts
ALTER TABLE exercises ALTER COLUMN duration_seconds SET DEFAULT 60;

-- Add a check constraint to ensure reasonable duration values (15 seconds to 10 minutes)
ALTER TABLE exercises ADD CONSTRAINT check_duration_seconds 
CHECK (duration_seconds >= 15 AND duration_seconds <= 600);
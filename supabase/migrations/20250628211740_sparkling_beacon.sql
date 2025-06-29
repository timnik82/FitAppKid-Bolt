/*
# Parse sets_reps_duration into structured data

## Overview
This migration transforms the text-based sets_reps_duration field into structured data
that can be easily queried and used programmatically.

## Changes
1. Add structured columns to exercises table:
   - min_sets, max_sets (integer)
   - min_reps, max_reps (integer) 
   - min_duration_seconds, max_duration_seconds (integer)
   - exercise_type (enum: 'reps', 'duration', 'distance')
   - instructions (text) - cleaned up instruction text

2. Parse existing sets_reps_duration data using pattern matching
3. Add constraints for data integrity
4. Keep original field for reference during transition

## Parsing Logic
Handles common patterns like:
- "2-3 sets of 8-15 repetitions"
- "2-3 sets of 30-60 seconds"
- "10-15 circles in each direction"
- "Hold for 20-45 seconds"
- "30-60 seconds"
*/

-- Add new structured columns to exercises table
DO $$
BEGIN
  -- Sets columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'min_sets') THEN
    ALTER TABLE exercises ADD COLUMN min_sets integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'max_sets') THEN
    ALTER TABLE exercises ADD COLUMN max_sets integer;
  END IF;
  
  -- Reps columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'min_reps') THEN
    ALTER TABLE exercises ADD COLUMN min_reps integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'max_reps') THEN
    ALTER TABLE exercises ADD COLUMN max_reps integer;
  END IF;
  
  -- Duration columns (in seconds)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'min_duration_seconds') THEN
    ALTER TABLE exercises ADD COLUMN min_duration_seconds integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'max_duration_seconds') THEN
    ALTER TABLE exercises ADD COLUMN max_duration_seconds integer;
  END IF;
  
  -- Exercise type enum
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'exercise_type') THEN
    ALTER TABLE exercises ADD COLUMN exercise_type text CHECK (exercise_type IN ('reps', 'duration', 'distance', 'hold'));
  END IF;
  
  -- Cleaned instructions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercises' AND column_name = 'structured_instructions') THEN
    ALTER TABLE exercises ADD COLUMN structured_instructions text;
  END IF;
END $$;

-- Create function to extract numbers from text
CREATE OR REPLACE FUNCTION extract_number_range(input_text text, pattern text)
RETURNS integer[] AS $$
DECLARE
  matches text[];
  result integer[];
BEGIN
  -- Extract numbers using regex
  SELECT regexp_matches(input_text, pattern, 'gi') INTO matches;
  
  IF matches IS NOT NULL AND array_length(matches, 1) >= 1 THEN
    -- Convert to integers
    FOR i IN 1..array_length(matches, 1) LOOP
      result := array_append(result, matches[i]::integer);
    END LOOP;
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN ARRAY[]::integer[];
END;
$$ LANGUAGE plpgsql;

-- Create function to parse sets_reps_duration
CREATE OR REPLACE FUNCTION parse_sets_reps_duration(input_text text)
RETURNS TABLE(
  min_sets_out integer,
  max_sets_out integer,
  min_reps_out integer,
  max_reps_out integer,
  min_duration_out integer,
  max_duration_out integer,
  exercise_type_out text,
  instructions_out text
) AS $$
DECLARE
  clean_text text;
  numbers integer[];
  sets_numbers integer[];
  reps_numbers integer[];
  duration_numbers integer[];
  time_unit text;
BEGIN
  -- Initialize outputs
  min_sets_out := NULL;
  max_sets_out := NULL;
  min_reps_out := NULL;
  max_reps_out := NULL;
  min_duration_out := NULL;
  max_duration_out := NULL;
  exercise_type_out := 'reps'; -- default
  instructions_out := input_text;
  
  -- Clean and normalize input
  clean_text := lower(trim(input_text));
  
  -- Return early if input is null or empty
  IF clean_text IS NULL OR clean_text = '' THEN
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Extract sets (look for "X sets" or "X-Y sets")
  IF clean_text ~ '\d+(-\d+)?\s*sets?' THEN
    SELECT regexp_matches(clean_text, '(\d+)(?:-(\d+))?\s*sets?', 'i') INTO sets_numbers;
    IF sets_numbers IS NOT NULL THEN
      min_sets_out := sets_numbers[1]::integer;
      max_sets_out := COALESCE(sets_numbers[2]::integer, sets_numbers[1]::integer);
    END IF;
  END IF;
  
  -- Check for time-based exercises (seconds, minutes)
  IF clean_text ~ '\d+(-\d+)?\s*(seconds?|minutes?|mins?)' THEN
    exercise_type_out := 'duration';
    
    -- Extract duration numbers
    IF clean_text ~ 'minutes?' OR clean_text ~ 'mins?' THEN
      time_unit := 'minutes';
      SELECT regexp_matches(clean_text, '(\d+)(?:-(\d+))?\s*(?:minutes?|mins?)', 'i') INTO duration_numbers;
    ELSE
      time_unit := 'seconds';
      SELECT regexp_matches(clean_text, '(\d+)(?:-(\d+))?\s*seconds?', 'i') INTO duration_numbers;
    END IF;
    
    IF duration_numbers IS NOT NULL THEN
      min_duration_out := duration_numbers[1]::integer;
      max_duration_out := COALESCE(duration_numbers[2]::integer, duration_numbers[1]::integer);
      
      -- Convert minutes to seconds
      IF time_unit = 'minutes' THEN
        min_duration_out := min_duration_out * 60;
        max_duration_out := max_duration_out * 60;
      END IF;
    END IF;
    
  -- Check for rep-based exercises
  ELSIF clean_text ~ '\d+(-\d+)?\s*(repetitions?|reps?|circles?|times?)' THEN
    exercise_type_out := 'reps';
    
    -- Extract rep numbers
    SELECT regexp_matches(clean_text, '(\d+)(?:-(\d+))?\s*(?:repetitions?|reps?|circles?|times?)', 'i') INTO reps_numbers;
    IF reps_numbers IS NOT NULL THEN
      min_reps_out := reps_numbers[1]::integer;
      max_reps_out := COALESCE(reps_numbers[2]::integer, reps_numbers[1]::integer);
    END IF;
    
  -- Check for "hold" exercises
  ELSIF clean_text ~ 'hold' AND clean_text ~ '\d+(-\d+)?\s*seconds?' THEN
    exercise_type_out := 'hold';
    
    SELECT regexp_matches(clean_text, '(\d+)(?:-(\d+))?\s*seconds?', 'i') INTO duration_numbers;
    IF duration_numbers IS NOT NULL THEN
      min_duration_out := duration_numbers[1]::integer;
      max_duration_out := COALESCE(duration_numbers[2]::integer, duration_numbers[1]::integer);
    END IF;
    
  -- Fallback: look for any numbers and try to infer
  ELSE
    -- Look for standalone numbers that might be reps
    SELECT regexp_matches(clean_text, '(\d+)(?:-(\d+))?', 'i') INTO reps_numbers;
    IF reps_numbers IS NOT NULL THEN
      min_reps_out := reps_numbers[1]::integer;
      max_reps_out := COALESCE(reps_numbers[2]::integer, reps_numbers[1]::integer);
      exercise_type_out := 'reps';
    END IF;
  END IF;
  
  -- Set default sets if we have reps or duration but no sets specified
  IF (min_reps_out IS NOT NULL OR min_duration_out IS NOT NULL) AND min_sets_out IS NULL THEN
    min_sets_out := 1;
    max_sets_out := 1;
  END IF;
  
  -- Clean up instructions (remove redundant info that's now structured)
  instructions_out := regexp_replace(input_text, '\d+(-\d+)?\s*sets?\s*(of\s*)?', '', 'gi');
  instructions_out := regexp_replace(instructions_out, '^\s*,?\s*', '');
  instructions_out := trim(instructions_out);
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Parse existing data
DO $$
DECLARE
  exercise_record RECORD;
  parsed_data RECORD;
BEGIN
  -- Loop through all exercises with sets_reps_duration data
  FOR exercise_record IN 
    SELECT id, sets_reps_duration 
    FROM exercises 
    WHERE sets_reps_duration IS NOT NULL AND sets_reps_duration != ''
  LOOP
    -- Parse the text
    SELECT * INTO parsed_data 
    FROM parse_sets_reps_duration(exercise_record.sets_reps_duration);
    
    -- Update the exercise with parsed data
    UPDATE exercises SET
      min_sets = parsed_data.min_sets_out,
      max_sets = parsed_data.max_sets_out,
      min_reps = parsed_data.min_reps_out,
      max_reps = parsed_data.max_reps_out,
      min_duration_seconds = parsed_data.min_duration_out,
      max_duration_seconds = parsed_data.max_duration_out,
      exercise_type = parsed_data.exercise_type_out,
      structured_instructions = parsed_data.instructions_out
    WHERE id = exercise_record.id;
  END LOOP;
  
  RAISE NOTICE 'Parsed sets_reps_duration for % exercises', 
    (SELECT COUNT(*) FROM exercises WHERE sets_reps_duration IS NOT NULL);
END $$;

-- Add data integrity constraints
ALTER TABLE exercises ADD CONSTRAINT check_sets_range 
  CHECK (min_sets IS NULL OR max_sets IS NULL OR min_sets <= max_sets);

ALTER TABLE exercises ADD CONSTRAINT check_reps_range 
  CHECK (min_reps IS NULL OR max_reps IS NULL OR min_reps <= max_reps);

ALTER TABLE exercises ADD CONSTRAINT check_duration_range 
  CHECK (min_duration_seconds IS NULL OR max_duration_seconds IS NULL OR min_duration_seconds <= max_duration_seconds);

ALTER TABLE exercises ADD CONSTRAINT check_positive_sets 
  CHECK (min_sets IS NULL OR min_sets > 0);

ALTER TABLE exercises ADD CONSTRAINT check_positive_reps 
  CHECK (min_reps IS NULL OR min_reps > 0);

ALTER TABLE exercises ADD CONSTRAINT check_positive_duration 
  CHECK (min_duration_seconds IS NULL OR min_duration_seconds > 0);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_sets ON exercises(min_sets, max_sets);
CREATE INDEX IF NOT EXISTS idx_exercises_duration ON exercises(min_duration_seconds, max_duration_seconds);

-- Add helpful comments
COMMENT ON COLUMN exercises.min_sets IS 'Minimum number of sets for this exercise';
COMMENT ON COLUMN exercises.max_sets IS 'Maximum number of sets for this exercise';
COMMENT ON COLUMN exercises.min_reps IS 'Minimum repetitions per set';
COMMENT ON COLUMN exercises.max_reps IS 'Maximum repetitions per set';
COMMENT ON COLUMN exercises.min_duration_seconds IS 'Minimum duration in seconds (for time-based exercises)';
COMMENT ON COLUMN exercises.max_duration_seconds IS 'Maximum duration in seconds (for time-based exercises)';
COMMENT ON COLUMN exercises.exercise_type IS 'Type of exercise: reps, duration, distance, or hold';
COMMENT ON COLUMN exercises.structured_instructions IS 'Cleaned instruction text with structured data removed';

-- Create a view for easy querying of exercise structure
CREATE OR REPLACE VIEW exercise_structure AS
SELECT 
  id,
  name_en,
  exercise_type,
  CASE 
    WHEN min_sets = max_sets THEN min_sets::text || ' set'
    WHEN min_sets IS NOT NULL AND max_sets IS NOT NULL THEN min_sets::text || '-' || max_sets::text || ' sets'
    ELSE 'Variable sets'
  END as sets_display,
  CASE 
    WHEN exercise_type = 'reps' THEN
      CASE 
        WHEN min_reps = max_reps THEN min_reps::text || ' reps'
        WHEN min_reps IS NOT NULL AND max_reps IS NOT NULL THEN min_reps::text || '-' || max_reps::text || ' reps'
        ELSE 'Variable reps'
      END
    WHEN exercise_type IN ('duration', 'hold') THEN
      CASE 
        WHEN min_duration_seconds = max_duration_seconds THEN min_duration_seconds::text || ' seconds'
        WHEN min_duration_seconds IS NOT NULL AND max_duration_seconds IS NOT NULL THEN min_duration_seconds::text || '-' || max_duration_seconds::text || ' seconds'
        ELSE 'Variable duration'
      END
    ELSE 'See instructions'
  END as target_display,
  structured_instructions,
  sets_reps_duration as original_text
FROM exercises;

-- Grant access to the view
GRANT SELECT ON exercise_structure TO authenticated;

-- Clean up temporary functions (optional - keep them if you want to reuse)
-- DROP FUNCTION IF EXISTS extract_number_range(text, text);
-- DROP FUNCTION IF EXISTS parse_sets_reps_duration(text);

-- Log completion
DO $$
DECLARE
  parsed_count integer;
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count FROM exercises WHERE sets_reps_duration IS NOT NULL;
  SELECT COUNT(*) INTO parsed_count FROM exercises WHERE exercise_type IS NOT NULL;
  
  RAISE NOTICE 'Migration completed: Parsed % out of % exercises with sets_reps_duration data', 
    parsed_count, total_count;
END $$;
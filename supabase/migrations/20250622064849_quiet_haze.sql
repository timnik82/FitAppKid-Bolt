/*
# Progression System for Children's Fitness App

## Overview
This migration creates a comprehensive progression system with:
1. Exercise prerequisites (unlock system)
2. Adventure paths (themed exercise journeys)
3. Structured difficulty progression
4. Multi-path exercise assignments

## New Tables
1. **exercise_prerequisites** - Exercise unlock requirements
2. **adventure_paths** - Themed exercise journeys
3. **path_exercises** - Exercises within adventure paths
4. **user_path_progress** - User progress through adventure paths

## Features
- Beginner → Intermediate → Advanced progression
- Prerequisites ensure proper skill building
- Multiple themed paths for variety
- Progress tracking per path
*/

-- EXERCISE PREREQUISITES TABLE
-- Defines which exercises must be completed before others unlock
CREATE TABLE IF NOT EXISTS exercise_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  prerequisite_exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  minimum_completions integer DEFAULT 1,
  minimum_rating integer DEFAULT 3, -- Minimum fun/effort rating to unlock
  created_at timestamptz DEFAULT now(),
  UNIQUE(exercise_id, prerequisite_exercise_id)
);

-- ADVENTURE PATHS TABLE
-- Themed journeys that group exercises into coherent learning experiences
CREATE TABLE IF NOT EXISTS adventure_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  theme text NOT NULL, -- 'strength', 'balance', 'coordination', 'flexibility', etc.
  difficulty_level text CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
  estimated_weeks integer DEFAULT 4,
  total_exercises integer DEFAULT 0, -- Auto-calculated
  unlock_criteria jsonb DEFAULT '{"completed_paths": 0}'::jsonb,
  reward_points integer DEFAULT 200,
  icon text DEFAULT 'map',
  color_hex text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- PATH EXERCISES TABLE
-- Links exercises to adventure paths with progression order
CREATE TABLE IF NOT EXISTS path_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES adventure_paths(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  week_number integer DEFAULT 1,
  is_required boolean DEFAULT true,
  unlock_after_exercise_id uuid REFERENCES exercises(id), -- Previous exercise in path
  points_reward integer DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  UNIQUE(path_id, exercise_id),
  UNIQUE(path_id, sequence_order)
);

-- USER PATH PROGRESS TABLE
-- Tracks user progress through adventure paths
CREATE TABLE IF NOT EXISTS user_path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES adventure_paths(id) ON DELETE CASCADE,
  status text CHECK (status IN ('locked', 'available', 'in_progress', 'completed')) DEFAULT 'locked',
  current_week integer DEFAULT 1,
  exercises_completed integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  progress_percentage decimal(5,2) DEFAULT 0.00,
  started_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, path_id)
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_exercise_prerequisites_exercise ON exercise_prerequisites(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_prerequisites_prereq ON exercise_prerequisites(prerequisite_exercise_id);
CREATE INDEX IF NOT EXISTS idx_path_exercises_path ON path_exercises(path_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_path_exercises_exercise ON path_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_path_progress_user ON user_path_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_path_progress_path ON user_path_progress(path_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE exercise_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_path_progress ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Exercise prerequisites (read-only for authenticated users)
CREATE POLICY "Authenticated users can read exercise prerequisites"
  ON exercise_prerequisites FOR SELECT TO authenticated USING (true);

-- Adventure paths (read-only for authenticated users)
CREATE POLICY "Authenticated users can read adventure paths"
  ON adventure_paths FOR SELECT TO authenticated USING (is_active = true);

-- Path exercises (read-only for authenticated users)
CREATE POLICY "Authenticated users can read path exercises"
  ON path_exercises FOR SELECT TO authenticated USING (true);

-- User path progress (users can manage their own, parents can view children's)
CREATE POLICY "Users can manage own path progress"
  ON user_path_progress
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view children path progress"
  ON user_path_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = user_path_progress.user_id
      AND pcr.active = true
    )
  );

-- FUNCTIONS for automatic calculations

-- Function to update total_exercises count in adventure_paths
CREATE OR REPLACE FUNCTION update_path_exercise_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE adventure_paths 
    SET total_exercises = (
      SELECT COUNT(*) FROM path_exercises WHERE path_id = NEW.path_id
    )
    WHERE id = NEW.path_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE adventure_paths 
    SET total_exercises = (
      SELECT COUNT(*) FROM path_exercises WHERE path_id = OLD.path_id
    )
    WHERE id = OLD.path_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update exercise counts
CREATE TRIGGER update_path_exercise_count_trigger
  AFTER INSERT OR DELETE ON path_exercises
  FOR EACH ROW EXECUTE FUNCTION update_path_exercise_count();

-- Function to update user path progress percentage
CREATE OR REPLACE FUNCTION update_user_path_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_exercises_in_path integer;
  completed_exercises integer;
  new_percentage decimal(5,2);
BEGIN
  -- Get total exercises in the path
  SELECT total_exercises INTO total_exercises_in_path
  FROM adventure_paths WHERE id = NEW.path_id;
  
  -- Count completed exercises for this user in this path
  SELECT COUNT(DISTINCT pe.exercise_id) INTO completed_exercises
  FROM path_exercises pe
  JOIN exercise_sessions es ON pe.exercise_id = es.exercise_id
  WHERE pe.path_id = NEW.path_id 
  AND es.user_id = NEW.user_id;
  
  -- Calculate percentage
  IF total_exercises_in_path > 0 THEN
    new_percentage := (completed_exercises::decimal / total_exercises_in_path) * 100;
  ELSE
    new_percentage := 0;
  END IF;
  
  -- Update the record
  NEW.exercises_completed := completed_exercises;
  NEW.progress_percentage := new_percentage;
  
  -- Update status based on progress
  IF new_percentage >= 100 THEN
    NEW.status := 'completed';
    NEW.completed_at := now();
  ELSIF new_percentage > 0 THEN
    NEW.status := 'in_progress';
    IF NEW.started_at IS NULL THEN
      NEW.started_at := now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update progress
CREATE TRIGGER update_user_path_progress_trigger
  BEFORE UPDATE ON user_path_progress
  FOR EACH ROW EXECUTE FUNCTION update_user_path_progress();

-- SEED DATA: Create adventure paths with structured progression

DO $$
DECLARE
    -- Path IDs
    foundation_path_id uuid;
    strength_path_id uuid;
    balance_path_id uuid;
    flexibility_path_id uuid;
    coordination_path_id uuid;
    advanced_path_id uuid;
    
    -- Exercise IDs (we'll get these from existing exercises)
    bear_crawl_id uuid;
    arm_circles_id uuid;
    squat_id uuid;
    plank_id uuid;
    glute_bridge_id uuid;
    lunges_id uuid;
    single_leg_balance_id uuid;
    wall_pushups_id uuid;
    bird_dog_id uuid;
    calf_raises_id uuid;
BEGIN
    -- Get existing exercise IDs
    SELECT id INTO bear_crawl_id FROM exercises WHERE name_en = 'Animal Walks (Bear Crawl Race)';
    SELECT id INTO arm_circles_id FROM exercises WHERE name_en = 'Arm Circles';
    SELECT id INTO squat_id FROM exercises WHERE name_en = 'Bodyweight Squat';
    SELECT id INTO plank_id FROM exercises WHERE name_en = 'Plank';
    SELECT id INTO glute_bridge_id FROM exercises WHERE name_en = 'Glute Bridge';
    SELECT id INTO lunges_id FROM exercises WHERE name_en = 'Lunges';
    SELECT id INTO single_leg_balance_id FROM exercises WHERE name_en = 'Single Leg Balance';
    SELECT id INTO wall_pushups_id FROM exercises WHERE name_en = 'Wall Push-ups';
    SELECT id INTO bird_dog_id FROM exercises WHERE name_en = 'Bird Dog';
    SELECT id INTO calf_raises_id FROM exercises WHERE name_en = 'Calf Raises';

    -- 1. FOUNDATION PATH (Beginner)
    INSERT INTO adventure_paths (title, description, theme, difficulty_level, estimated_weeks, unlock_criteria, reward_points, icon, color_hex, display_order)
    VALUES (
        'Foundation Builder',
        'Master the basics! Learn fundamental movements that will prepare you for all future adventures.',
        'foundation',
        'Beginner',
        3,
        '{"completed_paths": 0}'::jsonb,
        150,
        'home',
        '#10B981',
        1
    ) RETURNING id INTO foundation_path_id;

    -- Add exercises to Foundation Path
    IF bear_crawl_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward)
        VALUES (foundation_path_id, bear_crawl_id, 1, 1, 15);
    END IF;
    
    IF arm_circles_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward)
        VALUES (foundation_path_id, arm_circles_id, 2, 1, 10);
    END IF;
    
    IF squat_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward, unlock_after_exercise_id)
        VALUES (foundation_path_id, squat_id, 3, 2, 20, arm_circles_id);
    END IF;
    
    IF glute_bridge_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward, unlock_after_exercise_id)
        VALUES (foundation_path_id, glute_bridge_id, 4, 2, 15, squat_id);
    END IF;

    -- 2. STRENGTH PATH (Intermediate)
    INSERT INTO adventure_paths (title, description, theme, difficulty_level, estimated_weeks, unlock_criteria, reward_points, icon, color_hex, display_order)
    VALUES (
        'Strength Explorer',
        'Build powerful muscles! Develop strength through progressive challenges.',
        'strength',
        'Intermediate',
        4,
        '{"completed_paths": 1}'::jsonb,
        250,
        'dumbbell',
        '#F59E0B',
        2
    ) RETURNING id INTO strength_path_id;

    -- Add exercises to Strength Path
    IF plank_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward)
        VALUES (strength_path_id, plank_id, 1, 1, 25);
    END IF;
    
    IF wall_pushups_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward, unlock_after_exercise_id)
        VALUES (strength_path_id, wall_pushups_id, 2, 2, 20, plank_id);
    END IF;
    
    IF lunges_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward, unlock_after_exercise_id)
        VALUES (strength_path_id, lunges_id, 3, 3, 30, wall_pushups_id);
    END IF;

    -- 3. BALANCE PATH (Intermediate)
    INSERT INTO adventure_paths (title, description, theme, difficulty_level, estimated_weeks, unlock_criteria, reward_points, icon, color_hex, display_order)
    VALUES (
        'Balance Master',
        'Find your center! Develop incredible balance and stability.',
        'balance',
        'Intermediate',
        3,
        '{"completed_paths": 1}'::jsonb,
        200,
        'target',
        '#8B5CF6',
        3
    ) RETURNING id INTO balance_path_id;

    -- Add exercises to Balance Path
    IF single_leg_balance_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward)
        VALUES (balance_path_id, single_leg_balance_id, 1, 1, 20);
    END IF;
    
    IF bird_dog_id IS NOT NULL THEN
        INSERT INTO path_exercises (path_id, exercise_id, sequence_order, week_number, points_reward, unlock_after_exercise_id)
        VALUES (balance_path_id, bird_dog_id, 2, 2, 25, single_leg_balance_id);
    END IF;

    -- 4. FLEXIBILITY PATH (All levels)
    INSERT INTO adventure_paths (title, description, theme, difficulty_level, estimated_weeks, unlock_criteria, reward_points, icon, color_hex, display_order)
    VALUES (
        'Flexibility Flow',
        'Move like water! Improve flexibility and mobility for better movement.',
        'flexibility',
        'Beginner',
        2,
        '{"completed_paths": 0}'::jsonb,
        100,
        'leaf',
        '#06B6D4',
        4
    ) RETURNING id INTO flexibility_path_id;

    -- 5. COORDINATION PATH (Advanced)
    INSERT INTO adventure_paths (title, description, theme, difficulty_level, estimated_weeks, unlock_criteria, reward_points, icon, color_hex, display_order)
    VALUES (
        'Coordination Champion',
        'Master complex movements! Develop amazing coordination and agility.',
        'coordination',
        'Advanced',
        5,
        '{"completed_paths": 2}'::jsonb,
        350,
        'zap',
        '#EF4444',
        5
    ) RETURNING id INTO coordination_path_id;

    -- 6. ADVANCED ATHLETE PATH (Advanced)
    INSERT INTO adventure_paths (title, description, theme, difficulty_level, estimated_weeks, unlock_criteria, reward_points, icon, color_hex, display_order)
    VALUES (
        'Elite Athlete',
        'Become unstoppable! Master advanced techniques and complex movements.',
        'elite',
        'Advanced',
        6,
        '{"completed_paths": 3}'::jsonb,
        500,
        'crown',
        '#7C3AED',
        6
    ) RETURNING id INTO advanced_path_id;

END $$;

-- CREATE EXERCISE PREREQUISITES for logical progression

DO $$
DECLARE
    squat_id uuid;
    plank_id uuid;
    lunges_id uuid;
    wall_pushups_id uuid;
    bird_dog_id uuid;
    single_leg_balance_id uuid;
BEGIN
    -- Get exercise IDs
    SELECT id INTO squat_id FROM exercises WHERE name_en = 'Bodyweight Squat';
    SELECT id INTO plank_id FROM exercises WHERE name_en = 'Plank';
    SELECT id INTO lunges_id FROM exercises WHERE name_en = 'Lunges';
    SELECT id INTO wall_pushups_id FROM exercises WHERE name_en = 'Wall Push-ups';
    SELECT id INTO bird_dog_id FROM exercises WHERE name_en = 'Bird Dog';
    SELECT id INTO single_leg_balance_id FROM exercises WHERE name_en = 'Single Leg Balance';

    -- Lunges require squats (single leg strength builds on double leg)
    IF squat_id IS NOT NULL AND lunges_id IS NOT NULL THEN
        INSERT INTO exercise_prerequisites (exercise_id, prerequisite_exercise_id, minimum_completions, minimum_rating)
        VALUES (lunges_id, squat_id, 3, 3);
    END IF;

    -- Bird Dog requires plank (core stability progression)
    IF plank_id IS NOT NULL AND bird_dog_id IS NOT NULL THEN
        INSERT INTO exercise_prerequisites (exercise_id, prerequisite_exercise_id, minimum_completions, minimum_rating)
        VALUES (bird_dog_id, plank_id, 2, 3);
    END IF;

    -- Advanced balance requires basic balance
    IF single_leg_balance_id IS NOT NULL AND squat_id IS NOT NULL THEN
        INSERT INTO exercise_prerequisites (exercise_id, prerequisite_exercise_id, minimum_completions, minimum_rating)
        VALUES (single_leg_balance_id, squat_id, 2, 3);
    END IF;

END $$;

-- ADD NEW PROGRESSION-BASED REWARDS
INSERT INTO rewards (title, description, reward_type, icon, rarity, unlock_criteria, points_value) VALUES
('Foundation Graduate', 'Complete the Foundation Builder path!', 'badge', 'graduation-cap', 'common', '{"completed_paths": ["Foundation Builder"]}', 50),
('Strength Seeker', 'Complete the Strength Explorer path!', 'badge', 'muscle', 'rare', '{"completed_paths": ["Strength Explorer"]}', 100),
('Balance Guru', 'Complete the Balance Master path!', 'badge', 'yin-yang', 'rare', '{"completed_paths": ["Balance Master"]}', 100),
('Path Pioneer', 'Complete 3 different adventure paths!', 'trophy', 'map-pin', 'epic', '{"completed_paths": 3}', 200),
('Elite Explorer', 'Complete the Elite Athlete path!', 'trophy', 'star', 'legendary', '{"completed_paths": ["Elite Athlete"]}', 300),
('Prerequisite Pro', 'Unlock 5 exercises by completing prerequisites!', 'badge', 'key', 'rare', '{"unlocked_exercises": 5}', 75),
('Multi-Path Master', 'Be active in 3 paths simultaneously!', 'badge', 'shuffle', 'epic', '{"active_paths": 3}', 150);
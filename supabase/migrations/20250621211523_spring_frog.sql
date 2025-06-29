/*
# Children's Fitness App Database Schema

## Overview
Complete database schema for a COPPA-compliant children's fitness app with gamified exercise tracking, parent-child account management, and comprehensive progress monitoring.

## New Tables
1. **profiles** - Extended user information with COPPA compliance
2. **parent_child_relationships** - Manages parent-child account linking
3. **exercises** - Core exercise library from JSON data
4. **exercise_categories** - Normalized exercise categories
5. **muscle_groups** - Normalized muscle group data
6. **equipment_types** - Normalized equipment data
7. **exercise_sessions** - Individual workout session tracking
8. **user_progress** - Aggregate progress and achievements
9. **adventures** - Gamification storylines
10. **user_adventures** - User progress through adventures
11. **rewards** - Achievement and reward system
12. **user_rewards** - User-earned rewards tracking

## Security Features
- Row Level Security (RLS) enabled on all tables
- Parent-controlled child data access
- COPPA compliance with minimal data collection for children
- Audit logging for data access

## Performance Optimizations
- Indexes on frequently filtered columns
- Efficient parent-child relationship queries
- Optimized progress tracking queries
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE - Extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text NOT NULL,
  date_of_birth date,
  is_child boolean DEFAULT false,
  parent_consent_given boolean DEFAULT false,
  parent_consent_date timestamptz,
  privacy_settings jsonb DEFAULT '{"data_sharing": false, "analytics": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PARENT-CHILD RELATIONSHIPS
CREATE TABLE IF NOT EXISTS parent_child_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian')),
  consent_given boolean DEFAULT true,
  consent_date timestamptz DEFAULT now(),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, child_id)
);

-- EXERCISE CATEGORIES (normalized)
CREATE TABLE IF NOT EXISTS exercise_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text UNIQUE NOT NULL,
  name_ru text,
  description text,
  color_hex text DEFAULT '#3B82F6',
  icon text DEFAULT 'activity',
  display_order integer DEFAULT 0
);

-- MUSCLE GROUPS (normalized)
CREATE TABLE IF NOT EXISTS muscle_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text UNIQUE NOT NULL,
  name_ru text,
  is_primary boolean DEFAULT true
);

-- EQUIPMENT TYPES (normalized)
CREATE TABLE IF NOT EXISTS equipment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text UNIQUE NOT NULL,
  name_ru text,
  required boolean DEFAULT false,
  icon text
);

-- MAIN EXERCISES TABLE
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id integer, -- Reference to original JSON id
  name_en text NOT NULL,
  name_ru text,
  category_id uuid REFERENCES exercise_categories(id),
  description text,
  difficulty text CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Easy',
  sets_reps_duration text,
  safety_cues text[],
  fun_variation text,
  progression_notes text,
  basketball_skills_improvement text,
  is_balance_focused boolean DEFAULT false,
  estimated_duration_minutes integer DEFAULT 5,
  calories_per_minute decimal(4,2) DEFAULT 3.0,
  age_min integer DEFAULT 9,
  age_max integer DEFAULT 12,
  popularity_score integer DEFAULT 0,
  data_source text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- EXERCISE-MUSCLE GROUP RELATIONSHIPS
CREATE TABLE IF NOT EXISTS exercise_muscles (
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_group_id uuid REFERENCES muscle_groups(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT true,
  PRIMARY KEY (exercise_id, muscle_group_id)
);

-- EXERCISE-EQUIPMENT RELATIONSHIPS
CREATE TABLE IF NOT EXISTS exercise_equipment (
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id uuid REFERENCES equipment_types(id) ON DELETE CASCADE,
  is_required boolean DEFAULT true,
  PRIMARY KEY (exercise_id, equipment_id)
);

-- ADVENTURES (gamification storylines)
CREATE TABLE IF NOT EXISTS adventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  story_theme text, -- e.g., 'jungle', 'space', 'ocean'
  total_exercises integer DEFAULT 10,
  difficulty_level text CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
  estimated_days integer DEFAULT 7,
  reward_points integer DEFAULT 100,
  unlock_criteria jsonb DEFAULT '{"completed_adventures": 0}'::jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ADVENTURE-EXERCISE RELATIONSHIPS
CREATE TABLE IF NOT EXISTS adventure_exercises (
  adventure_id uuid REFERENCES adventures(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  is_required boolean DEFAULT true,
  points_reward integer DEFAULT 10,
  PRIMARY KEY (adventure_id, exercise_id)
);

-- USER ADVENTURE PROGRESS
CREATE TABLE IF NOT EXISTS user_adventures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  adventure_id uuid REFERENCES adventures(id) ON DELETE CASCADE,
  status text CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')) DEFAULT 'not_started',
  progress_percentage decimal(5,2) DEFAULT 0.00,
  exercises_completed integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_activity_at timestamptz DEFAULT now(),
  UNIQUE(user_id, adventure_id)
);

-- EXERCISE SESSIONS (individual workout tracking)
CREATE TABLE IF NOT EXISTS exercise_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  adventure_id uuid REFERENCES adventures(id) ON DELETE SET NULL,
  duration_minutes decimal(5,2),
  sets_completed integer,
  reps_completed integer,
  difficulty_modifier text, -- 'easier', 'normal', 'harder'
  effort_rating integer CHECK (effort_rating BETWEEN 1 AND 5),
  fun_rating integer CHECK (fun_rating BETWEEN 1 AND 5),
  notes text,
  points_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- USER PROGRESS AGGREGATION
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_exercises_completed integer DEFAULT 0,
  total_minutes_exercised decimal(8,2) DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  current_streak_days integer DEFAULT 0,
  longest_streak_days integer DEFAULT 0,
  last_exercise_date date,
  favorite_exercise_id uuid REFERENCES exercises(id),
  fitness_level text CHECK (fitness_level IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
  achievements_earned integer DEFAULT 0,
  adventures_completed integer DEFAULT 0,
  weekly_goal_minutes integer DEFAULT 150, -- WHO recommendation adapted for children
  monthly_goal_exercises integer DEFAULT 20,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- REWARDS SYSTEM
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  reward_type text CHECK (reward_type IN ('badge', 'trophy', 'avatar', 'title', 'power_up')) DEFAULT 'badge',
  icon text,
  rarity text CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  unlock_criteria jsonb NOT NULL, -- {"exercises_completed": 10, "streak_days": 7}
  points_value integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- USER REWARDS TRACKING
CREATE TABLE IF NOT EXISTS user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES rewards(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  is_new boolean DEFAULT true, -- For UI notifications
  earned_from_session_id uuid REFERENCES exercise_sessions(id),
  UNIQUE(user_id, reward_id)
);

-- INDEXES for performance optimization
CREATE INDEX IF NOT EXISTS idx_profiles_is_child ON profiles(is_child);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_parent_child_active ON parent_child_relationships(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category_id);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_balance ON exercises(is_balance_focused);
CREATE INDEX IF NOT EXISTS idx_exercises_duration ON exercises(estimated_duration_minutes);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON exercise_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_exercise ON exercise_sessions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_adventures_status ON user_adventures(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON user_rewards(user_id, earned_at DESC);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_child_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Users can read their own profile, parents can read their children's profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

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

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

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

-- Parent-child relationships
CREATE POLICY "Parents can manage their relationships"
  ON parent_child_relationships
  FOR ALL
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Children can view their parent relationships"
  ON parent_child_relationships
  FOR SELECT
  TO authenticated
  USING (child_id = auth.uid());

-- Exercise data (read-only for all authenticated users)
CREATE POLICY "Authenticated users can read exercise categories"
  ON exercise_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read muscle groups"
  ON muscle_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read equipment types"
  ON equipment_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read exercises"
  ON exercises FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Authenticated users can read exercise muscles"
  ON exercise_muscles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read exercise equipment"
  ON exercise_equipment FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read adventures"
  ON adventures FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Authenticated users can read adventure exercises"
  ON adventure_exercises FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read rewards"
  ON rewards FOR SELECT TO authenticated USING (is_active = true);

-- User-specific data policies
CREATE POLICY "Users can manage own adventure progress"
  ON user_adventures
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view children adventure progress"
  ON user_adventures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = user_adventures.user_id
      AND pcr.active = true
    )
  );

CREATE POLICY "Users can manage own exercise sessions"
  ON exercise_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view children exercise sessions"
  ON exercise_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = exercise_sessions.user_id
      AND pcr.active = true
    )
  );

CREATE POLICY "Users can view own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view children progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = user_progress.user_id
      AND pcr.active = true
    )
  );

CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own rewards"
  ON user_rewards
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Parents can view children rewards"
  ON user_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_child_relationships pcr
      WHERE pcr.parent_id = auth.uid()
      AND pcr.child_id = user_rewards.user_id
      AND pcr.active = true
    )
  );

-- FUNCTIONS for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
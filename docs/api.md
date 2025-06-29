# API Documentation

This document provides comprehensive examples for querying the Children's Fitness App database schema.

## Table of Contents

- [Authentication & User Management](#authentication--user-management)
- [Exercise Data Queries](#exercise-data-queries)
- [Progression System](#progression-system)
- [Gamification Features](#gamification-features)
- [Progress Tracking](#progress-tracking)
- [Parent-Child Management](#parent-child-management)
- [Advanced Queries](#advanced-queries)

## Authentication & User Management

### Create User Profile
```sql
-- Create a new user profile (typically done after Supabase Auth signup)
INSERT INTO profiles (id, email, display_name, is_child, privacy_settings)
VALUES (
  auth.uid(),
  'user@example.com',
  'John Doe',
  false,
  '{"data_sharing": false, "analytics": false}'::jsonb
);
```

### Get User Profile
```sql
-- Get current user's profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Get profile with progress summary
SELECT 
  p.*,
  up.total_exercises_completed,
  up.current_streak_days,
  up.total_points_earned
FROM profiles p
LEFT JOIN user_progress up ON p.id = up.user_id
WHERE p.id = auth.uid();
```

### Update User Profile
```sql
-- Update user's display name and privacy settings
UPDATE profiles 
SET 
  display_name = 'New Name',
  privacy_settings = '{"data_sharing": true, "analytics": false}'::jsonb,
  updated_at = now()
WHERE id = auth.uid();
```

## Exercise Data Queries

### Basic Exercise Queries

```sql
-- Get all active exercises with categories
SELECT 
  e.id,
  e.name_en,
  e.difficulty,
  e.exercise_type,
  ec.name_en as category_name,
  e.adventure_points
FROM exercises e
JOIN exercise_categories ec ON e.category_id = ec.id
WHERE e.is_active = true
ORDER BY ec.display_order, e.name_en;
```

### Structured Exercise Data

```sql
-- Find exercises by duration range
SELECT 
  name_en,
  exercise_type,
  min_duration_seconds,
  max_duration_seconds,
  adventure_points
FROM exercises 
WHERE min_duration_seconds >= 30 
  AND max_duration_seconds <= 60
  AND exercise_type IN ('duration', 'hold');

-- Get beginner-friendly exercises (1 set, low reps)
SELECT 
  name_en,
  min_sets,
  max_sets,
  min_reps,
  max_reps,
  difficulty
FROM exercises 
WHERE max_sets = 1 
  AND max_reps <= 10 
  AND difficulty = 'Easy';

-- Find exercises by type with structured data
SELECT 
  name_en,
  exercise_type,
  CASE 
    WHEN min_sets = max_sets THEN min_sets::text || ' set'
    ELSE min_sets::text || '-' || max_sets::text || ' sets'
  END as sets_display,
  CASE 
    WHEN exercise_type = 'reps' THEN min_reps::text || '-' || max_reps::text || ' reps'
    WHEN exercise_type IN ('duration', 'hold') THEN min_duration_seconds::text || '-' || max_duration_seconds::text || ' seconds'
  END as target_display
FROM exercises 
WHERE exercise_type = 'reps' 
  AND is_active = true;
```

### Exercise with Equipment and Muscles

```sql
-- Get exercise with required equipment
SELECT 
  e.name_en,
  array_agg(DISTINCT et.name_en) as equipment_needed,
  array_agg(DISTINCT mg.name_en) as muscles_targeted
FROM exercises e
LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
LEFT JOIN equipment_types et ON ee.equipment_id = et.id
LEFT JOIN exercise_muscles em ON e.id = em.exercise_id
LEFT JOIN muscle_groups mg ON em.muscle_group_id = mg.id
WHERE e.is_active = true
GROUP BY e.id, e.name_en
ORDER BY e.name_en;
```

## Progression System

### Exercise Prerequisites

```sql
-- Get exercises a user can unlock
SELECT 
  e.name_en,
  e.difficulty,
  CASE 
    WHEN ep.exercise_id IS NULL THEN 'Available'
    ELSE 'Locked'
  END as status
FROM exercises e
LEFT JOIN exercise_prerequisites ep ON e.id = ep.exercise_id
WHERE e.is_active = true
  AND (ep.exercise_id IS NULL OR ep.prerequisite_exercise_id IN (
    SELECT DISTINCT exercise_id 
    FROM exercise_sessions 
    WHERE user_id = auth.uid() 
      AND completed_at IS NOT NULL
  ));

-- Check if user meets prerequisites for specific exercise
SELECT 
  e.name_en,
  ep.minimum_completions,
  COUNT(es.id) as user_completions,
  CASE 
    WHEN COUNT(es.id) >= ep.minimum_completions THEN 'Unlocked'
    ELSE 'Locked'
  END as status
FROM exercises e
JOIN exercise_prerequisites ep ON e.id = ep.exercise_id
LEFT JOIN exercise_sessions es ON ep.prerequisite_exercise_id = es.exercise_id 
  AND es.user_id = auth.uid()
WHERE e.id = $1
GROUP BY e.id, e.name_en, ep.minimum_completions;
```

### Adventure Paths

```sql
-- Get all available adventure paths for user
SELECT 
  ap.*,
  CASE 
    WHEN upp.id IS NULL THEN 'locked'
    ELSE upp.status
  END as user_status,
  COALESCE(upp.progress_percentage, 0) as progress
FROM adventure_paths ap
LEFT JOIN user_path_progress upp ON ap.id = upp.path_id 
  AND upp.user_id = auth.uid()
WHERE ap.is_active = true
ORDER BY ap.display_order;

-- Get exercises in a specific path with user progress
SELECT 
  pe.sequence_order,
  pe.week_number,
  e.name_en,
  e.difficulty,
  pe.points_reward,
  CASE 
    WHEN es.id IS NOT NULL THEN 'Completed'
    ELSE 'Not Started'
  END as completion_status
FROM path_exercises pe
JOIN exercises e ON pe.exercise_id = e.id
LEFT JOIN exercise_sessions es ON e.id = es.exercise_id 
  AND es.user_id = auth.uid()
WHERE pe.path_id = $1
ORDER BY pe.sequence_order;
```

## Gamification Features

### Adventures and Rewards

```sql
-- Get user's adventure progress
SELECT 
  a.title,
  a.story_theme,
  a.total_exercises,
  ua.status,
  ua.progress_percentage,
  ua.exercises_completed,
  ua.total_points_earned
FROM adventures a
LEFT JOIN user_adventures ua ON a.id = ua.adventure_id 
  AND ua.user_id = auth.uid()
WHERE a.is_active = true
ORDER BY a.display_order;

-- Get available rewards for user
SELECT 
  r.title,
  r.description,
  r.reward_type,
  r.rarity,
  r.points_value,
  CASE 
    WHEN ur.id IS NOT NULL THEN 'Earned'
    ELSE 'Available'
  END as status
FROM rewards r
LEFT JOIN user_rewards ur ON r.id = ur.reward_id 
  AND ur.user_id = auth.uid()
WHERE r.is_active = true
ORDER BY r.rarity, r.title;
```

### Points and Achievements

```sql
-- Calculate user's total points from different sources
SELECT 
  'Exercise Sessions' as source,
  SUM(points_earned) as points
FROM exercise_sessions 
WHERE user_id = auth.uid()
UNION ALL
SELECT 
  'Adventure Completion' as source,
  SUM(total_points_earned) as points
FROM user_adventures 
WHERE user_id = auth.uid() AND status = 'completed'
UNION ALL
SELECT 
  'Rewards' as source,
  SUM(points_value) as points
FROM user_rewards ur
JOIN rewards r ON ur.reward_id = r.id
WHERE ur.user_id = auth.uid();
```

## Progress Tracking

### Exercise Sessions

```sql
-- Record a new exercise session
INSERT INTO exercise_sessions (
  user_id,
  exercise_id,
  adventure_id,
  duration_minutes,
  sets_completed,
  reps_completed,
  effort_rating,
  fun_rating,
  points_earned
) VALUES (
  auth.uid(),
  $1, -- exercise_id
  $2, -- adventure_id (optional)
  $3, -- duration_minutes
  $4, -- sets_completed
  $5, -- reps_completed
  $6, -- effort_rating (1-5)
  $7, -- fun_rating (1-5)
  $8  -- points_earned
);

-- Get user's recent exercise sessions
SELECT 
  es.completed_at,
  e.name_en as exercise_name,
  es.duration_minutes,
  es.points_earned,
  es.fun_rating,
  a.title as adventure_title
FROM exercise_sessions es
JOIN exercises e ON es.exercise_id = e.id
LEFT JOIN adventures a ON es.adventure_id = a.id
WHERE es.user_id = auth.uid()
ORDER BY es.completed_at DESC
LIMIT 10;
```

### User Progress Summary

```sql
-- Get comprehensive user progress
SELECT 
  up.*,
  (
    SELECT COUNT(DISTINCT exercise_id) 
    FROM exercise_sessions 
    WHERE user_id = auth.uid()
  ) as unique_exercises_completed,
  (
    SELECT COUNT(*) 
    FROM user_adventures 
    WHERE user_id = auth.uid() AND status = 'completed'
  ) as adventures_completed,
  (
    SELECT COUNT(*) 
    FROM user_rewards 
    WHERE user_id = auth.uid()
  ) as total_rewards_earned
FROM user_progress up
WHERE up.user_id = auth.uid();

-- Update user progress (typically done by triggers)
UPDATE user_progress 
SET 
  total_exercises_completed = total_exercises_completed + 1,
  total_points_earned = total_points_earned + $1,
  last_exercise_date = CURRENT_DATE,
  updated_at = now()
WHERE user_id = auth.uid();
```

## Parent-Child Management

### Family Relationships

```sql
-- Create parent-child relationship
INSERT INTO parent_child_relationships (
  parent_id,
  child_id,
  relationship_type,
  consent_given,
  consent_date
) VALUES (
  auth.uid(), -- parent
  $1,         -- child_id
  'parent',
  true,
  now()
);

-- Get parent's children
SELECT 
  p.id,
  p.display_name,
  p.date_of_birth,
  pcr.relationship_type,
  pcr.consent_date,
  up.total_exercises_completed,
  up.current_streak_days
FROM parent_child_relationships pcr
JOIN profiles p ON pcr.child_id = p.id
LEFT JOIN user_progress up ON p.id = up.user_id
WHERE pcr.parent_id = auth.uid() 
  AND pcr.active = true;

-- Get child's progress for parent
SELECT 
  es.completed_at,
  e.name_en,
  es.duration_minutes,
  es.fun_rating,
  es.points_earned
FROM exercise_sessions es
JOIN exercises e ON es.exercise_id = e.id
WHERE es.user_id = $1 -- child_id
  AND EXISTS (
    SELECT 1 FROM parent_child_relationships 
    WHERE parent_id = auth.uid() 
      AND child_id = $1 
      AND active = true
  )
ORDER BY es.completed_at DESC;
```

## Advanced Queries

### Analytics and Insights

```sql
-- Get exercise popularity
SELECT 
  e.name_en,
  COUNT(es.id) as session_count,
  AVG(es.fun_rating) as avg_fun_rating,
  AVG(es.effort_rating) as avg_effort_rating
FROM exercises e
LEFT JOIN exercise_sessions es ON e.id = es.exercise_id
WHERE e.is_active = true
GROUP BY e.id, e.name_en
HAVING COUNT(es.id) > 0
ORDER BY session_count DESC, avg_fun_rating DESC;

-- Get user's exercise patterns
SELECT 
  EXTRACT(DOW FROM completed_at) as day_of_week,
  EXTRACT(HOUR FROM completed_at) as hour_of_day,
  COUNT(*) as session_count
FROM exercise_sessions
WHERE user_id = auth.uid()
  AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY day_of_week, hour_of_day
ORDER BY day_of_week, hour_of_day;
```

### Recommendation Queries

```sql
-- Recommend exercises based on user preferences
SELECT 
  e.name_en,
  e.difficulty,
  e.adventure_points,
  AVG(es.fun_rating) as avg_fun_rating
FROM exercises e
JOIN exercise_sessions es ON e.id = es.exercise_id
WHERE es.user_id = auth.uid()
  AND es.fun_rating >= 4
  AND e.is_active = true
GROUP BY e.id, e.name_en, e.difficulty, e.adventure_points
ORDER BY avg_fun_rating DESC, e.adventure_points DESC
LIMIT 5;

-- Find similar exercises to user's favorites
WITH user_favorites AS (
  SELECT DISTINCT em.muscle_group_id
  FROM exercise_sessions es
  JOIN exercise_muscles em ON es.exercise_id = em.exercise_id
  WHERE es.user_id = auth.uid()
    AND es.fun_rating >= 4
)
SELECT DISTINCT
  e.name_en,
  e.difficulty,
  e.adventure_points
FROM exercises e
JOIN exercise_muscles em ON e.id = em.exercise_id
WHERE em.muscle_group_id IN (SELECT muscle_group_id FROM user_favorites)
  AND e.id NOT IN (
    SELECT DISTINCT exercise_id 
    FROM exercise_sessions 
    WHERE user_id = auth.uid()
  )
  AND e.is_active = true
ORDER BY e.adventure_points DESC
LIMIT 10;
```

## Error Handling

### Common Query Patterns

```sql
-- Safe user data access with RLS
SELECT * FROM profiles 
WHERE id = auth.uid(); -- Always use auth.uid() for current user

-- Check if user can access child data
SELECT * FROM profiles 
WHERE id = $1 -- child_id
  AND (
    id = auth.uid() -- User's own data
    OR EXISTS (
      SELECT 1 FROM parent_child_relationships 
      WHERE parent_id = auth.uid() 
        AND child_id = $1 
        AND active = true
    )
  );

-- Upsert pattern for user progress
INSERT INTO user_progress (user_id, total_exercises_completed)
VALUES (auth.uid(), 1)
ON CONFLICT (user_id) 
DO UPDATE SET 
  total_exercises_completed = user_progress.total_exercises_completed + 1,
  updated_at = now();
```

## Performance Tips

1. **Use indexes effectively**: The schema includes indexes on frequently queried columns
2. **Limit result sets**: Always use `LIMIT` for large datasets
3. **Use EXISTS instead of IN**: For better performance with subqueries
4. **Batch operations**: Group multiple inserts/updates when possible
5. **Use prepared statements**: For repeated queries with parameters

## Security Notes

1. **Row Level Security**: All queries automatically respect RLS policies
2. **Use auth.uid()**: Always reference the current user with `auth.uid()`
3. **Validate input**: Sanitize all user inputs before querying
4. **Parent-child access**: Use the provided patterns for family data access
5. **Privacy compliance**: Remember that this schema is designed for COPPA compliance

For more examples and advanced use cases, refer to the test files in the repository.
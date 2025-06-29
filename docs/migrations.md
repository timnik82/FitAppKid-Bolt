# Database Migration Guide

This guide walks you through setting up the complete database schema for the Children's Fitness App.

## Prerequisites

- Supabase project created
- Supabase CLI installed (optional, for local development)
- PostgreSQL access to your database

## Migration Overview

The database schema is built through 6 sequential migrations:

1. **Initial Schema** - Core tables and relationships
2. **Seed Data** - Sample exercises, categories, and adventures
3. **Duration Fields** - Exercise timing enhancements
4. **COPPA Compliance** - Privacy and gamification features
5. **Progression System** - Adventure paths and prerequisites
6. **Structure Parsing** - Intelligent exercise data extraction

## Step-by-Step Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. **Access SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor" in the sidebar

2. **Run Migrations in Order**
   
   Copy and paste each migration file content into the SQL editor and run them in this exact order:

   **Migration 1: Initial Schema**
   ```sql
   -- Copy content from supabase/migrations/20250621211523_spring_frog.sql
   ```

   **Migration 2: Seed Data**
   ```sql
   -- Copy content from supabase/migrations/20250621211632_winter_sky.sql
   ```

   **Migration 3: Duration Fields**
   ```sql
   -- Copy content from supabase/migrations/20250622063608_damp_surf.sql
   ```

   **Migration 4: COPPA Compliance**
   ```sql
   -- Copy content from supabase/migrations/20250622064655_pale_art.sql
   ```

   **Migration 5: Progression System**
   ```sql
   -- Copy content from supabase/migrations/20250622064849_quiet_haze.sql
   ```

   **Migration 6: Structure Parsing**
   ```sql
   -- Copy content from supabase/migrations/20250628211740_sparkling_beacon.sql
   ```

### Option 2: Using Supabase CLI

1. **Initialize Supabase locally**
   ```bash
   supabase init
   ```

2. **Link to your project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Apply migrations**
   ```bash
   supabase db push
   ```

## Verification Steps

After running all migrations, verify the setup:

### 1. Check Table Creation
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- adventure_exercises
- adventure_paths
- adventures
- equipment_types
- exercise_categories
- exercise_equipment
- exercise_muscles
- exercise_prerequisites
- exercise_sessions
- exercises
- muscle_groups
- parent_child_relationships
- path_exercises
- profiles
- rewards
- user_adventures
- user_path_progress
- user_progress
- user_rewards

### 2. Verify Row Level Security
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

All tables should have RLS enabled.

### 3. Check Sample Data
```sql
-- Verify exercise categories
SELECT name_en FROM exercise_categories ORDER BY display_order;

-- Verify sample exercises
SELECT name_en, exercise_type, min_sets, max_sets 
FROM exercises 
WHERE min_sets IS NOT NULL 
LIMIT 5;

-- Verify adventures
SELECT title, difficulty_level FROM adventures ORDER BY display_order;
```

### 4. Test Structured Data Parsing
```sql
-- Check parsed exercise data
SELECT 
  name_en,
  exercise_type,
  min_sets,
  max_sets,
  min_reps,
  max_reps,
  min_duration_seconds,
  max_duration_seconds
FROM exercises 
WHERE exercise_type IS NOT NULL
LIMIT 5;
```

## Common Issues and Solutions

### Issue 1: Permission Denied
**Error**: `permission denied for schema public`

**Solution**: Ensure you're running migrations as a database owner or with sufficient privileges.

### Issue 2: Function Already Exists
**Error**: `function "function_name" already exists`

**Solution**: This is normal for re-running migrations. The `CREATE OR REPLACE FUNCTION` statements handle this.

### Issue 3: Missing Extensions
**Error**: `extension "uuid-ossp" does not exist`

**Solution**: Enable the extension manually:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Issue 4: RLS Policy Conflicts
**Error**: `policy "policy_name" already exists`

**Solution**: Drop existing policies before re-running:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

## Post-Migration Setup

### 1. Create Your First User Profile
```sql
-- This would typically be done through your application
INSERT INTO profiles (id, email, display_name, is_child)
VALUES (
  auth.uid(), -- Your user ID from Supabase Auth
  'parent@example.com',
  'Parent User',
  false
);
```

### 2. Test Parent-Child Relationship
```sql
-- Create a child profile (in your application)
-- Then link them
INSERT INTO parent_child_relationships (parent_id, child_id, consent_given)
VALUES (
  'parent-uuid',
  'child-uuid',
  true
);
```

### 3. Initialize User Progress
```sql
-- Create initial progress record
INSERT INTO user_progress (user_id)
VALUES ('user-uuid');
```

## Rollback Procedures

If you need to rollback migrations:

### Complete Reset
```sql
-- WARNING: This will delete all data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Selective Rollback
For specific features, you can drop individual tables:

```sql
-- Remove progression system
DROP TABLE IF EXISTS user_path_progress CASCADE;
DROP TABLE IF EXISTS path_exercises CASCADE;
DROP TABLE IF EXISTS adventure_paths CASCADE;
DROP TABLE IF EXISTS exercise_prerequisites CASCADE;

-- Remove structured parsing
ALTER TABLE exercises DROP COLUMN IF EXISTS min_sets;
ALTER TABLE exercises DROP COLUMN IF EXISTS max_sets;
-- ... etc
```

## Performance Optimization

After migration, consider these optimizations:

### 1. Analyze Tables
```sql
ANALYZE;
```

### 2. Update Statistics
```sql
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;
```

### 3. Check Index Usage
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Next Steps

1. **Set up your application** to connect to the database
2. **Configure authentication** with Supabase Auth
3. **Test RLS policies** with different user roles
4. **Import your exercise data** if you have additional content
5. **Customize adventures and rewards** for your specific use case

## Support

If you encounter issues during migration:

1. Check the Supabase logs in your dashboard
2. Verify your database permissions
3. Ensure migrations are run in the correct order
4. Review the error messages for specific table/column conflicts

For additional help, refer to the [Supabase documentation](https://supabase.com/docs) or open an issue in this repository.
/*
# Database Schema Validation Tests

This file contains SQL tests to validate the database schema integrity,
constraints, and relationships.
*/

-- Test 1: Verify all required tables exist
DO $$
DECLARE
    expected_tables text[] := ARRAY[
        'profiles', 'parent_child_relationships', 'exercise_categories',
        'muscle_groups', 'equipment_types', 'exercises', 'exercise_muscles',
        'exercise_equipment', 'exercise_prerequisites', 'adventures',
        'adventure_exercises', 'adventure_paths', 'path_exercises',
        'user_adventures', 'user_path_progress', 'exercise_sessions',
        'user_progress', 'rewards', 'user_rewards'
    ];
    missing_tables text[] := '{}';
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = table_name
        ) THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: All % required tables exist', array_length(expected_tables, 1);
END $$;

-- Test 2: Verify RLS is enabled on all tables
DO $$
DECLARE
    table_record RECORD;
    tables_without_rls text[] := '{}';
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' 
            AND c.relname = table_record.tablename
            AND c.relrowsecurity = true
        ) THEN
            tables_without_rls := array_append(tables_without_rls, table_record.tablename);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE EXCEPTION 'Tables without RLS: %', array_to_string(tables_without_rls, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: RLS enabled on all tables';
END $$;

-- Test 3: Verify foreign key constraints
DO $$
DECLARE
    expected_fks RECORD;
    fk_count integer;
BEGIN
    -- Check profiles -> auth.users
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'profiles' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'id';
    
    IF fk_count = 0 THEN
        RAISE EXCEPTION 'Missing FK: profiles.id -> auth.users.id';
    END IF;
    
    -- Check parent_child_relationships
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'parent_child_relationships' 
    AND tc.constraint_type = 'FOREIGN KEY';
    
    IF fk_count < 2 THEN
        RAISE EXCEPTION 'Missing FKs in parent_child_relationships (expected 2, found %)', fk_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Foreign key constraints verified';
END $$;

-- Test 4: Verify check constraints
DO $$
BEGIN
    -- Test difficulty constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%difficulty_check%'
    ) THEN
        RAISE EXCEPTION 'Missing difficulty check constraint on exercises';
    END IF;
    
    -- Test rating constraints
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%fun_rating_check%'
    ) THEN
        RAISE EXCEPTION 'Missing fun_rating check constraint';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%effort_rating_check%'
    ) THEN
        RAISE EXCEPTION 'Missing effort_rating check constraint';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Check constraints verified';
END $$;

-- Test 5: Verify structured data constraints
DO $$
BEGIN
    -- Test sets range constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'check_sets_range'
    ) THEN
        RAISE EXCEPTION 'Missing check_sets_range constraint';
    END IF;
    
    -- Test reps range constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'check_reps_range'
    ) THEN
        RAISE EXCEPTION 'Missing check_reps_range constraint';
    END IF;
    
    -- Test duration range constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints
        WHERE constraint_name = 'check_duration_range'
    ) THEN
        RAISE EXCEPTION 'Missing check_duration_range constraint';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Structured data constraints verified';
END $$;

-- Test 6: Verify indexes exist for performance
DO $$
DECLARE
    expected_indexes text[] := ARRAY[
        'idx_profiles_is_child',
        'idx_exercises_category',
        'idx_exercises_difficulty',
        'idx_sessions_user_date',
        'idx_user_progress_user',
        'idx_exercise_prerequisites_exercise',
        'idx_path_exercises_path'
    ];
    missing_indexes text[] := '{}';
    index_name text;
BEGIN
    FOREACH index_name IN ARRAY expected_indexes
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' AND indexname = index_name
        ) THEN
            missing_indexes := array_append(missing_indexes, index_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_indexes, 1) > 0 THEN
        RAISE EXCEPTION 'Missing indexes: %', array_to_string(missing_indexes, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: All required indexes exist';
END $$;

-- Test 7: Verify no prohibited COPPA data fields
DO $$
DECLARE
    prohibited_columns text[] := ARRAY[
        'weight', 'height', 'bmi', 'body_fat', 'heart_rate',
        'blood_pressure', 'calories_burned', 'medical_condition',
        'real_name', 'full_name', 'address', 'phone_number', 'ssn'
    ];
    found_columns text[] := '{}';
    col_name text;
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        FOREACH col_name IN ARRAY prohibited_columns
        LOOP
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = table_record.table_name
                AND column_name = col_name
            ) THEN
                found_columns := array_append(found_columns, 
                    table_record.table_name || '.' || col_name);
            END IF;
        END LOOP;
    END LOOP;
    
    IF array_length(found_columns, 1) > 0 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Found prohibited columns: %', 
            array_to_string(found_columns, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: No prohibited COPPA data fields found';
END $$;

-- Test 8: Verify trigger functions exist
DO $$
DECLARE
    expected_functions text[] := ARRAY[
        'update_updated_at_column',
        'update_path_exercise_count',
        'update_user_path_progress'
    ];
    missing_functions text[] := '{}';
    func_name text;
BEGIN
    FOREACH func_name IN ARRAY expected_functions
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public' AND routine_name = func_name
        ) THEN
            missing_functions := array_append(missing_functions, func_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE EXCEPTION 'Missing functions: %', array_to_string(missing_functions, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: All required trigger functions exist';
END $$;

RAISE NOTICE '🎉 ALL DATABASE SCHEMA VALIDATION TESTS PASSED';
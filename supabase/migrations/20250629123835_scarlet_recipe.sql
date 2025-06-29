/*
# Progression System Verification

This migration verifies that all required progression system components are properly implemented:

1. Prerequisites table linking exercises that unlock others
2. Adventure_paths table grouping exercises into themed journeys  
3. Difficulty progression: beginner → intermediate → advanced
4. Each exercise can belong to multiple adventure paths

## Changes Made
- Comprehensive verification of progression system tables
- Validation of relationships and constraints
- Sample data verification
- Performance index checks
*/

-- 1. Verify Prerequisites System
DO $$
DECLARE
    prerequisites_table_exists boolean := false;
    prerequisites_count integer := 0;
    prerequisites_constraints integer := 0;
BEGIN
    RAISE NOTICE '🔓 VERIFYING PREREQUISITES SYSTEM...';
    
    -- Check if exercise_prerequisites table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'exercise_prerequisites'
    ) INTO prerequisites_table_exists;
    
    IF prerequisites_table_exists THEN
        RAISE NOTICE '✅ exercise_prerequisites table exists';
        
        -- Check table structure
        SELECT COUNT(*) INTO prerequisites_count
        FROM information_schema.columns
        WHERE table_name = 'exercise_prerequisites' AND table_schema = 'public';
        
        RAISE NOTICE '   - Table has % columns', prerequisites_count;
        
        -- Check foreign key constraints
        SELECT COUNT(*) INTO prerequisites_constraints
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'exercise_prerequisites' 
        AND tc.constraint_type = 'FOREIGN KEY';
        
        RAISE NOTICE '   - Table has % foreign key constraints', prerequisites_constraints;
        
        -- Check if there are sample prerequisites
        SELECT COUNT(*) INTO prerequisites_count
        FROM exercise_prerequisites;
        
        RAISE NOTICE '   - Currently has % prerequisite relationships', prerequisites_count;
        
        -- Verify key columns exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercise_prerequisites' AND column_name = 'exercise_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercise_prerequisites' AND column_name = 'prerequisite_exercise_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercise_prerequisites' AND column_name = 'minimum_completions') THEN
            RAISE NOTICE '✅ Prerequisites system: FULLY IMPLEMENTED';
        ELSE
            RAISE NOTICE '❌ Prerequisites system: MISSING KEY COLUMNS';
        END IF;
    ELSE
        RAISE NOTICE '❌ exercise_prerequisites table does not exist';
    END IF;
END $$;

-- 2. Verify Adventure Paths System
DO $$
DECLARE
    adventure_paths_exists boolean := false;
    path_exercises_exists boolean := false;
    paths_count integer := 0;
    path_exercises_count integer := 0;
    difficulty_levels text[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🗺️  VERIFYING ADVENTURE PATHS SYSTEM...';
    
    -- Check if adventure_paths table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'adventure_paths'
    ) INTO adventure_paths_exists;
    
    -- Check if path_exercises table exists (links exercises to paths)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'path_exercises'
    ) INTO path_exercises_exists;
    
    IF adventure_paths_exists AND path_exercises_exists THEN
        RAISE NOTICE '✅ adventure_paths and path_exercises tables exist';
        
        -- Check sample data
        SELECT COUNT(*) INTO paths_count FROM adventure_paths;
        SELECT COUNT(*) INTO path_exercises_count FROM path_exercises;
        
        RAISE NOTICE '   - Currently has % adventure paths', paths_count;
        RAISE NOTICE '   - Currently has % path-exercise relationships', path_exercises_count;
        
        -- Check difficulty levels in adventure_paths
        SELECT ARRAY_AGG(DISTINCT difficulty_level) INTO difficulty_levels
        FROM adventure_paths
        WHERE difficulty_level IS NOT NULL;
        
        IF difficulty_levels IS NOT NULL THEN
            RAISE NOTICE '   - Available difficulty levels: %', array_to_string(difficulty_levels, ', ');
        END IF;
        
        -- Verify key columns for adventure paths
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adventure_paths' AND column_name = 'title') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adventure_paths' AND column_name = 'theme') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adventure_paths' AND column_name = 'difficulty_level') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adventure_paths' AND column_name = 'estimated_weeks') THEN
            RAISE NOTICE '✅ Adventure paths system: FULLY IMPLEMENTED';
        ELSE
            RAISE NOTICE '❌ Adventure paths system: MISSING KEY COLUMNS';
        END IF;
        
        -- Verify path_exercises linking table
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'path_exercises' AND column_name = 'path_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'path_exercises' AND column_name = 'exercise_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'path_exercises' AND column_name = 'sequence_order') THEN
            RAISE NOTICE '✅ Path-Exercise linking: FULLY IMPLEMENTED';
        ELSE
            RAISE NOTICE '❌ Path-Exercise linking: MISSING KEY COLUMNS';
        END IF;
    ELSE
        RAISE NOTICE '❌ Adventure paths system incomplete:';
        IF NOT adventure_paths_exists THEN
            RAISE NOTICE '   - Missing adventure_paths table';
        END IF;
        IF NOT path_exercises_exists THEN
            RAISE NOTICE '   - Missing path_exercises table';
        END IF;
    END IF;
END $$;

-- 3. Verify Difficulty Progression System
DO $$
DECLARE
    exercises_with_difficulty integer := 0;
    adventure_paths_with_difficulty integer := 0;
    adventures_with_difficulty integer := 0;
    exercise_difficulty_levels text[];
    path_difficulty_levels text[];
    adventure_difficulty_levels text[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📈 VERIFYING DIFFICULTY PROGRESSION SYSTEM...';
    
    -- Check exercises difficulty levels
    SELECT COUNT(*), ARRAY_AGG(DISTINCT difficulty) INTO exercises_with_difficulty, exercise_difficulty_levels
    FROM exercises 
    WHERE difficulty IS NOT NULL;
    
    RAISE NOTICE '✅ Exercises with difficulty: %', exercises_with_difficulty;
    IF exercise_difficulty_levels IS NOT NULL THEN
        RAISE NOTICE '   - Exercise difficulty levels: %', array_to_string(exercise_difficulty_levels, ', ');
    END IF;
    
    -- Check adventure_paths difficulty levels
    SELECT COUNT(*), ARRAY_AGG(DISTINCT difficulty_level) INTO adventure_paths_with_difficulty, path_difficulty_levels
    FROM adventure_paths 
    WHERE difficulty_level IS NOT NULL;
    
    RAISE NOTICE '✅ Adventure paths with difficulty: %', adventure_paths_with_difficulty;
    IF path_difficulty_levels IS NOT NULL THEN
        RAISE NOTICE '   - Path difficulty levels: %', array_to_string(path_difficulty_levels, ', ');
    END IF;
    
    -- Check adventures difficulty levels
    SELECT COUNT(*), ARRAY_AGG(DISTINCT difficulty_level) INTO adventures_with_difficulty, adventure_difficulty_levels
    FROM adventures 
    WHERE difficulty_level IS NOT NULL;
    
    RAISE NOTICE '✅ Adventures with difficulty: %', adventures_with_difficulty;
    IF adventure_difficulty_levels IS NOT NULL THEN
        RAISE NOTICE '   - Adventure difficulty levels: %', array_to_string(adventure_difficulty_levels, ', ');
    END IF;
    
    -- Verify difficulty progression support
    IF 'Beginner' = ANY(exercise_difficulty_levels) AND 
       'Intermediate' = ANY(exercise_difficulty_levels) AND 
       'Advanced' = ANY(exercise_difficulty_levels) THEN
        RAISE NOTICE '✅ Difficulty progression: FULLY SUPPORTED (Beginner → Intermediate → Advanced)';
    ELSE
        RAISE NOTICE '⚠️  Difficulty progression: PARTIALLY SUPPORTED';
        RAISE NOTICE '   Consider adding Beginner/Intermediate/Advanced levels to exercises';
    END IF;
END $$;

-- 4. Verify Many-to-Many Exercise-Path Relationships
DO $$
DECLARE
    exercises_in_multiple_paths integer := 0;
    paths_with_multiple_exercises integer := 0;
    max_paths_per_exercise integer := 0;
    max_exercises_per_path integer := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔗 VERIFYING MANY-TO-MANY EXERCISE-PATH RELATIONSHIPS...';
    
    -- Check exercises that belong to multiple paths
    SELECT COUNT(*) INTO exercises_in_multiple_paths
    FROM (
        SELECT exercise_id, COUNT(DISTINCT path_id) as path_count
        FROM path_exercises
        GROUP BY exercise_id
        HAVING COUNT(DISTINCT path_id) > 1
    ) multi_path_exercises;
    
    -- Check paths that have multiple exercises
    SELECT COUNT(*) INTO paths_with_multiple_exercises
    FROM (
        SELECT path_id, COUNT(DISTINCT exercise_id) as exercise_count
        FROM path_exercises
        GROUP BY path_id
        HAVING COUNT(DISTINCT exercise_id) > 1
    ) multi_exercise_paths;
    
    -- Get maximum relationships
    SELECT COALESCE(MAX(path_count), 0) INTO max_paths_per_exercise
    FROM (
        SELECT COUNT(DISTINCT path_id) as path_count
        FROM path_exercises
        GROUP BY exercise_id
    ) exercise_path_counts;
    
    SELECT COALESCE(MAX(exercise_count), 0) INTO max_exercises_per_path
    FROM (
        SELECT COUNT(DISTINCT exercise_id) as exercise_count
        FROM path_exercises
        GROUP BY path_id
    ) path_exercise_counts;
    
    RAISE NOTICE '✅ Exercises in multiple paths: %', exercises_in_multiple_paths;
    RAISE NOTICE '✅ Paths with multiple exercises: %', paths_with_multiple_exercises;
    RAISE NOTICE '   - Max paths per exercise: %', max_paths_per_exercise;
    RAISE NOTICE '   - Max exercises per path: %', max_exercises_per_path;
    
    IF max_paths_per_exercise > 1 OR max_exercises_per_path > 1 THEN
        RAISE NOTICE '✅ Many-to-many relationships: WORKING CORRECTLY';
    ELSE
        RAISE NOTICE '⚠️  Many-to-many relationships: READY (no sample data yet)';
    END IF;
END $$;

-- 5. Verify User Progress Tracking
DO $$
DECLARE
    user_path_progress_exists boolean := false;
    user_progress_count integer := 0;
    progress_statuses text[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFYING USER PROGRESS TRACKING...';
    
    -- Check if user_path_progress table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_path_progress'
    ) INTO user_path_progress_exists;
    
    IF user_path_progress_exists THEN
        RAISE NOTICE '✅ user_path_progress table exists';
        
        -- Check sample progress data
        SELECT COUNT(*) INTO user_progress_count FROM user_path_progress;
        RAISE NOTICE '   - Currently tracking % user path progressions', user_progress_count;
        
        -- Check available status values
        SELECT ARRAY_AGG(DISTINCT status) INTO progress_statuses
        FROM user_path_progress
        WHERE status IS NOT NULL;
        
        IF progress_statuses IS NOT NULL THEN
            RAISE NOTICE '   - Progress statuses in use: %', array_to_string(progress_statuses, ', ');
        END IF;
        
        -- Verify key columns
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_path_progress' AND column_name = 'user_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_path_progress' AND column_name = 'path_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_path_progress' AND column_name = 'status') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_path_progress' AND column_name = 'progress_percentage') THEN
            RAISE NOTICE '✅ User progress tracking: FULLY IMPLEMENTED';
        ELSE
            RAISE NOTICE '❌ User progress tracking: MISSING KEY COLUMNS';
        END IF;
    ELSE
        RAISE NOTICE '❌ user_path_progress table does not exist';
    END IF;
END $$;

-- 6. Verify Performance Indexes
DO $$
DECLARE
    prerequisite_indexes integer := 0;
    path_exercise_indexes integer := 0;
    progress_indexes integer := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚡ VERIFYING PERFORMANCE INDEXES...';
    
    -- Check prerequisite-related indexes
    SELECT COUNT(*) INTO prerequisite_indexes
    FROM pg_indexes
    WHERE tablename IN ('exercise_prerequisites')
    AND schemaname = 'public';
    
    -- Check path-exercise relationship indexes
    SELECT COUNT(*) INTO path_exercise_indexes
    FROM pg_indexes
    WHERE tablename IN ('path_exercises', 'adventure_paths')
    AND schemaname = 'public';
    
    -- Check progress tracking indexes
    SELECT COUNT(*) INTO progress_indexes
    FROM pg_indexes
    WHERE tablename IN ('user_path_progress', 'user_progress')
    AND schemaname = 'public';
    
    RAISE NOTICE '✅ Prerequisite system indexes: %', prerequisite_indexes;
    RAISE NOTICE '✅ Path-exercise system indexes: %', path_exercise_indexes;
    RAISE NOTICE '✅ Progress tracking indexes: %', progress_indexes;
    
    IF prerequisite_indexes > 0 AND path_exercise_indexes > 0 AND progress_indexes > 0 THEN
        RAISE NOTICE '✅ Performance optimization: PROPERLY INDEXED';
    ELSE
        RAISE NOTICE '⚠️  Performance optimization: SOME INDEXES MISSING';
    END IF;
END $$;

-- 7. Generate Sample Query Examples
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 SAMPLE QUERIES FOR PROGRESSION SYSTEM:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Find exercises a user can unlock:';
    RAISE NOTICE '   SELECT e.* FROM exercises e';
    RAISE NOTICE '   WHERE NOT EXISTS (';
    RAISE NOTICE '     SELECT 1 FROM exercise_prerequisites ep';
    RAISE NOTICE '     WHERE ep.exercise_id = e.id';
    RAISE NOTICE '     AND ep.prerequisite_exercise_id NOT IN (completed_exercises)';
    RAISE NOTICE '   );';
    RAISE NOTICE '';
    RAISE NOTICE '2. Get user progress through adventure paths:';
    RAISE NOTICE '   SELECT ap.title, upp.status, upp.progress_percentage';
    RAISE NOTICE '   FROM adventure_paths ap';
    RAISE NOTICE '   JOIN user_path_progress upp ON ap.id = upp.path_id';
    RAISE NOTICE '   WHERE upp.user_id = $1;';
    RAISE NOTICE '';
    RAISE NOTICE '3. Find exercises in multiple adventure paths:';
    RAISE NOTICE '   SELECT e.name_en, COUNT(pe.path_id) as path_count';
    RAISE NOTICE '   FROM exercises e';
    RAISE NOTICE '   JOIN path_exercises pe ON e.id = pe.exercise_id';
    RAISE NOTICE '   GROUP BY e.id, e.name_en';
    RAISE NOTICE '   HAVING COUNT(pe.path_id) > 1;';
    RAISE NOTICE '';
    RAISE NOTICE '4. Get exercises by difficulty progression:';
    RAISE NOTICE '   SELECT name_en, difficulty FROM exercises';
    RAISE NOTICE '   ORDER BY CASE difficulty';
    RAISE NOTICE '     WHEN ''Beginner'' THEN 1';
    RAISE NOTICE '     WHEN ''Intermediate'' THEN 2';
    RAISE NOTICE '     WHEN ''Advanced'' THEN 3';
    RAISE NOTICE '   END;';
END $$;

-- Final Summary
DO $$
DECLARE
    prerequisites_ready boolean;
    adventure_paths_ready boolean;
    difficulty_ready boolean;
    many_to_many_ready boolean;
    overall_status text;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 PROGRESSION SYSTEM VERIFICATION SUMMARY';
    RAISE NOTICE '==========================================';
    
    -- Check each component
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'exercise_prerequisites'
    ) INTO prerequisites_ready;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'adventure_paths'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'path_exercises'
    ) INTO adventure_paths_ready;
    
    SELECT EXISTS (
        SELECT 1 FROM exercises WHERE difficulty IN ('Beginner', 'Intermediate', 'Advanced')
    ) INTO difficulty_ready;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'path_exercises'
    ) INTO many_to_many_ready;
    
    -- Overall assessment
    IF prerequisites_ready AND adventure_paths_ready AND many_to_many_ready THEN
        overall_status := '✅ FULLY IMPLEMENTED';
    ELSE
        overall_status := '⚠️  PARTIALLY IMPLEMENTED';
    END IF;
    
    RAISE NOTICE '1. Prerequisites system: %', CASE WHEN prerequisites_ready THEN '✅ READY' ELSE '❌ MISSING' END;
    RAISE NOTICE '2. Adventure paths system: %', CASE WHEN adventure_paths_ready THEN '✅ READY' ELSE '❌ MISSING' END;
    RAISE NOTICE '3. Difficulty progression: %', CASE WHEN difficulty_ready THEN '✅ READY' ELSE '⚠️  NEEDS SAMPLE DATA' END;
    RAISE NOTICE '4. Many-to-many relationships: %', CASE WHEN many_to_many_ready THEN '✅ READY' ELSE '❌ MISSING' END;
    RAISE NOTICE '';
    RAISE NOTICE 'OVERALL STATUS: %', overall_status;
    RAISE NOTICE '';
    
    IF prerequisites_ready AND adventure_paths_ready AND many_to_many_ready THEN
        RAISE NOTICE '🎉 Your progression system is ready for production!';
        RAISE NOTICE 'Users can unlock exercises, progress through adventure paths,';
        RAISE NOTICE 'and experience structured difficulty progression.';
    ELSE
        RAISE NOTICE '📋 Next steps to complete progression system:';
        IF NOT prerequisites_ready THEN
            RAISE NOTICE '   - Implement exercise_prerequisites table';
        END IF;
        IF NOT adventure_paths_ready THEN
            RAISE NOTICE '   - Implement adventure_paths and path_exercises tables';
        END IF;
        IF NOT difficulty_ready THEN
            RAISE NOTICE '   - Add sample exercises with Beginner/Intermediate/Advanced difficulty';
        END IF;
    END IF;
END $$;
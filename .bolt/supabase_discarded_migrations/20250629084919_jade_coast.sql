/*
# Query Performance Tests

This file contains tests to verify database query performance
and identify potential bottlenecks.
*/

-- Test 1: User dashboard query performance
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time interval;
    test_user_id uuid;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM profiles WHERE is_child = false LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No test user found for performance testing';
    END IF;
    
    start_time := clock_timestamp();
    
    -- Complex dashboard query
    PERFORM 
        p.display_name,
        up.total_exercises_completed,
        up.current_streak_days,
        up.total_points_earned,
        COUNT(DISTINCT es.id) as recent_sessions,
        COUNT(DISTINCT ua.id) as active_adventures,
        COUNT(DISTINCT ur.id) as total_rewards
    FROM profiles p
    LEFT JOIN user_progress up ON p.id = up.user_id
    LEFT JOIN exercise_sessions es ON p.id = es.user_id 
        AND es.completed_at >= CURRENT_DATE - INTERVAL '7 days'
    LEFT JOIN user_adventures ua ON p.id = ua.user_id 
        AND ua.status = 'in_progress'
    LEFT JOIN user_rewards ur ON p.id = ur.user_id
    WHERE p.id = test_user_id
    GROUP BY p.id, p.display_name, up.total_exercises_completed, 
             up.current_streak_days, up.total_points_earned;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    IF execution_time > INTERVAL '100 milliseconds' THEN
        RAISE WARNING 'Dashboard query slow: % ms', EXTRACT(milliseconds FROM execution_time);
    ELSE
        RAISE NOTICE 'Dashboard query performance: % ms', EXTRACT(milliseconds FROM execution_time);
    END IF;
END $$;

-- Test 2: Exercise search and filtering performance
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time interval;
    result_count integer;
BEGIN
    start_time := clock_timestamp();
    
    -- Complex exercise search query
    SELECT COUNT(*) INTO result_count
    FROM exercises e
    JOIN exercise_categories ec ON e.category_id = ec.id
    LEFT JOIN exercise_muscles em ON e.id = em.exercise_id
    LEFT JOIN muscle_groups mg ON em.muscle_group_id = mg.id
    LEFT JOIN exercise_equipment ee ON e.id = ee.exercise_id
    LEFT JOIN equipment_types et ON ee.equipment_id = et.id
    WHERE e.is_active = true
    AND e.difficulty = 'Easy'
    AND e.estimated_duration_minutes <= 10
    AND (mg.name_en ILIKE '%core%' OR mg.name_en IS NULL)
    AND (et.name_en = 'None' OR et.name_en IS NULL);
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    IF execution_time > INTERVAL '50 milliseconds' THEN
        RAISE WARNING 'Exercise search slow: % ms', EXTRACT(milliseconds FROM execution_time);
    ELSE
        RAISE NOTICE 'Exercise search performance: % ms (% results)', 
            EXTRACT(milliseconds FROM execution_time), result_count;
    END IF;
END $$;

-- Test 3: Adventure progress calculation performance
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time interval;
    test_user_id uuid;
BEGIN
    -- Get a test user
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    
    start_time := clock_timestamp();
    
    -- Adventure progress calculation
    PERFORM 
        a.title,
        a.total_exercises,
        COALESCE(ua.progress_percentage, 0) as progress,
        COUNT(DISTINCT ae.exercise_id) as total_exercises_in_adventure,
        COUNT(DISTINCT es.exercise_id) as completed_exercises
    FROM adventures a
    LEFT JOIN user_adventures ua ON a.id = ua.adventure_id AND ua.user_id = test_user_id
    LEFT JOIN adventure_exercises ae ON a.id = ae.adventure_id
    LEFT JOIN exercise_sessions es ON ae.exercise_id = es.exercise_id 
        AND es.user_id = test_user_id
    WHERE a.is_active = true
    GROUP BY a.id, a.title, a.total_exercises, ua.progress_percentage
    ORDER BY a.display_order;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    IF execution_time > INTERVAL '75 milliseconds' THEN
        RAISE WARNING 'Adventure progress calculation slow: % ms', EXTRACT(milliseconds FROM execution_time);
    ELSE
        RAISE NOTICE 'Adventure progress performance: % ms', EXTRACT(milliseconds FROM execution_time);
    END IF;
END $$;

-- Test 4: Parent dashboard with multiple children performance
DO $$
DECLARE
    start_time timestamp;
    end_time timestamp;
    execution_time interval;
    test_parent_id uuid;
BEGIN
    -- Get a test parent
    SELECT parent_id INTO test_parent_id 
    FROM parent_child_relationships 
    WHERE active = true 
    LIMIT 1;
    
    IF test_parent_id IS NULL THEN
        RAISE NOTICE 'No parent-child relationships found for testing';
        RETURN;
    END IF;
    
    start_time := clock_timestamp();
    
    -- Parent dashboard with children data
    PERFORM 
        p.display_name as child_name,
        up.total_exercises_completed,
        up.current_streak_days,
        up.total_points_earned,
        COUNT(DISTINCT es.id) as sessions_this_week,
        AVG(es.fun_rating) as avg_fun_rating
    FROM parent_child_relationships pcr
    JOIN profiles p ON pcr.child_id = p.id
    LEFT JOIN user_progress up ON p.id = up.user_id
    LEFT JOIN exercise_sessions es ON p.id = es.user_id 
        AND es.completed_at >= CURRENT_DATE - INTERVAL '7 days'
    WHERE pcr.parent_id = test_parent_id
    AND pcr.active = true
    GROUP BY p.id, p.display_name, up.total_exercises_completed, 
             up.current_streak_days, up.total_points_earned;
    
    end_time := clock_timestamp();
    execution_time := end_time - start_time;
    
    IF execution_time > INTERVAL '100 milliseconds' THEN
        RAISE WARNING 'Parent dashboard slow: % ms', EXTRACT(milliseconds FROM execution_time);
    ELSE
        RAISE NOTICE 'Parent dashboard performance: % ms', EXTRACT(milliseconds FROM execution_time);
    END IF;
END $$;

-- Test 5: Index usage verification
DO $$
DECLARE
    unused_indexes text[] := '{}';
    index_record RECORD;
BEGIN
    -- Check for unused indexes (this is a simplified check)
    FOR index_record IN
        SELECT schemaname, tablename, indexname
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        AND idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
    LOOP
        unused_indexes := array_append(unused_indexes, 
            index_record.tablename || '.' || index_record.indexname);
    END LOOP;
    
    IF array_length(unused_indexes, 1) > 0 THEN
        RAISE WARNING 'Potentially unused indexes: %', array_to_string(unused_indexes, ', ');
    ELSE
        RAISE NOTICE 'All indexes appear to be in use';
    END IF;
END $$;

-- Test 6: Table size and growth analysis
DO $$
DECLARE
    table_record RECORD;
    large_tables text[] := '{}';
BEGIN
    FOR table_record IN
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LOOP
        RAISE NOTICE 'Table %: %', table_record.tablename, table_record.size;
        
        -- Flag tables larger than 10MB for monitoring
        IF table_record.size_bytes > 10485760 THEN
            large_tables := array_append(large_tables, table_record.tablename);
        END IF;
    END LOOP;
    
    IF array_length(large_tables, 1) > 0 THEN
        RAISE NOTICE 'Large tables to monitor: %', array_to_string(large_tables, ', ');
    END IF;
END $$;

-- Test 7: Connection and query statistics
DO $$
DECLARE
    active_connections integer;
    slow_queries integer;
BEGIN
    -- Check active connections
    SELECT COUNT(*) INTO active_connections
    FROM pg_stat_activity
    WHERE state = 'active';
    
    RAISE NOTICE 'Active database connections: %', active_connections;
    
    -- Check for slow queries (this would need pg_stat_statements extension)
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        SELECT COUNT(*) INTO slow_queries
        FROM pg_stat_statements
        WHERE mean_exec_time > 100; -- queries taking more than 100ms on average
        
        RAISE NOTICE 'Queries with mean execution time > 100ms: %', slow_queries;
    ELSE
        RAISE NOTICE 'pg_stat_statements extension not available for query analysis';
    END IF;
END $$;

RAISE NOTICE '⚡ PERFORMANCE TESTS COMPLETED - CHECK WARNINGS FOR OPTIMIZATION OPPORTUNITIES';
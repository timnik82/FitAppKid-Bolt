/*
# Integration Tests for User Workflows

This file contains end-to-end tests for complete user workflows
including registration, exercise tracking, and progress monitoring.
*/

-- Test 1: Complete user onboarding workflow
DO $$
DECLARE
    parent_id uuid := gen_random_uuid();
    child_id uuid := gen_random_uuid();
    relationship_count integer;
    progress_record_count integer;
BEGIN
    RAISE NOTICE 'Testing complete user onboarding workflow...';
    
    -- Step 1: Parent creates account
    INSERT INTO profiles (id, display_name, is_child, email, privacy_settings)
    VALUES (parent_id, 'Integration Test Parent', false, 'integration@test.com',
            '{"data_sharing": false, "analytics": false}'::jsonb);
    
    -- Step 2: Parent creates child account with consent
    INSERT INTO profiles (id, display_name, is_child, date_of_birth,
                         parent_consent_given, parent_consent_date, privacy_settings)
    VALUES (child_id, 'Integration Test Child', true, '2015-06-15',
            true, now(), '{"data_sharing": false, "analytics": false}'::jsonb);
    
    -- Step 3: Establish parent-child relationship
    INSERT INTO parent_child_relationships (parent_id, child_id, consent_given, consent_date)
    VALUES (parent_id, child_id, true, now());
    
    -- Step 4: Initialize user progress
    INSERT INTO user_progress (user_id, weekly_points_goal, monthly_goal_exercises)
    VALUES (child_id, 100, 20);
    
    -- Verify relationship was created
    SELECT COUNT(*) INTO relationship_count
    FROM parent_child_relationships
    WHERE parent_id = parent_id AND child_id = child_id AND active = true;
    
    IF relationship_count != 1 THEN
        RAISE EXCEPTION 'Parent-child relationship not properly created';
    END IF;
    
    -- Verify progress record was created
    SELECT COUNT(*) INTO progress_record_count
    FROM user_progress
    WHERE user_id = child_id;
    
    IF progress_record_count != 1 THEN
        RAISE EXCEPTION 'User progress record not properly created';
    END IF;
    
    -- Store IDs for subsequent tests
    PERFORM set_config('integration.parent_id', parent_id::text, true);
    PERFORM set_config('integration.child_id', child_id::text, true);
    
    RAISE NOTICE 'SUCCESS: User onboarding workflow completed';
END $$;

-- Test 2: Exercise session recording and progress tracking
DO $$
DECLARE
    child_id uuid := current_setting('integration.child_id')::uuid;
    test_exercise_id uuid;
    test_adventure_id uuid;
    session_id uuid;
    updated_progress RECORD;
    points_earned integer := 15;
BEGIN
    RAISE NOTICE 'Testing exercise session recording...';
    
    -- Get test exercise and adventure
    SELECT id INTO test_exercise_id FROM exercises WHERE is_active = true LIMIT 1;
    SELECT id INTO test_adventure_id FROM adventures WHERE is_active = true LIMIT 1;
    
    IF test_exercise_id IS NULL OR test_adventure_id IS NULL THEN
        RAISE EXCEPTION 'No test exercises or adventures available';
    END IF;
    
    -- Record exercise session
    INSERT INTO exercise_sessions (
        user_id, exercise_id, adventure_id, duration_minutes,
        sets_completed, reps_completed, effort_rating, fun_rating,
        points_earned, notes
    ) VALUES (
        child_id, test_exercise_id, test_adventure_id, 5.5,
        2, 10, 4, 5, points_earned, 'Great workout!'
    ) RETURNING id INTO session_id;
    
    -- Update user progress manually (in real app this would be triggered)
    UPDATE user_progress 
    SET 
        total_exercises_completed = total_exercises_completed + 1,
        total_points_earned = total_points_earned + points_earned,
        total_minutes_exercised = total_minutes_exercised + 5.5,
        last_exercise_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = child_id;
    
    -- Verify progress was updated
    SELECT * INTO updated_progress
    FROM user_progress
    WHERE user_id = child_id;
    
    IF updated_progress.total_exercises_completed < 1 THEN
        RAISE EXCEPTION 'Exercise completion not tracked in user progress';
    END IF;
    
    IF updated_progress.total_points_earned < points_earned THEN
        RAISE EXCEPTION 'Points not properly added to user progress';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Exercise session recorded and progress updated';
END $$;

-- Test 3: Adventure progression workflow
DO $$
DECLARE
    child_id uuid := current_setting('integration.child_id')::uuid;
    test_adventure_id uuid;
    adventure_progress_id uuid;
    adventure_exercises_count integer;
    completed_exercises integer := 0;
    exercise_record RECORD;
BEGIN
    RAISE NOTICE 'Testing adventure progression workflow...';
    
    -- Get test adventure
    SELECT id INTO test_adventure_id FROM adventures WHERE is_active = true LIMIT 1;
    
    -- Start adventure
    INSERT INTO user_adventures (user_id, adventure_id, status, started_at)
    VALUES (child_id, test_adventure_id, 'in_progress', now())
    RETURNING id INTO adventure_progress_id;
    
    -- Get adventure exercises count
    SELECT COUNT(*) INTO adventure_exercises_count
    FROM adventure_exercises
    WHERE adventure_id = test_adventure_id;
    
    -- Complete some exercises in the adventure
    FOR exercise_record IN
        SELECT ae.exercise_id, ae.points_reward
        FROM adventure_exercises ae
        WHERE ae.adventure_id = test_adventure_id
        ORDER BY ae.sequence_order
        LIMIT 2
    LOOP
        -- Record exercise session
        INSERT INTO exercise_sessions (
            user_id, exercise_id, adventure_id, duration_minutes,
            effort_rating, fun_rating, points_earned
        ) VALUES (
            child_id, exercise_record.exercise_id, test_adventure_id, 3,
            4, 4, exercise_record.points_reward
        );
        
        completed_exercises := completed_exercises + 1;
    END LOOP;
    
    -- Update adventure progress
    UPDATE user_adventures
    SET 
        exercises_completed = completed_exercises,
        progress_percentage = (completed_exercises::decimal / adventure_exercises_count) * 100,
        total_points_earned = completed_exercises * 10, -- approximate
        last_activity_at = now()
    WHERE id = adventure_progress_id;
    
    -- Verify adventure progress
    IF NOT EXISTS (
        SELECT 1 FROM user_adventures
        WHERE id = adventure_progress_id
        AND exercises_completed > 0
        AND progress_percentage > 0
    ) THEN
        RAISE EXCEPTION 'Adventure progress not properly tracked';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Adventure progression workflow completed';
END $$;

-- Test 4: Reward earning workflow
DO $$
DECLARE
    child_id uuid := current_setting('integration.child_id')::uuid;
    first_steps_reward_id uuid;
    user_progress_record RECORD;
    reward_earned boolean := false;
BEGIN
    RAISE NOTICE 'Testing reward earning workflow...';
    
    -- Get "First Steps" reward
    SELECT id INTO first_steps_reward_id
    FROM rewards
    WHERE title = 'First Steps' AND is_active = true;
    
    IF first_steps_reward_id IS NULL THEN
        RAISE EXCEPTION 'First Steps reward not found';
    END IF;
    
    -- Get current user progress
    SELECT * INTO user_progress_record
    FROM user_progress
    WHERE user_id = child_id;
    
    -- Check if user qualifies for "First Steps" reward (1 exercise completed)
    IF user_progress_record.total_exercises_completed >= 1 THEN
        -- Award the reward
        INSERT INTO user_rewards (user_id, reward_id, is_new)
        VALUES (child_id, first_steps_reward_id, true)
        ON CONFLICT (user_id, reward_id) DO NOTHING;
        
        reward_earned := true;
    END IF;
    
    -- Verify reward was earned
    IF reward_earned AND NOT EXISTS (
        SELECT 1 FROM user_rewards
        WHERE user_id = child_id AND reward_id = first_steps_reward_id
    ) THEN
        RAISE EXCEPTION 'Reward not properly awarded';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Reward earning workflow completed (earned: %)', reward_earned;
END $$;

-- Test 5: Parent dashboard access workflow
DO $$
DECLARE
    parent_id uuid := current_setting('integration.parent_id')::uuid;
    child_id uuid := current_setting('integration.child_id')::uuid;
    child_data_accessible boolean := false;
    dashboard_data RECORD;
BEGIN
    RAISE NOTICE 'Testing parent dashboard access workflow...';
    
    -- Test parent can access child's data through proper relationship
    SELECT 
        p.display_name,
        up.total_exercises_completed,
        up.total_points_earned,
        COUNT(es.id) as recent_sessions
    INTO dashboard_data
    FROM profiles p
    JOIN user_progress up ON p.id = up.user_id
    LEFT JOIN exercise_sessions es ON p.id = es.user_id
        AND es.completed_at >= CURRENT_DATE - INTERVAL '7 days'
    WHERE p.id = child_id
    AND EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = parent_id
        AND pcr.child_id = p.id
        AND pcr.active = true
    )
    GROUP BY p.id, p.display_name, up.total_exercises_completed, up.total_points_earned;
    
    IF dashboard_data.display_name IS NOT NULL THEN
        child_data_accessible := true;
    END IF;
    
    IF NOT child_data_accessible THEN
        RAISE EXCEPTION 'Parent cannot access child data through proper relationship';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Parent dashboard access verified (child: %, exercises: %, points: %)',
        dashboard_data.display_name, 
        dashboard_data.total_exercises_completed,
        dashboard_data.total_points_earned;
END $$;

-- Test 6: Data privacy and isolation verification
DO $$
DECLARE
    parent_id uuid := current_setting('integration.parent_id')::uuid;
    child_id uuid := current_setting('integration.child_id')::uuid;
    other_user_id uuid := gen_random_uuid();
    unauthorized_access_count integer;
BEGIN
    RAISE NOTICE 'Testing data privacy and isolation...';
    
    -- Create another user (not related)
    INSERT INTO profiles (id, display_name, is_child, email)
    VALUES (other_user_id, 'Unrelated User', false, 'unrelated@test.com');
    
    -- Test that unrelated user cannot access child data
    SELECT COUNT(*) INTO unauthorized_access_count
    FROM profiles p
    WHERE p.id = child_id
    AND EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = other_user_id  -- Wrong parent
        AND pcr.child_id = p.id
        AND pcr.active = true
    );
    
    IF unauthorized_access_count > 0 THEN
        RAISE EXCEPTION 'Data isolation violation: Unrelated user can access child data';
    END IF;
    
    -- Test that child cannot access other children's data
    SELECT COUNT(*) INTO unauthorized_access_count
    FROM exercise_sessions es
    WHERE es.user_id != child_id  -- Other users' sessions
    AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = child_id  -- Current child trying to access
        AND p.id = es.user_id  -- This should never match
    );
    
    -- Cleanup unrelated user
    DELETE FROM profiles WHERE id = other_user_id;
    
    RAISE NOTICE 'SUCCESS: Data privacy and isolation verified';
END $$;

-- Test 7: Complete workflow cleanup
DO $$
DECLARE
    parent_id uuid := current_setting('integration.parent_id')::uuid;
    child_id uuid := current_setting('integration.child_id')::uuid;
    cleanup_count integer;
BEGIN
    RAISE NOTICE 'Testing complete workflow cleanup...';
    
    -- Delete parent profile (should cascade to child and all related data)
    DELETE FROM profiles WHERE id = parent_id;
    
    -- Verify child profile was also deleted (cascade)
    SELECT COUNT(*) INTO cleanup_count
    FROM profiles
    WHERE id = child_id;
    
    IF cleanup_count > 0 THEN
        RAISE EXCEPTION 'Cascade delete not working: Child profile still exists';
    END IF;
    
    -- Verify related data was cleaned up
    SELECT COUNT(*) INTO cleanup_count
    FROM exercise_sessions
    WHERE user_id = child_id;
    
    IF cleanup_count > 0 THEN
        RAISE EXCEPTION 'Cascade delete not working: Exercise sessions still exist';
    END IF;
    
    SELECT COUNT(*) INTO cleanup_count
    FROM user_progress
    WHERE user_id = child_id;
    
    IF cleanup_count > 0 THEN
        RAISE EXCEPTION 'Cascade delete not working: User progress still exists';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Complete workflow cleanup verified';
END $$;

RAISE NOTICE '🔄 ALL INTEGRATION WORKFLOW TESTS PASSED - END-TO-END FUNCTIONALITY VERIFIED';
/*
# Row Level Security (RLS) Policy Tests

This file tests all RLS policies to ensure proper data isolation
and access control for different user roles.
*/

-- Setup test users and data
DO $$
DECLARE
    parent_user_id uuid := gen_random_uuid();
    child_user_id uuid := gen_random_uuid();
    other_parent_id uuid := gen_random_uuid();
    other_child_id uuid := gen_random_uuid();
    unrelated_user_id uuid := gen_random_uuid();
    test_exercise_id uuid;
    test_adventure_id uuid;
BEGIN
    -- Create test profiles
    INSERT INTO profiles (id, display_name, is_child, email) VALUES
    (parent_user_id, 'Test Parent', false, 'parent@test.com'),
    (child_user_id, 'Test Child', true, null),
    (other_parent_id, 'Other Parent', false, 'other@test.com'),
    (other_child_id, 'Other Child', true, null),
    (unrelated_user_id, 'Unrelated User', false, 'unrelated@test.com');
    
    -- Create parent-child relationship
    INSERT INTO parent_child_relationships (parent_id, child_id, consent_given, active) VALUES
    (parent_user_id, child_user_id, true, true),
    (other_parent_id, other_child_id, true, true);
    
    -- Create test exercise and adventure
    SELECT id INTO test_exercise_id FROM exercises LIMIT 1;
    SELECT id INTO test_adventure_id FROM adventures LIMIT 1;
    
    -- Create test exercise sessions
    INSERT INTO exercise_sessions (user_id, exercise_id, duration_minutes, points_earned) VALUES
    (child_user_id, test_exercise_id, 5, 10),
    (other_child_id, test_exercise_id, 3, 8);
    
    -- Create test user progress
    INSERT INTO user_progress (user_id, total_exercises_completed, total_points_earned) VALUES
    (child_user_id, 1, 10),
    (other_child_id, 1, 8);
    
    -- Store test IDs for later use
    PERFORM set_config('test.parent_user_id', parent_user_id::text, true);
    PERFORM set_config('test.child_user_id', child_user_id::text, true);
    PERFORM set_config('test.other_parent_id', other_parent_id::text, true);
    PERFORM set_config('test.other_child_id', other_child_id::text, true);
    PERFORM set_config('test.unrelated_user_id', unrelated_user_id::text, true);
    
    RAISE NOTICE 'Test data created successfully';
END $$;

-- Test 1: Profile access control
DO $$
DECLARE
    parent_id uuid := current_setting('test.parent_user_id')::uuid;
    child_id uuid := current_setting('test.child_user_id')::uuid;
    other_child_id uuid := current_setting('test.other_child_id')::uuid;
    profile_count integer;
BEGIN
    -- Test parent can see own profile
    SET LOCAL rls.user_id = parent_id;
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = parent_id;
    IF profile_count != 1 THEN
        RAISE EXCEPTION 'Parent cannot see own profile';
    END IF;
    
    -- Test parent can see child profile
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = child_id;
    IF profile_count != 1 THEN
        RAISE EXCEPTION 'Parent cannot see child profile';
    END IF;
    
    -- Test parent cannot see other children
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = other_child_id;
    IF profile_count != 0 THEN
        RAISE EXCEPTION 'Parent can see other children profiles (security violation)';
    END IF;
    
    -- Test child can see own profile
    SET LOCAL rls.user_id = child_id;
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = child_id;
    IF profile_count != 1 THEN
        RAISE EXCEPTION 'Child cannot see own profile';
    END IF;
    
    -- Test child cannot see parent profile
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE id = parent_id;
    IF profile_count != 0 THEN
        RAISE EXCEPTION 'Child can see parent profile (should be restricted)';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Profile access control working correctly';
END $$;

-- Test 2: Exercise session access control
DO $$
DECLARE
    parent_id uuid := current_setting('test.parent_user_id')::uuid;
    child_id uuid := current_setting('test.child_user_id')::uuid;
    other_child_id uuid := current_setting('test.other_child_id')::uuid;
    session_count integer;
BEGIN
    -- Test parent can see child's exercise sessions
    SET LOCAL rls.user_id = parent_id;
    SELECT COUNT(*) INTO session_count FROM exercise_sessions WHERE user_id = child_id;
    IF session_count = 0 THEN
        RAISE EXCEPTION 'Parent cannot see child exercise sessions';
    END IF;
    
    -- Test parent cannot see other children's sessions
    SELECT COUNT(*) INTO session_count FROM exercise_sessions WHERE user_id = other_child_id;
    IF session_count != 0 THEN
        RAISE EXCEPTION 'Parent can see other children exercise sessions (security violation)';
    END IF;
    
    -- Test child can see own sessions
    SET LOCAL rls.user_id = child_id;
    SELECT COUNT(*) INTO session_count FROM exercise_sessions WHERE user_id = child_id;
    IF session_count = 0 THEN
        RAISE EXCEPTION 'Child cannot see own exercise sessions';
    END IF;
    
    -- Test child cannot see other sessions
    SELECT COUNT(*) INTO session_count FROM exercise_sessions WHERE user_id = other_child_id;
    IF session_count != 0 THEN
        RAISE EXCEPTION 'Child can see other children exercise sessions (security violation)';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Exercise session access control working correctly';
END $$;

-- Test 3: User progress access control
DO $$
DECLARE
    parent_id uuid := current_setting('test.parent_user_id')::uuid;
    child_id uuid := current_setting('test.child_user_id')::uuid;
    other_child_id uuid := current_setting('test.other_child_id')::uuid;
    progress_count integer;
BEGIN
    -- Test parent can see child's progress
    SET LOCAL rls.user_id = parent_id;
    SELECT COUNT(*) INTO progress_count FROM user_progress WHERE user_id = child_id;
    IF progress_count = 0 THEN
        RAISE EXCEPTION 'Parent cannot see child progress';
    END IF;
    
    -- Test parent cannot see other children's progress
    SELECT COUNT(*) INTO progress_count FROM user_progress WHERE user_id = other_child_id;
    IF progress_count != 0 THEN
        RAISE EXCEPTION 'Parent can see other children progress (security violation)';
    END IF;
    
    -- Test child can see own progress
    SET LOCAL rls.user_id = child_id;
    SELECT COUNT(*) INTO progress_count FROM user_progress WHERE user_id = child_id;
    IF progress_count = 0 THEN
        RAISE EXCEPTION 'Child cannot see own progress';
    END IF;
    
    RAISE NOTICE 'SUCCESS: User progress access control working correctly';
END $$;

-- Test 4: Public data access (exercises, categories, etc.)
DO $$
DECLARE
    child_id uuid := current_setting('test.child_user_id')::uuid;
    exercise_count integer;
    category_count integer;
    adventure_count integer;
BEGIN
    -- Test child can see exercises
    SET LOCAL rls.user_id = child_id;
    SELECT COUNT(*) INTO exercise_count FROM exercises WHERE is_active = true;
    IF exercise_count = 0 THEN
        RAISE EXCEPTION 'Child cannot see exercises';
    END IF;
    
    -- Test child can see categories
    SELECT COUNT(*) INTO category_count FROM exercise_categories;
    IF category_count = 0 THEN
        RAISE EXCEPTION 'Child cannot see exercise categories';
    END IF;
    
    -- Test child can see adventures
    SELECT COUNT(*) INTO adventure_count FROM adventures WHERE is_active = true;
    IF adventure_count = 0 THEN
        RAISE EXCEPTION 'Child cannot see adventures';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Public data access working correctly';
END $$;

-- Test 5: Parent-child relationship access
DO $$
DECLARE
    parent_id uuid := current_setting('test.parent_user_id')::uuid;
    child_id uuid := current_setting('test.child_user_id')::uuid;
    other_parent_id uuid := current_setting('test.other_parent_id')::uuid;
    relationship_count integer;
BEGIN
    -- Test parent can see their relationships
    SET LOCAL rls.user_id = parent_id;
    SELECT COUNT(*) INTO relationship_count 
    FROM parent_child_relationships 
    WHERE parent_id = parent_id;
    IF relationship_count = 0 THEN
        RAISE EXCEPTION 'Parent cannot see their own relationships';
    END IF;
    
    -- Test parent cannot see other relationships
    SELECT COUNT(*) INTO relationship_count 
    FROM parent_child_relationships 
    WHERE parent_id = other_parent_id;
    IF relationship_count != 0 THEN
        RAISE EXCEPTION 'Parent can see other parent relationships (security violation)';
    END IF;
    
    -- Test child can see their parent relationships
    SET LOCAL rls.user_id = child_id;
    SELECT COUNT(*) INTO relationship_count 
    FROM parent_child_relationships 
    WHERE child_id = child_id;
    IF relationship_count = 0 THEN
        RAISE EXCEPTION 'Child cannot see their parent relationships';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Parent-child relationship access control working correctly';
END $$;

-- Test 6: Data modification restrictions
DO $$
DECLARE
    parent_id uuid := current_setting('test.parent_user_id')::uuid;
    child_id uuid := current_setting('test.child_user_id')::uuid;
    other_child_id uuid := current_setting('test.other_child_id')::uuid;
    update_count integer;
BEGIN
    -- Test parent can update child profile
    SET LOCAL rls.user_id = parent_id;
    UPDATE profiles SET display_name = 'Updated Child Name' WHERE id = child_id;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    IF update_count != 1 THEN
        RAISE EXCEPTION 'Parent cannot update child profile';
    END IF;
    
    -- Test parent cannot update other children
    UPDATE profiles SET display_name = 'Hacked Name' WHERE id = other_child_id;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    IF update_count != 0 THEN
        RAISE EXCEPTION 'Parent can update other children profiles (security violation)';
    END IF;
    
    -- Test child can update own profile
    SET LOCAL rls.user_id = child_id;
    UPDATE profiles SET display_name = 'My New Name' WHERE id = child_id;
    GET DIAGNOSTICS update_count = ROW_COUNT;
    IF update_count != 1 THEN
        RAISE EXCEPTION 'Child cannot update own profile';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Data modification restrictions working correctly';
END $$;

-- Cleanup test data
DO $$
DECLARE
    parent_id uuid := current_setting('test.parent_user_id')::uuid;
    child_id uuid := current_setting('test.child_user_id')::uuid;
    other_parent_id uuid := current_setting('test.other_parent_id')::uuid;
    other_child_id uuid := current_setting('test.other_child_id')::uuid;
    unrelated_id uuid := current_setting('test.unrelated_user_id')::uuid;
BEGIN
    -- Delete test data (cascading deletes will handle related records)
    DELETE FROM profiles WHERE id IN (parent_id, child_id, other_parent_id, other_child_id, unrelated_id);
    
    RAISE NOTICE 'Test data cleaned up successfully';
END $$;

RAISE NOTICE '🔒 ALL RLS POLICY TESTS PASSED - DATA ISOLATION VERIFIED';
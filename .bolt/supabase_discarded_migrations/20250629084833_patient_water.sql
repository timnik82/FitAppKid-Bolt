/*
# COPPA Compliance Validation Tests

This file contains tests to verify strict adherence to COPPA requirements
including data minimization, parental consent, and privacy protections.
*/

-- Test 1: Verify no prohibited health data collection
DO $$
DECLARE
    prohibited_health_fields text[] := ARRAY[
        'weight', 'height', 'bmi', 'body_fat_percentage', 'heart_rate',
        'blood_pressure', 'calories_burned', 'metabolic_rate', 'vo2_max',
        'medical_condition', 'medication', 'allergy', 'diagnosis', 'treatment'
    ];
    prohibited_personal_fields text[] := ARRAY[
        'real_name', 'full_name', 'first_name', 'last_name', 'address',
        'street_address', 'phone_number', 'mobile_phone', 'ssn', 'social_security',
        'credit_card', 'bank_account', 'drivers_license'
    ];
    prohibited_location_fields text[] := ARRAY[
        'latitude', 'longitude', 'gps_coordinates', 'location', 'geolocation',
        'ip_address', 'device_id', 'mac_address'
    ];
    all_prohibited text[];
    found_fields text[] := '{}';
    field_name text;
    table_record RECORD;
BEGIN
    -- Combine all prohibited fields
    all_prohibited := prohibited_health_fields || prohibited_personal_fields || prohibited_location_fields;
    
    -- Check all tables for prohibited fields
    FOR table_record IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
    LOOP
        FOREACH field_name IN ARRAY all_prohibited
        LOOP
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' 
                AND table_name = table_record.table_name
                AND column_name ILIKE '%' || field_name || '%'
            ) THEN
                found_fields := array_append(found_fields, 
                    table_record.table_name || '.' || field_name);
            END IF;
        END LOOP;
    END LOOP;
    
    IF array_length(found_fields, 1) > 0 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Found prohibited data fields: %', 
            array_to_string(found_fields, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: No prohibited health, personal, or location data fields found';
END $$;

-- Test 2: Verify parental consent tracking
DO $$
DECLARE
    consent_fields_count integer;
    relationship_consent_count integer;
BEGIN
    -- Check profiles table has consent tracking
    SELECT COUNT(*) INTO consent_fields_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name IN ('parent_consent_given', 'parent_consent_date', 'is_child');
    
    IF consent_fields_count < 3 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing parental consent tracking in profiles table';
    END IF;
    
    -- Check parent_child_relationships has consent tracking
    SELECT COUNT(*) INTO relationship_consent_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'parent_child_relationships'
    AND column_name IN ('consent_given', 'consent_date');
    
    IF relationship_consent_count < 2 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing consent tracking in parent_child_relationships';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Parental consent tracking properly implemented';
END $$;

-- Test 3: Verify privacy settings with restrictive defaults
DO $$
DECLARE
    privacy_column_exists boolean;
    default_privacy_settings jsonb;
BEGIN
    -- Check if privacy_settings column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'privacy_settings'
    ) INTO privacy_column_exists;
    
    IF NOT privacy_column_exists THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing privacy_settings column in profiles';
    END IF;
    
    -- Check default privacy settings are restrictive
    SELECT column_default::jsonb INTO default_privacy_settings
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'privacy_settings';
    
    IF default_privacy_settings->>'data_sharing' != 'false' OR 
       default_privacy_settings->>'analytics' != 'false' THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Default privacy settings are not restrictive enough';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Privacy settings with restrictive defaults verified';
END $$;

-- Test 4: Verify gamification replaces health metrics
DO $$
DECLARE
    points_system_exists boolean;
    calorie_fields_exist boolean;
BEGIN
    -- Check adventure_points exists in exercises
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'exercises'
        AND column_name = 'adventure_points'
    ) INTO points_system_exists;
    
    IF NOT points_system_exists THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing adventure_points system in exercises';
    END IF;
    
    -- Verify no calorie tracking exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND (column_name ILIKE '%calorie%' OR column_name ILIKE '%kcal%')
    ) INTO calorie_fields_exist;
    
    IF calorie_fields_exist THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Found calorie tracking fields (health data)';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Gamification system properly replaces health metrics';
END $$;

-- Test 5: Verify child data minimization
DO $$
DECLARE
    child_profile_columns text[];
    excessive_data_fields text[] := ARRAY[
        'email', 'phone', 'address', 'school', 'grade', 'teacher',
        'emergency_contact', 'photo', 'image', 'video'
    ];
    found_excessive text[] := '{}';
    field_name text;
BEGIN
    -- Get all columns in profiles table
    SELECT array_agg(column_name) INTO child_profile_columns
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles';
    
    -- Check for excessive data collection
    FOREACH field_name IN ARRAY excessive_data_fields
    LOOP
        IF field_name = ANY(child_profile_columns) THEN
            found_excessive := array_append(found_excessive, field_name);
        END IF;
    END LOOP;
    
    -- Email is allowed for parents but should be nullable for children
    IF 'email' = ANY(child_profile_columns) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'profiles'
            AND column_name = 'email'
            AND is_nullable = 'NO'
        ) THEN
            RAISE EXCEPTION 'COPPA VIOLATION: Email field is required (should be nullable for children)';
        END IF;
    END IF;
    
    -- Remove email from excessive fields if properly implemented
    found_excessive := array_remove(found_excessive, 'email');
    
    IF array_length(found_excessive, 1) > 0 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Excessive data collection for children: %', 
            array_to_string(found_excessive, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: Child data collection properly minimized';
END $$;

-- Test 6: Verify data retention and deletion capabilities
DO $$
DECLARE
    cascade_deletes_count integer;
    profile_fk_exists boolean;
BEGIN
    -- Check for CASCADE delete relationships
    SELECT COUNT(*) INTO cascade_deletes_count
    FROM information_schema.referential_constraints
    WHERE constraint_schema = 'public'
    AND delete_rule = 'CASCADE';
    
    IF cascade_deletes_count = 0 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: No CASCADE delete relationships found for data cleanup';
    END IF;
    
    -- Verify profiles table has proper FK to auth.users for account deletion
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'profiles' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'id'
    ) INTO profile_fk_exists;
    
    IF NOT profile_fk_exists THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing FK relationship for profile deletion';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Data retention and deletion capabilities verified';
END $$;

-- Test 7: Verify engagement-focused metrics only
DO $$
DECLARE
    engagement_fields text[] := ARRAY[
        'fun_rating', 'effort_rating', 'adventure_points', 'total_points_earned',
        'current_streak_days', 'exercises_completed', 'average_fun_rating'
    ];
    missing_engagement text[] := '{}';
    field_name text;
    table_name text;
BEGIN
    -- Check for engagement metrics in appropriate tables
    FOREACH field_name IN ARRAY engagement_fields
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND column_name = field_name
        ) THEN
            missing_engagement := array_append(missing_engagement, field_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_engagement, 1) > 0 THEN
        RAISE EXCEPTION 'COPPA COMPLIANCE: Missing engagement metrics: %', 
            array_to_string(missing_engagement, ', ');
    END IF;
    
    RAISE NOTICE 'SUCCESS: Engagement-focused metrics properly implemented';
END $$;

-- Test 8: Verify age verification and child identification
DO $$
DECLARE
    age_verification_exists boolean;
    child_flag_exists boolean;
BEGIN
    -- Check for age verification capability
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'date_of_birth'
    ) INTO age_verification_exists;
    
    IF NOT age_verification_exists THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing age verification (date_of_birth) field';
    END IF;
    
    -- Check for child identification flag
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
        AND column_name = 'is_child'
    ) INTO child_flag_exists;
    
    IF NOT child_flag_exists THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Missing child identification (is_child) flag';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Age verification and child identification properly implemented';
END $$;

-- Test 9: Create test scenario for COPPA compliance workflow
DO $$
DECLARE
    test_parent_id uuid := gen_random_uuid();
    test_child_id uuid := gen_random_uuid();
    consent_record_count integer;
    child_data_access_count integer;
BEGIN
    -- Test complete COPPA workflow
    
    -- 1. Create parent account
    INSERT INTO profiles (id, display_name, is_child, email, privacy_settings)
    VALUES (test_parent_id, 'Test Parent', false, 'testparent@example.com', 
            '{"data_sharing": false, "analytics": false}'::jsonb);
    
    -- 2. Create child account with parental consent
    INSERT INTO profiles (id, display_name, is_child, date_of_birth, 
                         parent_consent_given, parent_consent_date, privacy_settings)
    VALUES (test_child_id, 'Test Child', true, '2015-01-01',
            true, now(), '{"data_sharing": false, "analytics": false}'::jsonb);
    
    -- 3. Link parent and child with consent tracking
    INSERT INTO parent_child_relationships (parent_id, child_id, consent_given, consent_date)
    VALUES (test_parent_id, test_child_id, true, now());
    
    -- 4. Verify consent is properly recorded
    SELECT COUNT(*) INTO consent_record_count
    FROM parent_child_relationships
    WHERE parent_id = test_parent_id 
    AND child_id = test_child_id 
    AND consent_given = true;
    
    IF consent_record_count != 1 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Parental consent not properly recorded';
    END IF;
    
    -- 5. Test parent can access child data
    SELECT COUNT(*) INTO child_data_access_count
    FROM profiles p
    WHERE p.id = test_child_id
    AND EXISTS (
        SELECT 1 FROM parent_child_relationships pcr
        WHERE pcr.parent_id = test_parent_id
        AND pcr.child_id = p.id
        AND pcr.active = true
    );
    
    IF child_data_access_count != 1 THEN
        RAISE EXCEPTION 'COPPA VIOLATION: Parent cannot access child data with proper consent';
    END IF;
    
    -- Cleanup test data
    DELETE FROM profiles WHERE id IN (test_parent_id, test_child_id);
    
    RAISE NOTICE 'SUCCESS: Complete COPPA compliance workflow verified';
END $$;

RAISE NOTICE '👶 ALL COPPA COMPLIANCE TESTS PASSED - CHILD PRIVACY PROTECTED';
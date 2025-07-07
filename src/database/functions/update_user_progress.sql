-- Function to update user progress when an exercise is completed
-- This function handles points accumulation, streak tracking, and progress updates
CREATE OR REPLACE FUNCTION update_user_progress(
    p_user_id uuid,
    p_exercise_id uuid,
    p_points_earned integer,
    p_fun_rating integer,
    p_duration_seconds integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_streak integer := 0;
    last_activity_date date;
    today_date date := CURRENT_DATE;
    total_points integer := 0;
    total_exercises integer := 0;
BEGIN
    -- Get current user progress
    SELECT 
        COALESCE(current_streak_days, 0),
        last_activity_date,
        COALESCE(total_points, 0),
        COALESCE(total_exercises_completed, 0)
    INTO 
        current_streak,
        last_activity_date,
        total_points,
        total_exercises
    FROM user_progress 
    WHERE user_id = p_user_id;

    -- Calculate new streak
    IF last_activity_date IS NULL THEN
        -- First exercise ever
        current_streak := 1;
    ELSIF last_activity_date = today_date THEN
        -- Already exercised today, keep current streak
        current_streak := current_streak;
    ELSIF last_activity_date = today_date - INTERVAL '1 day' THEN
        -- Exercised yesterday, increment streak
        current_streak := current_streak + 1;
    ELSE
        -- Missed days, reset streak
        current_streak := 1;
    END IF;

    -- Insert or update user progress
    INSERT INTO user_progress (
        user_id,
        total_points,
        total_exercises_completed,
        current_streak_days,
        longest_streak_days,
        last_activity_date,
        average_fun_rating,
        total_exercise_time_minutes,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_points_earned,
        1,
        current_streak,
        current_streak,
        today_date,
        p_fun_rating,
        ROUND(p_duration_seconds / 60.0),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_progress.total_points + p_points_earned,
        total_exercises_completed = user_progress.total_exercises_completed + 1,
        current_streak_days = current_streak,
        longest_streak_days = GREATEST(user_progress.longest_streak_days, current_streak),
        last_activity_date = today_date,
        average_fun_rating = ROUND(
            (user_progress.average_fun_rating * user_progress.total_exercises_completed + p_fun_rating) / 
            (user_progress.total_exercises_completed + 1)
        ),
        total_exercise_time_minutes = user_progress.total_exercise_time_minutes + ROUND(p_duration_seconds / 60.0),
        updated_at = NOW();

    -- Update exercise-specific progress
    INSERT INTO exercise_progress (
        user_id,
        exercise_id,
        times_completed,
        best_fun_rating,
        total_time_minutes,
        last_completed_at,
        created_at,
        updated_at
    )
    VALUES (
        p_user_id,
        p_exercise_id,
        1,
        p_fun_rating,
        ROUND(p_duration_seconds / 60.0),
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, exercise_id) DO UPDATE SET
        times_completed = exercise_progress.times_completed + 1,
        best_fun_rating = GREATEST(exercise_progress.best_fun_rating, p_fun_rating),
        total_time_minutes = exercise_progress.total_time_minutes + ROUND(p_duration_seconds / 60.0),
        last_completed_at = NOW(),
        updated_at = NOW();

    -- Create achievement records for milestones
    PERFORM check_and_award_achievements(p_user_id);

END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_stats RECORD;
    achievement_record RECORD;
BEGIN
    -- Get user stats
    SELECT 
        total_points,
        total_exercises_completed,
        current_streak_days,
        longest_streak_days
    INTO user_stats
    FROM user_progress
    WHERE user_id = p_user_id;

    -- Check for achievements that haven't been awarded yet
    FOR achievement_record IN
        SELECT id, achievement_type, threshold_value, points_reward
        FROM achievements
        WHERE is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = p_user_id AND achievement_id = achievements.id
        )
    LOOP
        -- Check if user meets achievement criteria
        IF (achievement_record.achievement_type = 'total_points' AND user_stats.total_points >= achievement_record.threshold_value) OR
           (achievement_record.achievement_type = 'total_exercises' AND user_stats.total_exercises_completed >= achievement_record.threshold_value) OR
           (achievement_record.achievement_type = 'streak_days' AND user_stats.current_streak_days >= achievement_record.threshold_value) OR
           (achievement_record.achievement_type = 'longest_streak' AND user_stats.longest_streak_days >= achievement_record.threshold_value) THEN
            
            -- Award the achievement
            INSERT INTO user_achievements (
                user_id,
                achievement_id,
                earned_at,
                created_at
            )
            VALUES (
                p_user_id,
                achievement_record.id,
                NOW(),
                NOW()
            );
            
            -- Add bonus points to user progress
            UPDATE user_progress 
            SET total_points = total_points + achievement_record.points_reward
            WHERE user_id = p_user_id;
        END IF;
    END LOOP;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_progress(uuid, uuid, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_achievements(uuid) TO authenticated;
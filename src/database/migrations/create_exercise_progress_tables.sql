-- Migration to create exercise progress tracking tables
-- This extends the existing schema to support detailed exercise progress tracking

BEGIN;

-- Create exercise_progress table for individual exercise tracking
CREATE TABLE IF NOT EXISTS exercise_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    times_completed integer NOT NULL DEFAULT 0,
    best_fun_rating integer CHECK (best_fun_rating >= 1 AND best_fun_rating <= 5),
    total_time_minutes integer NOT NULL DEFAULT 0,
    last_completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, exercise_id)
);

-- Create achievements table for gamification
CREATE TABLE IF NOT EXISTS achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(255) NOT NULL,
    description text,
    achievement_type varchar(50) NOT NULL, -- 'total_points', 'total_exercises', 'streak_days', 'longest_streak', 'category_master', etc.
    threshold_value integer NOT NULL, -- The value needed to unlock this achievement
    points_reward integer NOT NULL DEFAULT 0,
    badge_icon varchar(10), -- Emoji or icon identifier
    badge_color varchar(7), -- Hex color code
    is_active boolean NOT NULL DEFAULT true,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
    achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at timestamp with time zone NOT NULL DEFAULT NOW(),
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_progress
CREATE POLICY "Users can manage own exercise progress"
    ON exercise_progress
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profile_id = exercise_progress.user_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view children exercise progress"
    ON exercise_progress
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
            WHERE parent_profile.user_id = auth.uid()
            AND pcr.child_id = exercise_progress.user_id
            AND pcr.active = true
        )
    );

-- RLS Policies for achievements (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view achievements"
    ON achievements
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
    ON user_achievements
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profile_id = user_achievements.user_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Parents can view children achievements"
    ON user_achievements
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM parent_child_relationships pcr
            JOIN profiles parent_profile ON pcr.parent_id = parent_profile.profile_id
            WHERE parent_profile.user_id = auth.uid()
            AND pcr.child_id = user_achievements.user_id
            AND pcr.active = true
        )
    );

CREATE POLICY "System can award achievements"
    ON user_achievements
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profile_id = user_achievements.user_id 
            AND user_id = auth.uid()
        )
    );

-- Insert sample achievements
INSERT INTO achievements (title, description, achievement_type, threshold_value, points_reward, badge_icon, badge_color) VALUES
    ('Первый шаг', 'Завершите своё первое упражнение', 'total_exercises', 1, 50, '🏅', '#10B981'),
    ('Упорный спортсмен', 'Завершите 10 упражнений', 'total_exercises', 10, 100, '💪', '#3B82F6'),
    ('Чемпион фитнеса', 'Завершите 50 упражнений', 'total_exercises', 50, 250, '🏆', '#F59E0B'),
    ('Мастер приключений', 'Завершите 100 упражнений', 'total_exercises', 100, 500, '⭐', '#8B5CF6'),
    
    ('Коллекционер очков', 'Наберите 100 очков', 'total_points', 100, 50, '💎', '#06B6D4'),
    ('Богач очков', 'Наберите 500 очков', 'total_points', 500, 100, '💰', '#F59E0B'),
    ('Магнат очков', 'Наберите 1000 очков', 'total_points', 1000, 200, '👑', '#EC4899'),
    
    ('Постоянство', 'Занимайтесь 3 дня подряд', 'streak_days', 3, 75, '🔥', '#EF4444'),
    ('Неделя силы', 'Занимайтесь 7 дней подряд', 'streak_days', 7, 150, '🚀', '#F97316'),
    ('Месяц мощи', 'Занимайтесь 30 дней подряд', 'streak_days', 30, 500, '⚡', '#8B5CF6'),
    
    ('Герой баланса', 'Завершите 5 упражнений на баланс', 'balance_exercises', 5, 100, '⚖️', '#10B981'),
    ('Мастер разминки', 'Завершите 10 разминочных упражнений', 'warmup_exercises', 10, 100, '⚡', '#F97316'),
    ('Силач основной части', 'Завершите 20 основных упражнений', 'main_exercises', 20, 150, '💪', '#3B82F6'),
    ('Эксперт заминки', 'Завершите 10 упражнений заминки', 'cooldown_exercises', 10, 100, '🍃', '#10B981'),
    ('Страж осанки', 'Завершите 15 упражнений для осанки', 'posture_exercises', 15, 125, '👤', '#8B5CF6');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_id ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_exercise_id ON exercise_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_last_completed ON exercise_progress(last_completed_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercise_progress_updated_at 
    BEFORE UPDATE ON exercise_progress 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at 
    BEFORE UPDATE ON achievements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Exercise progress tracking tables created successfully!';
    RAISE NOTICE '   - exercise_progress: Individual exercise completion tracking';
    RAISE NOTICE '   - achievements: Gamification system with 15 built-in achievements';
    RAISE NOTICE '   - user_achievements: User achievement tracking';
    RAISE NOTICE '   - All tables have proper RLS policies and indexes';
END $$;
/*
# Multilingual Support Enhancement for Children's Fitness App

This migration adds comprehensive multilingual support (English/Russian) to the database schema.

## Changes Made
1. Add Russian language columns to adventures, adventure_paths, and rewards tables
2. Add preferred_language column to profiles table
3. Create helper function for language fallback
4. Create localized views for easy language-specific queries
5. Add sample Russian translations for existing data
6. Add comprehensive documentation comments

## Features Added
- Full English/Russian support for all user-facing content
- Language preference tracking per user
- Automatic fallback from Russian to English when translations missing
- Localized database views for simplified querying
- Sample translations for common terms
*/

-- First, verify existing multilingual support
DO $$
DECLARE
    exercise_en_count integer;
    exercise_ru_count integer;
    category_en_count integer;
    category_ru_count integer;
    muscle_en_count integer;
    muscle_ru_count integer;
    equipment_en_count integer;
    equipment_ru_count integer;
BEGIN
    RAISE NOTICE '🌍 Verifying existing multilingual support...';
    
    -- Check exercises table
    SELECT COUNT(*) INTO exercise_en_count FROM exercises WHERE name_en IS NOT NULL;
    SELECT COUNT(*) INTO exercise_ru_count FROM exercises WHERE name_ru IS NOT NULL;
    
    -- Check exercise_categories table
    SELECT COUNT(*) INTO category_en_count FROM exercise_categories WHERE name_en IS NOT NULL;
    SELECT COUNT(*) INTO category_ru_count FROM exercise_categories WHERE name_ru IS NOT NULL;
    
    -- Check muscle_groups table
    SELECT COUNT(*) INTO muscle_en_count FROM muscle_groups WHERE name_en IS NOT NULL;
    SELECT COUNT(*) INTO muscle_ru_count FROM muscle_groups WHERE name_ru IS NOT NULL;
    
    -- Check equipment_types table
    SELECT COUNT(*) INTO equipment_en_count FROM equipment_types WHERE name_en IS NOT NULL;
    SELECT COUNT(*) INTO equipment_ru_count FROM equipment_types WHERE name_ru IS NOT NULL;
    
    RAISE NOTICE '✅ Existing multilingual data:';
    RAISE NOTICE '   Exercises: % EN, % RU', exercise_en_count, exercise_ru_count;
    RAISE NOTICE '   Categories: % EN, % RU', category_en_count, category_ru_count;
    RAISE NOTICE '   Muscle Groups: % EN, % RU', muscle_en_count, muscle_ru_count;
    RAISE NOTICE '   Equipment: % EN, % RU', equipment_en_count, equipment_ru_count;
END $$;

-- Add Russian language support to adventures table
DO $$
BEGIN
    -- Add Russian title and description to adventures
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'adventures' AND column_name = 'title_ru'
    ) THEN
        ALTER TABLE adventures ADD COLUMN title_ru text;
        RAISE NOTICE '✅ Added title_ru to adventures table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'adventures' AND column_name = 'description_ru'
    ) THEN
        ALTER TABLE adventures ADD COLUMN description_ru text;
        RAISE NOTICE '✅ Added description_ru to adventures table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'adventures' AND column_name = 'story_theme_ru'
    ) THEN
        ALTER TABLE adventures ADD COLUMN story_theme_ru text;
        RAISE NOTICE '✅ Added story_theme_ru to adventures table';
    END IF;
END $$;

-- Add Russian language support to adventure_paths table
DO $$
BEGIN
    -- Add Russian title, description, and theme to adventure_paths
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'adventure_paths' AND column_name = 'title_ru'
    ) THEN
        ALTER TABLE adventure_paths ADD COLUMN title_ru text;
        RAISE NOTICE '✅ Added title_ru to adventure_paths table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'adventure_paths' AND column_name = 'description_ru'
    ) THEN
        ALTER TABLE adventure_paths ADD COLUMN description_ru text;
        RAISE NOTICE '✅ Added description_ru to adventure_paths table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'adventure_paths' AND column_name = 'theme_ru'
    ) THEN
        ALTER TABLE adventure_paths ADD COLUMN theme_ru text;
        RAISE NOTICE '✅ Added theme_ru to adventure_paths table';
    END IF;
END $$;

-- Add Russian language support to rewards table
DO $$
BEGIN
    -- Add Russian title and description to rewards
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rewards' AND column_name = 'title_ru'
    ) THEN
        ALTER TABLE rewards ADD COLUMN title_ru text;
        RAISE NOTICE '✅ Added title_ru to rewards table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rewards' AND column_name = 'description_ru'
    ) THEN
        ALTER TABLE rewards ADD COLUMN description_ru text;
        RAISE NOTICE '✅ Added description_ru to rewards table';
    END IF;
END $$;

-- Create language preference support in profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'preferred_language'
    ) THEN
        ALTER TABLE profiles ADD COLUMN preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'ru'));
        RAISE NOTICE '✅ Added preferred_language to profiles table';
    END IF;
END $$;

-- Create helper function for language fallback
CREATE OR REPLACE FUNCTION get_localized_text(en_text text, ru_text text, user_language text DEFAULT 'en')
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    -- Return Russian text if requested and available, otherwise fallback to English
    IF user_language = 'ru' AND ru_text IS NOT NULL AND ru_text != '' THEN
        RETURN ru_text;
    ELSE
        RETURN COALESCE(en_text, ru_text);
    END IF;
END;
$$;

-- Create view for localized exercise data
CREATE OR REPLACE VIEW exercise_localized AS
SELECT 
    e.id,
    e.name_en,
    e.name_ru,
    e.description,
    e.difficulty,
    e.exercise_type,
    e.min_sets,
    e.max_sets,
    e.min_reps,
    e.max_reps,
    e.min_duration_seconds,
    e.max_duration_seconds,
    e.adventure_points,
    e.is_active,
    ec.name_en as category_name_en,
    ec.name_ru as category_name_ru,
    -- Helper function to get localized names
    get_localized_text(e.name_en, e.name_ru, 'en') as name_localized_en,
    get_localized_text(e.name_en, e.name_ru, 'ru') as name_localized_ru,
    get_localized_text(ec.name_en, ec.name_ru, 'en') as category_localized_en,
    get_localized_text(ec.name_en, ec.name_ru, 'ru') as category_localized_ru
FROM exercises e
LEFT JOIN exercise_categories ec ON e.category_id = ec.id;

-- Create view for localized adventure data
CREATE OR REPLACE VIEW adventure_localized AS
SELECT 
    a.id,
    a.title,
    a.title_ru,
    a.description,
    a.description_ru,
    a.story_theme,
    a.story_theme_ru,
    a.difficulty_level,
    a.total_exercises,
    a.reward_points,
    a.is_active,
    -- Helper function to get localized content
    get_localized_text(a.title, a.title_ru, 'en') as title_localized_en,
    get_localized_text(a.title, a.title_ru, 'ru') as title_localized_ru,
    get_localized_text(a.description, a.description_ru, 'en') as description_localized_en,
    get_localized_text(a.description, a.description_ru, 'ru') as description_localized_ru,
    get_localized_text(a.story_theme, a.story_theme_ru, 'en') as story_theme_localized_en,
    get_localized_text(a.story_theme, a.story_theme_ru, 'ru') as story_theme_localized_ru
FROM adventures a;

-- Create view for localized adventure path data
CREATE OR REPLACE VIEW adventure_path_localized AS
SELECT 
    ap.id,
    ap.title,
    ap.title_ru,
    ap.description,
    ap.description_ru,
    ap.theme,
    ap.theme_ru,
    ap.difficulty_level,
    ap.estimated_weeks,
    ap.total_exercises,
    ap.is_active,
    -- Helper function to get localized content
    get_localized_text(ap.title, ap.title_ru, 'en') as title_localized_en,
    get_localized_text(ap.title, ap.title_ru, 'ru') as title_localized_ru,
    get_localized_text(ap.description, ap.description_ru, 'en') as description_localized_en,
    get_localized_text(ap.description, ap.description_ru, 'ru') as description_localized_ru,
    get_localized_text(ap.theme, ap.theme_ru, 'en') as theme_localized_en,
    get_localized_text(ap.theme, ap.theme_ru, 'ru') as theme_localized_ru
FROM adventure_paths ap;

-- Create view for localized reward data
CREATE OR REPLACE VIEW reward_localized AS
SELECT 
    r.id,
    r.title,
    r.title_ru,
    r.description,
    r.description_ru,
    r.reward_type,
    r.rarity,
    r.points_value,
    r.is_active,
    -- Helper function to get localized content
    get_localized_text(r.title, r.title_ru, 'en') as title_localized_en,
    get_localized_text(r.title, r.title_ru, 'ru') as title_localized_ru,
    get_localized_text(r.description, r.description_ru, 'en') as description_localized_en,
    get_localized_text(r.description, r.description_ru, 'ru') as description_localized_ru
FROM rewards r;

-- Add sample Russian translations for existing data (if any exists)
DO $$
BEGIN
    -- Add sample Russian translations for exercise categories if they exist but have no Russian names
    UPDATE exercise_categories 
    SET name_ru = CASE 
        WHEN name_en = 'Warm-up' THEN 'Разминка'
        WHEN name_en = 'Main Exercise' THEN 'Основное упражнение'
        WHEN name_en = 'Cool-down' THEN 'Заминка'
        WHEN name_en = 'Posture' THEN 'Осанка'
        WHEN name_en = 'Cardio' THEN 'Кардио'
        WHEN name_en = 'Strength' THEN 'Силовые'
        WHEN name_en = 'Flexibility' THEN 'Гибкость'
        WHEN name_en = 'Balance' THEN 'Баланс'
        ELSE name_ru
    END
    WHERE name_ru IS NULL OR name_ru = '';
    
    -- Add sample Russian translations for muscle groups
    UPDATE muscle_groups 
    SET name_ru = CASE 
        WHEN name_en = 'Arms' THEN 'Руки'
        WHEN name_en = 'Legs' THEN 'Ноги'
        WHEN name_en = 'Core' THEN 'Пресс'
        WHEN name_en = 'Back' THEN 'Спина'
        WHEN name_en = 'Chest' THEN 'Грудь'
        WHEN name_en = 'Shoulders' THEN 'Плечи'
        WHEN name_en = 'Full Body' THEN 'Всё тело'
        ELSE name_ru
    END
    WHERE name_ru IS NULL OR name_ru = '';
    
    -- Add sample Russian translations for equipment types
    UPDATE equipment_types 
    SET name_ru = CASE 
        WHEN name_en = 'No Equipment' THEN 'Без оборудования'
        WHEN name_en = 'Mat' THEN 'Коврик'
        WHEN name_en = 'Chair' THEN 'Стул'
        WHEN name_en = 'Wall' THEN 'Стена'
        WHEN name_en = 'Ball' THEN 'Мяч'
        WHEN name_en = 'Resistance Band' THEN 'Эспандер'
        ELSE name_ru
    END
    WHERE name_ru IS NULL OR name_ru = '';
    
    RAISE NOTICE '✅ Added sample Russian translations for existing data';
END $$;

-- Add comments to document multilingual fields
COMMENT ON COLUMN exercises.name_en IS 'Exercise name in English (required)';
COMMENT ON COLUMN exercises.name_ru IS 'Exercise name in Russian (optional)';
COMMENT ON COLUMN exercise_categories.name_en IS 'Category name in English (required)';
COMMENT ON COLUMN exercise_categories.name_ru IS 'Category name in Russian (optional)';
COMMENT ON COLUMN muscle_groups.name_en IS 'Muscle group name in English (required)';
COMMENT ON COLUMN muscle_groups.name_ru IS 'Muscle group name in Russian (optional)';
COMMENT ON COLUMN equipment_types.name_en IS 'Equipment name in English (required)';
COMMENT ON COLUMN equipment_types.name_ru IS 'Equipment name in Russian (optional)';
COMMENT ON COLUMN adventures.title_ru IS 'Adventure title in Russian (optional)';
COMMENT ON COLUMN adventures.description_ru IS 'Adventure description in Russian (optional)';
COMMENT ON COLUMN adventures.story_theme_ru IS 'Adventure story theme in Russian (optional)';
COMMENT ON COLUMN adventure_paths.title_ru IS 'Adventure path title in Russian (optional)';
COMMENT ON COLUMN adventure_paths.description_ru IS 'Adventure path description in Russian (optional)';
COMMENT ON COLUMN adventure_paths.theme_ru IS 'Adventure path theme in Russian (optional)';
COMMENT ON COLUMN rewards.title_ru IS 'Reward title in Russian (optional)';
COMMENT ON COLUMN rewards.description_ru IS 'Reward description in Russian (optional)';
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language: en (English) or ru (Russian)';

-- Final verification of multilingual support
DO $$
DECLARE
    tables_with_multilingual integer;
    total_ru_columns integer;
    total_en_columns integer;
BEGIN
    RAISE NOTICE '🌍 Final multilingual support verification...';
    
    -- Count tables with multilingual support
    SELECT COUNT(DISTINCT table_name) INTO tables_with_multilingual
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND (column_name LIKE '%_en' OR column_name LIKE '%_ru');
    
    -- Count total Russian columns
    SELECT COUNT(*) INTO total_ru_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name LIKE '%_ru';
    
    -- Count total English columns
    SELECT COUNT(*) INTO total_en_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name LIKE '%_en';
    
    RAISE NOTICE '✅ Multilingual support summary:';
    RAISE NOTICE '   Tables with multilingual fields: %', tables_with_multilingual;
    RAISE NOTICE '   Total English columns: %', total_en_columns;
    RAISE NOTICE '   Total Russian columns: %', total_ru_columns;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Multilingual features available:';
    RAISE NOTICE '   ✅ Exercise names and categories in EN/RU';
    RAISE NOTICE '   ✅ Muscle groups and equipment in EN/RU';
    RAISE NOTICE '   ✅ Adventure content in EN/RU';
    RAISE NOTICE '   ✅ Adventure path content in EN/RU';
    RAISE NOTICE '   ✅ Reward content in EN/RU';
    RAISE NOTICE '   ✅ User language preferences';
    RAISE NOTICE '   ✅ Localized views with fallback logic';
    RAISE NOTICE '   ✅ Helper functions for text localization';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Usage examples:';
    RAISE NOTICE '   SELECT * FROM exercise_localized; -- Get all exercises with localized names';
    RAISE NOTICE '   SELECT get_localized_text(name_en, name_ru, ''ru'') FROM exercises; -- Get Russian names with English fallback';
    RAISE NOTICE '   UPDATE profiles SET preferred_language = ''ru'' WHERE id = user_id; -- Set user language preference';
    RAISE NOTICE '';
    RAISE NOTICE '🌍 MULTILINGUAL SUPPORT ENHANCEMENT COMPLETED';
    RAISE NOTICE '🎉 Your application now fully supports English and Russian languages!';
END $$;
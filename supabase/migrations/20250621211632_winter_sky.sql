/*
# Seed Initial Data for Children's Fitness App

This migration populates the database with initial data including:
1. Exercise categories
2. Muscle groups  
3. Equipment types
4. Sample exercises from the JSON data
5. Sample adventures
6. Basic rewards system

*/

-- Insert Exercise Categories
INSERT INTO exercise_categories (name_en, name_ru, description, color_hex, icon, display_order) VALUES
('Warm-up', 'Разминка', 'Prepare your body for exercise', '#F97316', 'zap', 1),
('Main', 'Основная часть', 'Core strength and fitness exercises', '#3B82F6', 'dumbbell', 2),
('Cool-down', 'Заминка', 'Relax and stretch after exercise', '#10B981', 'leaf', 3),
('Posture', 'Осанка', 'Improve posture and stability', '#8B5CF6', 'user-check', 4);

-- Insert Muscle Groups
INSERT INTO muscle_groups (name_en, name_ru, is_primary) VALUES
('Core', 'Кор', true),
('Shoulders', 'Плечи', true),
('Quadriceps', 'Квадрицепсы', true),
('Hamstrings', 'Подколенные сухожилия', true),
('Glutes', 'Ягодицы', true),
('Calves', 'Икроножные мышцы', true),
('Upper Back', 'Верхняя часть спины', true),
('Lower Back', 'Нижняя часть спины', true),
('Chest', 'Грудные мышцы', true),
('Hip Flexors', 'Сгибатели бедра', false),
('Stabilizer Muscles', 'Мышцы-стабилизаторы', false),
('Ankle Muscles', 'Мышцы голеностопа', false);

-- Insert Equipment Types
INSERT INTO equipment_types (name_en, name_ru, required, icon) VALUES
('Yoga Mat', 'Коврик для йоги', false, 'square'),
('Dumbbells 0.5kg', 'Гантели 0.5кг', false, 'dumbbell'),
('Wall', 'Стена', false, 'square'),
('Chair', 'Стул', false, 'square'),
('Balance Board', 'Балансировочная доска', false, 'circle'),
('Low Step', 'Низкая ступенька', false, 'square'),
('None', 'Без оборудования', true, 'circle');

-- Get category and equipment IDs for referencing
DO $$
DECLARE
    warmup_id uuid;
    main_id uuid;
    cooldown_id uuid;
    posture_id uuid;
    yoga_mat_id uuid;
    dumbbells_id uuid;
    wall_id uuid;
    none_id uuid;
    balance_board_id uuid;
    step_id uuid;
    
    -- Muscle group IDs
    core_id uuid;
    shoulders_id uuid;
    quads_id uuid;
    hams_id uuid;
    glutes_id uuid;
    calves_id uuid;
    upper_back_id uuid;
    lower_back_id uuid;
    
    -- Exercise IDs for later reference
    bear_crawl_id uuid;
    arm_circles_id uuid;
    squat_id uuid;
    plank_id uuid;
    glute_bridge_id uuid;
BEGIN
    -- Get category IDs
    SELECT id INTO warmup_id FROM exercise_categories WHERE name_en = 'Warm-up';
    SELECT id INTO main_id FROM exercise_categories WHERE name_en = 'Main';
    SELECT id INTO cooldown_id FROM exercise_categories WHERE name_en = 'Cool-down';
    SELECT id INTO posture_id FROM exercise_categories WHERE name_en = 'Posture';
    
    -- Get equipment IDs
    SELECT id INTO yoga_mat_id FROM equipment_types WHERE name_en = 'Yoga Mat';
    SELECT id INTO dumbbells_id FROM equipment_types WHERE name_en = 'Dumbbells 0.5kg';
    SELECT id INTO wall_id FROM equipment_types WHERE name_en = 'Wall';
    SELECT id INTO none_id FROM equipment_types WHERE name_en = 'None';
    SELECT id INTO balance_board_id FROM equipment_types WHERE name_en = 'Balance Board';
    SELECT id INTO step_id FROM equipment_types WHERE name_en = 'Low Step';
    
    -- Get muscle group IDs
    SELECT id INTO core_id FROM muscle_groups WHERE name_en = 'Core';
    SELECT id INTO shoulders_id FROM muscle_groups WHERE name_en = 'Shoulders';
    SELECT id INTO quads_id FROM muscle_groups WHERE name_en = 'Quadriceps';
    SELECT id INTO hams_id FROM muscle_groups WHERE name_en = 'Hamstrings';
    SELECT id INTO glutes_id FROM muscle_groups WHERE name_en = 'Glutes';
    SELECT id INTO calves_id FROM muscle_groups WHERE name_en = 'Calves';
    SELECT id INTO upper_back_id FROM muscle_groups WHERE name_en = 'Upper Back';
    SELECT id INTO lower_back_id FROM muscle_groups WHERE name_en = 'Lower Back';

    -- Insert sample exercises from JSON data
    
    -- 1. Bear Crawl
    INSERT INTO exercises (
        original_id, name_en, name_ru, category_id, description, difficulty,
        sets_reps_duration, safety_cues, fun_variation, progression_notes,
        basketball_skills_improvement, is_balance_focused, estimated_duration_minutes,
        data_source
    ) VALUES (
        1, 'Animal Walks (Bear Crawl Race)', 'Медвежья походка', warmup_id,
        'Children move on all fours, imitating bear movements. This exercise warms up the entire body, improves coordination and strengthens core and shoulder muscles.',
        'Easy', '2-3 sets of 30-60 seconds',
        ARRAY['Keep your back straight, don''t sag', 'Knees don''t touch the floor'],
        'Bear Race', 'Increase distance or speed, add obstacles',
        'Improves coordination, core and shoulder strength for ball control and defense',
        false, 3, 'exercise_routines_Manus.json'
    ) RETURNING id INTO bear_crawl_id;
    
    -- Add muscle relationships for bear crawl
    INSERT INTO exercise_muscles (exercise_id, muscle_group_id, is_primary) VALUES
    (bear_crawl_id, core_id, true),
    (bear_crawl_id, shoulders_id, true),
    (bear_crawl_id, quads_id, false),
    (bear_crawl_id, hams_id, false);
    
    -- Add equipment relationship
    INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required) VALUES
    (bear_crawl_id, yoga_mat_id, false);

    -- 2. Arm Circles
    INSERT INTO exercises (
        original_id, name_en, name_ru, category_id, description, difficulty,
        sets_reps_duration, safety_cues, fun_variation, progression_notes,
        basketball_skills_improvement, is_balance_focused, estimated_duration_minutes
    ) VALUES (
        2, 'Arm Circles', 'Круги руками (Ветряные мельницы)', warmup_id,
        'Children perform circular arm movements forward and backward with gradually increasing amplitude.',
        'Easy', '10-15 circles in each direction',
        ARRAY['Keep arms straight', 'Control the movement, don''t swing the body'],
        'Windmills', 'Increase amplitude or add light weights',
        'Improves shoulder mobility for shooting and passing',
        false, 2
    ) RETURNING id INTO arm_circles_id;
    
    INSERT INTO exercise_muscles (exercise_id, muscle_group_id, is_primary) VALUES
    (arm_circles_id, shoulders_id, true),
    (arm_circles_id, upper_back_id, true);
    
    INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required) VALUES
    (arm_circles_id, none_id, true);

    -- 3. Bodyweight Squat
    INSERT INTO exercises (
        original_id, name_en, name_ru, category_id, description, difficulty,
        sets_reps_duration, safety_cues, fun_variation, progression_notes,
        basketball_skills_improvement, is_balance_focused, estimated_duration_minutes
    ) VALUES (
        4, 'Bodyweight Squat', 'Приседания', main_id,
        'Fundamental exercise for developing leg and glute strength, improving posture and coordination.',
        'Easy', '2-3 sets of 8-15 repetitions',
        ARRAY['Keep back straight, chest forward', 'Knees don''t go past toes', 'Heels stay on ground'],
        'Superhero Squats', 'Add light weights, single leg squats, jump squats',
        'Improves leg strength for jumping, acceleration, and defensive stance',
        false, 4
    ) RETURNING id INTO squat_id;
    
    INSERT INTO exercise_muscles (exercise_id, muscle_group_id, is_primary) VALUES
    (squat_id, quads_id, true),
    (squat_id, glutes_id, true),
    (squat_id, hams_id, false),
    (squat_id, core_id, false);

    -- 4. Plank
    INSERT INTO exercises (
        original_id, name_en, name_ru, category_id, description, difficulty,
        sets_reps_duration, safety_cues, fun_variation, progression_notes,
        basketball_skills_improvement, is_balance_focused, estimated_duration_minutes
    ) VALUES (
        5, 'Plank', 'Планка', main_id,
        'Static exercise for strengthening all core muscles, improving posture and spinal stability.',
        'Medium', '2-3 sets of 20-45 seconds',
        ARRAY['Body should be straight line from head to heels', 'Don''t sag in lower back', 'Breathe steadily'],
        'Surfboard Challenge', 'Modified on knees, single arm/leg variations',
        'Strengthens core for stability during shooting, dribbling and defense',
        true, 3
    ) RETURNING id INTO plank_id;
    
    INSERT INTO exercise_muscles (exercise_id, muscle_group_id, is_primary) VALUES
    (plank_id, core_id, true),
    (plank_id, shoulders_id, false),
    (plank_id, glutes_id, false);
    
    INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required) VALUES
    (plank_id, yoga_mat_id, false);

    -- 5. Glute Bridge
    INSERT INTO exercises (
        original_id, name_en, name_ru, category_id, description, difficulty,
        sets_reps_duration, safety_cues, fun_variation, progression_notes,
        basketball_skills_improvement, is_balance_focused, estimated_duration_minutes
    ) VALUES (
        6, 'Glute Bridge', 'Ягодичный мостик', main_id,
        'Lying on back with bent knees, lifting pelvis up and holding at the top.',
        'Easy', '2-3 sets of 10-15 repetitions',
        ARRAY['Lift pelvis to straight line from knees to shoulders', 'Squeeze glutes at top', 'Push through heels'],
        'Rainbow Bridge', 'Single leg variation, add hold time, light weight',
        'Improves glute strength for jumping, acceleration and landing stability',
        false, 3
    ) RETURNING id INTO glute_bridge_id;
    
    INSERT INTO exercise_muscles (exercise_id, muscle_group_id, is_primary) VALUES
    (glute_bridge_id, glutes_id, true),
    (glute_bridge_id, hams_id, true),
    (glute_bridge_id, lower_back_id, true),
    (glute_bridge_id, core_id, false);
    
    INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required) VALUES
    (glute_bridge_id, yoga_mat_id, false);

END $$;

-- Insert Sample Adventures
INSERT INTO adventures (title, description, story_theme, total_exercises, difficulty_level, estimated_days, reward_points, display_order) VALUES
('Jungle Explorer', 'Journey through the wild jungle and discover amazing animal movements!', 'jungle', 8, 'Beginner', 7, 150, 1),
('Space Cadet Training', 'Train like an astronaut to become strong enough for space missions!', 'space', 10, 'Beginner', 10, 200, 2),
('Ocean Adventure', 'Dive deep into the ocean and move like sea creatures!', 'ocean', 6, 'Beginner', 5, 120, 3),
('Superhero Academy', 'Develop superhero strength and agility!', 'superhero', 12, 'Intermediate', 14, 300, 4);

-- Link exercises to adventures (using the exercise IDs we captured)
DO $$
DECLARE
    jungle_id uuid;
    space_id uuid;
    ocean_id uuid;
    superhero_id uuid;
    bear_crawl_id uuid;
    arm_circles_id uuid;
    squat_id uuid;
    plank_id uuid;
    glute_bridge_id uuid;
BEGIN
    -- Get adventure IDs
    SELECT id INTO jungle_id FROM adventures WHERE title = 'Jungle Explorer';
    SELECT id INTO space_id FROM adventures WHERE title = 'Space Cadet Training';
    SELECT id INTO ocean_id FROM adventures WHERE title = 'Ocean Adventure';
    SELECT id INTO superhero_id FROM adventures WHERE title = 'Superhero Academy';
    
    -- Get exercise IDs
    SELECT id INTO bear_crawl_id FROM exercises WHERE name_en = 'Animal Walks (Bear Crawl Race)';
    SELECT id INTO arm_circles_id FROM exercises WHERE name_en = 'Arm Circles';
    SELECT id INTO squat_id FROM exercises WHERE name_en = 'Bodyweight Squat';
    SELECT id INTO plank_id FROM exercises WHERE name_en = 'Plank';
    SELECT id INTO glute_bridge_id FROM exercises WHERE name_en = 'Glute Bridge';
    
    -- Jungle Explorer adventure
    INSERT INTO adventure_exercises (adventure_id, exercise_id, sequence_order, points_reward) VALUES
    (jungle_id, bear_crawl_id, 1, 20),
    (jungle_id, arm_circles_id, 2, 15),
    (jungle_id, squat_id, 3, 25);
    
    -- Space Cadet Training
    INSERT INTO adventure_exercises (adventure_id, exercise_id, sequence_order, points_reward) VALUES
    (space_id, plank_id, 1, 30),
    (space_id, squat_id, 2, 25),
    (space_id, glute_bridge_id, 3, 20);
    
    -- Ocean Adventure
    INSERT INTO adventure_exercises (adventure_id, exercise_id, sequence_order, points_reward) VALUES
    (ocean_id, glute_bridge_id, 1, 25),
    (ocean_id, plank_id, 2, 30);
    
    -- Superhero Academy (uses all exercises)
    INSERT INTO adventure_exercises (adventure_id, exercise_id, sequence_order, points_reward) VALUES
    (superhero_id, bear_crawl_id, 1, 25),
    (superhero_id, arm_circles_id, 2, 20),
    (superhero_id, squat_id, 3, 30),
    (superhero_id, plank_id, 4, 35),
    (superhero_id, glute_bridge_id, 5, 25);
END $$;

-- Insert Basic Rewards
INSERT INTO rewards (title, description, reward_type, icon, rarity, unlock_criteria, points_value) VALUES
('First Steps', 'Complete your very first exercise!', 'badge', 'award', 'common', '{"exercises_completed": 1}', 10),
('Getting Started', 'Complete 5 exercises', 'badge', 'star', 'common', '{"exercises_completed": 5}', 25),
('Exercise Explorer', 'Complete 10 different exercises', 'badge', 'compass', 'common', '{"unique_exercises": 10}', 50),
('Streak Starter', 'Exercise for 3 days in a row', 'badge', 'flame', 'rare', '{"streak_days": 3}', 75),
('Weekly Warrior', 'Exercise for 7 days in a row', 'trophy', 'trophy', 'rare', '{"streak_days": 7}', 150),
('Adventure Beginner', 'Complete your first adventure', 'badge', 'map', 'rare', '{"adventures_completed": 1}', 100),
('Balance Master', 'Complete 10 balance-focused exercises', 'badge', 'target', 'rare', '{"balance_exercises": 10}', 100),
('Strength Builder', 'Complete 50 exercises total', 'trophy', 'dumbbell', 'epic', '{"exercises_completed": 50}', 200),
('Fitness Champion', 'Complete 100 exercises total', 'trophy', 'crown', 'legendary', '{"exercises_completed": 100}', 500),
('Adventure Master', 'Complete 5 adventures', 'trophy', 'mountain', 'epic', '{"adventures_completed": 5}', 300);
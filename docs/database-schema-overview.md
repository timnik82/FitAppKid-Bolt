# Database Schema Overview for Children's Fitness App

## 1. Database Tables Overview (Updated)

### Core User Management
- **profiles** - Extended user information with COPPA compliance
- **parent_child_relationships** - Manages parent-child account linking

### Exercise Data (Normalized & Enhanced)
- **exercise_categories** - Exercise types (Warm-up, Main, Cool-down, Posture)
- **muscle_groups** - Muscle group definitions
- **equipment_types** - Equipment requirements
- **exercises** - Main exercise library with structured data parsing ✨ **ENHANCED**
- **exercise_muscles** - Exercise-to-muscle relationships (many-to-many)
- **exercise_equipment** - Exercise-to-equipment relationships (many-to-many)

### Progression System ✨ **NEW**
- **exercise_prerequisites** - Exercise unlock requirements and dependencies
- **adventure_paths** - Multi-week themed exercise journeys
- **path_exercises** - Path-to-exercise relationships with sequencing
- **user_path_progress** - User progress through adventure paths

### Gamification System
- **adventures** - Storyline-based exercise collections
- **adventure_exercises** - Adventure-to-exercise relationships
- **user_adventures** - User progress through adventures
- **rewards** - Achievement and reward definitions
- **user_rewards** - User-earned rewards tracking

### Progress Tracking (Enhanced)
- **exercise_sessions** - Individual workout session records
- **user_progress** - Aggregate progress and statistics with gamification metrics ✨ **ENHANCED**

## 2. Table Relationships (Updated)

```
profiles (users)
├── parent_child_relationships (parent_id, child_id)
├── exercise_sessions (user_id)
├── user_progress (user_id)
├── user_adventures (user_id)
├── user_path_progress (user_id) ✨ NEW
└── user_rewards (user_id)

exercises (main exercise data) ✨ ENHANCED
├── exercise_muscles (exercise_id → muscle_groups)
├── exercise_equipment (exercise_id → equipment_types)
├── exercise_prerequisites (exercise_id, prerequisite_exercise_id) ✨ NEW
├── adventure_exercises (exercise_id → adventures)
├── path_exercises (exercise_id → adventure_paths) ✨ NEW
└── exercise_sessions (exercise_id)

adventure_paths (progression journeys) ✨ NEW
├── path_exercises (path_id → exercises)
└── user_path_progress (path_id)

adventures (gamification)
├── adventure_exercises (adventure_id → exercises)
└── user_adventures (adventure_id)

rewards (achievements)
└── user_rewards (reward_id)
```

## 3. JSON to Database Column Mapping (Updated)

### Direct Mappings

| JSON Field | Database Table | Database Column | Notes |
|------------|----------------|-----------------|-------|
| `id` | exercises | original_id | Preserves original JSON ID |
| `exercise_name_en` | exercises | name_en | English exercise name |
| `exercise_name_ru` | exercises | name_ru | Russian exercise name |
| `description` | exercises | description | Exercise description |
| `difficulty` | exercises | difficulty | Easy/Medium/Hard |
| `fun_variation` | exercises | fun_variation | Direct mapping |
| `basketball_skills_improvement` | exercises | basketball_skills_improvement | Direct mapping |
| `is_balance_focused` | exercises | is_balance_focused | Boolean field |
| `data_source_file` | exercises | data_source | Source file reference |
| `safety_cues` | exercises | safety_cues | Text array |

### Structured Data Parsing ✨ **NEW**

| JSON Field | Database Implementation | Relationship |
|------------|------------------------|--------------|
| `sets_reps_duration` | exercises.min_sets, max_sets | Parsed set ranges from text |
| `sets_reps_duration` | exercises.min_reps, max_reps | Parsed repetition ranges from text |
| `sets_reps_duration` | exercises.min_duration_seconds, max_duration_seconds | Parsed duration ranges from text |
| `sets_reps_duration` | exercises.exercise_type | Inferred type: reps, duration, hold, distance |
| `sets_reps_duration` | exercises.structured_instructions | Cleaned instructions with structured data removed |

### Normalized Mappings

| JSON Field | Database Implementation | Relationship |
|------------|------------------------|--------------|
| `category` | exercise_categories table | exercises.category_id → exercise_categories.id |
| `primary_muscles` | muscle_groups + exercise_muscles | Many-to-many with is_primary=true |
| `secondary_muscles` | muscle_groups + exercise_muscles | Many-to-many with is_primary=false |
| `equipment` | equipment_types + exercise_equipment | Many-to-many relationship |

### Gamification Enhancements ✨ **NEW**

| Database Column | Source | Purpose |
|----------------|--------|---------|
| adventure_points | Derived from difficulty + duration | COPPA-compliant points system (replaces calories) |
| weekly_points_goal | Default value (100) | Gamified weekly goals |
| weekly_exercise_days | Calculated field | Consistency tracking |
| average_fun_rating | Aggregated from sessions | Engagement metrics |

## 4. Data Processing Status ✨ **UPDATED**

### Successfully Resolved ✅
- **sets_reps_duration parsing** - Implemented intelligent text parser with structured columns
- **Calorie estimates** - Replaced with adventure_points system (COPPA compliant)
- **Age ranges** - Added default 9-12 years for target demographic
- **Exercise duration** - Parsed from sets_reps_duration + duration_seconds field
- **Popularity metrics** - Added for future recommendation features
- **Safety cues** - Converted to PostgreSQL text array

### New Progression Features ✨
- **Exercise prerequisites** - New table for unlock requirements and skill progression
- **Adventure paths** - Multi-week themed journeys with structured progression
- **Path sequencing** - Ordered exercises with week-by-week unlocking
- **Progress tracking** - Comprehensive user progress through paths and prerequisites

### COPPA Compliance Enhancements ✅
- **Health data removal** - Removed all calorie and health-focused metrics
- **Engagement focus** - Points, fun ratings, and consistency tracking
- **Parent oversight** - Complete RLS system for family data isolation
- **Privacy controls** - Granular privacy settings with restrictive defaults

## 5. New Features & Capabilities ✨

### Structured Exercise Data
- **Intelligent Text Parsing**: Automatically parses "2-3 sets of 8-15 repetitions" into structured columns
- **Exercise Type Classification**: Categorizes exercises as reps, duration, hold, or distance-based
- **Range-Based Parameters**: Stores min/max values for sets, reps, and duration
- **Data Integrity Constraints**: Ensures logical ranges (min ≤ max) and positive values

### Progression System
- **Exercise Prerequisites**: Defines which exercises must be completed before others unlock
- **Adventure Paths**: Multi-week themed journeys with structured exercise sequences
- **Difficulty Scaling**: Beginner → Intermediate → Advanced path progression
- **Unlock System**: Exercises and paths unlock based on completion criteria

### Enhanced Queries Now Possible

```sql
-- Find exercises by duration range
SELECT * FROM exercises 
WHERE min_duration_seconds >= 30 AND max_duration_seconds <= 60;

-- Get beginner-friendly exercises (1 set, low reps)
SELECT * FROM exercises 
WHERE max_sets = 1 AND max_reps <= 10;

-- Find exercises by type with structured data
SELECT name_en, exercise_type, min_sets, max_sets, min_reps, max_reps
FROM exercises WHERE exercise_type = 'reps';

-- Get user's unlocked exercises based on prerequisites
SELECT e.* FROM exercises e 
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_prerequisites ep 
  WHERE ep.exercise_id = e.id 
  AND ep.prerequisite_exercise_id NOT IN (
    SELECT DISTINCT exercise_id FROM exercise_sessions 
    WHERE user_id = $1 AND completed_at IS NOT NULL
  )
);

-- Track user progress through adventure paths
SELECT ap.title, upp.progress_percentage, upp.exercises_completed, upp.status
FROM adventure_paths ap 
JOIN user_path_progress upp ON ap.id = upp.path_id 
WHERE upp.user_id = $1;
```

## 6. COPPA Compliance Features (Enhanced)

### Child Protection
- Parent consent tracking (parent_consent_given, parent_consent_date)
- Minimal data collection for children
- Privacy settings with default restrictive values
- Parent oversight of all child data

### Data Access Controls
- Row Level Security (RLS) on all tables
- Parents can view/manage child data
- Children can only access their own data
- Audit trail for data access

### Health Data Removal
- **Removed**: All calorie tracking and health metrics
- **Added**: Adventure points system for engagement
- **Focus**: Fun, consistency, and participation over performance

## 7. Gamification System (Enhanced)

### Adventure-Based Learning
- **Adventures** - Themed exercise collections (Jungle Explorer, Space Cadet, etc.)
- **Adventure Paths** - Multi-week journeys with progressive difficulty ✨ **NEW**
- **Progress Tracking** - User completion status and points
- **Rewards System** - Badges, trophies, and achievements

### Progression Features ✨ **NEW**
- **Prerequisites** - Skill-based exercise unlocking
- **Path Progression** - Structured learning journeys
- **Difficulty Scaling** - Beginner to Advanced pathways
- **Unlock Criteria** - Achievement-based content access

### Engagement Features
- Point-based progression (replaces calories)
- Streak tracking
- Achievement unlocking
- Fun exercise variations
- Consistency rewards

## 8. Performance Optimizations (Updated)

### Indexes
- User-based queries (user_id indexes)
- Exercise filtering (category, difficulty, duration, type) ✨ **NEW**
- Structured data queries (sets, reps, duration ranges) ✨ **NEW**
- Progress tracking (date-based indexes)
- Parent-child relationships
- Prerequisite lookups ✨ **NEW**

### Query Efficiency
- Denormalized progress data
- Efficient parent-child access patterns
- Optimized adventure progress queries
- Structured exercise data queries ✨ **NEW**
- Path progression tracking ✨ **NEW**

## 9. Future Extensibility (Enhanced)

### Ready for Enhancement
- Recommendation system (popularity_score + structured data)
- Advanced analytics (privacy-compliant)
- Personalized difficulty progression ✨ **NEW**
- Dynamic path generation ✨ **NEW**
- AI-powered exercise sequencing ✨ **NEW**
- Expanded reward systems
- Social features (with parental controls)

### Data Views ✨ **NEW**
- **exercise_structure** - Simplified view of parsed exercise data
- Easy querying of structured exercise information
- Formatted display of sets, reps, and duration ranges

## 10. Migration History

1. **Initial Schema** - Basic tables and relationships
2. **Gamification** - Adventures, rewards, and progress tracking
3. **COPPA Compliance** - Removed health data, added points system
4. **Structured Parsing** - Parsed sets_reps_duration into structured columns ✨ **LATEST**
5. **Progression System** - Added prerequisites and adventure paths ✨ **LATEST**

The database now provides a comprehensive, COPPA-compliant foundation for a children's fitness app with advanced progression tracking, structured exercise data, and engaging gamification features.
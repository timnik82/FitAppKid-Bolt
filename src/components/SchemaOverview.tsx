import React, { useState } from 'react';
import { Database, ArrowRight, AlertCircle, CheckCircle, XCircle, GitBranch, Table, Link, FileText, Zap, Target } from 'lucide-react';

const SchemaOverview = () => {
  const [activeTab, setActiveTab] = useState('tables');

  const tables = [
    {
      name: 'profiles',
      category: 'User Management',
      description: 'Extended user information with COPPA compliance',
      columns: 11,
      relationships: ['parent_child_relationships', 'exercise_sessions', 'user_progress', 'user_adventures', 'user_rewards', 'user_path_progress']
    },
    {
      name: 'parent_child_relationships',
      category: 'User Management',
      description: 'Manages parent-child account linking',
      columns: 8,
      relationships: ['profiles (parent_id)', 'profiles (child_id)']
    },
    {
      name: 'exercise_categories',
      category: 'Exercise Data',
      description: 'Exercise types (Warm-up, Main, Cool-down, Posture)',
      columns: 7,
      relationships: ['exercises']
    },
    {
      name: 'muscle_groups',
      category: 'Exercise Data',
      description: 'Muscle group definitions',
      columns: 4,
      relationships: ['exercise_muscles']
    },
    {
      name: 'equipment_types',
      category: 'Exercise Data',
      description: 'Equipment requirements',
      columns: 5,
      relationships: ['exercise_equipment']
    },
    {
      name: 'exercises',
      category: 'Exercise Data',
      description: 'Main exercise library with structured data parsing',
      columns: 29,
      relationships: ['exercise_muscles', 'exercise_equipment', 'adventure_exercises', 'path_exercises', 'exercise_sessions', 'exercise_prerequisites']
    },
    {
      name: 'exercise_muscles',
      category: 'Exercise Data',
      description: 'Exercise-to-muscle relationships (many-to-many)',
      columns: 3,
      relationships: ['exercises', 'muscle_groups']
    },
    {
      name: 'exercise_equipment',
      category: 'Exercise Data',
      description: 'Exercise-to-equipment relationships (many-to-many)',
      columns: 3,
      relationships: ['exercises', 'equipment_types']
    },
    {
      name: 'exercise_prerequisites',
      category: 'Progression System',
      description: 'Exercise unlock requirements and dependencies',
      columns: 6,
      relationships: ['exercises (exercise_id)', 'exercises (prerequisite_exercise_id)']
    },
    {
      name: 'adventures',
      category: 'Gamification',
      description: 'Storyline-based exercise collections',
      columns: 10,
      relationships: ['adventure_exercises', 'user_adventures', 'exercise_sessions']
    },
    {
      name: 'adventure_exercises',
      category: 'Gamification',
      description: 'Adventure-to-exercise relationships',
      columns: 5,
      relationships: ['adventures', 'exercises']
    },
    {
      name: 'adventure_paths',
      category: 'Progression System',
      description: 'Multi-week themed exercise journeys',
      columns: 12,
      relationships: ['path_exercises', 'user_path_progress']
    },
    {
      name: 'path_exercises',
      category: 'Progression System',
      description: 'Path-to-exercise relationships with sequencing',
      columns: 9,
      relationships: ['adventure_paths', 'exercises']
    },
    {
      name: 'user_adventures',
      category: 'Progress Tracking',
      description: 'User progress through adventures',
      columns: 10,
      relationships: ['profiles', 'adventures']
    },
    {
      name: 'user_path_progress',
      category: 'Progress Tracking',
      description: 'User progress through adventure paths',
      columns: 12,
      relationships: ['profiles', 'adventure_paths']
    },
    {
      name: 'rewards',
      category: 'Gamification',
      description: 'Achievement and reward definitions',
      columns: 9,
      relationships: ['user_rewards']
    },
    {
      name: 'user_rewards',
      category: 'Progress Tracking',
      description: 'User-earned rewards tracking',
      columns: 6,
      relationships: ['profiles', 'rewards', 'exercise_sessions']
    },
    {
      name: 'exercise_sessions',
      category: 'Progress Tracking',
      description: 'Individual workout session records',
      columns: 13,
      relationships: ['profiles', 'exercises', 'adventures']
    },
    {
      name: 'user_progress',
      category: 'Progress Tracking',
      description: 'Aggregate progress and statistics with gamification metrics',
      columns: 19,
      relationships: ['profiles', 'exercises (favorite_exercise_id)']
    }
  ];

  const jsonMapping = [
    {
      category: 'Direct Mappings',
      mappings: [
        { json: 'id', table: 'exercises', column: 'original_id', notes: 'Preserves original JSON ID' },
        { json: 'exercise_name_en', table: 'exercises', column: 'name_en', notes: 'English exercise name' },
        { json: 'exercise_name_ru', table: 'exercises', column: 'name_ru', notes: 'Russian exercise name' },
        { json: 'description', table: 'exercises', column: 'description', notes: 'Exercise description' },
        { json: 'difficulty', table: 'exercises', column: 'difficulty', notes: 'Easy/Medium/Hard' },
        { json: 'fun_variation', table: 'exercises', column: 'fun_variation', notes: 'Direct mapping' },
        { json: 'basketball_skills_improvement', table: 'exercises', column: 'basketball_skills_improvement', notes: 'Direct mapping' },
        { json: 'is_balance_focused', table: 'exercises', column: 'is_balance_focused', notes: 'Boolean field' },
        { json: 'data_source_file', table: 'exercises', column: 'data_source', notes: 'Source file reference' },
        { json: 'safety_cues', table: 'exercises', column: 'safety_cues', notes: 'Text array' }
      ]
    },
    {
      category: 'Structured Data Parsing (NEW)',
      mappings: [
        { json: 'sets_reps_duration', table: 'exercises', column: 'min_sets, max_sets', notes: 'Parsed set ranges from text' },
        { json: 'sets_reps_duration', table: 'exercises', column: 'min_reps, max_reps', notes: 'Parsed repetition ranges from text' },
        { json: 'sets_reps_duration', table: 'exercises', column: 'min_duration_seconds, max_duration_seconds', notes: 'Parsed duration ranges from text' },
        { json: 'sets_reps_duration', table: 'exercises', column: 'exercise_type', notes: 'Inferred type: reps, duration, hold, distance' },
        { json: 'sets_reps_duration', table: 'exercises', column: 'structured_instructions', notes: 'Cleaned instructions with structured data removed' }
      ]
    },
    {
      category: 'Normalized Mappings',
      mappings: [
        { json: 'category', table: 'exercise_categories + exercises', column: 'category_id', notes: 'Foreign key to exercise_categories.id' },
        { json: 'primary_muscles', table: 'muscle_groups + exercise_muscles', column: 'is_primary=true', notes: 'Many-to-many with primary flag' },
        { json: 'secondary_muscles', table: 'muscle_groups + exercise_muscles', column: 'is_primary=false', notes: 'Many-to-many with secondary flag' },
        { json: 'equipment', table: 'equipment_types + exercise_equipment', column: 'equipment_id', notes: 'Many-to-many relationship' }
      ]
    },
    {
      category: 'Gamification Enhancements (NEW)',
      mappings: [
        { json: 'N/A (new)', table: 'exercises', column: 'adventure_points', notes: 'COPPA-compliant points system (replaces calories)' },
        { json: 'N/A (new)', table: 'user_progress', column: 'weekly_points_goal', notes: 'Gamified weekly goals' },
        { json: 'N/A (new)', table: 'user_progress', column: 'weekly_exercise_days', notes: 'Consistency tracking' },
        { json: 'N/A (new)', table: 'user_progress', column: 'average_fun_rating', notes: 'Engagement metrics' }
      ]
    }
  ];

  const unmappedData = [
    {
      category: 'Successfully Resolved',
      items: [
        { field: 'sets_reps_duration parsing', solution: '✅ Implemented intelligent text parser with structured columns', status: 'resolved' },
        { field: 'Calorie estimates', solution: '✅ Replaced with adventure_points system (COPPA compliant)', status: 'resolved' },
        { field: 'Age ranges', solution: '✅ Added default 9-12 years for target demographic', status: 'resolved' },
        { field: 'Exercise duration', solution: '✅ Parsed from sets_reps_duration + duration_seconds field', status: 'resolved' },
        { field: 'Popularity metrics', solution: '✅ Added for future recommendation features', status: 'resolved' },
        { field: 'Safety cues', solution: '✅ Converted to PostgreSQL text array', status: 'resolved' }
      ]
    },
    {
      category: 'New Progression Features',
      items: [
        { field: 'Exercise prerequisites', solution: '✅ New table for unlock requirements and skill progression', status: 'new_feature' },
        { field: 'Adventure paths', solution: '✅ Multi-week themed journeys with structured progression', status: 'new_feature' },
        { field: 'Path sequencing', solution: '✅ Ordered exercises with week-by-week unlocking', status: 'new_feature' },
        { field: 'Progress tracking', solution: '✅ Comprehensive user progress through paths and prerequisites', status: 'new_feature' }
      ]
    },
    {
      category: 'COPPA Compliance Enhancements',
      items: [
        { field: 'Health data removal', solution: '✅ Removed all calorie and health-focused metrics', status: 'resolved' },
        { field: 'Engagement focus', solution: '✅ Points, fun ratings, and consistency tracking', status: 'resolved' },
        { field: 'Parent oversight', solution: '✅ Complete RLS system for family data isolation', status: 'resolved' },
        { field: 'Privacy controls', solution: '✅ Granular privacy settings with restrictive defaults', status: 'resolved' }
      ]
    }
  ];

  const relationships = [
    {
      from: 'profiles',
      to: 'parent_child_relationships',
      type: 'One-to-Many',
      description: 'A parent can have multiple children',
      keys: 'profiles.id → parent_child_relationships.parent_id'
    },
    {
      from: 'exercises',
      to: 'exercise_categories',
      type: 'Many-to-One',
      description: 'Each exercise belongs to one category',
      keys: 'exercises.category_id → exercise_categories.id'
    },
    {
      from: 'exercises',
      to: 'exercise_prerequisites',
      type: 'One-to-Many',
      description: 'Exercise can have multiple prerequisites for unlocking',
      keys: 'exercises.id → exercise_prerequisites.exercise_id'
    },
    {
      from: 'adventure_paths',
      to: 'path_exercises',
      type: 'One-to-Many',
      description: 'Path contains multiple exercises in sequence',
      keys: 'adventure_paths.id → path_exercises.path_id'
    },
    {
      from: 'profiles',
      to: 'user_path_progress',
      type: 'One-to-Many',
      description: 'User can progress through multiple adventure paths',
      keys: 'profiles.id → user_path_progress.user_id'
    },
    {
      from: 'exercises',
      to: 'exercise_muscles',
      type: 'One-to-Many',
      description: 'Exercise can target multiple muscle groups',
      keys: 'exercises.id → exercise_muscles.exercise_id'
    },
    {
      from: 'muscle_groups',
      to: 'exercise_muscles',
      type: 'One-to-Many',
      description: 'Muscle group can be used by multiple exercises',
      keys: 'muscle_groups.id → exercise_muscles.muscle_group_id'
    },
    {
      from: 'exercises',
      to: 'exercise_equipment',
      type: 'One-to-Many',
      description: 'Exercise can require multiple equipment types',
      keys: 'exercises.id → exercise_equipment.exercise_id'
    },
    {
      from: 'equipment_types',
      to: 'exercise_equipment',
      type: 'One-to-Many',
      description: 'Equipment can be used by multiple exercises',
      keys: 'equipment_types.id → exercise_equipment.equipment_id'
    },
    {
      from: 'adventures',
      to: 'adventure_exercises',
      type: 'One-to-Many',
      description: 'Adventure contains multiple exercises',
      keys: 'adventures.id → adventure_exercises.adventure_id'
    },
    {
      from: 'profiles',
      to: 'exercise_sessions',
      type: 'One-to-Many',
      description: 'User can have multiple exercise sessions',
      keys: 'profiles.id → exercise_sessions.user_id'
    },
    {
      from: 'profiles',
      to: 'user_progress',
      type: 'One-to-One',
      description: 'Each user has one progress record',
      keys: 'profiles.id → user_progress.user_id'
    }
  ];

  const newFeatures = [
    {
      category: 'Structured Exercise Data',
      features: [
        {
          name: 'Intelligent Text Parsing',
          description: 'Automatically parses "2-3 sets of 8-15 repetitions" into structured columns',
          benefit: 'Enables precise queries and automatic workout timing'
        },
        {
          name: 'Exercise Type Classification',
          description: 'Categorizes exercises as reps, duration, hold, or distance-based',
          benefit: 'Allows type-specific filtering and UI adaptations'
        },
        {
          name: 'Range-Based Parameters',
          description: 'Stores min/max values for sets, reps, and duration',
          benefit: 'Supports progressive difficulty and personalization'
        },
        {
          name: 'Data Integrity Constraints',
          description: 'Ensures logical ranges (min ≤ max) and positive values',
          benefit: 'Prevents invalid data and maintains consistency'
        }
      ]
    },
    {
      category: 'Progression System',
      features: [
        {
          name: 'Exercise Prerequisites',
          description: 'Defines which exercises must be completed before others unlock',
          benefit: 'Ensures safe skill progression and prevents injury'
        },
        {
          name: 'Adventure Paths',
          description: 'Multi-week themed journeys with structured exercise sequences',
          benefit: 'Provides long-term engagement and clear progression goals'
        },
        {
          name: 'Difficulty Scaling',
          description: 'Beginner → Intermediate → Advanced path progression',
          benefit: 'Adapts to user skill level and prevents overwhelming beginners'
        },
        {
          name: 'Unlock System',
          description: 'Exercises and paths unlock based on completion criteria',
          benefit: 'Gamifies progression and maintains motivation'
        }
      ]
    },
    {
      category: 'COPPA Compliance',
      features: [
        {
          name: 'Adventure Points System',
          description: 'Replaces calorie tracking with fun, game-like points',
          benefit: 'Maintains engagement without health data collection'
        },
        {
          name: 'Engagement Metrics',
          description: 'Tracks fun ratings, consistency, and participation',
          benefit: 'Focuses on positive relationship with exercise'
        },
        {
          name: 'Family Data Isolation',
          description: 'Complete RLS system ensuring data privacy',
          benefit: 'Parents can monitor children while maintaining security'
        },
        {
          name: 'Privacy-First Design',
          description: 'No sensitive health data collection or storage',
          benefit: 'Full COPPA compliance and child safety'
        }
      ]
    }
  ];

  const renderTablesView = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Database Overview</h3>
        </div>
        <p className="text-blue-800 text-sm">
          {tables.length} tables organized into 5 main categories: User Management, Exercise Data, Progression System, Gamification, and Progress Tracking
        </p>
      </div>

      {['User Management', 'Exercise Data', 'Progression System', 'Gamification', 'Progress Tracking'].map(category => (
        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">{category}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {tables.filter(table => table.category === category).map((table, idx) => (
              <div key={idx} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Table className="w-4 h-4 text-gray-500" />
                      {table.name}
                      {table.name === 'exercises' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Enhanced
                        </span>
                      )}
                      {table.category === 'Progression System' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          New
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-500">{table.columns} columns</div>
                    <div className="text-gray-400">{table.relationships.length} relationships</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Related to:</div>
                  <div className="flex flex-wrap gap-1">
                    {table.relationships.map((rel, rIdx) => (
                      <span key={rIdx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderRelationshipsView = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Table Relationships</h3>
        </div>
        <p className="text-green-800 text-sm">
          Foreign key relationships that maintain data integrity and enable complex queries, including new progression system relationships
        </p>
      </div>

      <div className="grid gap-4">
        {relationships.map((rel, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {rel.from}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                {rel.to}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {rel.type}
              </span>
              {(rel.to.includes('path') || rel.to.includes('prerequisite')) && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  New
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{rel.description}</p>
            <code className="text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded block">
              {rel.keys}
            </code>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMappingView = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">JSON to Database Mapping</h3>
        </div>
        <p className="text-purple-800 text-sm">
          How your original JSON exercise data maps to the normalized database structure, including new structured data parsing
        </p>
      </div>

      {jsonMapping.map((category, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {category.category}
              {category.category.includes('NEW') && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Latest Update
                </span>
              )}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {category.mappings.map((mapping, mIdx) => (
              <div key={mIdx} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {mapping.json}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {mapping.table}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Column:</strong> {mapping.column}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 max-w-xs text-right">
                    {mapping.notes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderUnmappedView = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">Data Processing & Enhancements</h3>
        </div>
        <p className="text-orange-800 text-sm">
          Status of data that required processing, enhancement, or new feature development
        </p>
      </div>

      {unmappedData.map((category, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">{category.category}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {category.items.map((item, iIdx) => (
              <div key={iIdx} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{item.field}</h4>
                      {item.status === 'resolved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {item.status === 'needs_review' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      {item.status === 'new_feature' && <Zap className="w-4 h-4 text-purple-500" />}
                    </div>
                    <p className="text-sm text-gray-600">{item.solution}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    item.status === 'needs_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Status Legend</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span><strong>Resolved:</strong> Successfully implemented</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span><strong>Needs Review:</strong> Requires further processing</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-500" />
            <span><strong>New Feature:</strong> Added for enhanced functionality</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesView = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-indigo-900">Latest Features & Enhancements</h3>
        </div>
        <p className="text-indigo-800 text-sm">
          New capabilities added to the database schema for enhanced functionality and user experience
        </p>
      </div>

      {newFeatures.map((category, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">{category.category}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {category.features.map((feature, fIdx) => (
              <div key={fIdx} className="p-4">
                <div className="mb-2">
                  <h4 className="font-medium text-gray-900 mb-1">{feature.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-2">
                    <p className="text-sm text-blue-800">
                      <strong>Benefit:</strong> {feature.benefit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">Query Examples Now Possible</h4>
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-medium text-green-800 mb-1">Find exercises by duration range:</div>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
              {`SELECT * FROM exercises WHERE min_duration_seconds >= 30 AND max_duration_seconds <= 60;`}
            </code>
          </div>
          <div>
            <div className="font-medium text-green-800 mb-1">Get user's unlocked exercises:</div>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
              {`SELECT e.* FROM exercises e WHERE NOT EXISTS (SELECT 1 FROM exercise_prerequisites ep WHERE ep.exercise_id = e.id AND ep.prerequisite_exercise_id NOT IN (completed_exercises));`}
            </code>
          </div>
          <div>
            <div className="font-medium text-green-800 mb-1">Track path progression:</div>
            <code className="block bg-gray-800 text-green-400 p-2 rounded text-xs">
              {`SELECT ap.title, upp.progress_percentage, upp.exercises_completed FROM adventure_paths ap JOIN user_path_progress upp ON ap.id = upp.path_id WHERE upp.user_id = $1;`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'tables', label: 'All Tables', icon: Database },
    { id: 'relationships', label: 'Relationships', icon: GitBranch },
    { id: 'mapping', label: 'JSON Mapping', icon: FileText },
    { id: 'unmapped', label: 'Data Processing', icon: AlertCircle },
    { id: 'features', label: 'New Features', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Database Schema Overview
          </h1>
          <p className="text-gray-600">
            Complete structure, relationships, and latest enhancements for the children's fitness app
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {(tab.id === 'features' || tab.id === 'unmapped') && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        Updated
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'tables' && renderTablesView()}
            {activeTab === 'relationships' && renderRelationshipsView()}
            {activeTab === 'mapping' && renderMappingView()}
            {activeTab === 'unmapped' && renderUnmappedView()}
            {activeTab === 'features' && renderFeaturesView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchemaOverview;
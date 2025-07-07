import React, { useState } from 'react';
import { Shield, Users, Trophy, Activity, Database, Lock, Star, Target } from 'lucide-react';

const DatabaseDashboard = () => {
  const [activeSection, setActiveSection] = useState('rls');

  const sections = [
    { id: 'rls', title: 'Row Level Security (RLS)', icon: Shield },
    { id: 'family', title: 'Parent-Child Relationships', icon: Users },
    { id: 'gamification', title: 'Gamification System', icon: Trophy },
    { id: 'tracking', title: 'Exercise Tracking', icon: Activity }
  ];

  const rlsPolicies = [
    {
      table: 'profiles',
      policies: [
        {
          name: 'Users can read own profile',
          type: 'SELECT',
          condition: 'uid() = id',
          description: 'Users can only view their own profile data'
        },
        {
          name: 'Users can update own profile',
          type: 'UPDATE',
          condition: 'uid() = id',
          description: 'Users can only modify their own profile'
        },
        {
          name: 'Parents can read children profiles',
          type: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships WHERE parent_id = uid() AND child_id = profiles.id AND active = true)',
          description: 'Parents can view their children\'s profiles'
        },
        {
          name: 'Parents can update children profiles',
          type: 'UPDATE',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships WHERE parent_id = uid() AND child_id = profiles.id AND active = true)',
          description: 'Parents can modify their children\'s profiles'
        }
      ]
    },
    {
      table: 'exercise_sessions',
      policies: [
        {
          name: 'Users can manage own exercise sessions',
          type: 'ALL',
          condition: 'user_id = uid()',
          description: 'Users have full control over their exercise data'
        },
        {
          name: 'Parents can view children exercise sessions',
          type: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships WHERE parent_id = uid() AND child_id = exercise_sessions.user_id AND active = true)',
          description: 'Parents can monitor their children\'s exercise activity'
        }
      ]
    },
    {
      table: 'user_progress',
      policies: [
        {
          name: 'Users can view own progress',
          type: 'SELECT',
          condition: 'user_id = uid()',
          description: 'Users can see their own progress statistics'
        },
        {
          name: 'Parents can view children progress',
          type: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships WHERE parent_id = uid() AND child_id = user_progress.user_id AND active = true)',
          description: 'Parents can track their children\'s progress'
        }
      ]
    }
  ];

  const familyStructure = {
    parentChildTable: {
      name: 'parent_child_relationships',
      columns: [
        { name: 'id', type: 'uuid', description: 'Primary key' },
        { name: 'parent_id', type: 'uuid', description: 'References profiles.id (parent account)' },
        { name: 'child_id', type: 'uuid', description: 'References profiles.id (child account)' },
        { name: 'relationship_type', type: 'text', description: 'parent | guardian' },
        { name: 'consent_given', type: 'boolean', description: 'COPPA consent status' },
        { name: 'consent_date', type: 'timestamptz', description: 'When consent was given' },
        { name: 'active', type: 'boolean', description: 'Relationship is active' }
      ]
    },
    profilesEnhancements: [
      { field: 'is_child', type: 'boolean', purpose: 'Identifies child accounts for COPPA compliance' },
      { field: 'parent_consent_given', type: 'boolean', purpose: 'Tracks parental consent' },
      { field: 'parent_consent_date', type: 'timestamptz', purpose: 'Audit trail for consent' },
      { field: 'privacy_settings', type: 'jsonb', purpose: 'Granular privacy controls' }
    ]
  };

  const gamificationTables = [
    {
      name: 'adventures',
      purpose: 'Themed exercise collections',
      columns: [
        { name: 'title', type: 'text', example: 'Jungle Explorer' },
        { name: 'story_theme', type: 'text', example: 'Navigate through the Amazon rainforest' },
        { name: 'total_exercises', type: 'integer', example: '10' },
        { name: 'difficulty_level', type: 'text', example: 'Beginner | Intermediate | Advanced' },
        { name: 'reward_points', type: 'integer', example: '100' }
      ]
    },
    {
      name: 'adventure_paths',
      purpose: 'Multi-week exercise journeys',
      columns: [
        { name: 'title', type: 'text', example: 'Space Cadet Training' },
        { name: 'theme', type: 'text', example: 'Astronaut fitness preparation' },
        { name: 'estimated_weeks', type: 'integer', example: '4' },
        { name: 'unlock_criteria', type: 'jsonb', example: '{"completed_paths": 1}' }
      ]
    },
    {
      name: 'rewards',
      purpose: 'Badges and achievements',
      columns: [
        { name: 'title', type: 'text', example: 'First Steps Badge' },
        { name: 'reward_type', type: 'text', example: 'badge | trophy | avatar | title' },
        { name: 'rarity', type: 'text', example: 'common | rare | epic | legendary' },
        { name: 'unlock_criteria', type: 'jsonb', example: '{"exercises_completed": 5}' }
      ]
    },
    {
      name: 'user_adventures',
      purpose: 'User progress through adventures',
      columns: [
        { name: 'status', type: 'text', example: 'not_started | in_progress | completed' },
        { name: 'progress_percentage', type: 'numeric', example: '75.50' },
        { name: 'exercises_completed', type: 'integer', example: '7' },
        { name: 'total_points_earned', type: 'integer', example: '85' }
      ]
    }
  ];

  const trackingFeatures = [
    {
      category: 'COPPA-Compliant Metrics',
      items: [
        { metric: 'Adventure Points', description: 'Gamified points instead of calories', table: 'exercises.adventure_points' },
        { metric: 'Completion Count', description: 'Number of exercises completed', table: 'user_progress.total_exercises_completed' },
        { metric: 'Streak Days', description: 'Consecutive days of activity', table: 'user_progress.current_streak_days' },
        { metric: 'Fun Rating', description: 'User enjoyment (1-5 stars)', table: 'exercise_sessions.fun_rating' }
      ]
    },
    {
      category: 'Progress Tracking',
      items: [
        { metric: 'Exercise Duration', description: 'Time spent (not health-focused)', table: 'exercise_sessions.duration_minutes' },
        { metric: 'Difficulty Progression', description: 'Easy → Medium → Hard', table: 'exercises.difficulty' },
        { metric: 'Adventure Progress', description: 'Story-based completion', table: 'user_adventures.progress_percentage' },
        { metric: 'Consistency Score', description: 'Regular participation tracking', table: 'user_progress.weekly_exercise_days' }
      ]
    },
    {
      category: 'Removed Health Metrics',
      items: [
        { metric: 'Calories Burned', description: '❌ Removed for COPPA compliance', table: 'N/A' },
        { metric: 'Heart Rate', description: '❌ Not collected (health data)', table: 'N/A' },
        { metric: 'Weight/BMI', description: '❌ Not collected (sensitive health data)', table: 'N/A' },
        { metric: 'Body Measurements', description: '❌ Not collected (body image concerns)', table: 'N/A' }
      ]
    }
  ];

  const renderRLSSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Data Isolation Strategy</h3>
        </div>
        <p className="text-blue-800 text-sm">
          Every table uses Row Level Security to ensure users can only access their own data, 
          with special provisions for parents to monitor their children's activity.
        </p>
      </div>

      {rlsPolicies.map((table, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4" />
              {table.table}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {table.policies.map((policy, pIdx) => (
              <div key={pIdx} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{policy.name}</h4>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {policy.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                <code className="text-xs bg-gray-100 p-2 rounded block overflow-x-auto">
                  {policy.condition}
                </code>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFamilySection = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">COPPA-Compliant Family Management</h3>
        </div>
        <p className="text-green-800 text-sm">
          Parent accounts can create and manage child profiles with proper consent tracking 
          and privacy controls built into the database structure.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Relationship Table</h3>
          </div>
          <div className="p-4">
            <h4 className="font-medium mb-3">{familyStructure.parentChildTable.name}</h4>
            <div className="space-y-2">
              {familyStructure.parentChildTable.columns.map((col, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-sm text-blue-600">{col.name}</span>
                    <span className="text-gray-500 text-xs ml-2">({col.type})</span>
                  </div>
                  <span className="text-xs text-gray-600 text-right max-w-xs">
                    {col.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Profile Enhancements</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {familyStructure.profilesEnhancements.map((field, idx) => (
                <div key={idx} className="border-l-4 border-blue-200 pl-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-blue-600">{field.field}</span>
                    <span className="text-gray-500 text-xs">({field.type})</span>
                  </div>
                  <p className="text-xs text-gray-600">{field.purpose}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">How It Works</h4>
        <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
          <li>Parent creates account and verifies email</li>
          <li>Parent creates child profile with consent confirmation</li>
          <li>Relationship record created with consent timestamp</li>
          <li>RLS policies automatically grant parent access to child data</li>
          <li>Child can use app while parent maintains oversight</li>
        </ol>
      </div>
    </div>
  );

  const renderGamificationSection = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Story-Driven Exercise System</h3>
        </div>
        <p className="text-purple-800 text-sm">
          Exercises are wrapped in engaging narratives and adventure themes to make 
          fitness fun and motivating for children, with achievement systems that 
          focus on participation rather than performance metrics.
        </p>
      </div>

      <div className="grid gap-6">
        {gamificationTables.map((table, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{table.name}</h3>
                <span className="text-sm text-gray-600">{table.purpose}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="grid gap-3">
                {table.columns.map((col, cIdx) => (
                  <div key={cIdx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-blue-600">{col.name}</span>
                      <span className="text-gray-500 text-xs">({col.type})</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{col.example}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Progression System
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full mb-2">Adventures</div>
            <p className="text-indigo-800">Short themed collections (5-10 exercises)</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full mb-2">Paths</div>
            <p className="text-indigo-800">Multi-week journeys with unlockable content</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full mb-2">Rewards</div>
            <p className="text-indigo-800">Badges and achievements for milestones</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrackingSection = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">Privacy-First Progress Tracking</h3>
        </div>
        <p className="text-orange-800 text-sm">
          All tracking focuses on engagement, consistency, and fun rather than health metrics. 
          No sensitive health data is collected to ensure COPPA compliance and promote 
          positive relationships with physical activity.
        </p>
      </div>

      {trackingFeatures.map((category, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">{category.category}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {category.items.map((item, iIdx) => (
              <div key={iIdx} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{item.metric}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <div className="text-right">
                  <span className={`font-mono text-xs px-2 py-1 rounded ${
                    item.table === 'N/A' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {item.table}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2">Key Benefits</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• <strong>COPPA Compliant:</strong> No health data collection</li>
          <li>• <strong>Positive Focus:</strong> Emphasizes fun and participation</li>
          <li>• <strong>Parent Friendly:</strong> Transparent progress without pressure</li>
          <li>• <strong>Child Safe:</strong> Promotes healthy relationship with exercise</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Children's Fitness App Database Structure
          </h1>
          <p className="text-gray-600">
            COPPA-compliant database design with family data isolation and gamified progress tracking
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">Sections</h2>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeSection === 'rls' && renderRLSSection()}
              {activeSection === 'family' && renderFamilySection()}
              {activeSection === 'gamification' && renderGamificationSection()}
              {activeSection === 'tracking' && renderTrackingSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseDashboard;
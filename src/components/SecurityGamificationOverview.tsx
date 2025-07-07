import React, { useState } from 'react';
import { Shield, Users, Trophy, Activity, Lock, Star, Heart, XCircle, CheckCircle, Database, UserCheck, Gamepad2 } from 'lucide-react';

const SecurityGamificationOverview = () => {
  const [activeSection, setActiveSection] = useState('rls');

  const sections = [
    { id: 'rls', title: 'Row Level Security Policies', icon: Shield },
    { id: 'family', title: 'Parent-Child Relationships', icon: Users },
    { id: 'gamification', title: 'Gamification System', icon: Trophy },
    { id: 'tracking', title: 'COPPA-Compliant Tracking', icon: Activity }
  ];

  // RLS Policies from the actual schema
  const rlsPolicies = [
    {
      table: 'profiles',
      description: 'User profile data with family access controls',
      policies: [
        {
          name: 'Users can read own profile',
          operation: 'SELECT',
          condition: 'uid() = id',
          description: 'Users can only view their own profile information',
          example: 'SELECT * FROM profiles WHERE id = auth.uid();'
        },
        {
          name: 'Users can update own profile',
          operation: 'UPDATE',
          condition: 'uid() = id',
          description: 'Users can only modify their own profile',
          example: 'UPDATE profiles SET display_name = $1 WHERE id = auth.uid();'
        },
        {
          name: 'Parents can read children profiles',
          operation: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships pcr WHERE pcr.parent_id = uid() AND pcr.child_id = profiles.id AND pcr.active = true)',
          description: 'Parents can view their children\'s profiles',
          example: 'Automatic access when querying child data'
        },
        {
          name: 'Parents can update children profiles',
          operation: 'UPDATE',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships pcr WHERE pcr.parent_id = uid() AND pcr.child_id = profiles.id AND pcr.active = true)',
          description: 'Parents can modify their children\'s settings',
          example: 'Parents can update privacy settings for children'
        }
      ]
    },
    {
      table: 'exercise_sessions',
      description: 'Individual workout records with family monitoring',
      policies: [
        {
          name: 'Users can manage own exercise sessions',
          operation: 'ALL',
          condition: 'user_id = uid()',
          description: 'Full CRUD access to own exercise data',
          example: 'INSERT INTO exercise_sessions (user_id, exercise_id, duration_minutes) VALUES (auth.uid(), $1, $2);'
        },
        {
          name: 'Parents can view children exercise sessions',
          operation: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships pcr WHERE pcr.parent_id = uid() AND pcr.child_id = exercise_sessions.user_id AND pcr.active = true)',
          description: 'Parents can monitor children\'s exercise activity',
          example: 'SELECT * FROM exercise_sessions WHERE user_id = $child_id;'
        }
      ]
    },
    {
      table: 'user_progress',
      description: 'Aggregate progress statistics with parental access',
      policies: [
        {
          name: 'Users can view own progress',
          operation: 'SELECT',
          condition: 'user_id = uid()',
          description: 'Users can see their progress statistics',
          example: 'SELECT total_exercises_completed, current_streak_days FROM user_progress WHERE user_id = auth.uid();'
        },
        {
          name: 'Users can update own progress',
          operation: 'UPDATE',
          condition: 'user_id = uid()',
          description: 'Users can update their progress (via triggers)',
          example: 'Automatic updates when completing exercises'
        },
        {
          name: 'Parents can view children progress',
          operation: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships pcr WHERE pcr.parent_id = uid() AND pcr.child_id = user_progress.user_id AND pcr.active = true)',
          description: 'Parents can track children\'s overall progress',
          example: 'Dashboard showing child\'s streaks and achievements'
        }
      ]
    },
    {
      table: 'user_adventures',
      description: 'Adventure progress with family oversight',
      policies: [
        {
          name: 'Users can manage own adventure progress',
          operation: 'ALL',
          condition: 'user_id = uid()',
          description: 'Full control over adventure participation',
          example: 'UPDATE user_adventures SET status = \'completed\' WHERE user_id = auth.uid();'
        },
        {
          name: 'Parents can view children adventure progress',
          operation: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships pcr WHERE pcr.parent_id = uid() AND pcr.child_id = user_adventures.user_id AND pcr.active = true)',
          description: 'Parents can see which adventures children are doing',
          example: 'Parent dashboard showing child\'s adventure completion'
        }
      ]
    },
    {
      table: 'user_rewards',
      description: 'Earned badges and achievements with family sharing',
      policies: [
        {
          name: 'Users can manage own rewards',
          operation: 'ALL',
          condition: 'user_id = uid()',
          description: 'Full access to earned rewards and badges',
          example: 'SELECT * FROM user_rewards WHERE user_id = auth.uid();'
        },
        {
          name: 'Parents can view children rewards',
          operation: 'SELECT',
          condition: 'EXISTS (SELECT 1 FROM parent_child_relationships pcr WHERE pcr.parent_id = uid() AND pcr.child_id = user_rewards.user_id AND pcr.active = true)',
          description: 'Parents can celebrate children\'s achievements',
          example: 'Parent can see all badges child has earned'
        }
      ]
    }
  ];

  // Parent-Child Relationship System
  const parentChildSystem = {
    mainTable: {
      name: 'parent_child_relationships',
      purpose: 'Links parent accounts to child accounts with consent tracking',
      columns: [
        { name: 'id', type: 'uuid', description: 'Primary key' },
        { name: 'parent_id', type: 'uuid', description: 'References parent\'s profile.id' },
        { name: 'child_id', type: 'uuid', description: 'References child\'s profile.id' },
        { name: 'relationship_type', type: 'text', description: 'parent | guardian (for legal clarity)' },
        { name: 'consent_given', type: 'boolean', description: 'COPPA parental consent status' },
        { name: 'consent_date', type: 'timestamptz', description: 'Timestamp of consent for audit trail' },
        { name: 'active', type: 'boolean', description: 'Relationship can be deactivated' },
        { name: 'created_at', type: 'timestamptz', description: 'When relationship was established' }
      ]
    },
    profileEnhancements: [
      { field: 'is_child', type: 'boolean', purpose: 'Identifies accounts under 13 for COPPA compliance' },
      { field: 'parent_consent_given', type: 'boolean', purpose: 'Direct consent tracking on child profile' },
      { field: 'parent_consent_date', type: 'timestamptz', purpose: 'Audit trail for consent timing' },
      { field: 'privacy_settings', type: 'jsonb', purpose: 'Granular privacy controls (data_sharing, analytics)' },
      { field: 'preferred_language', type: 'text', purpose: 'EN/RU language preference for localization' }
    ],
    workflow: [
      { step: 1, action: 'Parent Registration', description: 'Parent creates account and verifies email' },
      { step: 2, action: 'Child Profile Creation', description: 'Parent creates child profile with birth date' },
      { step: 3, action: 'Age Verification', description: 'System identifies if child is under 13' },
      { step: 4, action: 'Consent Recording', description: 'Parent consent recorded with timestamp' },
      { step: 5, action: 'Relationship Linking', description: 'parent_child_relationships record created' },
      { step: 6, action: 'RLS Activation', description: 'Parent automatically gains access to child data' },
      { step: 7, action: 'Ongoing Oversight', description: 'Parent can monitor and manage child\'s activity' }
    ]
  };

  // Gamification System Structure
  const gamificationTables = [
    {
      name: 'adventures',
      purpose: 'Story-driven exercise collections',
      icon: '🏔️',
      columns: [
        { name: 'title / title_ru', example: 'Jungle Explorer / Исследователь джунглей' },
        { name: 'story_theme / story_theme_ru', example: 'Navigate the Amazon rainforest / Навигация по тропическому лесу Амазонки' },
        { name: 'total_exercises', example: '8-12 exercises per adventure' },
        { name: 'difficulty_level', example: 'Beginner | Intermediate | Advanced' },
        { name: 'reward_points', example: '100 points for completion' }
      ],
      sampleData: [
        { title: 'Space Cadet Training', theme: 'Astronaut fitness preparation', exercises: 10, points: 120 },
        { title: 'Ninja Academy', theme: 'Stealth and agility training', exercises: 8, points: 100 },
        { title: 'Superhero Bootcamp', theme: 'Build your superpowers', exercises: 12, points: 150 }
      ]
    },
    {
      name: 'adventure_paths',
      purpose: 'Multi-week themed journeys',
      icon: '🗺️',
      columns: [
        { name: 'title / title_ru', example: 'Warrior Training Path / Путь подготовки воина' },
        { name: 'theme / theme_ru', example: 'Ancient warrior conditioning / Кондиционирование древних воинов' },
        { name: 'estimated_weeks', example: '4-8 weeks per path' },
        { name: 'total_exercises', example: 'Progressive difficulty scaling' },
        { name: 'unlock_criteria', example: '{"completed_paths": 1}' }
      ],
      sampleData: [
        { title: 'Young Explorer', weeks: 3, difficulty: 'Beginner', unlock: 'Available immediately' },
        { title: 'Forest Ranger', weeks: 5, difficulty: 'Intermediate', unlock: 'Complete Young Explorer' },
        { title: 'Mountain Climber', weeks: 8, difficulty: 'Advanced', unlock: 'Complete Forest Ranger' }
      ]
    },
    {
      name: 'rewards',
      purpose: 'Badges, trophies, and achievements',
      icon: '🏆',
      columns: [
        { name: 'title / title_ru', example: 'First Steps Badge / Значок первых шагов' },
        { name: 'reward_type', example: 'badge | trophy | avatar | title | power_up' },
        { name: 'rarity', example: 'common | rare | epic | legendary' },
        { name: 'unlock_criteria', example: '{"exercises_completed": 5}' },
        { name: 'points_value', example: '0-50 bonus points' }
      ],
      sampleData: [
        { title: 'Early Bird', type: 'badge', rarity: 'common', criteria: 'Exercise before 9 AM' },
        { title: 'Consistency Champion', type: 'trophy', rarity: 'rare', criteria: '7-day streak' },
        { title: 'Adventure Master', type: 'title', rarity: 'epic', criteria: 'Complete 5 adventures' },
        { title: 'Ultimate Warrior', type: 'avatar', rarity: 'legendary', criteria: 'Complete advanced path' }
      ]
    },
    {
      name: 'user_adventures',
      purpose: 'Track user progress through adventures',
      icon: '📈',
      columns: [
        { name: 'status', example: 'not_started | in_progress | completed | paused' },
        { name: 'progress_percentage', example: '0.00 to 100.00' },
        { name: 'exercises_completed', example: 'Running count' },
        { name: 'total_points_earned', example: 'Points from this adventure' },
        { name: 'started_at / completed_at', example: 'Timing tracking' }
      ]
    },
    {
      name: 'user_path_progress',
      purpose: 'Track progress through adventure paths',
      icon: '🛤️',
      columns: [
        { name: 'status', example: 'locked | available | in_progress | completed' },
        { name: 'current_week', example: 'Week 1, 2, 3...' },
        { name: 'exercises_completed', example: 'Total exercises in path' },
        { name: 'progress_percentage', example: 'Overall path completion' }
      ]
    },
    {
      name: 'user_rewards',
      purpose: 'Track earned badges and achievements',
      icon: '⭐',
      columns: [
        { name: 'earned_at', example: 'Timestamp of achievement' },
        { name: 'is_new', example: 'Highlight new achievements' },
        { name: 'earned_from_session_id', example: 'Link to triggering exercise session' }
      ]
    }
  ];

  // COPPA-Compliant Tracking System
  const trackingSystem = {
    allowedMetrics: [
      {
        category: 'Engagement Metrics (✅ COPPA Safe)',
        metrics: [
          { name: 'Adventure Points', field: 'adventure_points', description: 'Gamified points instead of calories', example: '10-50 points per exercise' },
          { name: 'Fun Rating', field: 'fun_rating', description: 'User enjoyment (1-5 stars)', example: 'How fun was this exercise?' },
          { name: 'Effort Rating', field: 'effort_rating', description: 'Perceived exertion (1-5)', example: 'How hard did you work?' },
          { name: 'Completion Count', field: 'total_exercises_completed', description: 'Number of exercises finished', example: '47 exercises completed' },
          { name: 'Streak Days', field: 'current_streak_days', description: 'Consecutive days active', example: '5-day streak!' },
          { name: 'Consistency Score', field: 'weekly_exercise_days', description: 'Days active per week', example: '4 out of 7 days this week' }
        ]
      },
      {
        category: 'Progress Metrics (✅ COPPA Safe)',
        metrics: [
          { name: 'Duration Minutes', field: 'duration_minutes', description: 'Time spent (not health-focused)', example: '15 minutes of movement' },
          { name: 'Sets Completed', field: 'sets_completed', description: 'Number of exercise sets', example: '3 sets of jumping jacks' },
          { name: 'Reps Completed', field: 'reps_completed', description: 'Number of repetitions', example: '20 reps completed' },
          { name: 'Adventure Progress', field: 'progress_percentage', description: 'Story completion percentage', example: '75% through Jungle Explorer' },
          { name: 'Points Goal Progress', field: 'weekly_points_goal', description: 'Weekly adventure points target', example: '85/100 points this week' },
          { name: 'Average Fun Rating', field: 'average_fun_rating', description: 'Overall enjoyment tracking', example: '4.2/5.0 average fun score' }
        ]
      }
    ],
    prohibitedMetrics: [
      {
        category: 'Health Data (❌ COPPA Prohibited)',
        metrics: [
          { name: 'Calories Burned', reason: 'Health data - can promote unhealthy relationships with food' },
          { name: 'Heart Rate', reason: 'Biometric data - sensitive health information' },
          { name: 'Weight/BMI Tracking', reason: 'Health data - can cause body image issues' },
          { name: 'Body Measurements', reason: 'Sensitive health data - COPPA prohibited' },
          { name: 'Performance Comparisons', reason: 'Can create pressure and self-esteem issues' },
          { name: 'Fitness Assessments', reason: 'Health evaluations inappropriate for children' }
        ]
      },
      {
        category: 'Sensitive Personal Data (❌ COPPA Prohibited)',
        metrics: [
          { name: 'Location Data', reason: 'Geographic information - privacy concern' },
          { name: 'Photo/Video Recordings', reason: 'Image data of children - COPPA restricted' },
          { name: 'Real Names', reason: 'Personal identification - use display names only' },
          { name: 'Contact Information', reason: 'Personal data - restricted for children' },
          { name: 'Social Sharing', reason: 'Public exposure - requires special protections' },
          { name: 'Third-party Tracking', reason: 'External data sharing - COPPA restricted' }
        ]
      }
    ],
    dataFlow: [
      { step: 1, process: 'Exercise Completion', data: 'Duration, sets, reps, fun rating, effort rating' },
      { step: 2, process: 'Points Calculation', data: 'Adventure points based on difficulty and completion' },
      { step: 3, process: 'Progress Update', data: 'Update streaks, totals, and adventure progress' },
      { step: 4, process: 'Achievement Check', data: 'Check for earned badges and rewards' },
      { step: 5, process: 'Parent Notification', data: 'Optional summary for parent dashboard' }
    ]
  };

  const renderRLSSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Complete Data Isolation Strategy</h3>
        </div>
        <p className="text-blue-800 text-sm">
          Every table uses Row Level Security to ensure users can only access their own data, 
          with carefully controlled exceptions for parents to monitor their children's activity under COPPA guidelines.
        </p>
      </div>

      {rlsPolicies.map((table, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-4 h-4" />
                {table.table}
              </h3>
              <span className="text-sm text-gray-600">{table.description}</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {table.policies.map((policy, pIdx) => (
              <div key={pIdx} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{policy.name}</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {policy.operation}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mb-2">
                  <div className="text-xs text-gray-500 mb-1">SQL Condition:</div>
                  <code className="text-xs text-gray-700 break-all">
                    {policy.condition}
                  </code>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">Usage Example:</div>
                  <code className="text-xs text-blue-800">
                    {policy.example}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Security Benefits
        </h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• <strong>Complete Data Isolation:</strong> Users can never access other families' data</li>
          <li>• <strong>Automatic Enforcement:</strong> RLS policies enforced at database level</li>
          <li>• <strong>Parent Oversight:</strong> Parents can monitor children while maintaining privacy</li>
          <li>• <strong>COPPA Compliant:</strong> Child data is protected with parental controls</li>
          <li>• <strong>Audit Trail:</strong> All data access is logged and traceable</li>
        </ul>
      </div>
    </div>
  );

  const renderFamilySection = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">COPPA-Compliant Family Account Management</h3>
        </div>
        <p className="text-green-800 text-sm">
          Secure parent-child account linking with full consent tracking, privacy controls, 
          and the ability for parents to monitor their children's activity safely.
        </p>
      </div>

      {/* Main Relationship Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Core Relationship Table</h3>
        </div>
        <div className="p-4">
          <h4 className="font-medium mb-3 text-blue-600">{parentChildSystem.mainTable.name}</h4>
          <p className="text-sm text-gray-600 mb-4">{parentChildSystem.mainTable.purpose}</p>
          <div className="grid gap-3">
            {parentChildSystem.mainTable.columns.map((col, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-blue-600">{col.name}</span>
                  <span className="text-gray-500 text-xs">({col.type})</span>
                </div>
                <span className="text-sm text-gray-700 max-w-md text-right">{col.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Enhancements */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Profile Table Enhancements</h3>
        </div>
        <div className="p-4">
          <div className="grid gap-3">
            {parentChildSystem.profileEnhancements.map((field, idx) => (
              <div key={idx} className="border-l-4 border-green-200 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-green-600">{field.field}</span>
                  <span className="text-gray-500 text-xs">({field.type})</span>
                </div>
                <p className="text-xs text-gray-600">{field.purpose}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow Process */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Family Account Setup Workflow</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {parentChildSystem.workflow.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{step.action}</h4>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          COPPA Compliance Features
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-yellow-800 mb-1">Consent Management</h5>
            <ul className="text-yellow-700 space-y-1">
              <li>• Verifiable parental consent required</li>
              <li>• Consent timestamp for audit trail</li>
              <li>• Consent can be withdrawn anytime</li>
              <li>• Relationship can be deactivated</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-yellow-800 mb-1">Data Protection</h5>
            <ul className="text-yellow-700 space-y-1">
              <li>• Child age verification automatic</li>
              <li>• Privacy settings default to restrictive</li>
              <li>• Parent can modify child's settings</li>
              <li>• Complete data access transparency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGamificationSection = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-purple-900">Story-Driven Gamification System</h3>
        </div>
        <p className="text-purple-800 text-sm">
          Comprehensive adventure and reward system that makes exercise engaging through storytelling, 
          achievement unlocking, and progression tracking - all without performance pressure.
        </p>
      </div>

      {gamificationTables.map((table, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-lg">{table.icon}</span>
                {table.name}
              </h3>
              <span className="text-sm text-gray-600">{table.purpose}</span>
            </div>
          </div>
          <div className="p-4">
            {/* Column Structure */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Table Structure:</h4>
              <div className="grid gap-2">
                {table.columns.map((col, cIdx) => (
                  <div key={cIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="font-mono text-blue-600">{col.name}</span>
                    <span className="text-gray-700">{col.example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Data (if available) */}
            {table.sampleData && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Example Content:</h4>
                <div className="grid gap-2">
                  {table.sampleData.map((sample, sIdx) => (
                    <div key={sIdx} className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-900 mb-1">{sample.title}</div>
                      <div className="text-sm text-blue-700">
                        {sample.theme && <span>{sample.theme} • </span>}
                        {sample.exercises && <span>{sample.exercises} exercises • </span>}
                        {sample.weeks && <span>{sample.weeks} weeks • </span>}
                        {sample.difficulty && <span>{sample.difficulty} • </span>}
                        {sample.points && <span>{sample.points} points</span>}
                        {sample.rarity && <span>{sample.rarity} rarity</span>}
                        {sample.criteria && <span>{sample.criteria}</span>}
                        {sample.unlock && <span>{sample.unlock}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4" />
          Gamification Flow
        </h4>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full mb-2">Start</div>
            <p className="text-indigo-800">User picks an adventure or follows a path</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full mb-2">Progress</div>
            <p className="text-indigo-800">Complete exercises, earn points, track fun rating</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full mb-2">Achieve</div>
            <p className="text-indigo-800">Unlock badges, complete adventures, level up</p>
          </div>
          <div className="text-center">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full mb-2">Share</div>
            <p className="text-indigo-800">Parents see achievements, celebrate progress</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrackingSection = () => (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">COPPA-Compliant Exercise Tracking</h3>
        </div>
        <p className="text-orange-800 text-sm">
          Complete exercise tracking focused on engagement, fun, and consistency rather than health metrics. 
          No sensitive health data is collected to ensure child safety and positive relationships with physical activity.
        </p>
      </div>

      {/* Allowed Metrics */}
      {trackingSystem.allowedMetrics.map((category, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-200">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {category.category}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {category.metrics.map((metric, mIdx) => (
              <div key={mIdx} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{metric.name}</h4>
                    <p className="text-sm text-gray-600 mb-1">{metric.description}</p>
                    <div className="bg-green-50 px-2 py-1 rounded text-xs text-green-800">
                      Example: {metric.example}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {metric.field}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Prohibited Metrics */}
      {trackingSystem.prohibitedMetrics.map((category, idx) => (
        <div key={idx} className="border border-red-200 rounded-lg overflow-hidden">
          <div className="bg-red-50 px-4 py-3 border-b border-red-200">
            <h3 className="font-semibold text-red-900 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {category.category}
            </h3>
          </div>
          <div className="divide-y divide-red-100">
            {category.metrics.map((metric, mIdx) => (
              <div key={mIdx} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{metric.name}</h4>
                    <p className="text-sm text-red-700">{metric.reason}</p>
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      PROHIBITED
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Data Flow */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Exercise Data Flow</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {trackingSystem.dataFlow.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{step.process}</h4>
                  <p className="text-xs text-gray-600">{step.data}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Star className="w-4 h-4" />
          Key Benefits of This Approach
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-800 mb-1">Child Safety</h5>
            <ul className="text-blue-700 space-y-1">
              <li>• No health data collection</li>
              <li>• No performance pressure</li>
              <li>• Focus on fun and engagement</li>
              <li>• Positive relationship with exercise</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-1">COPPA Compliance</h5>
            <ul className="text-blue-700 space-y-1">
              <li>• Minimal data collection</li>
              <li>• No sensitive personal information</li>
              <li>• Parent visibility and control</li>
              <li>• Age-appropriate tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Security & Gamification Overview
          </h1>
          <p className="text-gray-600">
            Comprehensive overview of RLS policies, family management, gamification system, and COPPA-compliant tracking
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-4">
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

export default SecurityGamificationOverview;
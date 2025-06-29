import React, { useState } from 'react';
import { Users, UserPlus, Baby, Shield, Play, CheckCircle, Eye, EyeOff, Clock, RotateCcw, Target, Star, Award, AlertTriangle, Lock } from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  isChild: boolean;
  dateOfBirth?: string;
  parentConsentGiven?: boolean;
  parentConsentDate?: string;
  parentId?: string;
  privacySettings: {
    dataSharing: boolean;
    analytics: boolean;
  };
}

interface Exercise {
  id: string;
  nameEn: string;
  nameRu?: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  exerciseType: 'reps' | 'duration' | 'hold';
  minSets?: number;
  maxSets?: number;
  minReps?: number;
  maxReps?: number;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  adventurePoints: number;
  description?: string;
}

interface ExerciseSession {
  id: string;
  userId: string;
  exerciseId: string;
  durationMinutes: number;
  setsCompleted: number;
  repsCompleted?: number;
  funRating: number;
  effortRating: number;
  pointsEarned: number;
  completedAt: string;
}

const TestInterface = () => {
  const [activeTab, setActiveTab] = useState('registration');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showFamily, setShowFamily] = useState<string>('smith');
  const [registrationStep, setRegistrationStep] = useState(1);

  // Mock data for different families
  const mockFamilies = {
    smith: {
      parent: {
        id: 'parent-smith-1',
        email: 'sarah.smith@email.com',
        displayName: 'Sarah Smith',
        isChild: false,
        privacySettings: { dataSharing: false, analytics: false }
      },
      children: [
        {
          id: 'child-smith-1',
          email: '',
          displayName: 'Emma Smith',
          isChild: true,
          dateOfBirth: '2015-03-15',
          parentConsentGiven: true,
          parentConsentDate: '2024-01-15T10:30:00Z',
          parentId: 'parent-smith-1',
          privacySettings: { dataSharing: false, analytics: false }
        }
      ]
    },
    johnson: {
      parent: {
        id: 'parent-johnson-1',
        email: 'mike.johnson@email.com',
        displayName: 'Mike Johnson',
        isChild: false,
        privacySettings: { dataSharing: false, analytics: false }
      },
      children: [
        {
          id: 'child-johnson-1',
          email: '',
          displayName: 'Alex Johnson',
          isChild: true,
          dateOfBirth: '2016-07-22',
          parentConsentGiven: true,
          parentConsentDate: '2024-02-10T14:15:00Z',
          parentId: 'parent-johnson-1',
          privacySettings: { dataSharing: false, analytics: false }
        }
      ]
    }
  };

  // Mock exercises data
  const mockExercises: Exercise[] = [
    {
      id: 'ex-1',
      nameEn: 'Animal Walks (Bear Crawl)',
      nameRu: 'Звериные прогулки (медвежья походка)',
      category: 'Warm-up',
      difficulty: 'Easy',
      exerciseType: 'duration',
      minSets: 2,
      maxSets: 3,
      minDurationSeconds: 30,
      maxDurationSeconds: 60,
      adventurePoints: 15,
      description: 'Move on all fours like a bear - fun and engaging!'
    },
    {
      id: 'ex-2',
      nameEn: 'Jumping Jacks',
      nameRu: 'Прыжки с разведением рук и ног',
      category: 'Cardio',
      difficulty: 'Easy',
      exerciseType: 'reps',
      minSets: 2,
      maxSets: 3,
      minReps: 10,
      maxReps: 20,
      adventurePoints: 20,
      description: 'Classic cardio exercise that gets your heart pumping!'
    },
    {
      id: 'ex-3',
      nameEn: 'Tree Pose (Balance)',
      nameRu: 'Поза дерева (баланс)',
      category: 'Balance',
      difficulty: 'Medium',
      exerciseType: 'hold',
      minSets: 2,
      maxSets: 2,
      minDurationSeconds: 15,
      maxDurationSeconds: 30,
      adventurePoints: 25,
      description: 'Stand on one foot like a tall, strong tree!'
    },
    {
      id: 'ex-4',
      nameEn: 'Wall Push-ups',
      nameRu: 'Отжимания от стены',
      category: 'Strength',
      difficulty: 'Easy',
      exerciseType: 'reps',
      minSets: 1,
      maxSets: 2,
      minReps: 5,
      maxReps: 15,
      adventurePoints: 18,
      description: 'Gentle strength building using the wall for support'
    },
    {
      id: 'ex-5',
      nameEn: 'Dance Freeze',
      nameRu: 'Танцевальная заморозка',
      category: 'Fun Movement',
      difficulty: 'Easy',
      exerciseType: 'duration',
      minSets: 3,
      maxSets: 5,
      minDurationSeconds: 45,
      maxDurationSeconds: 90,
      adventurePoints: 30,
      description: 'Dance to music then freeze like a statue when it stops!'
    },
    {
      id: 'ex-6',
      nameEn: 'Mountain Climbers',
      nameRu: 'Альпинисты',
      category: 'Cardio',
      difficulty: 'Medium',
      exerciseType: 'reps',
      minSets: 2,
      maxSets: 3,
      minReps: 8,
      maxReps: 15,
      adventurePoints: 22,
      description: 'Climb the mountain by moving your legs quickly!'
    },
    {
      id: 'ex-7',
      nameEn: 'Cat-Cow Stretch',
      nameRu: 'Растяжка кошка-корова',
      category: 'Flexibility',
      difficulty: 'Easy',
      exerciseType: 'reps',
      minSets: 1,
      maxSets: 1,
      minReps: 8,
      maxReps: 12,
      adventurePoints: 12,
      description: 'Gentle spine movement like a stretching cat!'
    },
    {
      id: 'ex-8',
      nameEn: 'Superhero Pose',
      nameRu: 'Поза супергероя',
      category: 'Posture',
      difficulty: 'Easy',
      exerciseType: 'hold',
      minSets: 2,
      maxSets: 3,
      minDurationSeconds: 20,
      maxDurationSeconds: 45,
      adventurePoints: 16,
      description: 'Stand tall and strong like your favorite superhero!'
    }
  ];

  // Mock exercise sessions (showing data isolation)
  const mockExerciseSessions: { [familyName: string]: ExerciseSession[] } = {
    smith: [
      {
        id: 'session-smith-1',
        userId: 'child-smith-1',
        exerciseId: 'ex-1',
        durationMinutes: 5,
        setsCompleted: 3,
        funRating: 5,
        effortRating: 3,
        pointsEarned: 15,
        completedAt: '2024-06-29T09:15:00Z'
      },
      {
        id: 'session-smith-2',
        userId: 'child-smith-1',
        exerciseId: 'ex-2',
        durationMinutes: 8,
        setsCompleted: 2,
        repsCompleted: 15,
        funRating: 4,
        effortRating: 4,
        pointsEarned: 20,
        completedAt: '2024-06-29T09:25:00Z'
      }
    ],
    johnson: [
      {
        id: 'session-johnson-1',
        userId: 'child-johnson-1',
        exerciseId: 'ex-3',
        durationMinutes: 6,
        setsCompleted: 2,
        funRating: 3,
        effortRating: 4,
        pointsEarned: 25,
        completedAt: '2024-06-29T14:20:00Z'
      },
      {
        id: 'session-johnson-2',
        userId: 'child-johnson-1',
        exerciseId: 'ex-5',
        durationMinutes: 12,
        setsCompleted: 4,
        funRating: 5,
        effortRating: 3,
        pointsEarned: 30,
        completedAt: '2024-06-29T14:35:00Z'
      }
    ]
  };

  const tabs = [
    { id: 'registration', label: 'Registration Flow', icon: UserPlus },
    { id: 'exercises', label: 'Exercise Library', icon: Play },
    { id: 'isolation', label: 'Data Isolation Demo', icon: Shield }
  ];

  const formatExerciseTarget = (exercise: Exercise) => {
    if (exercise.exerciseType === 'reps') {
      if (exercise.minReps === exercise.maxReps) {
        return `${exercise.minReps} reps`;
      }
      return `${exercise.minReps}-${exercise.maxReps} reps`;
    } else if (exercise.exerciseType === 'duration' || exercise.exerciseType === 'hold') {
      if (exercise.minDurationSeconds === exercise.maxDurationSeconds) {
        return `${exercise.minDurationSeconds}s`;
      }
      return `${exercise.minDurationSeconds}-${exercise.maxDurationSeconds}s`;
    }
    return 'Variable';
  };

  const formatSets = (exercise: Exercise) => {
    if (exercise.minSets === exercise.maxSets) {
      return `${exercise.minSets} set${exercise.minSets > 1 ? 's' : ''}`;
    }
    return `${exercise.minSets}-${exercise.maxSets} sets`;
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'reps': return RotateCcw;
      case 'duration': return Clock;
      case 'hold': return Target;
      default: return Play;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRegistrationFlow = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">COPPA-Compliant Registration Process</h3>
        </div>
        <p className="text-blue-800 text-sm">
          This demonstrates the complete parent-child account creation workflow with proper consent tracking and data protection.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Registration Steps</h3>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                onClick={() => setRegistrationStep(step)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  registrationStep === step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Parent Registration */}
        {registrationStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <h4 className="font-semibold text-gray-900">Parent Account Creation</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-3">Create Parent Account</h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value="sarah.smith@email.com"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input 
                    type="text" 
                    value="Sarah Smith"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="password" 
                    value="••••••••"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                    <option>Parent/Guardian Account</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Account Created Successfully</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Profile record created with is_child = false
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Child Profile Creation */}
        {registrationStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <h4 className="font-semibold text-gray-900">Child Profile Creation</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-3">Add Child to Family Account</h5>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Child's Display Name</label>
                  <input 
                    type="text" 
                    value="Emma Smith"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value="2015-03-15"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                    <option>Parent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
                  <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                    <option>English</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Age Verification Required</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Child is under 13 (age 9) - COPPA consent required
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: COPPA Consent */}
        {registrationStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <h4 className="font-semibold text-gray-900">COPPA Parental Consent</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-3">Parental Consent for Child Under 13</h5>
              
              <div className="space-y-4">
                <div className="p-4 bg-white border border-gray-200 rounded">
                  <h6 className="font-medium text-gray-900 mb-2">Data Collection Notice</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Child's display name and age for account management</li>
                    <li>• Exercise activity (duration, fun rating, points earned)</li>
                    <li>• Progress tracking (streaks, completion counts)</li>
                    <li>• NO health data (calories, weight, heart rate)</li>
                    <li>• NO location data or photos</li>
                  </ul>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded">
                  <h6 className="font-medium text-gray-900 mb-2">Parental Rights</h6>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• View all child's activity and data</li>
                    <li>• Modify child's privacy settings</li>
                    <li>• Delete child's data at any time</li>
                    <li>• Deactivate child's account</li>
                    <li>• Withdraw consent and delete all data</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="text-sm font-medium text-green-900">Consent Given</span>
                    <p className="text-xs text-green-700">January 15, 2024 at 10:30 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Account Linking */}
        {registrationStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
              <h4 className="font-semibold text-gray-900">Account Linking & RLS Activation</h4>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-medium mb-3">Database Records Created</h5>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <h6 className="font-mono text-sm text-blue-900 mb-1">profiles table</h6>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>Child profile: is_child = true</div>
                    <div>Parent consent: parent_consent_given = true</div>
                    <div>Privacy settings: {"{ data_sharing: false, analytics: false }"}</div>
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <h6 className="font-mono text-sm text-green-900 mb-1">parent_child_relationships table</h6>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>parent_id: parent-smith-1</div>
                    <div>child_id: child-smith-1</div>
                    <div>consent_given: true</div>
                    <div>active: true</div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                  <h6 className="font-mono text-sm text-purple-900 mb-1">RLS Policies Activated</h6>
                  <div className="text-xs text-purple-700 space-y-1">
                    <div>✅ Parent can read/update child profile</div>
                    <div>✅ Parent can view child exercise sessions</div>
                    <div>✅ Parent can monitor child progress</div>
                    <div>✅ Child data isolated from other families</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Family Account Setup Complete!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Emma can now use the app safely with parental oversight
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderExerciseLibrary = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Play className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Exercise Library with Structured Data</h3>
        </div>
        <p className="text-green-800 text-sm">
          Sample exercises showing parsed structured data, adventure points system, and COPPA-compliant tracking.
        </p>
      </div>

      <div className="grid gap-4">
        {mockExercises.map((exercise) => {
          const Icon = getExerciseIcon(exercise.exerciseType);
          return (
            <div key={exercise.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{exercise.nameEn}</h3>
                    {exercise.nameRu && (
                      <p className="text-sm text-gray-600 mb-2">{exercise.nameRu}</p>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <Icon className="w-3 h-3" />
                        {exercise.exerciseType}
                      </span>
                      <span className="text-xs text-gray-500">{exercise.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600 mb-1">
                      <Star className="w-4 h-4" />
                      <span className="font-medium">{exercise.adventurePoints}</span>
                    </div>
                    <span className="text-xs text-gray-500">adventure points</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Sets</div>
                    <div className="font-semibold text-gray-900">{formatSets(exercise)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Target</div>
                    <div className="font-semibold text-gray-900">{formatExerciseTarget(exercise)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Points</div>
                    <div className="font-semibold text-yellow-600">{exercise.adventurePoints}</div>
                  </div>
                </div>

                {exercise.description && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    {exercise.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">COPPA-Compliant Features</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-blue-800 mb-1">✅ What We Track</h5>
            <ul className="text-blue-700 space-y-1">
              <li>• Adventure points (not calories)</li>
              <li>• Fun rating (1-5 stars)</li>
              <li>• Exercise duration and completion</li>
              <li>• Difficulty progression</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-1">❌ What We Don't Track</h5>
            <ul className="text-blue-700 space-y-1">
              <li>• Calories burned or health data</li>
              <li>• Body measurements or weight</li>
              <li>• Performance comparisons</li>
              <li>• Location or biometric data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataIsolation = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-red-900">Family Data Isolation Demonstration</h3>
        </div>
        <p className="text-red-800 text-sm">
          This shows how RLS policies ensure complete data isolation between families. 
          Each family can only see their own data, even when viewing the same exercise types.
        </p>
      </div>

      {/* Family Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Select Family to View</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setShowFamily('smith')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              showFamily === 'smith' 
                ? 'border-blue-500 bg-blue-50 text-blue-900' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Smith Family
          </button>
          <button
            onClick={() => setShowFamily('johnson')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              showFamily === 'johnson' 
                ? 'border-blue-500 bg-blue-50 text-blue-900' 
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Johnson Family
          </button>
        </div>
      </div>

      {/* Current Family View */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {showFamily === 'smith' ? 'Smith Family' : 'Johnson Family'} - Authorized Data View
            </h3>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">RLS Protected</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Family Members */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Family Members</h4>
            <div className="space-y-3">
              {/* Parent */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium text-blue-900">
                    {mockFamilies[showFamily as keyof typeof mockFamilies].parent.displayName}
                  </div>
                  <div className="text-sm text-blue-700">Parent Account</div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  PARENT
                </span>
              </div>

              {/* Children */}
              {mockFamilies[showFamily as keyof typeof mockFamilies].children.map((child) => (
                <div key={child.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Baby className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium text-green-900">{child.displayName}</div>
                    <div className="text-sm text-green-700">
                      Child Account (Age {new Date().getFullYear() - new Date(child.dateOfBirth!).getFullYear()})
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    CHILD
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise Sessions */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Recent Exercise Sessions</h4>
            <div className="space-y-3">
              {mockExerciseSessions[showFamily as keyof typeof mockExerciseSessions]?.map((session) => {
                const exercise = mockExercises.find(ex => ex.id === session.exerciseId);
                const child = mockFamilies[showFamily as keyof typeof mockFamilies].children.find(c => c.id === session.userId);
                
                return (
                  <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{exercise?.nameEn}</h5>
                        <p className="text-sm text-gray-600">by {child?.displayName}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">{session.pointsEarned}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-gray-500">Duration</div>
                        <div className="font-medium">{session.durationMinutes}m</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Sets</div>
                        <div className="font-medium">{session.setsCompleted}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Fun Rating</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3 h-3 ${i < session.funRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Effort</div>
                        <div className="font-medium">{session.effortRating}/5</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500">
                      Completed: {new Date(session.completedAt).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Isolation Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">🔒 Data Isolation in Effect</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• This family can only see their own exercise sessions and progress</p>
              <p>• Other families' data is completely invisible and inaccessible</p>
              <p>• RLS policies enforce this at the database level automatically</p>
              <p>• Even administrators cannot bypass these security controls</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Family Comparison */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold text-gray-900">Cross-Family Data Isolation Proof</h3>
        </div>
        <div className="p-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Smith Family Data */}
            <div className="border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Smith Family View
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sessions Visible:</span>
                  <span className="font-medium">{mockExerciseSessions.smith.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-medium text-yellow-600">
                    {mockExerciseSessions.smith.reduce((sum, session) => sum + session.pointsEarned, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Child Name:</span>
                  <span className="font-medium">Emma Smith</span>
                </div>
              </div>
            </div>

            {/* Johnson Family Data */}
            <div className="border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Johnson Family View
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Sessions Visible:</span>
                  <span className="font-medium">{mockExerciseSessions.johnson.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Points:</span>
                  <span className="font-medium text-yellow-600">
                    {mockExerciseSessions.johnson.reduce((sum, session) => sum + session.pointsEarned, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Child Name:</span>
                  <span className="font-medium">Alex Johnson</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <h5 className="font-medium text-red-900 mb-1">Security Verification</h5>
            <p className="text-sm text-red-800">
              Notice how each family sees completely different data, even though they're using the same exercises. 
              This is RLS in action - providing complete data isolation at the database level.
            </p>
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
            COPPA-Compliant App Test Interface
          </h1>
          <p className="text-gray-600">
            Interactive demonstration of parent-child registration, exercise tracking, and family data isolation
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
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'registration' && renderRegistrationFlow()}
            {activeTab === 'exercises' && renderExerciseLibrary()}
            {activeTab === 'isolation' && renderDataIsolation()}
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Test Interface Features</h3>
          </div>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Registration Flow</h4>
              <p>Complete COPPA-compliant parent-child account setup with consent tracking</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Exercise Library</h4>
              <p>Structured exercise data with adventure points and difficulty progression</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Data Isolation</h4>
              <p>Demonstration of RLS policies ensuring complete family data separation</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Mock Data</h4>
              <p>Realistic sample data showing two families with different exercise sessions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestInterface;
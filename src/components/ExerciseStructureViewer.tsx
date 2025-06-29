import React, { useState } from 'react';
import { Database, Clock, RotateCcw, Target, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ExerciseStructure {
  id: string;
  name_en: string;
  exercise_type: 'reps' | 'duration' | 'hold' | 'distance';
  min_sets?: number;
  max_sets?: number;
  min_reps?: number;
  max_reps?: number;
  min_duration_seconds?: number;
  max_duration_seconds?: number;
  structured_instructions?: string;
  original_text?: string;
}

const ExerciseStructureViewer = () => {
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Sample data - in real app this would come from your database
  const sampleExercises: ExerciseStructure[] = [
    {
      id: '1',
      name_en: 'Animal Walks (Bear Crawl Race)',
      exercise_type: 'duration',
      min_sets: 2,
      max_sets: 3,
      min_duration_seconds: 30,
      max_duration_seconds: 60,
      structured_instructions: 'Children move on all fours, imitating bear movements',
      original_text: '2-3 sets of 30-60 seconds'
    },
    {
      id: '2',
      name_en: 'Arm Circles',
      exercise_type: 'reps',
      min_sets: 1,
      max_sets: 1,
      min_reps: 10,
      max_reps: 15,
      structured_instructions: 'in each direction',
      original_text: '10-15 circles in each direction'
    },
    {
      id: '3',
      name_en: 'Bodyweight Squat',
      exercise_type: 'reps',
      min_sets: 2,
      max_sets: 3,
      min_reps: 8,
      max_reps: 15,
      structured_instructions: 'repetitions',
      original_text: '2-3 sets of 8-15 repetitions'
    },
    {
      id: '4',
      name_en: 'Plank',
      exercise_type: 'hold',
      min_sets: 2,
      max_sets: 3,
      min_duration_seconds: 20,
      max_duration_seconds: 45,
      structured_instructions: '',
      original_text: '2-3 sets of 20-45 seconds'
    }
  ];

  const exerciseTypes = [
    { value: 'all', label: 'All Types', icon: Database },
    { value: 'reps', label: 'Repetitions', icon: RotateCcw },
    { value: 'duration', label: 'Duration', icon: Clock },
    { value: 'hold', label: 'Hold/Static', icon: Target }
  ];

  const filteredExercises = selectedType === 'all' 
    ? sampleExercises 
    : sampleExercises.filter(ex => ex.exercise_type === selectedType);

  const formatSets = (exercise: ExerciseStructure) => {
    if (!exercise.min_sets) return 'Variable';
    if (exercise.min_sets === exercise.max_sets) {
      return `${exercise.min_sets} set${exercise.min_sets > 1 ? 's' : ''}`;
    }
    return `${exercise.min_sets}-${exercise.max_sets} sets`;
  };

  const formatTarget = (exercise: ExerciseStructure) => {
    if (exercise.exercise_type === 'reps') {
      if (!exercise.min_reps) return 'Variable reps';
      if (exercise.min_reps === exercise.max_reps) {
        return `${exercise.min_reps} reps`;
      }
      return `${exercise.min_reps}-${exercise.max_reps} reps`;
    } else if (exercise.exercise_type === 'duration' || exercise.exercise_type === 'hold') {
      if (!exercise.min_duration_seconds) return 'Variable duration';
      if (exercise.min_duration_seconds === exercise.max_duration_seconds) {
        return `${exercise.min_duration_seconds}s`;
      }
      return `${exercise.min_duration_seconds}-${exercise.max_duration_seconds}s`;
    }
    return 'See instructions';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reps': return RotateCcw;
      case 'duration': return Clock;
      case 'hold': return Target;
      default: return Database;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reps': return 'bg-blue-100 text-blue-800';
      case 'duration': return 'bg-green-100 text-green-800';
      case 'hold': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exercise Structure Parser Results
          </h1>
          <p className="text-gray-600">
            Structured data extracted from sets_reps_duration text fields
          </p>
        </div>

        {/* Migration Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Migration Completed Successfully</h3>
          </div>
          <p className="text-green-800 text-sm">
            All exercises with sets_reps_duration data have been parsed into structured columns.
            The original text is preserved for reference.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {exerciseTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      selectedType === type.value
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="grid gap-6">
          {filteredExercises.map((exercise) => {
            const TypeIcon = getTypeIcon(exercise.exercise_type);
            return (
              <div key={exercise.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {exercise.name_en}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(exercise.exercise_type)}`}>
                          <TypeIcon className="w-3 h-3" />
                          {exercise.exercise_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    {/* Sets */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Sets</div>
                      <div className="font-semibold text-gray-900">{formatSets(exercise)}</div>
                    </div>

                    {/* Target (Reps or Duration) */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {exercise.exercise_type === 'reps' ? 'Repetitions' : 'Duration'}
                      </div>
                      <div className="font-semibold text-gray-900">{formatTarget(exercise)}</div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Additional Notes</div>
                      <div className="text-sm text-gray-700">
                        {exercise.structured_instructions || 'None'}
                      </div>
                    </div>
                  </div>

                  {/* Original vs Parsed Comparison */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-gray-700">Original Text</span>
                        </div>
                        <div className="text-sm text-gray-600 bg-orange-50 p-2 rounded">
                          {exercise.original_text}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">Structured Data</span>
                        </div>
                        <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                          {formatSets(exercise)} of {formatTarget(exercise)}
                          {exercise.structured_instructions && ` (${exercise.structured_instructions})`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Benefits of Structured Data</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">Query Capabilities</h4>
              <ul className="space-y-1">
                <li>• Filter exercises by duration range</li>
                <li>• Find exercises with specific set counts</li>
                <li>• Sort by exercise complexity</li>
                <li>• Group by exercise type</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Application Features</h4>
              <ul className="space-y-1">
                <li>• Automatic workout timing</li>
                <li>• Progressive difficulty scaling</li>
                <li>• Personalized recommendations</li>
                <li>• Better progress tracking</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SQL Examples */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Example Queries Now Possible</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Find quick exercises (under 1 minute)</div>
              <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                SELECT * FROM exercises WHERE max_duration_seconds &lt; 60;
              </code>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Find beginner-friendly exercises (1 set, low reps)</div>
              <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                SELECT * FROM exercises WHERE max_sets = 1 AND max_reps &lt;= 10;
              </code>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Get exercises by type with duration range</div>
              <code className="block text-xs bg-gray-800 text-green-400 p-2 rounded">
                SELECT name_en, min_duration_seconds, max_duration_seconds FROM exercises WHERE exercise_type = 'hold';
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseStructureViewer;
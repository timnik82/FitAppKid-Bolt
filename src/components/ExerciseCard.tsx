import React from 'react';
import { Clock, Star, Zap, Users, Target } from 'lucide-react';

interface Exercise {
  id: string;
  name_en: string;
  name_ru: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: {
    id: string;
    name_ru: string;
    name_en: string;
    color_hex: string;
    icon: string;
  };
  equipment: Array<{
    id: string;
    name_ru: string;
    name_en: string;
    required: boolean;
    icon: string;
  }>;
  muscles: Array<{
    id: string;
    name_ru: string;
    name_en: string;
    is_primary: boolean;
  }>;
  sets_reps_duration: string;
  fun_variation: string;
  adventure_points: number;
  estimated_duration_minutes: number;
  is_balance_focused: boolean;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onStart?: (exercise: Exercise) => void;
  onViewDetails?: (exercise: Exercise) => void;
  compact?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  exercise, 
  onStart, 
  onViewDetails, 
  compact = false 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'Hard': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getDifficultyName = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'Легко';
      case 'Medium': return 'Средне';
      case 'Hard': return 'Сложно';
      default: return difficulty;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap': return <Zap className="w-4 h-4" />;
      case 'dumbbell': return '💪';
      case 'leaf': return '🍃';
      case 'user-check': return <Users className="w-4 h-4" />;
      default: return '🏃‍♂️';
    }
  };

  const handleStart = () => {
    if (onStart) {
      onStart(exercise);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(exercise);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 group">
      {/* Header with Category and Difficulty */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div
            className="flex items-center px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
            style={{ backgroundColor: exercise.category?.color_hex || '#6B7280' }}
          >
            <span className="mr-1">
              {getCategoryIcon(exercise.category?.icon || '')}
            </span>
            {exercise.category?.name_ru || 'Общее'}
          </div>
          <div
            className="px-2 py-1 rounded text-xs font-medium text-white shadow-sm"
            style={{ backgroundColor: getDifficultyColor(exercise.difficulty) }}
          >
            {getDifficultyName(exercise.difficulty)}
          </div>
        </div>

        {/* Balance Focus Indicator */}
        {exercise.is_balance_focused && (
          <div className="inline-flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium mb-3">
            <Target className="w-3 h-3 mr-1" />
            Упражнение на баланс
          </div>
        )}

        {/* Exercise Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {exercise.name_ru || exercise.name_en}
        </h3>

        {/* Fun Variation */}
        {exercise.fun_variation && (
          <p className="text-sm text-blue-600 font-medium mb-2">
            🎮 {exercise.fun_variation}
          </p>
        )}
      </div>

      {/* Description */}
      {!compact && (
        <div className="px-4 pb-0">
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {exercise.description}
          </p>
        </div>
      )}

      {/* Exercise Details */}
      <div className="px-4 pb-0">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {exercise.sets_reps_duration && (
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-xs leading-tight">
                {exercise.sets_reps_duration}
              </span>
            </div>
          )}
          
          {exercise.adventure_points && (
            <div className="flex items-center text-sm text-gray-600 bg-yellow-50 p-2 rounded">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              <span className="text-xs leading-tight">
                {exercise.adventure_points} очков
              </span>
            </div>
          )}
          
          {exercise.estimated_duration_minutes && (
            <div className="flex items-center text-sm text-gray-600 bg-green-50 p-2 rounded">
              <Zap className="w-4 h-4 mr-2 text-green-500" />
              <span className="text-xs leading-tight">
                {exercise.estimated_duration_minutes} мин
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Primary Muscles */}
      {!compact && exercise.muscles && exercise.muscles.length > 0 && (
        <div className="px-4 pb-0">
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Основные мышцы:</p>
            <div className="flex flex-wrap gap-1">
              {exercise.muscles
                .filter(muscle => muscle.is_primary)
                .slice(0, 3)
                .map((muscle) => (
                  <span
                    key={muscle.id}
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium"
                  >
                    {muscle.name_ru || muscle.name_en}
                  </span>
                ))}
              {exercise.muscles.filter(m => m.is_primary).length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                  +{exercise.muscles.filter(m => m.is_primary).length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Equipment */}
      {!compact && exercise.equipment && exercise.equipment.length > 0 && (
        <div className="px-4 pb-0">
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Оборудование:</p>
            <div className="flex flex-wrap gap-1">
              {exercise.equipment.slice(0, 3).map((eq) => (
                <span
                  key={eq.id}
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    eq.required 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {eq.name_ru || eq.name_en}
                  {eq.required && ' *'}
                </span>
              ))}
              {exercise.equipment.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                  +{exercise.equipment.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4">
        <div className={`flex gap-2 ${compact ? 'flex-col' : 'flex-row'}`}>
          <button
            onClick={handleStart}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm hover:shadow-md flex items-center justify-center"
            style={{ minHeight: '44px' }}
            aria-label={`Начать упражнение ${exercise.name_ru || exercise.name_en}`}
          >
            <span className="mr-2">🚀</span>
            Начать
          </button>
          
          {onViewDetails && (
            <button
              onClick={handleViewDetails}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors shadow-sm hover:shadow-md flex items-center justify-center"
              style={{ minHeight: '44px' }}
              aria-label={`Подробнее о упражнении ${exercise.name_ru || exercise.name_en}`}
            >
              <span className="mr-2">📋</span>
              Подробнее
            </button>
          )}
        </div>
      </div>

      {/* Accessibility Enhancement */}
      <div className="sr-only">
        Упражнение {exercise.name_ru || exercise.name_en}, 
        категория {exercise.category?.name_ru}, 
        сложность {getDifficultyName(exercise.difficulty)}, 
        продолжительность {exercise.estimated_duration_minutes} минут, 
        {exercise.adventure_points} очков приключений
      </div>
    </div>
  );
};

export default ExerciseCard;
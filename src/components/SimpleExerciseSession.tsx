import React, { useState, useEffect } from 'react';

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
  sets_reps_duration: string;
  fun_variation: string;
  adventure_points: number;
  estimated_duration_minutes: number;
  is_balance_focused: boolean;
}

interface SimpleExerciseSessionProps {
  exercise: Exercise;
  childProfileId: string;
  onComplete: (result: {
    exerciseId: string;
    duration: number;
    funRating: number;
    pointsEarned: number;
    completed: boolean;
  }) => void;
  onCancel: () => void;
}

const SimpleExerciseSession: React.FC<SimpleExerciseSessionProps> = ({
  exercise,
  childProfileId,
  onComplete,
  onCancel
}) => {
  console.log('🔵 SimpleExerciseSession mounted:', { 
    exerciseName: exercise?.name_ru || exercise?.name_en,
    childProfileId,
    exerciseId: exercise?.id 
  });

  const [sessionState, setSessionState] = useState<'preparing' | 'active' | 'paused' | 'completed'>('preparing');
  const [timer, setTimer] = useState(0);
  const [funRating, setFunRating] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (sessionState === 'active') {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startExercise = () => {
    setSessionState('active');
  };

  const pauseExercise = () => {
    setSessionState('paused');
  };

  const resumeExercise = () => {
    setSessionState('active');
  };

  const completeExercise = () => {
    const pointsEarned = Math.round(exercise.adventure_points * (funRating / 5));
    
    setSessionState('completed');
    
    onComplete({
      exerciseId: exercise.id,
      duration: timer,
      funRating,
      pointsEarned,
      completed: true
    });
  };

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

  if (sessionState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Отлично!</h2>
            <p className="text-gray-600">Упражнение завершено!</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Время:</span>
              <span className="text-sm text-blue-700">{formatTime(timer)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-medium text-yellow-900">Очки:</span>
              <span className="text-sm text-yellow-700">{Math.round(exercise.adventure_points * (funRating / 5))}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">Рейтинг веселья:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${star <= funRating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Вернуться к упражнениям
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="mr-2">←</span>
              Назад
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(timer)}</div>
              <div className="text-sm text-gray-500">
                {sessionState === 'active' ? 'Выполняется' : 
                 sessionState === 'paused' ? 'Пауза' : 'Готов к началу'}
              </div>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Exercise Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: exercise.category?.color_hex || '#6B7280' }}
            >
              {exercise.category?.name_ru || 'Общее'}
            </div>
            <div
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: getDifficultyColor(exercise.difficulty) }}
            >
              {getDifficultyName(exercise.difficulty)}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {exercise.name_ru || exercise.name_en}
          </h1>

          {exercise.fun_variation && (
            <p className="text-blue-600 font-medium mb-3">
              🎮 {exercise.fun_variation}
            </p>
          )}

          <p className="text-gray-600 mb-4">{exercise.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <span className="mr-2">⏰</span>
              <span>{exercise.sets_reps_duration}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
              <span className="mr-2">⚡</span>
              <span>{exercise.adventure_points} очков</span>
            </div>
          </div>
        </div>

        {/* Fun Rating */}
        {sessionState !== 'preparing' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Насколько весело было упражнение?
            </h3>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setFunRating(star)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-2xl ${
                    star <= funRating 
                      ? 'bg-yellow-100 text-yellow-600 scale-110' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-500">
              {funRating === 0 ? 'Оцени упражнение' : 
               funRating === 1 ? 'Не очень' :
               funRating === 2 ? 'Нормально' :
               funRating === 3 ? 'Хорошо' :
               funRating === 4 ? 'Отлично' :
               'Супер!'}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-center space-x-4">
            {sessionState === 'preparing' && (
              <button
                onClick={startExercise}
                className="flex items-center justify-center bg-green-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                style={{ minHeight: '60px' }}
              >
                <span className="mr-2">▶️</span>
                Начать упражнение
              </button>
            )}

            {sessionState === 'active' && (
              <>
                <button
                  onClick={pauseExercise}
                  className="flex items-center justify-center bg-yellow-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-yellow-700 transition-colors"
                  style={{ minHeight: '60px' }}
                >
                  <span className="mr-2">⏸️</span>
                  Пауза
                </button>
                <button
                  onClick={completeExercise}
                  disabled={funRating === 0}
                  className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  style={{ minHeight: '60px' }}
                >
                  <span className="mr-2">⏹️</span>
                  Завершить
                </button>
              </>
            )}

            {sessionState === 'paused' && (
              <>
                <button
                  onClick={resumeExercise}
                  className="flex items-center justify-center bg-green-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  style={{ minHeight: '60px' }}
                >
                  <span className="mr-2">▶️</span>
                  Продолжить
                </button>
                <button
                  onClick={completeExercise}
                  disabled={funRating === 0}
                  className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  style={{ minHeight: '60px' }}
                >
                  <span className="mr-2">⏹️</span>
                  Завершить
                </button>
              </>
            )}
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            {sessionState === 'preparing' && 'Нажми "Начать упражнение" когда будешь готов'}
            {sessionState === 'active' && 'Упражнение выполняется. Не забудь оценить, как весело было!'}
            {sessionState === 'paused' && 'Упражнение на паузе. Продолжи когда будешь готов'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleExerciseSession;
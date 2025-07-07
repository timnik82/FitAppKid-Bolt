import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Play, Pause, Square, Star, Trophy, Clock, Zap } from 'lucide-react';

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

interface ExerciseSessionProps {
  exercise: Exercise;
  childProfileId: string;
  onComplete: (completedSession: ExerciseSessionResult) => void;
  onCancel: () => void;
}

interface ExerciseSessionResult {
  exerciseId: string;
  duration: number;
  funRating: number;
  pointsEarned: number;
  completed: boolean;
}

const ExerciseSession: React.FC<ExerciseSessionProps> = ({
  exercise,
  childProfileId,
  onComplete,
  onCancel
}) => {
  // Add error boundary within component
  const [componentError, setComponentError] = useState<string | null>(null);
  
  const [sessionState, setSessionState] = useState<'preparing' | 'active' | 'paused' | 'completed'>('preparing');
  const [timer, setTimer] = useState(0);
  const [funRating, setFunRating] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Component error handling
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('ExerciseSession component error:', error);
      setComponentError('Ошибка компонента упражнения');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Timer effect for tracking exercise duration
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

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createSession = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_sessions')
        .insert({
          user_id: childProfileId,
          exercise_id: exercise.id,
          started_at: new Date().toISOString(),
          is_completed: false
        })
        .select('id')
        .single();

      if (error) {
        // Check if table doesn't exist
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Exercise sessions table not yet created, using local session tracking');
          const localSessionId = `local-${Date.now()}`;
          setSessionId(localSessionId);
          return localSessionId;
        }
        throw error;
      }
      setSessionId(data.id);
      return data.id;
    } catch (err) {
      console.error('Error creating exercise session:', err);
      // Fallback to local session tracking
      const localSessionId = `local-${Date.now()}`;
      setSessionId(localSessionId);
      console.warn('Using local session tracking as fallback');
      return localSessionId;
    }
  }, [childProfileId, exercise.id]);

  const updateSession = useCallback(async (updates: Record<string, unknown>) => {
    if (!sessionId) return;

    // Skip database updates for local sessions
    if (sessionId.startsWith('local-')) {
      console.log('Local session update:', updates);
      return;
    }

    try {
      const { error } = await supabase
        .from('exercise_sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Exercise sessions table not available, skipping update');
          return;
        }
        throw error;
      }
    } catch (err) {
      console.error('Error updating exercise session:', err);
      // Don't set error state for update failures - just log them
      console.warn('Session update failed, continuing without database tracking');
    }
  }, [sessionId]);

  const startExercise = async () => {
    if (!sessionId) {
      const newSessionId = await createSession();
      if (!newSessionId) return;
    }

    setSessionState('active');
    await updateSession({ started_at: new Date().toISOString() });
  };

  const pauseExercise = async () => {
    setSessionState('paused');
    await updateSession({ paused_at: new Date().toISOString() });
  };

  const resumeExercise = async () => {
    setSessionState('active');
    await updateSession({ resumed_at: new Date().toISOString() });
  };

  const completeExercise = async () => {
    if (!sessionId) return;

    try {
      setSaving(true);
      setError(null);

      const completedAt = new Date().toISOString();
      const pointsEarned = Math.round(exercise.adventure_points * (funRating / 5));

      // Update exercise session (with fallback)
      await updateSession({
        completed_at: completedAt,
        duration_seconds: timer,
        fun_rating: funRating,
        points_earned: pointsEarned,
        is_completed: true
      });

      // Try to update user progress with multiple fallbacks
      let progressUpdated = false;
      
      // First try: RPC function
      try {
        await supabase.rpc('update_user_progress', {
          p_user_id: childProfileId,
          p_exercise_id: exercise.id,
          p_points_earned: pointsEarned,
          p_fun_rating: funRating,
          p_duration_seconds: timer
        });
        progressUpdated = true;
        console.log('Progress updated via RPC function');
      } catch {
        console.warn('RPC function not available, trying direct table update');
        
        // Second try: Direct table update
        try {
          await supabase
            .from('user_progress')
            .upsert({
              user_id: childProfileId,
              total_points: pointsEarned,
              total_exercises_completed: 1,
              last_activity_date: new Date().toISOString().split('T')[0]
            }, {
              onConflict: 'user_id'
            });
          progressUpdated = true;
          console.log('Progress updated via direct table update');
        } catch {
          console.warn('Progress table not available, continuing without progress tracking');
          // Don't throw error - allow completion without progress tracking
        }
      }

      setSessionState('completed');

      // Call completion callback regardless of database success
      onComplete({
        exerciseId: exercise.id,
        duration: timer,
        funRating,
        pointsEarned,
        completed: true
      });

      if (!progressUpdated) {
        console.log('Exercise completed successfully (progress tracking unavailable)');
      }
    } catch (err) {
      console.error('Error completing exercise:', err);
      // Even if there's an error, allow the user to see completion
      setSessionState('completed');
      onComplete({
        exerciseId: exercise.id,
        duration: timer,
        funRating,
        pointsEarned: Math.round(exercise.adventure_points * (funRating / 5)),
        completed: true
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelExercise = async () => {
    if (sessionId) {
      await updateSession({ cancelled_at: new Date().toISOString() });
    }
    onCancel();
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

  // Early return for component errors
  if (componentError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
          <p className="text-gray-600 mb-4">{componentError}</p>
          <button
            onClick={onCancel}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Вернуться к каталогу
          </button>
        </div>
      </div>
    );
  }

  if (sessionState === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-green-600" />
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
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= funRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                  />
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
              onClick={cancelExercise}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Назад
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(timer)}</div>
              <div className="text-sm text-gray-500">
                {sessionState === 'active' ? 'Выполняется' : 
                 sessionState === 'paused' ? 'Пауза' : 'Готов к началу'}
              </div>
            </div>
            <div className="w-16" /> {/* Spacer */}
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
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              <span>{exercise.sets_reps_duration}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              <span>{exercise.adventure_points} очков</span>
            </div>
          </div>
        </div>

        {/* Fun Rating (only show during/after exercise) */}
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    star <= funRating 
                      ? 'bg-yellow-100 text-yellow-600 scale-110' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`w-6 h-6 ${star <= funRating ? 'fill-current' : ''}`} />
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
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
                <Play className="w-6 h-6 mr-2" />
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
                  <Pause className="w-6 h-6 mr-2" />
                  Пауза
                </button>
                <button
                  onClick={completeExercise}
                  disabled={funRating === 0 || saving}
                  className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  style={{ minHeight: '60px' }}
                >
                  <Square className="w-6 h-6 mr-2" />
                  {saving ? 'Сохранение...' : 'Завершить'}
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
                  <Play className="w-6 h-6 mr-2" />
                  Продолжить
                </button>
                <button
                  onClick={completeExercise}
                  disabled={funRating === 0 || saving}
                  className="flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  style={{ minHeight: '60px' }}
                >
                  <Square className="w-6 h-6 mr-2" />
                  {saving ? 'Сохранение...' : 'Завершить'}
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

export default ExerciseSession;
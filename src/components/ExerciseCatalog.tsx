import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import FilterBar from './FilterBar';

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

interface ExerciseCatalogProps {
  childId?: string;
  childProfileId?: string;
  onStartExercise?: (exercise: Exercise) => void;
}

const ExerciseCatalog: React.FC<ExerciseCatalogProps> = ({ childProfileId, onStartExercise }) => {
  console.log('🔵 ExerciseCatalog mounted with childProfileId:', childProfileId);
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);
  const [selectedAdventure, setSelectedAdventure] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Array<{ id: string; name: string; icon?: string }>>([]);

  // Categories with Russian names and colors
  const categories = [
    { id: 'all', name: 'Все упражнения', color: '#6B7280', icon: '🏃‍♂️' },
    { id: 'warm-up', name: 'Разминка', color: '#F97316', icon: '⚡' },
    { id: 'main', name: 'Основная часть', color: '#3B82F6', icon: '💪' },
    { id: 'cool-down', name: 'Заминка', color: '#10B981', icon: '🍃' },
    { id: 'posture', name: 'Осанка', color: '#8B5CF6', icon: '👤' },
  ];

  const difficulties = [
    { id: 'all', name: 'Все уровни', color: '#6B7280' },
    { id: 'Easy', name: 'Легко', color: '#10B981' },
    { id: 'Medium', name: 'Средне', color: '#F59E0B' },
    { id: 'Hard', name: 'Сложно', color: '#EF4444' },
  ];

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_types')
        .select('id, name_ru, name_en, icon')
        .order('name_ru');

      if (error) {
        console.error('Error fetching equipment:', error);
        return;
      }

      const transformedEquipment = data?.map(eq => ({
        id: eq.id,
        name: eq.name_ru || eq.name_en,
        icon: eq.icon === 'square' ? '📦' : eq.icon === 'circle' ? '⭕' : eq.icon === 'dumbbell' ? '🏋️' : '🔧',
      })) || [];

      setEquipmentList(transformedEquipment);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const fetchExercises = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query;
      
      // If adventure is selected, query exercises through adventure_exercises
      if (selectedAdventure && selectedAdventure !== 'all') {
        query = supabase
          .from('adventure_exercises')
          .select(`
            exercise_id,
            sequence_order,
            points_reward,
            exercises!inner (
              *,
              category:exercise_categories(id, name_ru, name_en, color_hex, icon),
              equipment:exercise_equipment(
                equipment:equipment_types(id, name_ru, name_en, required, icon)
              ),
              muscles:exercise_muscles(
                muscle:muscle_groups(id, name_ru, name_en),
                is_primary
              )
            ),
            adventures!inner (story_theme)
          `)
          .eq('adventures.story_theme', selectedAdventure)
          .eq('exercises.is_active', true)
          .order('sequence_order');
      } else {
        // Default query for all exercises
        query = supabase
          .from('exercises')
          .select(`
            *,
            category:exercise_categories(id, name_ru, name_en, color_hex, icon),
            equipment:exercise_equipment(
              equipment:equipment_types(id, name_ru, name_en, required, icon)
            ),
            muscles:exercise_muscles(
              muscle:muscle_groups(id, name_ru, name_en),
              is_primary
            )
          `)
          .eq('is_active', true)
          .order('name_ru');
      }

      // Apply additional filters
      if (selectedCategory && selectedCategory !== 'all') {
        const categoryMap = {
          'warm-up': 'Warm-up',
          'main': 'Main',
          'cool-down': 'Cool-down',
          'posture': 'Posture',
        };
        const filterPath = selectedAdventure !== 'all' ? 'exercises.category.name_en' : 'category.name_en';
        query = query.eq(filterPath, categoryMap[selectedCategory as keyof typeof categoryMap]);
      }

      if (selectedDifficulty && selectedDifficulty !== 'all') {
        const filterPath = selectedAdventure !== 'all' ? 'exercises.difficulty' : 'difficulty';
        query = query.eq(filterPath, selectedDifficulty);
      }

      if (selectedEquipment) {
        const filterPath = selectedAdventure !== 'all' ? 'exercises.equipment.equipment.id' : 'equipment.equipment.id';
        query = query.eq(filterPath, selectedEquipment);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match our interface
      const transformedExercises = data?.map(item => {
        // Handle both direct exercise queries and adventure exercise queries
        interface AdventureExerciseItem {
          exercises: Exercise;
          sequence_order: number;
          points_reward: number;
        }
        
        const isAdventureQuery = selectedAdventure !== 'all';
        const exercise = isAdventureQuery ? (item as AdventureExerciseItem).exercises : (item as Exercise);
        const adventureItem = isAdventureQuery ? (item as AdventureExerciseItem) : null;
        
        return {
          ...exercise,
          category: exercise.category,
          equipment: exercise.equipment?.map((eq: { equipment: unknown }) => eq.equipment as { id: string; name_ru: string; name_en: string; required: boolean; icon: string }) || [],
          muscles: exercise.muscles?.map((m: { muscle: unknown; is_primary: boolean }) => ({
            ...(m.muscle as { id: string; name_ru: string; name_en: string }),
            is_primary: m.is_primary,
          })) || [],
          // Add adventure-specific data if available
          ...(adventureItem && {
            sequence_order: adventureItem.sequence_order,
            adventure_points_reward: adventureItem.points_reward,
          }),
        };
      }) || [];

      setExercises(transformedExercises);
    } catch (err) {
      console.error('Error fetching exercises:', err);
      setError('Ошибка загрузки упражнений');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDifficulty, selectedEquipment, selectedAdventure]);

  const filteredExercises = exercises.filter(exercise =>
    exercise.name_ru.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка упражнений...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchExercises}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🏃‍♂️ Упражнения для детей
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              selectedEquipment={selectedEquipment}
              onEquipmentChange={setSelectedEquipment}
              selectedAdventure={selectedAdventure}
              onAdventureChange={setSelectedAdventure}
              categories={categories}
              difficulties={difficulties}
              equipment={equipmentList}
              isVisible={showFilters}
              onToggleVisibility={() => setShowFilters(!showFilters)}
            />
          </div>

          {/* Exercise Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-gray-600">
                Найдено упражнений: <span className="font-semibold">{filteredExercises.length}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onStart={(exercise) => {
                    console.log('🔵 Starting exercise:', exercise.name_ru || exercise.name_en, 'for childProfileId:', childProfileId);
                    if (onStartExercise) {
                      onStartExercise(exercise);
                    }
                  }}
                  onViewDetails={(exercise) => {
                    console.log('Viewing details for:', exercise.name_ru || exercise.name_en);
                    // TODO: Implement exercise details modal
                  }}
                />
              ))}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">🔍</span>
                </div>
                <p className="text-gray-500 text-lg">Упражнения не найдены</p>
                <p className="text-gray-400 text-sm mt-2">
                  Попробуйте изменить фильтры или поисковый запрос
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseCatalog;
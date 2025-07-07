import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown } from 'lucide-react';

interface Adventure {
  id: string;
  title: string;
  description: string;
  story_theme: string;
  total_exercises: number;
  difficulty_level: string;
  estimated_days: number;
  reward_points: number;
  is_active: boolean;
  display_order: number;
}

interface AdventureSelectorProps {
  selectedAdventure: string;
  onAdventureChange: (adventureTheme: string) => void;
  className?: string;
}

const AdventureSelector: React.FC<AdventureSelectorProps> = ({
  selectedAdventure,
  onAdventureChange,
  className = ''
}) => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdventures();
  }, []);

  const fetchAdventures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('adventures')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching adventures:', error);
        return;
      }

      setAdventures(data || []);
    } catch (err) {
      console.error('Error fetching adventures:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAdventureEmoji = (theme: string) => {
    const emojis = {
      jungle: '🌴',
      space: '🚀',
      ocean: '🌊',
      superhero: '🦸',
    };
    return emojis[theme as keyof typeof emojis] || '⭐';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      'Beginner': 'text-green-600 bg-green-50',
      'Intermediate': 'text-amber-600 bg-amber-50',
      'Advanced': 'text-red-600 bg-red-50',
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const selectedAdventureData = adventures.find(a => a.story_theme === selectedAdventure);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        style={{ minHeight: '44px' }}
      >
        <div className="flex items-center gap-3">
          {selectedAdventure && selectedAdventure !== 'all' && selectedAdventureData ? (
            <>
              <span className="text-xl">{getAdventureEmoji(selectedAdventureData.story_theme)}</span>
              <div className="text-left">
                <span className="font-medium text-gray-900">{selectedAdventureData.title}</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedAdventureData.total_exercises} упражнений • {selectedAdventureData.estimated_days} дней
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-xl">🎯</span>
              <div className="text-left">
                <span className="font-medium text-gray-900">Все приключения</span>
                <p className="text-xs text-gray-500 mt-0.5">Показать все упражнения</p>
              </div>
            </>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {/* All Adventures Option */}
            <button
              onClick={() => {
                onAdventureChange('all');
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                selectedAdventure === 'all' ? 'bg-purple-50 border-purple-200' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎯</span>
                <div>
                  <div className="font-medium text-gray-900">Все приключения</div>
                  <div className="text-xs text-gray-500">Показать все упражнения</div>
                </div>
              </div>
            </button>

            {/* Adventure Options */}
            {adventures.map((adventure) => {
              const isSelected = selectedAdventure === adventure.story_theme;

              return (
                <button
                  key={adventure.id}
                  onClick={() => {
                    onAdventureChange(adventure.story_theme);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    isSelected ? 'bg-purple-50 border-purple-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{getAdventureEmoji(adventure.story_theme)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{adventure.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(adventure.difficulty_level)}`}>
                          {adventure.difficulty_level}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{adventure.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📋 {adventure.total_exercises} упражнений</span>
                        <span>⏱️ {adventure.estimated_days} дней</span>
                        <span>⭐ {adventure.reward_points} очков</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default AdventureSelector;
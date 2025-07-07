import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import AdventureSelector from './AdventureSelector';

interface FilterCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface FilterDifficulty {
  id: string;
  name: string;
  color: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  selectedDifficulty: string | null;
  onDifficultyChange: (difficultyId: string | null) => void;
  selectedEquipment: string | null;
  onEquipmentChange: (equipmentId: string | null) => void;
  selectedAdventure: string;
  onAdventureChange: (adventureTheme: string) => void;
  categories: FilterCategory[];
  difficulties: FilterDifficulty[];
  equipment: Array<{ id: string; name: string; icon?: string }>;
  isVisible: boolean;
  onToggleVisibility: () => void;
  compact?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedEquipment,
  onEquipmentChange,
  selectedAdventure,
  onAdventureChange,
  categories,
  difficulties,
  equipment,
  isVisible,
  onToggleVisibility,
  compact = false,
}) => {
  const hasActiveFilters = selectedCategory || selectedDifficulty || selectedEquipment || searchTerm || (selectedAdventure && selectedAdventure !== 'all');

  const clearAllFilters = () => {
    onSearchChange('');
    onCategoryChange(null);
    onDifficultyChange(null);
    onEquipmentChange(null);
    onAdventureChange('all');
  };

  return (
    <>
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleVisibility}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            style={{ minHeight: '44px' }}
          >
            <Filter className="w-5 h-5 mr-2" />
            Фильтры
            {hasActiveFilters && (
              <span className="ml-2 bg-blue-800 text-white text-xs px-2 py-1 rounded-full">
                !
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ minHeight: '44px' }}
            >
              <X className="w-4 h-4 mr-1" />
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className={`${isVisible ? 'block' : 'hidden'} lg:block`}>
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${compact ? 'p-4' : 'p-6'} ${!compact && 'sticky top-24'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>
              🎯 Фильтры
            </h2>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Сбросить все
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Поиск упражнений
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Найти упражнение..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                style={{ minHeight: '44px' }}
                aria-label="Поиск упражнений"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Очистить поиск"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Adventure Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🗺️ Приключение
            </label>
            <AdventureSelector
              selectedAdventure={selectedAdventure}
              onAdventureChange={onAdventureChange}
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📂 Категория упражнений
            </label>
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id === 'all' ? null : category.id)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    (selectedCategory === category.id || (selectedCategory === null && category.id === 'all'))
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px' }}
                  aria-pressed={selectedCategory === category.id || (selectedCategory === null && category.id === 'all')}
                >
                  <span className="text-lg mr-3" role="img" aria-hidden="true">
                    {category.icon}
                  </span>
                  <span className={`font-medium text-gray-900 ${compact && 'text-sm'}`}>
                    {category.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ⚡ Уровень сложности
            </label>
            <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => onDifficultyChange(difficulty.id === 'all' ? null : difficulty.id)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    (selectedDifficulty === difficulty.id || (selectedDifficulty === null && difficulty.id === 'all'))
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px' }}
                  aria-pressed={selectedDifficulty === difficulty.id || (selectedDifficulty === null && difficulty.id === 'all')}
                >
                  <div
                    className="w-4 h-4 rounded-full mr-3 shadow-sm"
                    style={{ backgroundColor: difficulty.color }}
                    aria-hidden="true"
                  />
                  <span className={`font-medium text-gray-900 ${compact && 'text-sm'}`}>
                    {difficulty.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Filter */}
          {equipment && equipment.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                🏋️‍♂️ Оборудование
              </label>
              <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <button
                  onClick={() => onEquipmentChange(null)}
                  className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedEquipment === null
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{ minHeight: '44px' }}
                  aria-pressed={selectedEquipment === null}
                >
                  <span className="text-lg mr-3" role="img" aria-hidden="true">🏃‍♂️</span>
                  <span className={`font-medium text-gray-900 ${compact && 'text-sm'}`}>
                    Любое оборудование
                  </span>
                </button>
                
                {equipment.slice(0, compact ? 5 : 10).map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => onEquipmentChange(eq.id)}
                    className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                      selectedEquipment === eq.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    style={{ minHeight: '44px' }}
                    aria-pressed={selectedEquipment === eq.id}
                  >
                    <span className="text-lg mr-3" role="img" aria-hidden="true">
                      {eq.icon || '🔧'}
                    </span>
                    <span className={`font-medium text-gray-900 ${compact && 'text-sm'}`}>
                      {eq.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Активные фильтры:</p>
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    Поиск: "{searchTerm}"
                    <button
                      onClick={() => onSearchChange('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name}
                    <button
                      onClick={() => onCategoryChange(null)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedDifficulty && (
                  <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                    {difficulties.find(d => d.id === selectedDifficulty)?.name}
                    <button
                      onClick={() => onDifficultyChange(null)}
                      className="ml-1 text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedEquipment && (
                  <span className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                    {equipment.find(e => e.id === selectedEquipment)?.name}
                    <button
                      onClick={() => onEquipmentChange(null)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FilterBar;
import React, { useState } from 'react';
import SchemaOverview from './components/SchemaOverview';
import DatabaseDashboard from './components/DatabaseDashboard';
import ExerciseStructureViewer from './components/ExerciseStructureViewer';
import SecurityGamificationOverview from './components/SecurityGamificationOverview';

function App() {
  const [activeView, setActiveView] = useState('structure');

  const views = [
    { id: 'structure', label: 'Exercise Structure Parser', component: ExerciseStructureViewer },
    { id: 'security', label: 'Security & Gamification', component: SecurityGamificationOverview },
    { id: 'schema', label: 'Schema Overview', component: SchemaOverview },
    { id: 'dashboard', label: 'Database Dashboard', component: DatabaseDashboard }
  ];

  const ActiveComponent = views.find(view => view.id === activeView)?.component || ExerciseStructureViewer;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {view.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <ActiveComponent />
    </div>
  );
}

export default App;
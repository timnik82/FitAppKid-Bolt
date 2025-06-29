import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Baby, UserPlus, Settings, Activity, Trophy, LogOut, Plus, Calendar, Clock, Star, Users } from 'lucide-react';
import AddChildModal from './AddChildModal';

const ParentDashboard: React.FC = () => {
  const { profile, children, signOut } = useAuth();
  const [showAddChild, setShowAddChild] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getAgeDisplay = (age: number) => {
    if (age === 1) return '1 year old';
    return `${age} years old`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Baby className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">KidsFit</h1>
                <p className="text-xs text-gray-500">Parent Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.display_name}</p>
                <p className="text-xs text-gray-500">Parent Account</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.display_name}!
          </h2>
          <p className="text-gray-600">
            Manage your children's fitness journey with complete oversight and control.
          </p>
        </div>

        {/* Children Management Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">My Children</h3>
                  </div>
                  <button
                    onClick={() => setShowAddChild(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Child
                  </button>
                </div>
              </div>

              <div className="p-6">
                {children.length === 0 ? (
                  <div className="text-center py-8">
                    <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No children added yet</h4>
                    <p className="text-gray-600 mb-4">
                      Get started by adding your first child to begin their fitness journey.
                    </p>
                    <button
                      onClick={() => setShowAddChild(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Your First Child
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {children.map((child) => (
                      <div key={child.profile_id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Baby className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{child.display_name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{getAgeDisplay(child.age)}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {child.date_of_birth ? formatDate(child.date_of_birth) : 'No DOB'}
                              </div>
                              {child.parent_consent_given && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Settings className="w-3 h-3" />
                                  COPPA Consent
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <button className="flex-1 px-3 py-2 bg-white bg-opacity-60 text-gray-700 rounded-md hover:bg-opacity-80 transition-colors text-sm font-medium">
                            View Progress
                          </button>
                          <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                            Start Exercise
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Family Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Children</span>
                  <span className="font-semibold text-gray-900">{children.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Today</span>
                  <span className="font-semibold text-green-600">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold text-blue-600">0 exercises</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Recent Achievements</h3>
              </div>
              <div className="text-center py-4">
                <Star className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No achievements yet</p>
                <p className="text-xs text-gray-500">Achievements will appear here as your children complete exercises</p>
              </div>
            </div>
          </div>
        </div>

        {/* COPPA Compliance Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Settings className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">COPPA Compliance & Privacy</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <h4 className="font-medium mb-1">✅ What We Track</h4>
                  <ul className="space-y-1">
                    <li>• Exercise completion and duration</li>
                    <li>• Fun ratings (1-5 stars)</li>
                    <li>• Adventure points and progress</li>
                    <li>• Consistency and streak tracking</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">❌ What We Don't Track</h4>
                  <ul className="space-y-1">
                    <li>• Calories burned or health metrics</li>
                    <li>• Body measurements or weight</li>
                    <li>• Location data or personal info</li>
                    <li>• Performance comparisons with others</li>
                  </ul>
                </div>
              </div>
              <p className="mt-3 text-sm text-blue-700">
                You have complete control over your children's data. You can view, modify, or delete 
                any information at any time. All children's accounts require your explicit consent 
                and are managed entirely through your parent account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <AddChildModal
          onClose={() => setShowAddChild(false)}
          onSuccess={() => setShowAddChild(false)}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
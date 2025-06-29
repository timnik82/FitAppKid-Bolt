import React, { useState } from 'react';
import { Heart, Shield, Users, Star } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="min-h-screen flex">
        {/* Left side - Branding and features */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-12 xl:px-16">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KidsFit</h1>
                <p className="text-sm text-gray-600">COPPA-Compliant Fitness</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Safe Fitness Fun for the Whole Family
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              A privacy-first fitness app designed specifically for children, 
              with complete parental oversight and COPPA compliance.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">COPPA Compliant</h3>
                  <p className="text-sm text-gray-600">
                    Full compliance with children's privacy laws. No health data collection, 
                    complete parental control.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Family Management</h3>
                  <p className="text-sm text-gray-600">
                    Parents create accounts and manage their children's profiles 
                    with full visibility and control.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fun Adventures</h3>
                  <p className="text-sm text-gray-600">
                    Gamified exercise through story-driven adventures, focusing on 
                    fun and engagement rather than performance.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">What We Don't Track</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>❌ No calorie counting or health metrics</p>
                <p>❌ No body measurements or weight tracking</p>
                <p>❌ No location data or personal information</p>
                <p>❌ No social features without proper safeguards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KidsFit</h1>
                  <p className="text-xs text-gray-600">COPPA-Compliant Fitness</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Safe Fitness Fun for Kids
              </h2>
              <p className="text-gray-600">
                Privacy-first fitness app with complete parental control
              </p>
            </div>

            {isLogin ? (
              <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
            ) : (
              <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
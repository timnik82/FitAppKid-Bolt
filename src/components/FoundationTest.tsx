import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, Baby, Play, Shield, CheckCircle, XCircle, AlertCircle, Eye, EyeOff, Clock, RotateCcw, Target } from 'lucide-react'

interface Profile {
  profile_id: string
  user_id: string | null
  email: string | null
  display_name: string
  date_of_birth: string | null
  is_child: boolean | null
  parent_consent_given: boolean | null
  created_at: string | null
  preferred_language: string | null
}

interface Child {
  profile_id: string
  display_name: string
  date_of_birth: string | null
  age: number
}

interface Exercise {
  id: string
  name_en: string
  name_ru: string | null
  description: string | null
  difficulty: string | null
  min_duration_seconds: number | null
  max_duration_seconds: number | null
  adventure_points: number | null
  exercise_type: string | null
}

const FoundationTest = () => {
  const [currentStep, setCurrentStep] = useState<'landing' | 'register' | 'dashboard'>('landing')
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Registration form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Child form state
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState('')
  const [showAddChild, setShowAddChild] = useState(false)

  // Test isolation state
  const [testResults, setTestResults] = useState<{ type: string; message: string; data?: unknown } | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  useEffect(() => {
    loadExercises()
    checkExistingSession()
  }, [])

  useEffect(() => {
    if (currentUser && currentStep === 'dashboard') {
      loadChildren()
    }
  }, [currentUser, currentStep, loadChildren])

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()
        
        if (profile) {
          setCurrentUser(profile)
          setCurrentStep('dashboard')
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Session check error:', message)
    }
  }

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name_en, name_ru, description, difficulty, min_duration_seconds, max_duration_seconds, adventure_points, exercise_type')
        .eq('is_active', true)
        .limit(10)

      if (error) {
        console.error('Error loading exercises:', error.message)
        setError('Ошибка загрузки упражнений: ' + error.message)
        return
      }
      setExercises(data || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading exercises:', message)
      setError('Ошибка загрузки упражнений')
    }
  }

  const loadChildren = useCallback(async () => {
    if (!currentUser) return

    try {
      // Get children through parent_child_relationships
      const { data: relationships, error: relError } = await supabase
        .from('parent_child_relationships')
        .select(`
          child_id,
          profiles!parent_child_relationships_child_id_fkey (
            profile_id,
            display_name,
            date_of_birth,
            is_child
          )
        `)
        .eq('parent_id', currentUser.profile_id)
        .eq('active', true)

      if (relError) {
        console.error('Error loading children:', relError.message)
        setError('Ошибка загрузки детей: ' + relError.message)
        return
      }

      const childrenData = relationships?.map(rel => {
        const profile = rel.profiles as Profile
        const age = profile.date_of_birth 
          ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
          : 0
        return {
          profile_id: profile.profile_id,
          display_name: profile.display_name,
          date_of_birth: profile.date_of_birth,
          age
        }
      }) || []

      setChildren(childrenData)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error loading children:', message)
      setError('Ошибка загрузки данных детей')
    }
  }, [currentUser])

  const handleParentRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        if (authError.message?.includes('User already registered') || ('code' in authError && authError.code === 'user_already_exists')) {
          console.warn('User already exists - attempting to sign in existing user:', email)
          // User already exists, attempt to log them in
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (signInError) {
              setError('Этот email уже зарегистрирован, но пароль неверный. Пожалуйста, проверьте ваш пароль или используйте другой email.')
              setLoading(false)
              return
            }

            if (!signInData.user) {
              setError('Ошибка входа в систему')
              setLoading(false)
              return
            }

            // Get existing profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', signInData.user.id)
              .maybeSingle()

            if (profileError) {
              setError('Ошибка загрузки профиля: ' + profileError.message)
              setLoading(false)
              return
            }

            // If no profile exists, create one for the authenticated user
            if (!profileData) {
              const { data: newProfileData, error: newProfileError } = await supabase
                .from('profiles')
                .insert({
                  user_id: signInData.user.id,
                  email,
                  display_name: displayName,
                  is_child: false,
                  privacy_settings: { data_sharing: false, analytics: false },
                  preferred_language: 'ru'
                })
                .select()
                .single()

              if (newProfileError) {
                setError('Ошибка создания профиля: ' + newProfileError.message)
                setLoading(false)
                return
              }

              // Initialize user progress for new profile
              await supabase
                .from('user_progress')
                .insert({
                  user_id: newProfileData.profile_id,
                  weekly_points_goal: 100,
                  monthly_goal_exercises: 20
                })

              setCurrentUser(newProfileData)
              setSuccess('Аккаунт найден! Профиль создан успешно!')
            } else {
              setCurrentUser(profileData)
              setSuccess('Вход в существующий аккаунт выполнен успешно!')
            }
            
            setTimeout(() => {
              setCurrentStep('dashboard')
              setSuccess(null)
            }, 2000)
            setLoading(false)
            return

          } catch (signInErr: unknown) {
            const message = signInErr instanceof Error ? signInErr.message : 'Unknown error';
            setError('Ошибка входа в систему: ' + message)
            setLoading(false)
            return
          }
        } else {
          setError('Ошибка регистрации: ' + authError.message)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Ошибка создания пользователя')
        setLoading(false)
        return
      }

      // Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email,
          display_name: displayName,
          is_child: false,
          privacy_settings: { data_sharing: false, analytics: false },
          preferred_language: 'ru'
        })
        .select()
        .single()

      if (profileError) {
        setError('Ошибка создания профиля: ' + profileError.message)
        setLoading(false)
        return
      }

      // Initialize user progress
      await supabase
        .from('user_progress')
        .insert({
          user_id: profileData.profile_id,
          weekly_points_goal: 100,
          monthly_goal_exercises: 20
        })

      setCurrentUser(profileData)
      setSuccess('Родительский аккаунт успешно создан!')
      setTimeout(() => {
        setCurrentStep('dashboard')
        setSuccess(null)
      }, 2000)

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Registration error:', message)
      setError('Ошибка регистрации: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setLoading(true)
    setError(null)

    try {
      // Calculate birth date from age
      const currentYear = new Date().getFullYear()
      const birthYear = currentYear - parseInt(childAge)
      const dateOfBirth = `${birthYear}-01-01`

      // Use the SECURITY DEFINER function to create child profile and all relationships
      const { data: childProfileData, error: childError } = await supabase
        .rpc('create_child_profile_and_link', {
          parent_profile_id: currentUser.profile_id,
          child_display_name: childName,
          child_date_of_birth: dateOfBirth
        })

      if (childError) {
        setError('Ошибка создания профиля ребенка: ' + childError.message)
        setLoading(false)
        return
      }

      if (!childProfileData || childProfileData.length === 0) {
        setError('Ошибка: не удалось создать профиль ребенка')
        setLoading(false)
        return
      }

      setSuccess('Ребенок успешно добавлен!')
      setChildName('')
      setChildAge('')
      setShowAddChild(false)
      loadChildren()

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Add child error:', message)
      setError('Ошибка добавления ребенка: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const testDataIsolation = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      // Try to access all profiles (should only see own family)
      const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')

      // Try to access all parent_child_relationships (should only see own)
      const { data: allRelationships, error: relError } = await supabase
        .from('parent_child_relationships')
        .select('*')

      // Try to access exercise sessions (should only see family's)
      const { data: allSessions, error: sessionError } = await supabase
        .from('exercise_sessions')
        .select('*')

      setTestResults({
        profilesVisible: allProfiles?.length || 0,
        relationshipsVisible: allRelationships?.length || 0,
        sessionsVisible: allSessions?.length || 0,
        errors: {
          profiles: profileError?.message,
          relationships: relError?.message,
          sessions: sessionError?.message
        }
      })

      setSuccess('Тест изоляции данных завершен!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError('Ошибка теста изоляции: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setChildren([])
    setCurrentStep('landing')
    setTestResults(null)
    setError(null)
    setSuccess(null)
  }

  const formatDuration = (exercise: Exercise) => {
    if (exercise.min_duration_seconds && exercise.max_duration_seconds) {
      if (exercise.min_duration_seconds === exercise.max_duration_seconds) {
        return `${exercise.min_duration_seconds}с`
      }
      return `${exercise.min_duration_seconds}-${exercise.max_duration_seconds}с`
    }
    return 'Переменная'
  }

  const getExerciseIcon = (type: string | null) => {
    switch (type) {
      case 'reps': return RotateCcw
      case 'duration': return Clock
      case 'hold': return Target
      default: return Play
    }
  }

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Landing Page
  if (currentStep === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Baby className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Детский Фитнес
            </h1>
            <p className="text-gray-600">
              Безопасное приложение для физической активности детей
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <button
              onClick={() => setCurrentStep('register')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Регистрация родителя
            </button>

            <div className="text-center text-sm text-gray-500">
              <p>✅ Соответствует COPPA</p>
              <p>🔒 Полная изоляция данных семьи</p>
              <p>🎮 Геймификация без метрик здоровья</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Registration Page
  if (currentStep === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Создать родительский аккаунт
            </h2>
            <p className="text-gray-600">
              Простая регистрация с проверкой в Supabase
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{success}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleParentRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="parent@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя для отображения
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Анна Петрова"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </button>
            </form>

            {/* Registration guidance */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Для тестирования:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Используйте уникальный email для каждой новой регистрации</li>
                    <li>• Если у вас уже есть аккаунт, обновите страницу - вы автоматически войдете</li>
                    <li>• Для выхода из существующего аккаунта используйте кнопку "Выйти" в панели</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentStep('landing')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Вернуться на главную
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Добро пожаловать, {currentUser?.display_name}!
              </h1>
              <p className="text-gray-600">Родительская панель управления</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={testDataIsolation}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Тест изоляции данных
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Children Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Мои дети</h2>
              <button
                onClick={() => setShowAddChild(!showAddChild)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Baby className="w-4 h-4" />
                Добавить ребенка
              </button>
            </div>

            {/* Add Child Form */}
            {showAddChild && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <form onSubmit={handleAddChild} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Имя ребенка
                    </label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Петя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Возраст
                    </label>
                    <input
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      required
                      min="5"
                      max="17"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="9"
                    />
                  </div>
                  
                  {/* Debug info */}
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <button
                      type="button"
                      onClick={() => setShowDebugInfo(!showDebugInfo)}
                      className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                    >
                      {showDebugInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showDebugInfo ? 'Скрыть' : 'Показать'} техническую информацию
                    </button>
                    {showDebugInfo && (
                      <div className="mt-2 text-xs text-blue-600">
                        <p><strong>Родительский профиль ID:</strong> {currentUser?.profile_id}</p>
                        <p><strong>Метод создания:</strong> supabase.rpc('create_child_profile_and_link')</p>
                        <p><strong>COPPA соответствие:</strong> user_id = NULL, parent_consent_given = true</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Добавление...' : 'Добавить'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddChild(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Children List */}
            <div className="space-y-3">
              {children.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Пока нет добавленных детей
                </p>
              ) : (
                children.map((child) => (
                  <div key={child.profile_id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Baby className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-blue-900">{child.display_name}</div>
                      <div className="text-sm text-blue-700">{child.age} лет</div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      РЕБЕНОК
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Isolation Test Results */}
          {testResults && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Результаты теста изоляции данных
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-900">Видимые профили:</span>
                  <span className="font-bold text-green-800">{testResults.profilesVisible}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-900">Видимые связи:</span>
                  <span className="font-bold text-blue-800">{testResults.relationshipsVisible}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-900">Видимые сессии:</span>
                  <span className="font-bold text-purple-800">{testResults.sessionsVisible}</span>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-1">🔒 Объяснение изоляции</h4>
                  <p className="text-sm text-yellow-800">
                    Политики RLS позволяют видеть только данные вашей семьи. 
                    Другие семьи полностью изолированы на уровне базы данных.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Exercises Library */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Библиотека упражнений ({exercises.length} упражнений)
          </h2>
          
          {exercises.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Упражнения не найдены</p>
              <p className="text-sm text-gray-400">Проверьте подключение к базе данных</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exercises.map((exercise) => {
                const Icon = getExerciseIcon(exercise.exercise_type)
                return (
                  <div key={exercise.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {exercise.name_ru || exercise.name_en}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty || 'Неизвестно'}
                          </span>
                          {exercise.exercise_type && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Icon className="w-3 h-3" />
                              {exercise.exercise_type}
                            </span>
                          )}
                        </div>
                      </div>
                      {exercise.adventure_points && (
                        <div className="text-right">
                          <div className="text-yellow-600 font-medium">{exercise.adventure_points}</div>
                          <div className="text-xs text-gray-500">очков</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-500">Длительность</div>
                        <div className="font-medium text-sm">{formatDuration(exercise)}</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-500">Очки</div>
                        <div className="font-medium text-sm text-yellow-600">
                          {exercise.adventure_points || 0}
                        </div>
                      </div>
                    </div>

                    {exercise.description && (
                      <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">✅ Проверка базового функционала</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">Регистрация родителя</h4>
              <p>Создание аккаунта в Supabase с профилем</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Добавление детей</h4>
              <p>Создание детских профилей через SECURITY DEFINER функцию</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Загрузка упражнений</h4>
              <p>Отображение реальных данных из базы</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Изоляция данных</h4>
              <p>Проверка RLS и семейной безопасности</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium text-green-900 mb-1">🔧 Техническое решение</h4>
            <p className="text-sm text-green-800">
              Используется PostgreSQL функция <code>create_child_profile_and_link</code> с правами 
              SECURITY DEFINER для обхода конфликтов RLS политик при создании детских профилей.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FoundationTest
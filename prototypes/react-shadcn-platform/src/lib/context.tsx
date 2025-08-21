/**
 * User Context and Authentication State Management
 * For demo purposes - comprehensive state management system
 */

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'

// User types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'member' | 'moderator' | 'admin'
  profile: {
    jobTitle: string
    company: string
    location: string
    industry: string
    graduationYear: number
    bio: string
    skills: string[]
    mentorStatus: 'available' | 'unavailable' | 'busy'
    verified: boolean
    socialLinks: {
      linkedin?: string
      twitter?: string
      github?: string
      website?: string
    }
  }
  preferences: {
    domains: string[]
    notifications: {
      email: boolean
      push: boolean
      mentions: boolean
      messages: boolean
    }
    privacy: {
      profileVisible: boolean
      contactInfoVisible: boolean
      showOnlineStatus: boolean
    }
  }
  stats: {
    connectionsHelped: number
    rating: number
    responseTime: string
    responseRate: number
    profileViews: number
    endorsements: number
  }
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  error: string | null
  selectedProfile: string | null // For multi-profile support
  availableProfiles: User[]
}

// Actions
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; profiles?: User[] } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'SWITCH_PROFILE'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<User['preferences']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  selectedProfile: null,
  availableProfiles: []
}

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      }

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        availableProfiles: action.payload.profiles || [action.payload.user],
        selectedProfile: action.payload.user.id,
        loading: false,
        error: null
      }

    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
        selectedProfile: null,
        availableProfiles: []
      }

    case 'LOGOUT':
      return {
        ...initialState
      }

    case 'UPDATE_PROFILE':
      if (!state.user) return state
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        },
        availableProfiles: state.availableProfiles.map(profile =>
          profile.id === state.user?.id
            ? { ...profile, ...action.payload }
            : profile
        )
      }

    case 'SWITCH_PROFILE': {
      const newProfile = state.availableProfiles.find(p => p.id === action.payload)
      if (!newProfile) return state
      return {
        ...state,
        user: newProfile,
        selectedProfile: action.payload
      }
    }

    case 'UPDATE_PREFERENCES':
      if (!state.user) return state
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload
          }
        }
      }

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }

    default:
      return state
  }
}

// Context
const AuthContext = createContext<{
  state: AuthState
  dispatch: React.Dispatch<AuthAction>
  // Helper functions
  login: (_email: string, _password: string) => Promise<void>
  logout: () => void
  updateProfile: (_updates: Partial<User>) => void
  switchProfile: (_profileId: string) => void
  updatePreferences: (_preferences: Partial<User['preferences']>) => void
} | null>(null)

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_state')
    if (savedAuth) {
      try {
        const parsedAuth = JSON.parse(savedAuth)
        if (parsedAuth.user) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: parsedAuth })
        }
      } catch (error) {
        console.error('Failed to parse saved auth state:', error)
        localStorage.removeItem('auth_state')
      }
    }
  }, [])

  // Save authentication state to localStorage
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      localStorage.setItem('auth_state', JSON.stringify({
        user: state.user,
        profiles: state.availableProfiles
      }))
    } else {
      localStorage.removeItem('auth_state')
    }
  }, [state.isAuthenticated, state.user, state.availableProfiles])

  // Login function (mock implementation for demo)
  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' })

    // Mock authentication delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock user data based on email
    const mockUser: User = {
      id: `user_${Date.now()}`,
      name: email === 'admin@gita.org' ? 'Admin User' : 'John Doe',
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: email === 'admin@gita.org' ? 'admin' : email.includes('moderator') ? 'moderator' : 'member',
      profile: {
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        industry: 'Technology',
        graduationYear: 2018,
        bio: 'Passionate about technology and helping fellow alumni.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        mentorStatus: 'available',
        verified: true,
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe'
        }
      },
      preferences: {
        domains: ['Technology', 'Healthcare'],
        notifications: {
          email: true,
          push: true,
          mentions: true,
          messages: true
        },
        privacy: {
          profileVisible: true,
          contactInfoVisible: true,
          showOnlineStatus: true
        }
      },
      stats: {
        connectionsHelped: 25,
        rating: 4.8,
        responseTime: '2 hours',
        responseRate: 95,
        profileViews: 150,
        endorsements: 12
      }
    }

    // Mock family profiles for profile selection demo
    const familyProfiles = email === 'family@gita.org' ? [
      mockUser,
      {
        ...mockUser,
        id: `user_${Date.now() + 1}`,
        name: 'Jane Doe',
        email: 'jane@gita.org',
        role: 'member' as const,
        profile: {
          ...mockUser.profile,
          jobTitle: 'Product Manager',
          company: 'Design Studio'
        }
      },
      {
        ...mockUser,
        id: `user_${Date.now() + 2}`,
        name: 'Bob Doe',
        email: 'bob@gita.org',
        role: 'member' as const,
        profile: {
          ...mockUser.profile,
          jobTitle: 'Student',
          company: 'University',
          graduationYear: 2025
        }
      }
    ] : [mockUser]

    // Simulate authentication failure for invalid credentials
    if (password.length < 6) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid credentials' })
      return
    }

    dispatch({ 
      type: 'LOGIN_SUCCESS', 
      payload: { 
        user: mockUser, 
        profiles: familyProfiles 
      } 
    })
  }

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' })
  }

  // Update profile function
  const updateProfile = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: updates })
  }

  // Switch profile function
  const switchProfile = (profileId: string) => {
    dispatch({ type: 'SWITCH_PROFILE', payload: profileId })
  }

  // Update preferences function
  const updatePreferences = (preferences: Partial<User['preferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences })
  }

  const value = {
    state,
    dispatch,
    login,
    logout,
    updateProfile,
    switchProfile,
    updatePreferences
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use authentication context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to get current user
export function useUser() {
  const { state } = useAuth()
  return state.user
}

// Hook to check if user is authenticated
export function useIsAuthenticated() {
  const { state } = useAuth()
  return state.isAuthenticated
}

// Hook to check user role
export function useUserRole() {
  const { state } = useAuth()
  return state.user?.role || null
}

// Hook to check if user has permission
export function usePermission(requiredRole: User['role']) {
  const { state } = useAuth()
  if (!state.user) return false
  
  const roleHierarchy: Record<User['role'], number> = {
    'member': 1,
    'moderator': 2,
    'admin': 3
  }
  
  return roleHierarchy[state.user.role] >= roleHierarchy[requiredRole]
}
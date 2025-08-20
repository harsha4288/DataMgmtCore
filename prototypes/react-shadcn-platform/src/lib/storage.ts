/**
 * Data Persistence and State Management Utilities
 * For demo purposes - comprehensive local storage and state management
 */

import { handleError, createError } from './error-handling'

// Storage keys
export const STORAGE_KEYS = {
  AUTH_STATE: 'auth_state',
  USER_PREFERENCES: 'user_preferences', 
  SAVED_SEARCHES: 'saved_searches',
  DRAFT_POSTINGS: 'draft_postings',
  CHAT_DRAFTS: 'chat_drafts',
  THEME_SETTINGS: 'theme_settings',
  FORM_DATA: 'form_data',
  RECENT_ACTIVITIES: 'recent_activities',
  BOOKMARKED_PROFILES: 'bookmarked_profiles',
  NOTIFICATION_SETTINGS: 'notification_settings'
} as const

// Type-safe storage interface
interface StorageData {
  [STORAGE_KEYS.AUTH_STATE]: any
  [STORAGE_KEYS.USER_PREFERENCES]: UserPreferences
  [STORAGE_KEYS.SAVED_SEARCHES]: SavedSearch[]
  [STORAGE_KEYS.DRAFT_POSTINGS]: DraftPosting[]
  [STORAGE_KEYS.CHAT_DRAFTS]: Record<string, string>
  [STORAGE_KEYS.THEME_SETTINGS]: ThemeSettings
  [STORAGE_KEYS.FORM_DATA]: Record<string, any>
  [STORAGE_KEYS.RECENT_ACTIVITIES]: RecentActivity[]
  [STORAGE_KEYS.BOOKMARKED_PROFILES]: string[]
  [STORAGE_KEYS.NOTIFICATION_SETTINGS]: NotificationSettings
}

// Data types
export interface UserPreferences {
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
  display: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    dateFormat: string
  }
}

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: {
    industry?: string
    location?: string
    graduationYear?: number
    skills?: string[]
    mentorStatus?: string
    onlineOnly?: boolean
  }
  createdAt: Date
  lastUsed: Date
  useCount: number
}

export interface DraftPosting {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  location?: string
  duration?: string
  createdAt: Date
  lastModified: Date
}

export interface RecentActivity {
  id: string
  type: 'profile_view' | 'message_sent' | 'posting_created' | 'connection_made'
  title: string
  description: string
  timestamp: Date
  metadata?: any
}

export interface ThemeSettings {
  currentTheme: string
  customColors?: Record<string, string>
  fontSize: 'sm' | 'md' | 'lg'
  animations: boolean
}

export interface NotificationSettings {
  email: {
    newMessages: boolean
    mentions: boolean
    connectionRequests: boolean
    systemUpdates: boolean
  }
  push: {
    enabled: boolean
    newMessages: boolean
    mentions: boolean
  }
  sound: {
    enabled: boolean
    volume: number
  }
}

/**
 * Safe JSON parsing with error handling
 */
function safeParse<T>(data: string | null, fallback: T): T {
  if (!data) return fallback
  
  try {
    return JSON.parse(data)
  } catch (error) {
    handleError(createError('unknown', 'Failed to parse stored data', { data, error }))
    return fallback
  }
}

/**
 * Safe JSON stringification
 */
function safeStringify(data: any): string | null {
  try {
    return JSON.stringify(data)
  } catch (error) {
    handleError(createError('unknown', 'Failed to stringify data', { data, error }))
    return null
  }
}

/**
 * Generic storage operations
 */
export class Storage {
  /**
   * Store data with type safety
   */
  static set<K extends keyof StorageData>(key: K, value: StorageData[K]): boolean {
    try {
      const serialized = safeStringify(value)
      if (serialized === null) return false
      
      localStorage.setItem(key, serialized)
      
      // Dispatch storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: serialized,
        oldValue: localStorage.getItem(key),
        storageArea: localStorage
      }))
      
      return true
    } catch (error) {
      handleError(createError('unknown', `Failed to store data for key: ${key}`, { key, value, error }))
      return false
    }
  }

  /**
   * Get data with type safety and fallback
   */
  static get<K extends keyof StorageData>(key: K, fallback: StorageData[K]): StorageData[K] {
    try {
      const data = localStorage.getItem(key)
      return safeParse(data, fallback)
    } catch (error) {
      handleError(createError('unknown', `Failed to retrieve data for key: ${key}`, { key, error }))
      return fallback
    }
  }

  /**
   * Remove data
   */
  static remove(key: keyof StorageData): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      handleError(createError('unknown', `Failed to remove data for key: ${key}`, { key, error }))
      return false
    }
  }

  /**
   * Clear all app data
   */
  static clear(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      handleError(createError('unknown', 'Failed to clear storage', { error }))
      return false
    }
  }

  /**
   * Get storage usage info
   */
  static getUsage(): { used: number; available: number; percentage: number } {
    let used = 0
    
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
    } catch (error) {
      handleError(createError('unknown', 'Failed to calculate storage usage', { error }))
    }

    // 5MB typical localStorage limit
    const available = 5 * 1024 * 1024
    const percentage = (used / available) * 100

    return { used, available, percentage }
  }
}

/**
 * Specific storage helpers for common operations
 */
export class UserPreferencesStorage {
  private static defaultPreferences: UserPreferences = {
    domains: [],
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
    },
    display: {
      theme: 'system',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/dd/yyyy'
    }
  }

  static get(): UserPreferences {
    return Storage.get(STORAGE_KEYS.USER_PREFERENCES, this.defaultPreferences)
  }

  static set(preferences: Partial<UserPreferences>): boolean {
    const current = this.get()
    const updated = { ...current, ...preferences }
    return Storage.set(STORAGE_KEYS.USER_PREFERENCES, updated)
  }

  static update(path: string, value: any): boolean {
    const preferences = this.get()
    const keys = path.split('.')
    let current = preferences as any

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    return Storage.set(STORAGE_KEYS.USER_PREFERENCES, preferences)
  }
}

/**
 * Saved searches management
 */
export class SavedSearchesStorage {
  static getAll(): SavedSearch[] {
    return Storage.get(STORAGE_KEYS.SAVED_SEARCHES, [])
  }

  static add(search: Omit<SavedSearch, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>): boolean {
    const searches = this.getAll()
    const newSearch: SavedSearch = {
      ...search,
      id: `search_${Date.now()}`,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    }
    
    searches.push(newSearch)
    return Storage.set(STORAGE_KEYS.SAVED_SEARCHES, searches)
  }

  static remove(id: string): boolean {
    const searches = this.getAll().filter(s => s.id !== id)
    return Storage.set(STORAGE_KEYS.SAVED_SEARCHES, searches)
  }

  static updateUsage(id: string): boolean {
    const searches = this.getAll().map(search => 
      search.id === id 
        ? { ...search, lastUsed: new Date(), useCount: search.useCount + 1 }
        : search
    )
    return Storage.set(STORAGE_KEYS.SAVED_SEARCHES, searches)
  }
}

/**
 * Draft postings management
 */
export class DraftPostingsStorage {
  static getAll(): DraftPosting[] {
    return Storage.get(STORAGE_KEYS.DRAFT_POSTINGS, [])
  }

  static save(draft: Omit<DraftPosting, 'id' | 'createdAt' | 'lastModified'>): boolean {
    const drafts = this.getAll()
    const newDraft: DraftPosting = {
      ...draft,
      id: `draft_${Date.now()}`,
      createdAt: new Date(),
      lastModified: new Date()
    }
    
    drafts.push(newDraft)
    return Storage.set(STORAGE_KEYS.DRAFT_POSTINGS, drafts)
  }

  static update(id: string, updates: Partial<DraftPosting>): boolean {
    const drafts = this.getAll().map(draft =>
      draft.id === id
        ? { ...draft, ...updates, lastModified: new Date() }
        : draft
    )
    return Storage.set(STORAGE_KEYS.DRAFT_POSTINGS, drafts)
  }

  static remove(id: string): boolean {
    const drafts = this.getAll().filter(d => d.id !== id)
    return Storage.set(STORAGE_KEYS.DRAFT_POSTINGS, drafts)
  }
}

/**
 * Form data auto-save
 */
export class FormDataStorage {
  static save(formId: string, data: any): boolean {
    const formData = Storage.get(STORAGE_KEYS.FORM_DATA, {})
    formData[formId] = {
      data,
      timestamp: new Date(),
      url: window.location.pathname
    }
    return Storage.set(STORAGE_KEYS.FORM_DATA, formData)
  }

  static get(formId: string): any | null {
    const formData = Storage.get(STORAGE_KEYS.FORM_DATA, {})
    return formData[formId]?.data || null
  }

  static remove(formId: string): boolean {
    const formData = Storage.get(STORAGE_KEYS.FORM_DATA, {})
    delete formData[formId]
    return Storage.set(STORAGE_KEYS.FORM_DATA, formData)
  }

  static cleanup(maxAge = 7 * 24 * 60 * 60 * 1000): boolean {
    const formData = Storage.get(STORAGE_KEYS.FORM_DATA, {})
    const cutoff = new Date(Date.now() - maxAge)
    
    const cleaned = Object.fromEntries(
      Object.entries(formData).filter(([, value]: [string, any]) => 
        new Date(value.timestamp) > cutoff
      )
    )
    
    return Storage.set(STORAGE_KEYS.FORM_DATA, cleaned)
  }
}

/**
 * Recent activities tracking
 */
export class ActivityStorage {
  static add(activity: Omit<RecentActivity, 'id' | 'timestamp'>): boolean {
    const activities = Storage.get(STORAGE_KEYS.RECENT_ACTIVITIES, [])
    const newActivity: RecentActivity = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date()
    }
    
    activities.unshift(newActivity)
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(100)
    }
    
    return Storage.set(STORAGE_KEYS.RECENT_ACTIVITIES, activities)
  }

  static getAll(): RecentActivity[] {
    return Storage.get(STORAGE_KEYS.RECENT_ACTIVITIES, [])
  }

  static clear(): boolean {
    return Storage.set(STORAGE_KEYS.RECENT_ACTIVITIES, [])
  }
}

/**
 * Export/Import functionality
 */
export class DataExport {
  static exportUserData(): string {
    const userData: any = {}
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key)
      if (data) {
        userData[key] = JSON.parse(data)
      }
    })

    userData.exportedAt = new Date()
    userData.version = '1.0'
    
    return JSON.stringify(userData, null, 2)
  }

  static importUserData(jsonData: string): boolean {
    try {
      const userData = JSON.parse(jsonData)
      
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== 'exportedAt' && key !== 'version') {
          localStorage.setItem(key, JSON.stringify(value))
        }
      })
      
      return true
    } catch (error) {
      handleError(createError('unknown', 'Failed to import user data', { error }))
      return false
    }
  }
}

/**
 * Cross-tab synchronization
 */
export function setupCrossTabSync(callback: (key: string, newValue: any, oldValue: any) => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.storageArea === localStorage && event.key) {
      const newValue = event.newValue ? safeParse(event.newValue, null) : null
      const oldValue = event.oldValue ? safeParse(event.oldValue, null) : null
      callback(event.key, newValue, oldValue)
    }
  }

  window.addEventListener('storage', handleStorageChange)
  
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}
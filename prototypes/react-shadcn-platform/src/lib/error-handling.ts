/**
 * Error Handling and User Feedback System
 * For demo purposes - comprehensive error management
 */

import { toast } from '@/hooks/use-toast'

// Error types
export interface AppError {
  type: 'validation' | 'network' | 'authentication' | 'authorization' | 'not_found' | 'server' | 'unknown'
  message: string
  details?: any
  code?: string | number
  field?: string
  timestamp: Date
  stack?: string
}

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error handling configuration
interface ErrorConfig {
  showToast: boolean
  logToConsole: boolean
  reportToService: boolean
  severity: ErrorSeverity
  retryable: boolean
  userMessage?: string
}

// Default error configurations by type
const defaultConfigs: Record<AppError['type'], ErrorConfig> = {
  validation: {
    showToast: true,
    logToConsole: false,
    reportToService: false,
    severity: 'low',
    retryable: false,
    userMessage: 'Please check your input and try again.'
  },
  network: {
    showToast: true,
    logToConsole: true,
    reportToService: true,
    severity: 'medium',
    retryable: true,
    userMessage: 'Network error. Please check your connection and try again.'
  },
  authentication: {
    showToast: true,
    logToConsole: true,
    reportToService: false,
    severity: 'medium',
    retryable: false,
    userMessage: 'Please log in to continue.'
  },
  authorization: {
    showToast: true,
    logToConsole: true,
    reportToService: true,
    severity: 'medium',
    retryable: false,
    userMessage: 'You do not have permission to perform this action.'
  },
  not_found: {
    showToast: true,
    logToConsole: false,
    reportToService: false,
    severity: 'low',
    retryable: false,
    userMessage: 'The requested resource was not found.'
  },
  server: {
    showToast: true,
    logToConsole: true,
    reportToService: true,
    severity: 'high',
    retryable: true,
    userMessage: 'Server error. Our team has been notified.'
  },
  unknown: {
    showToast: true,
    logToConsole: true,
    reportToService: true,
    severity: 'high',
    retryable: false,
    userMessage: 'An unexpected error occurred. Please try again.'
  }
}

// Error storage for development/debugging
const errorHistory: AppError[] = []

/**
 * Create a structured error object
 */
export function createError(
  type: AppError['type'],
  message: string,
  details?: any,
  code?: string | number,
  field?: string
): AppError {
  const error: AppError = {
    type,
    message,
    details,
    code,
    field,
    timestamp: new Date(),
    stack: new Error().stack
  }

  // Store in history for debugging
  errorHistory.push(error)
  
  // Keep only last 100 errors
  if (errorHistory.length > 100) {
    errorHistory.shift()
  }

  return error
}

/**
 * Handle errors with appropriate user feedback and logging
 */
export function handleError(
  error: AppError | Error | string,
  customConfig?: Partial<ErrorConfig>
): void {
  let appError: AppError

  // Convert different error types to AppError
  if (typeof error === 'string') {
    appError = createError('unknown', error)
  } else if (error instanceof Error) {
    appError = createError('unknown', error.message, { originalError: error })
  } else {
    appError = error
  }

  // Get configuration
  const config = {
    ...defaultConfigs[appError.type],
    ...customConfig
  }

  // Log to console if enabled
  if (config.logToConsole) {
    console.group(`🚨 ${appError.type.toUpperCase()} Error`)
    console.error('Message:', appError.message)
    console.error('Details:', appError.details)
    console.error('Code:', appError.code)
    console.error('Field:', appError.field)
    console.error('Timestamp:', appError.timestamp)
    if (appError.stack) console.error('Stack:', appError.stack)
    console.groupEnd()
  }

  // Show toast notification if enabled
  if (config.showToast) {
    const toastConfig = {
      title: getErrorTitle(appError.type),
      description: config.userMessage || appError.message,
      variant: getSeverityVariant(config.severity)
    }

    toast(toastConfig as any)
  }

  // Report to external service if enabled (mock for demo)
  if (config.reportToService) {
    reportErrorToService(appError, config.severity)
  }
}

/**
 * Get user-friendly error title
 */
function getErrorTitle(type: AppError['type']): string {
  const titles: Record<AppError['type'], string> = {
    validation: 'Validation Error',
    network: 'Connection Error',
    authentication: 'Authentication Required',
    authorization: 'Access Denied',
    not_found: 'Not Found',
    server: 'Server Error',
    unknown: 'Unexpected Error'
  }
  return titles[type]
}

/**
 * Convert severity to toast variant
 */
function getSeverityVariant(severity: ErrorSeverity): 'default' | 'destructive' {
  return severity === 'low' ? 'default' : 'destructive'
}

/**
 * Mock error reporting service
 */
function reportErrorToService(error: AppError, severity: ErrorSeverity): void {
  // In a real app, this would send to Sentry, LogRocket, etc.
  console.info('📊 Reporting error to service:', {
    type: error.type,
    message: error.message,
    severity,
    timestamp: error.timestamp
  })
}

/**
 * Validation error helpers
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function handleValidationError(
  field: string,
  message: string,
  details?: any
): void {
  const error = createError('validation', message, details, undefined, field)
  handleError(error)
}

/**
 * Network error helpers
 */
export class NetworkError extends Error {
  constructor(message: string, public code?: number, public response?: any) {
    super(message)
    this.name = 'NetworkError'
  }
}

export function handleNetworkError(
  message: string,
  code?: number,
  response?: any
): void {
  const error = createError('network', message, { response }, code)
  handleError(error)
}

/**
 * Authentication error helpers
 */
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function handleAuthError(message: string, code?: string): void {
  const error = createError('authentication', message, undefined, code)
  handleError(error)
}

/**
 * Success feedback helpers
 */
export function showSuccessMessage(
  title: string,
  description?: string,
  duration = 3000
): void {
  toast({
    title,
    description,
    duration,
    className: 'bg-green-50 border-green-200 text-green-800'
  } as any)
}

export function showInfoMessage(
  title: string,
  description?: string,
  duration = 4000
): void {
  toast({
    title,
    description,
    duration,
    className: 'bg-blue-50 border-blue-200 text-blue-800'
  } as any)
}

export function showErrorMessage(
  title: string,
  description?: string,
  duration = 5000
): void {
  toast({
    title,
    description,
    duration,
    variant: 'destructive'
  } as any)
}

export function showWarningMessage(
  title: string,
  description?: string,
  duration = 5000
): void {
  toast({
    title,
    description,
    duration,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  } as any)
}

/**
 * Error boundary helpers
 */
export function getErrorBoundaryFallback(error: Error, errorInfo: any) {
  return {
    title: 'Something went wrong',
    description: 'The application encountered an unexpected error. Please refresh the page.',
    action: () => window.location.reload(),
    details: typeof process !== 'undefined' && process.env.NODE_ENV === 'development' ? {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    } : undefined
  }
}

/**
 * Retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        break
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Get error history (for debugging)
 */
export function getErrorHistory(): AppError[] {
  return [...errorHistory]
}

/**
 * Clear error history
 */
export function clearErrorHistory(): void {
  errorHistory.length = 0
}

/**
 * Export error types for use in components
 */
export type { AppError, ErrorSeverity, ErrorConfig }
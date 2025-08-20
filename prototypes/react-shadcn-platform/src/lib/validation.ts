/**
 * Form validation utilities for the Alumni Platform
 * Ported and enhanced from old app's validation.js (146 lines proven)
 * For demo purposes - comprehensive validation system
 */

// Validation rule types
export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'url' | 'date' | 'array' | 'object'
  format?: 'email' | 'url' | 'date' | 'date-time' | 'phone'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[]
  items?: ValidationRule
  properties?: Record<string, ValidationRule>
  custom?: (value: any) => string | null
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string | string[]>
  warnings?: Record<string, string>
}

/**
 * Core validation function - supports nested objects and arrays
 */
export function validateData(data: any, schema: ValidationSchema): ValidationResult {
  const errors: Record<string, string | string[]> = {}
  const warnings: Record<string, string> = {}
  let isValid = true

  // Loop through schema properties
  Object.entries(schema).forEach(([field, rules]) => {
    const value = data[field]
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      isValid = false
      return
    }

    // Skip validation for undefined optional fields
    if (value === undefined || value === null || value === '') {
      return
    }

    // Type validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors[field] = `${field} must be a string`
          isValid = false
        } else {
          // Format validation
          if (rules.format) {
            const formatError = validateFormat(value, rules.format, field)
            if (formatError) {
              errors[field] = formatError
              isValid = false
            }
          }
          
          // Length validation
          if (rules.minLength && value.length < rules.minLength) {
            errors[field] = `${field} must be at least ${rules.minLength} characters`
            isValid = false
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors[field] = `${field} must be no more than ${rules.maxLength} characters`
            isValid = false
          }
          
          // Pattern validation
          if (rules.pattern && !rules.pattern.test(value)) {
            errors[field] = `${field} format is invalid`
            isValid = false
          }
        }
        break

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors[field] = `${field} must be a number`
          isValid = false
        } else {
          if (rules.min !== undefined && value < rules.min) {
            errors[field] = `${field} must be at least ${rules.min}`
            isValid = false
          }
          if (rules.max !== undefined && value > rules.max) {
            errors[field] = `${field} must be no more than ${rules.max}`
            isValid = false
          }
        }
        break

      case 'email':
        const emailError = validateFormat(String(value), 'email', field)
        if (emailError) {
          errors[field] = emailError
          isValid = false
        }
        break

      case 'url':
        const urlError = validateFormat(String(value), 'url', field)
        if (urlError) {
          errors[field] = urlError
          isValid = false
        }
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors[field] = `${field} must be an array`
          isValid = false
        } else if (rules.items && value.length > 0) {
          // Validate array items
          const itemErrors: string[] = []
          value.forEach((item, index) => {
            const itemResult = validateData({ item }, { item: rules.items! })
            if (!itemResult.isValid) {
              itemErrors.push(`Item ${index + 1}: ${Object.values(itemResult.errors)[0]}`)
            }
          })
          
          if (itemErrors.length > 0) {
            errors[field] = itemErrors
            isValid = false
          }
        }
        break

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          errors[field] = `${field} must be an object`
          isValid = false
        } else if (rules.properties) {
          // Recursively validate nested objects
          const nestedResult = validateData(value, rules.properties)
          if (!nestedResult.isValid) {
            errors[field] = nestedResult.errors
            isValid = false
          }
        }
        break
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`
      isValid = false
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        errors[field] = customError
        isValid = false
      }
    }
  })

  return { isValid, errors, warnings }
}

/**
 * Format validation helper
 */
function validateFormat(value: string, format: string, field: string): string | null {
  switch (format) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? null : `${field} must be a valid email address`
    
    case 'url':
      try {
        new URL(value)
        return null
      } catch (e) {
        return `${field} must be a valid URL`
      }
    
    case 'phone':
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
      return phoneRegex.test(value) ? null : `${field} must be a valid phone number`
    
    case 'date':
      return isNaN(Date.parse(value)) ? `${field} must be a valid date` : null
    
    case 'date-time':
      return isNaN(Date.parse(value)) ? `${field} must be a valid date and time` : null
    
    default:
      return null
  }
}

/**
 * Creates a validator function for a specific schema
 */
export function createValidator(schema: ValidationSchema) {
  return (data: any): ValidationResult => validateData(data, schema)
}

/**
 * Common validation schemas for the alumni platform
 */
export const schemas = {
  // Alumni profile schema
  alumniProfile: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    phone: { type: 'string' as const, format: 'phone' as const },
    bio: { type: 'string' as const, maxLength: 500 },
    jobTitle: { required: true, type: 'string' as const, maxLength: 100 },
    company: { required: true, type: 'string' as const, maxLength: 100 },
    location: { required: true, type: 'string' as const, maxLength: 100 },
    industry: { required: true, type: 'string' as const },
    graduationYear: { required: true, type: 'number' as const, min: 1950, max: new Date().getFullYear() },
    skills: { type: 'array' as const, items: { type: 'string' as const } },
    mentorStatus: { type: 'string' as const, enum: ['available', 'unavailable', 'busy'] },
    website: { type: 'url' as const }
  },

  // Contact form schema
  contactForm: {
    name: { required: true, type: 'string' as const, minLength: 2 },
    email: { required: true, type: 'email' as const },
    subject: { required: true, type: 'string' as const, minLength: 5, maxLength: 100 },
    message: { required: true, type: 'string' as const, minLength: 10, maxLength: 1000 }
  },

  // Registration schema
  registration: {
    name: { required: true, type: 'string' as const, minLength: 2, maxLength: 100 },
    email: { required: true, type: 'email' as const },
    password: { 
      required: true, 
      type: 'string' as const, 
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      custom: (value: string) => {
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        }
        return null
      }
    },
    confirmPassword: { 
      required: true, 
      type: 'string' as const,
      custom: (value: string, data: any) => {
        return value !== data?.password ? 'Passwords do not match' : null
      }
    },
    graduationYear: { required: true, type: 'number' as const, min: 1950, max: new Date().getFullYear() },
    agreeToTerms: { required: true, custom: (value: boolean) => !value ? 'You must agree to the terms and conditions' : null }
  },

  // Posting creation schema
  posting: {
    title: { required: true, type: 'string' as const, minLength: 5, maxLength: 100 },
    description: { required: true, type: 'string' as const, minLength: 20, maxLength: 2000 },
    category: { required: true, type: 'string' as const, enum: ['help', 'opportunity', 'event', 'general'] },
    domain: { required: true, type: 'string' as const },
    location: { type: 'string' as const, maxLength: 100 },
    duration: { type: 'string' as const, maxLength: 50 },
    contactEmail: { required: true, type: 'email' as const },
    contactPhone: { type: 'string' as const, format: 'phone' as const },
    tags: { type: 'array' as const, items: { type: 'string' as const } }
  }
}

/**
 * Pre-built validators for common use cases
 */
export const validators = {
  alumniProfile: createValidator(schemas.alumniProfile),
  contactForm: createValidator(schemas.contactForm),
  registration: createValidator(schemas.registration),
  posting: createValidator(schemas.posting)
}

/**
 * Utility function to display validation errors in UI
 */
export function getErrorMessage(errors: Record<string, string | string[]>, field: string): string | null {
  const error = errors[field]
  if (!error) return null
  
  if (Array.isArray(error)) {
    return error[0] // Return first error for arrays
  }
  
  return error
}

/**
 * Check if a field has an error
 */
export function hasError(errors: Record<string, string | string[]>, field: string): boolean {
  return !!errors[field]
}

/**
 * Format all errors for display
 */
export function formatErrors(errors: Record<string, string | string[]>): string[] {
  return Object.values(errors).flat()
}
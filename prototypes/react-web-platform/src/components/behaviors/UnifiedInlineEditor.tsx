import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Plus, Minus, Shirt } from 'lucide-react'

interface UnifiedInlineEditorProps {
  value: string | number
  type: 'text' | 'number' | 'quantity'
  onSave: (newValue: string | number) => Promise<void>
  disabled?: boolean
  className?: string
  placeholder?: string
  maxLength?: number
  min?: number
  max?: number
  validation?: (value: string | number) => { isValid: boolean; error?: string }
  // Quantity-specific props
  showControls?: boolean
  controlsPosition?: 'inline' | 'around' | 'between'
  onIncrement?: () => Promise<void>
  onDecrement?: () => Promise<void>
  // T-shirt button for zero values
  showTShirtButton?: boolean
  tshirtButtonSize?: 'sm' | 'md' | 'lg'
}

export function UnifiedInlineEditor({ 
  value, 
  type,
  onSave, 
  disabled = false,
  className = '',
  placeholder = '',
  maxLength,
  min,
  max,
  validation,
  showControls = false,
  controlsPosition = 'around',
  onIncrement,
  onDecrement,
  showTShirtButton = false,
  tshirtButtonSize = 'md'
}: UnifiedInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get responsive sizing for buttons and icons - compact sizing
  const getSizing = useCallback((size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return {
          buttonClass: 'h-4 w-4 min-h-[16px] min-w-[16px]',
          iconClass: 'h-2 w-2 stroke-[2px]',
          shirtClass: 'h-2.5 w-2.5 stroke-[1.5px]'
        }
      case 'lg':
        return {
          buttonClass: 'h-5 w-5 min-h-[20px] min-w-[20px]',
          iconClass: 'h-2.5 w-2.5 stroke-[2px]', 
          shirtClass: 'h-3 w-3 stroke-[1.5px]'
        }
      default: // md
        return {
          buttonClass: 'h-4 w-4 min-h-[16px] min-w-[16px]',
          iconClass: 'h-2 w-2 stroke-[2px]',
          shirtClass: 'h-2.5 w-2.5 stroke-[1.5px]'
        }
    }
  }, [])

  // Reset edit value when props change
  useEffect(() => {
    setEditValue(String(value))
    setError(null)
  }, [value])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const validateValue = useCallback((val: string): { isValid: boolean; error?: string; parsedValue?: string | number } => {
    const trimmed = val.trim()
    
    if (type === 'number' || type === 'quantity') {
      if (trimmed === '') {
        return { isValid: true, parsedValue: 0 }
      }
      
      const numValue = parseInt(trimmed, 10)
      
      if (isNaN(numValue)) {
        return { isValid: false, error: 'Must be a number' }
      }
      
      if (min !== undefined && numValue < min) {
        return { isValid: false, error: `Cannot be less than ${min}` }
      }
      
      if (max !== undefined && numValue > max) {
        return { isValid: false, error: `Cannot exceed ${max}` }
      }
      
      return { isValid: true, parsedValue: numValue }
    } else {
      // Text type
      if (maxLength && trimmed.length > maxLength) {
        return { isValid: false, error: `Cannot exceed ${maxLength} characters` }
      }
      
      return { isValid: true, parsedValue: trimmed }
    }
  }, [type, min, max, maxLength])

  const handleSave = useCallback(async () => {
    if (isSaving) return

    const validationResult = validateValue(editValue)
    
    if (!validationResult.isValid) {
      setError(validationResult.error || 'Invalid value')
      return
    }

    // Apply custom validation if provided
    if (validation) {
      const customValidation = validation(validationResult.parsedValue!)
      if (!customValidation.isValid) {
        setError(customValidation.error || 'Invalid value')
        return
      }
    }

    const newValue = validationResult.parsedValue!
    
    // No change, just exit edit mode
    if (newValue === value || (type === 'text' && String(newValue).trim() === String(value).trim())) {
      setIsEditing(false)
      setError(null)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(newValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [editValue, value, onSave, validateValue, validation, isSaving, type])

  const handleCancel = useCallback(() => {
    setEditValue(String(value))
    setError(null)
    setIsEditing(false)
  }, [value])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        handleSave()
        break
      case 'Escape':
        e.preventDefault()
        handleCancel()
        break
    }
  }, [handleSave, handleCancel])

  const handleClick = useCallback(() => {
    if (!disabled && !isEditing && !isSaving) {
      setIsEditing(true)
    }
  }, [disabled, isEditing, isSaving])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
    setError(null)
  }, [])

  const handleBlur = useCallback(() => {
    if (!error && editValue !== String(value)) {
      handleSave()
    } else if (error) {
      return
    } else {
      handleCancel()
    }
  }, [error, editValue, value, handleSave, handleCancel])

  const handleIncrement = useCallback(async () => {
    if (onIncrement) {
      await onIncrement()
    } else if (type === 'number' || type === 'quantity') {
      const current = Number(value) || 0
      const newValue = max !== undefined ? Math.min(current + 1, max) : current + 1
      await onSave(newValue)
    }
  }, [onIncrement, type, value, max, onSave])

  const handleDecrement = useCallback(async () => {
    if (onDecrement) {
      await onDecrement()
    } else if (type === 'number' || type === 'quantity') {
      const current = Number(value) || 0
      const newValue = min !== undefined ? Math.max(current - 1, min) : Math.max(current - 1, 0)
      await onSave(newValue)
    }
  }, [onDecrement, type, value, min, onSave])

  const renderControls = () => {
    if (!showControls || (type !== 'number' && type !== 'quantity')) return null

    const currentValue = Number(value) || 0
    const canDecrement = min === undefined || currentValue > min
    const canIncrement = max === undefined || currentValue < max
    const sizing = getSizing('sm') // Controls are always small for compactness

    return (
      <>
        <Button
          variant="outline"
          size="sm"
          className={`${sizing.buttonClass} p-0 bg-white hover:bg-red-50 border-2 border-red-500 text-red-600 hover:text-red-700 hover:border-red-600 transition-all duration-200 shadow-sm`}
          onClick={handleDecrement}
          disabled={!canDecrement || disabled || isSaving}
        >
          <Minus className={`${sizing.iconClass}`} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className={`${sizing.buttonClass} p-0 bg-white hover:bg-green-50 border-2 border-green-500 text-green-600 hover:text-green-700 hover:border-green-600 transition-all duration-200 shadow-sm`}
          onClick={handleIncrement}
          disabled={!canIncrement || disabled || isSaving}
        >
          <Plus className={`${sizing.iconClass}`} />
        </Button>
      </>
    )
  }

  if (isEditing) {
    const inputElement = (
      <div className="relative">
        <input
          ref={inputRef}
          type={type === 'text' ? 'text' : 'number'}
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          placeholder={placeholder}
          maxLength={maxLength}
          min={min}
          max={max}
          className={`
            ${type === 'quantity' ? 'w-12' : type === 'number' ? 'w-16' : 'w-full'} 
            px-1 py-0.5 text-center text-sm border rounded
            ${error 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400' 
              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            }
            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-1 focus:ring-blue-400
            dark:text-foreground
            ${className}
          `}
        />
        {error && (
          <div className="absolute top-full left-0 z-10 mt-1 px-2 py-1 text-xs text-white bg-red-500 rounded shadow-lg whitespace-nowrap">
            {error}
          </div>
        )}
        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    )

    if (controlsPosition === 'between' && showControls) {
      const sizing = getSizing('sm') // Use small size for better table fit
      return (
        <div className="relative flex items-center justify-center gap-0.5 bg-muted/30 rounded px-1 py-0.5 min-w-[64px]">
          <Button
            variant="outline"
            size="sm"
            className={`${sizing.buttonClass} p-0 bg-white hover:bg-red-50 border-2 border-red-500 text-red-600 hover:text-red-700 hover:border-red-600 transition-all duration-200 shadow-sm flex items-center justify-center`}
            onClick={handleDecrement}
            disabled={!((Number(value) || 0) > (min || 0)) || disabled || isSaving}
          >
            <Minus className={`${sizing.iconClass} flex-shrink-0`} />
          </Button>
          
          <span className="w-8 text-center font-mono text-sm font-semibold">{value}</span>
          
          <Button
            variant="outline"
            size="sm"
            className={`${sizing.buttonClass} p-0 bg-white hover:bg-green-50 border-2 border-green-500 text-green-600 hover:text-green-700 hover:border-green-600 transition-all duration-200 shadow-sm flex items-center justify-center`}
            onClick={handleIncrement}
            disabled={!((Number(value) || 0) < (max || Infinity)) || disabled || isSaving}
          >
            <Plus className={`${sizing.iconClass} flex-shrink-0`} />
          </Button>
        </div>
      )
    }

    return (
      <div className="relative flex items-center gap-1">
        {controlsPosition === 'around' && showControls && (() => {
          const sizing = getSizing('sm')
          return (
            <Button
              variant="outline"
              size="sm"
              className={`${sizing.buttonClass} p-0 bg-white hover:bg-red-50 border-2 border-red-500 text-red-600 hover:text-red-700 hover:border-red-600 transition-all duration-200 shadow-sm flex items-center justify-center`}
              onClick={handleDecrement}
              disabled={!((Number(value) || 0) > (min || 0)) || disabled || isSaving}
            >
              <Minus className={`${sizing.iconClass} flex-shrink-0`} />
            </Button>
          )
        })()}
        
        {inputElement}

        {controlsPosition === 'around' && showControls && (() => {
          const sizing = getSizing('sm')
          return (
            <Button
              variant="outline"
              size="sm"
              className={`${sizing.buttonClass} p-0 bg-white hover:bg-green-50 border-2 border-green-500 text-green-600 hover:text-green-700 hover:border-green-600 transition-all duration-200 shadow-sm flex items-center justify-center`}
              onClick={handleIncrement}
              disabled={!((Number(value) || 0) < (max || Infinity)) || disabled || isSaving}
            >
              <Plus className={`${sizing.iconClass} flex-shrink-0`} />
            </Button>
          )
        })()}
      </div>
    )
  }

  // Display mode
  const currentValue = Number(value) || 0
  const isZeroQuantity = type === 'quantity' && currentValue === 0

  // Show T-shirt button for zero quantities (production pattern)
  if (showTShirtButton && isZeroQuantity) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-accent/20 text-muted-foreground hover:text-primary transition-colors"
        disabled={disabled || isSaving}
        onClick={onIncrement || (() => handleIncrement())}
        title="Add T-shirt"
      >
        <Shirt className="h-3.5 w-3.5" />
      </Button>
    )
  }

  // For inline controls, render with gap container
  if (controlsPosition === 'inline' && showControls) {
    return (
      <div className="flex items-center gap-1">
        {renderControls()}
        <div
          onClick={handleClick}
          className={`
            ${type === 'quantity' ? 'w-12' : type === 'number' ? 'w-16' : 'min-w-[60px]'} 
            px-1 py-0.5 text-center text-sm rounded cursor-pointer
            hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          title={disabled ? 'Cannot edit' : 'Click to edit (Enter to save, Esc to cancel)'}
        >
          <span className={type === 'quantity' || type === 'number' ? 'font-mono font-semibold' : ''}>
            {String(value) || placeholder}
          </span>
        </div>
      </div>
    )
  }

  // For no controls, render without gap container
  return (
    <div
      onClick={handleClick}
      className={`
        ${type === 'quantity' ? 'w-12' : type === 'number' ? 'w-16' : 'min-w-[60px]'} 
        px-1 py-0.5 text-center text-sm rounded cursor-pointer
        hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={disabled ? 'Cannot edit' : 'Click to edit (Enter to save, Esc to cancel)'}
    >
      <span className={type === 'quantity' || type === 'number' ? 'font-mono font-semibold' : ''}>
        {String(value) || placeholder}
      </span>
    </div>
  )
}
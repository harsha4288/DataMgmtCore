import { useState, useEffect, useRef, useCallback } from 'react'

interface InlineQuantityEditorProps {
  value: number
  max: number
  onSave: (newValue: number) => Promise<void>
  disabled?: boolean
  className?: string
}

export function InlineQuantityEditor({ 
  value, 
  max, 
  onSave, 
  disabled = false,
  className = '' 
}: InlineQuantityEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value.toString())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset edit value when props change
  useEffect(() => {
    setEditValue(value.toString())
    setError(null)
  }, [value])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const validateValue = useCallback((val: string): { isValid: boolean; error?: string; numValue?: number } => {
    const trimmed = val.trim()
    
    if (trimmed === '') {
      return { isValid: true, numValue: 0 }
    }
    
    const numValue = parseInt(trimmed, 10)
    
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Must be a number' }
    }
    
    if (numValue < 0) {
      return { isValid: false, error: 'Cannot be negative' }
    }
    
    if (numValue > max) {
      return { isValid: false, error: `Cannot exceed ${max}` }
    }
    
    return { isValid: true, numValue }
  }, [max])

  const handleSave = useCallback(async () => {
    if (isSaving) return

    const validation = validateValue(editValue)
    
    if (!validation.isValid) {
      setError(validation.error || 'Invalid value')
      return
    }

    const newValue = validation.numValue || 0
    
    // No change, just exit edit mode
    if (newValue === value) {
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
      // Keep in edit mode on error
    } finally {
      setIsSaving(false)
    }
  }, [editValue, value, onSave, validateValue, isSaving])

  const handleCancel = useCallback(() => {
    setEditValue(value.toString())
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
    setError(null) // Clear error as user types
  }, [])

  const handleBlur = useCallback(() => {
    // Auto-save on blur if there are no errors
    if (!error && editValue !== value.toString()) {
      handleSave()
    } else if (error) {
      // Keep in edit mode if there's an error
      return
    } else {
      handleCancel()
    }
  }, [error, editValue, value, handleSave, handleCancel])

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          className={`
            w-16 px-1 py-0.5 text-center text-sm border rounded
            ${error 
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-400' 
              : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
            }
            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-1 focus:ring-blue-400
            dark:text-foreground
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
  }

  return (
    <div
      onClick={handleClick}
      className={`
        w-16 px-1 py-0.5 text-center text-sm rounded cursor-pointer
        hover:bg-muted/50 dark:hover:bg-muted/30 transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={disabled ? 'Cannot edit' : 'Click to edit (Enter to save, Esc to cancel)'}
    >
      <span className="font-mono font-semibold">{value}</span>
    </div>
  )
}
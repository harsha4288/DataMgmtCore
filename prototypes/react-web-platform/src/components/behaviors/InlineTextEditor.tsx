import { useState, useEffect, useRef, useCallback } from 'react'

interface InlineTextEditorProps {
  value: string
  onSave: (newValue: string) => Promise<void>
  disabled?: boolean
  className?: string
  placeholder?: string
  maxLength?: number
  validation?: (value: string) => { isValid: boolean; error?: string }
}

export function InlineTextEditor({ 
  value, 
  onSave, 
  disabled = false,
  className = '',
  placeholder = '',
  maxLength,
  validation
}: InlineTextEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset edit value when props change
  useEffect(() => {
    setEditValue(value)
    setError(null)
  }, [value])

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const validateValue = useCallback((val: string): { isValid: boolean; error?: string } => {
    const trimmed = val.trim()
    
    if (maxLength && trimmed.length > maxLength) {
      return { isValid: false, error: `Cannot exceed ${maxLength} characters` }
    }
    
    if (validation) {
      return validation(trimmed)
    }
    
    return { isValid: true }
  }, [maxLength, validation])

  const handleSave = useCallback(async () => {
    if (isSaving) return

    const trimmedValue = editValue.trim()
    const validationResult = validateValue(trimmedValue)
    
    if (!validationResult.isValid) {
      setError(validationResult.error || 'Invalid value')
      return
    }
    
    // No change, just exit edit mode
    if (trimmedValue === value.trim()) {
      setIsEditing(false)
      setError(null)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(trimmedValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      // Keep in edit mode on error
    } finally {
      setIsSaving(false)
    }
  }, [editValue, value, onSave, validateValue, isSaving])

  const handleCancel = useCallback(() => {
    setEditValue(value)
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
    if (!error && editValue.trim() !== value.trim()) {
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
          placeholder={placeholder}
          maxLength={maxLength}
          className={`
            w-full px-2 py-1 text-sm border rounded
            ${error ? 'border-red-500 bg-red-50' : 'border-muted focus:border-primary'}
            ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-primary/20
            ${className}
          `}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded shadow-sm z-10 whitespace-nowrap">
            {error}
          </div>
        )}
        {isSaving && (
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
            <div className="w-3 h-3 border border-t-2 border-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <span
      className={`
        cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      onClick={handleClick}
      title={disabled ? 'Editing disabled' : 'Click to edit'}
    >
      {value || placeholder}
    </span>
  )
}
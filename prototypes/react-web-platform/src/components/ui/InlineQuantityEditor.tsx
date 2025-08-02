import { useState, useEffect } from 'react'
import { Button } from './Button'

export interface InlineQuantityEditorProps {
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
  onConfirm?: (value: number) => void
  className?: string
  showConfirm?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function InlineQuantityEditor({
  value,
  min = 0,
  max = 999,
  step = 1,
  disabled = false,
  onChange,
  onConfirm,
  className = '',
  showConfirm = false,
  size = 'sm'
}: InlineQuantityEditorProps) {
  const [localValue, setLocalValue] = useState(value)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleIncrement = () => {
    const newValue = Math.min(max, localValue + step)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(min, localValue - step)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0
    const constrainedValue = Math.max(min, Math.min(max, newValue))
    setLocalValue(constrainedValue)
    onChange(constrainedValue)
  }

  const handleConfirm = () => {
    onConfirm?.(localValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      setLocalValue(value)
      setIsEditing(false)
    }
  }

  const buttonSize = size === 'lg' ? 'md' : 'sm'
  const inputClasses = {
    sm: 'h-6 w-12 text-xs px-1',
    md: 'h-8 w-16 text-sm px-2',
    lg: 'h-10 w-20 text-base px-3'
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Button
        size={buttonSize}
        variant="outline"
        onClick={handleDecrement}
        disabled={disabled || localValue <= min}
        className="h-6 w-6 p-0 text-xs"
      >
        −
      </Button>
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsEditing(false)}
            className={`border rounded text-center ${inputClasses[size]}`}
            min={min}
            max={max}
            step={step}
            autoFocus
          />
          {showConfirm && (
            <Button
              size={buttonSize}
              variant="outline"
              onClick={handleConfirm}
              className="h-6 w-6 p-0 text-xs text-green-600 hover:bg-green-50"
            >
              ✓
            </Button>
          )}
        </div>
      ) : (
        <span
          className={`font-mono cursor-pointer hover:bg-blue-50 rounded px-1 min-w-[2rem] text-center ${
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          }`}
          onClick={() => setIsEditing(true)}
        >
          {localValue}
        </span>
      )}
      
      <Button
        size={buttonSize}
        variant="outline"
        onClick={handleIncrement}
        disabled={disabled || localValue >= max}
        className="h-6 w-6 p-0 text-xs"
      >
        +
      </Button>
    </div>
  )
}
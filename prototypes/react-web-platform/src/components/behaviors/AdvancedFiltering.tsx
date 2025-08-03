import { useState, useEffect, useCallback } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'daterange' | 'boolean'
  options?: FilterOption[]
  min?: number
  max?: number
  placeholder?: string
  defaultValue?: any
}

export interface ActiveFilter {
  key: string
  operator: string
  value: any
  label: string
}

export interface SavedFilterPreset {
  id: string
  name: string
  description?: string
  filters: ActiveFilter[]
  createdAt: Date
  isDefault?: boolean
}

export interface AdvancedFilteringProps {
  filters: FilterConfig[]
  activeFilters: ActiveFilter[]
  onFiltersChange: (filters: ActiveFilter[]) => void
  savedPresets?: SavedFilterPreset[]
  onSavePreset?: (preset: Omit<SavedFilterPreset, 'id' | 'createdAt'>) => void
  onLoadPreset?: (preset: SavedFilterPreset) => void
  onDeletePreset?: (presetId: string) => void
  className?: string
}

export function AdvancedFiltering({
  filters,
  activeFilters,
  onFiltersChange,
  savedPresets = [],
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  className = ''
}: AdvancedFilteringProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newFilterKey, setNewFilterKey] = useState('')
  const [newFilterOperator, setNewFilterOperator] = useState('')
  const [newFilterValue, setNewFilterValue] = useState('')
  const [presetName, setPresetName] = useState('')
  const [showPresetSave, setShowPresetSave] = useState(false)

  const availableFilters = filters.filter(
    f => !activeFilters.some(af => af.key === f.key)
  )

  const getOperatorsForType = useCallback((type: FilterConfig['type']) => {
    switch (type) {
      case 'text':
        return [
          { value: 'contains', label: 'Contains' },
          { value: 'equals', label: 'Equals' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
          { value: 'notEquals', label: 'Not equals' }
        ]
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'greaterThan', label: 'Greater than' },
          { value: 'lessThan', label: 'Less than' },
          { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
          { value: 'lessThanOrEqual', label: 'Less than or equal' },
          { value: 'between', label: 'Between' }
        ]
      case 'select':
      case 'multiselect':
        return [
          { value: 'equals', label: 'Is' },
          { value: 'notEquals', label: 'Is not' },
          { value: 'in', label: 'Is one of' }
        ]
      case 'date':
      case 'daterange':
        return [
          { value: 'equals', label: 'On' },
          { value: 'before', label: 'Before' },
          { value: 'after', label: 'After' },
          { value: 'between', label: 'Between' }
        ]
      case 'boolean':
        return [
          { value: 'equals', label: 'Is' }
        ]
      default:
        return []
    }
  }, [])

  const addFilter = () => {
    if (!newFilterKey || !newFilterOperator) return

    const filterConfig = filters.find(f => f.key === newFilterKey)
    if (!filterConfig) return

    const newFilter: ActiveFilter = {
      key: newFilterKey,
      operator: newFilterOperator,
      value: newFilterValue,
      label: `${filterConfig.label} ${getOperatorsForType(filterConfig.type).find(op => op.value === newFilterOperator)?.label} ${newFilterValue}`
    }

    onFiltersChange([...activeFilters, newFilter])
    
    // Reset form
    setNewFilterKey('')
    setNewFilterOperator('')
    setNewFilterValue('')
  }

  const removeFilter = (index: number) => {
    const updated = activeFilters.filter((_, i) => i !== index)
    onFiltersChange(updated)
  }

  const clearAllFilters = () => {
    onFiltersChange([])
  }

  const saveCurrentPreset = () => {
    if (!presetName.trim() || !onSavePreset) return

    onSavePreset({
      name: presetName.trim(),
      description: `Saved on ${new Date().toLocaleDateString()}`,
      filters: activeFilters
    })

    setPresetName('')
    setShowPresetSave(false)
  }

  const renderFilterValue = (filterConfig: FilterConfig) => {
    switch (filterConfig.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={filterConfig.placeholder || 'Enter value...'}
            value={newFilterValue}
            onChange={(e) => setNewFilterValue(e.target.value)}
            className="w-40"
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter number..."
            min={filterConfig.min}
            max={filterConfig.max}
            value={newFilterValue}
            onChange={(e) => setNewFilterValue(e.target.value)}
            className="w-32"
          />
        )
      
      case 'select':
        return (
          <select
            value={newFilterValue}
            onChange={(e) => setNewFilterValue(e.target.value)}
            className="px-3 py-1 text-sm border border-muted/50 rounded bg-background"
          >
            <option value="">Select option...</option>
            {filterConfig.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        )
      
      case 'multiselect':
        return (
          <select
            multiple
            value={Array.isArray(newFilterValue) ? newFilterValue : []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value)
              setNewFilterValue(values)
            }}
            className="px-3 py-1 text-sm border border-muted/50 rounded bg-background min-h-[100px]"
          >
            {filterConfig.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} {option.count ? `(${option.count})` : ''}
              </option>
            ))}
          </select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={newFilterValue}
            onChange={(e) => setNewFilterValue(e.target.value)}
            className="w-40"
          />
        )
      
      case 'daterange':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={newFilterValue?.from || ''}
              onChange={(e) => setNewFilterValue({
                ...newFilterValue,
                from: e.target.value
              })}
              className="w-36"
            />
            <Input
              type="date"
              placeholder="To"
              value={newFilterValue?.to || ''}
              onChange={(e) => setNewFilterValue({
                ...newFilterValue,
                to: e.target.value
              })}
              className="w-36"
            />
          </div>
        )
      
      case 'boolean':
        return (
          <select
            value={newFilterValue}
            onChange={(e) => setNewFilterValue(e.target.value === 'true')}
            className="px-3 py-1 text-sm border border-muted/50 rounded bg-background"
          >
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        )
      
      default:
        return null
    }
  }

  return (
    <div className={`border border-muted/50 rounded-lg bg-background ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-muted/50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Advanced Filters
            <span className="ml-2">
              {isExpanded ? '▲' : '▼'}
            </span>
          </Button>
          
          {activeFilters.length > 0 && (
            <Badge variant="info" size="sm">
              {activeFilters.length} active
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
            >
              Clear All
            </Button>
          )}
          
          {onSavePreset && activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresetSave(!showPresetSave)}
            >
              Save Preset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="p-4 border-b border-muted/50">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge
                key={index}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                {filter.label}
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 hover:bg-red-500/20 rounded-full p-0.5"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Save Preset Form */}
      {showPresetSave && (
        <div className="p-4 border-b border-muted/50 bg-muted/10">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={saveCurrentPreset}
              disabled={!presetName.trim()}
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPresetSave(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div className="p-4 border-b border-muted/50">
          <h4 className="text-sm font-medium mb-2">Saved Presets</h4>
          <div className="flex flex-wrap gap-2">
            {savedPresets.map(preset => (
              <div key={preset.id} className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLoadPreset?.(preset)}
                  className="text-xs"
                >
                  {preset.name}
                  {preset.isDefault && (
                    <span className="ml-1 text-xs text-blue-600">★</span>
                  )}
                </Button>
                {onDeletePreset && (
                  <button
                    onClick={() => onDeletePreset(preset.id)}
                    className="text-red-600 hover:bg-red-100 rounded p-0.5 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Filter Form */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Filter Field */}
            <div>
              <label className="block text-xs font-medium mb-1">Field</label>
              <select
                value={newFilterKey}
                onChange={(e) => {
                  setNewFilterKey(e.target.value)
                  setNewFilterOperator('')
                  setNewFilterValue('')
                }}
                className="w-full px-3 py-1 text-sm border border-muted/50 rounded bg-background"
              >
                <option value="">Select field...</option>
                {availableFilters.map(filter => (
                  <option key={filter.key} value={filter.key}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div>
              <label className="block text-xs font-medium mb-1">Operator</label>
              <select
                value={newFilterOperator}
                onChange={(e) => setNewFilterOperator(e.target.value)}
                disabled={!newFilterKey}
                className="w-full px-3 py-1 text-sm border border-muted/50 rounded bg-background disabled:opacity-50"
              >
                <option value="">Select operator...</option>
                {newFilterKey && getOperatorsForType(
                  filters.find(f => f.key === newFilterKey)?.type || 'text'
                ).map(operator => (
                  <option key={operator.value} value={operator.value}>
                    {operator.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-xs font-medium mb-1">Value</label>
              {newFilterKey && newFilterOperator && (
                renderFilterValue(filters.find(f => f.key === newFilterKey)!)
              )}
            </div>

            {/* Add Button */}
            <div>
              <Button
                size="sm"
                onClick={addFilter}
                disabled={!newFilterKey || !newFilterOperator || !newFilterValue}
                className="w-full"
              >
                Add Filter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
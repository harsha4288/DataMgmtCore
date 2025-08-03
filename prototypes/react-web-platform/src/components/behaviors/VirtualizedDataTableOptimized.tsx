import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { InventoryBadge } from './InventoryBadge'
import { UnifiedInlineEditor } from './UnifiedInlineEditor'

// Inline types to avoid import issues
export interface Column<T> {
  key: keyof T
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: T[keyof T], item: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  resizable?: boolean
  width?: number
  minWidth?: number
  maxWidth?: number
  // Badge/indicator support
  badge?: {
    value: string | number
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
    position?: 'top-right' | 'bottom-right' | 'inline'
  }
  // Header badge support - displayed in column header
  headerBadge?: {
    getValue: (data: T[]) => { available: number; total: number }
    position?: 'below-label' | 'inline'
  }
  // Dynamic badge support for inventory/status indicators
  dynamicBadge?: {
    type: 'inventory' | 'custom'
    getValue: (item: T) => { available: number; total: number } | { value: string | number; variant?: 'default' | 'success' | 'warning' | 'error' | 'info' }
    showPercentage?: boolean
    position?: 'replace' | 'append'
  }
  // Inline editing support
  editable?: {
    enabled: boolean
    type?: 'text' | 'number' | 'select'
    options?: Array<{ value: string | number; label: string }>
    min?: number
    max?: number
    maxLength?: number
    onValidate?: (value: T[keyof T], item: T) => { isValid: boolean; error?: string }
    onSave?: (item: T, newValue: T[keyof T]) => Promise<void>
    disabled?: (item: T) => boolean
  }
}

export interface BulkAction<T> {
  id: string
  label: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  action: (selectedItems: T[]) => void
  icon?: React.ReactNode
  disabled?: (selectedItems: T[]) => boolean
}

export interface VirtualizedDataTableOptimizedProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
  // Virtual scrolling configuration (required)
  virtualScrolling: {
    enabled: true
    itemHeight?: number | ((index: number) => number)
    overscan?: number
    estimateSize?: number
  }
  // Optional features
  search?: {
    enabled: boolean
    placeholder?: string
    onSearchChange?: (searchTerm: string) => void
  }
  export?: {
    enabled: boolean
    filename?: string
    onExport?: (data: T[]) => void
  }
  columnControls?: {
    resizable?: boolean
    reorderable?: boolean
  }
  onColumnsChange?: (columns: Column<T>[]) => void
  selection?: {
    enabled: boolean
    bulkActions?: BulkAction<T>[]
    columnWidth?: number
  }
  onSelectionChange?: (selectedItems: T[]) => void
  onCellEdit?: (item: T, column: Column<T>, newValue: T[keyof T]) => Promise<void>
  cellValidation?: (item: T, column: Column<T>, value: T[keyof T]) => { isValid: boolean; error?: string }
  frozenColumns?: number[]
  maxHeight?: string
  frozenHeader?: boolean
  responsive?: {
    enabled: boolean
    breakpoints?: {
      mobile: number
      tablet: number
    }
    hideColumnsOnMobile?: (keyof T)[]
    hideColumnsOnTablet?: (keyof T)[]
    compactOnMobile?: boolean
  }
}

export function VirtualizedDataTableOptimized<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  virtualScrolling,
  search = { enabled: false },
  export: exportConfig = { enabled: false },
  columnControls = { resizable: true, reorderable: true },
  onColumnsChange,
  selection = { enabled: false },
  onSelectionChange,
  onCellEdit,
  cellValidation,
  frozenColumns = [],
  maxHeight = '600px',
  frozenHeader = false,
  responsive = { enabled: false }
}: VirtualizedDataTableOptimizedProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<T>>(new Set())
  const [isAllSelected, setIsAllSelected] = useState(false)

  // Add scroll event listener for debugging
  useEffect(() => {
    const element = parentRef.current;
    if (!element) return;

    let lastScrollTop = 0;
    const handleScroll = () => {
      const currentScrollTop = element.scrollTop;
      if (Math.abs(currentScrollTop - lastScrollTop) > 10) { // Only log significant scroll changes
        console.log('📜 Scroll Event:', {
          scrollTop: currentScrollTop,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight
        });
        lastScrollTop = currentScrollTop;
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [])

  // Filtered data based on search
  const filteredData = useMemo(() => {
    if (!search.enabled || !searchTerm) return data

    const searchFields = columns
      .filter(col => col.searchable)
      .map(col => col.key)

    return data.filter(item => {
      const searchableText = searchFields
        .map(field => String(item[field] || ''))
        .join(' ')
        .toLowerCase()
      
      return searchableText.includes(searchTerm.toLowerCase())
    })
  }, [data, searchTerm, search.enabled, columns])

  // Configure virtualizer with filtered data
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      if (typeof virtualScrolling.itemHeight === 'function') {
        return virtualScrolling.estimateSize || 48
      }
      return virtualScrolling.itemHeight || 48
    },
    overscan: virtualScrolling.overscan || 5,
    getItemKey: (index) => index,
    // Enable debug mode to understand what's happening
    debug: process.env.NODE_ENV === 'development'
  })

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems(new Set())
      setIsAllSelected(false)
    } else {
      setSelectedItems(new Set(filteredData))
      setIsAllSelected(true)
    }
  }, [isAllSelected, filteredData])

  const handleSelectItem = useCallback((item: T) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(item)) {
      newSelection.delete(item)
    } else {
      newSelection.add(item)
    }
    setSelectedItems(newSelection)
    setIsAllSelected(newSelection.size === filteredData.length)
  }, [selectedItems, filteredData.length])

  // Update parent component when selection changes
  useMemo(() => {
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedItems))
    }
  }, [selectedItems, onSelectionChange])

  // Search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    if (search.onSearchChange) {
      search.onSearchChange(value)
    }
    // Reset selection when search changes
    setSelectedItems(new Set())
    setIsAllSelected(false)
  }, [search])

  // Export handler
  const handleExport = useCallback(() => {
    const dataToExport = selectedItems.size > 0 ? Array.from(selectedItems) : filteredData
    
    if (exportConfig.onExport) {
      exportConfig.onExport(dataToExport)
    } else {
      // Default CSV export
      const csvContent = [
        columns.map(col => col.label).join(','),
        ...dataToExport.map(item => 
          columns.map(col => {
            const value = item[col.key]
            const stringValue = typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : String(value || '')
            return stringValue
          }).join(',')
        )
      ].join('\\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportConfig.filename || `export-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    }
  }, [selectedItems, filteredData, exportConfig, columns])

  // Render cell content
  const renderCellContent = useCallback((item: T, column: Column<T>) => {
    const value = item[column.key]

    // Handle badge rendering
    if (column.badge) {
      return (
        <div className="flex items-center gap-2">
          <span>{column.render ? column.render(value, item) : String(value)}</span>
          <Badge variant={column.badge.variant} size="sm">
            {column.badge.value}
          </Badge>
        </div>
      )
    }

    // Handle dynamic badge rendering
    if (column.dynamicBadge) {
      const badgeData = column.dynamicBadge.getValue(item)
      
      if (column.dynamicBadge.type === 'inventory') {
        const inventoryData = badgeData as { available: number; total: number }
        const renderedValue = column.render ? column.render(value, item) : String(value)
        
        if (column.dynamicBadge.position === 'replace') {
          return (
            <InventoryBadge 
              available={inventoryData.available}
              total={inventoryData.total}
              showPercentage={column.dynamicBadge.showPercentage}
            />
          )
        } else {
          return (
            <div className="flex items-center gap-2">
              {renderedValue}
              <InventoryBadge 
                available={inventoryData.available}
                total={inventoryData.total}
                showPercentage={column.dynamicBadge.showPercentage}
              />
            </div>
          )
        }
      }
    }

    // Handle inline editing
    if (column.editable?.enabled) {
      const isDisabled = column.editable.disabled?.(item) || false

      if (column.editable.type === 'number') {
        const numValue = typeof value === 'number' ? value : 0
        const maxValue = column.editable.max || 999999
        
        return (
          <UnifiedInlineEditor
            value={numValue}
            type="number"
            max={maxValue}
            min={column.editable.min || 0}
            onSave={async (newValue) => {
              if (column.editable?.onValidate) {
                const validation = column.editable.onValidate(newValue as T[keyof T], item)
                if (!validation.isValid) {
                  throw new Error(validation.error || 'Invalid value')
                }
              } else if (cellValidation) {
                const validation = cellValidation(item, column, newValue as T[keyof T])
                if (!validation.isValid) {
                  throw new Error(validation.error || 'Invalid value')
                }
              }
              
              if (column.editable?.onSave) {
                await column.editable.onSave(item, newValue as T[keyof T])
              } else if (onCellEdit) {
                await onCellEdit(item, column, newValue as T[keyof T])
              }
            }}
            disabled={isDisabled}
            validation={column.editable.onValidate ? (val) => {
              const result = column.editable!.onValidate!(val as T[keyof T], item)
              return { isValid: result.isValid, error: result.error }
            } : undefined}
            className="text-center min-w-[2rem]"
          />
        )
      }

      if (column.editable.type === 'text') {
        return (
          <UnifiedInlineEditor
            value={String(value)}
            type="text"
            maxLength={column.editable.maxLength}
            onSave={async (newValue) => {
              if (column.editable?.onValidate) {
                const validation = column.editable.onValidate(newValue as T[keyof T], item)
                if (!validation.isValid) {
                  throw new Error(validation.error || 'Invalid value')
                }
              } else if (cellValidation) {
                const validation = cellValidation(item, column, newValue as T[keyof T])
                if (!validation.isValid) {
                  throw new Error(validation.error || 'Invalid value')
                }
              }
              
              if (column.editable?.onSave) {
                await column.editable.onSave(item, newValue as T[keyof T])
              } else if (onCellEdit) {
                await onCellEdit(item, column, newValue as T[keyof T])
              }
            }}
            disabled={isDisabled}
            validation={column.editable.onValidate ? (val) => {
              const result = column.editable!.onValidate!(val as T[keyof T], item)
              return { isValid: result.isValid, error: result.error }
            } : undefined}
            className="min-w-[4rem]"
          />
        )
      }
    }

    // Default rendering
    return column.render ? column.render(value, item) : String(value)
  }, [onCellEdit, cellValidation])

  if (loading) {
    return (
      <div className={`rounded-lg border border-muted/50 ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`rounded-lg border border-muted/50 ${className}`}>
        <div className="p-8 text-center text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    )
  }

  const totalSize = rowVirtualizer.getTotalSize()
  const virtualItems = rowVirtualizer.getVirtualItems()

  // Debug virtual scrolling behavior
  console.log('🔍 VirtualizedDataTable Debug:', {
    totalItems: filteredData.length,
    virtualItemsRendered: virtualItems.length,
    totalSize,
    maxHeight,
    virtualItemsIndexes: virtualItems.map(item => item.index),
    isVirtualizing: virtualItems.length < filteredData.length,
    visibleRange: virtualItems.length > 0 ? 
      `${Math.min(...virtualItems.map(v => v.index))} - ${Math.max(...virtualItems.map(v => v.index))}` : 
      'none',
    renderingItems: virtualItems.map(v => `Item ${v.index}: "${filteredData[v.index]?.title?.slice(0, 30)}..."`)
  })

  return (
    <div className={`rounded-lg border border-muted/50 overflow-hidden ${className}`}>
      {/* Controls Header */}
      <div className="bg-muted/10 border-b border-muted/50 p-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {search.enabled && (
              <div className="relative">
                <Input
                  placeholder={search.placeholder || "Search..."}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64"
                />
              </div>
            )}

            {selection.enabled && selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  {selectedItems.size} selected
                </Badge>
                {selection.bulkActions?.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => action.action(Array.from(selectedItems))}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {exportConfig.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                Export {selectedItems.size > 0 ? `Selected (${selectedItems.size})` : `All (${filteredData.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Table Header */}
      <div className="bg-muted/15 border-b border-muted/50 overflow-hidden">
        <div className="flex min-w-full">
          {selection?.enabled && (
            <div 
              className="flex-shrink-0 px-3 py-2 bg-muted/15 border-r border-muted/50 flex items-center justify-center"
              style={{ width: `${selection.columnWidth || 48}px` }}
            >
              <input
                type="checkbox"
                className="rounded"
                checked={isAllSelected}
                onChange={handleSelectAll}
              />
            </div>
          )}
          {columns.map((column, index) => (
            <div
              key={String(column.key)}
              className={`flex-shrink-0 px-3 py-2 bg-muted/15 border-r border-muted/50 last:border-r-0 text-xs font-semibold ${
                column.align === 'center' ? 'text-center' : 
                column.align === 'right' ? 'text-right' : 'text-left'
              }`}
              style={{ 
                width: column.width ? `${column.width}px` : '150px',
                minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
                maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined
              }}
            >
              <div className="flex items-center gap-1">
                {column.label}
                {column.headerBadge && (
                  <InventoryBadge
                    available={column.headerBadge.getValue(data).available}
                    total={column.headerBadge.getValue(data).total}
                    size="xs"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: maxHeight }}
      >
        <div
          style={{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualItems.map((virtualRow) => {
            const item = filteredData[virtualRow.index]
            const rowHeight = typeof virtualScrolling.itemHeight === 'function' 
              ? virtualScrolling.itemHeight(virtualRow.index)
              : virtualScrolling.itemHeight || 48

            const isSelected = selectedItems.has(item)

            return (
              <div
                key={virtualRow.key}
                data-virtual-row={virtualRow.index}
                className={`absolute top-0 left-0 w-full border-b border-muted/40 hover:bg-muted/40 transition-colors flex ${
                  onRowClick ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}
                style={{
                  height: `${rowHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                onClick={() => onRowClick?.(item)}
              >
                {selection?.enabled && (
                  <div 
                    className="flex-shrink-0 px-3 py-2 border-r border-muted/40 flex items-center justify-center"
                    style={{ width: `${selection.columnWidth || 48}px` }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isSelected}
                      onChange={() => handleSelectItem(item)}
                    />
                  </div>
                )}
                {columns.map((column, colIndex) => (
                  <div
                    key={String(column.key)}
                    className={`flex-shrink-0 px-3 py-2 border-r border-muted/40 last:border-r-0 flex items-center ${
                      column.align === 'center' ? 'justify-center' : 
                      column.align === 'right' ? 'justify-end' : 'justify-start'
                    }`}
                    style={{ 
                      width: column.width ? `${column.width}px` : '150px',
                      minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
                      maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined
                    }}
                  >
                    {renderCellContent(item, column)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-2 bg-muted/10 border-t border-muted/50 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={virtualItems.length < filteredData.length ? 'text-green-600 font-semibold' : 'text-orange-600'}>
            🚀 Virtual scrolling: {virtualItems.length} of {filteredData.length} rows rendered
            {virtualItems.length < filteredData.length ? ' ✅ WORKING' : ' ⚠️ ALL RENDERED'}
          </span>
          <span className="text-xs text-blue-600 block">
            DOM elements: {parentRef.current?.querySelectorAll('[data-virtual-row]')?.length || 0} • 
            Range: {virtualItems.length > 0 ? 
              `${Math.min(...virtualItems.map(v => v.index))} - ${Math.max(...virtualItems.map(v => v.index))}` : 
              'none'}
          </span>
          <span className="text-xs opacity-60">
            Container: {maxHeight}, Row height: {virtualScrolling.itemHeight || 48}px
          </span>
        </div>
        <div className="flex items-center gap-4">
          {search.enabled && searchTerm && (
            <span>Filtered from {data.length} total items</span>
          )}
          {selection.enabled && (
            <span>{selectedItems.size} selected</span>
          )}
        </div>
      </div>
    </div>
  )
}
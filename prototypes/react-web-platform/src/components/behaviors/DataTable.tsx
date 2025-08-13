import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { InventoryBadge } from './InventoryBadge'
import { UnifiedInlineEditor } from './UnifiedInlineEditor'

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
  // Multi-level header support
  groupHeader?: string
  subColumns?: Column<T>[]
  // Header spanning support
  colSpan?: number
  rowSpan?: number
  headerRow?: 1 | 2 // Which header row this column belongs to
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
    onSave?: (item: T, newValue: T[keyof T]) => Promise<void>
    onValidate?: (value: T[keyof T], item: T) => { isValid: boolean; error?: string }
    disabled?: (item: T) => boolean
  }
}

export interface BulkAction<T> {
  id: string
  label: string
  icon?: React.ReactNode
  action: (selectedItems: T[]) => void
  variant?: 'default' | 'destructive'
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
  pagination?: {
    enabled: boolean
    pageSize?: number
    showPageSizeOptions?: boolean
  }
  search?: {
    enabled: boolean
    placeholder?: string
  }
  export?: {
    enabled: boolean
    filename?: string
  }
  columnControls?: {
    resizable?: boolean
    reorderable?: boolean
  }
  onColumnsChange?: (columns: Column<T>[]) => void
  selection?: {
    enabled: boolean
    bulkActions?: BulkAction<T>[]
    columnWidth?: number // Selection column width in pixels, defaults to 96
  }
  onSelectionChange?: (selectedItems: T[]) => void
  // Inline editing configuration
  onCellEdit?: (item: T, column: Column<T>, newValue: T[keyof T]) => Promise<void>
  cellValidation?: (item: T, column: Column<T>, value: T[keyof T]) => { isValid: boolean; error?: string }
  // Column freezing
  frozenColumns?: number[]
  maxHeight?: string
  // Header row freezing
  frozenHeader?: boolean
  // Responsive design
  responsive?: {
    enabled: boolean
    breakpoints?: {
      mobile: number    // Default: 768px
      tablet: number    // Default: 1024px
    }
    hideColumnsOnMobile?: (keyof T)[]   // Columns to hide on mobile
    hideColumnsOnTablet?: (keyof T)[]   // Columns to hide on tablet
    compactOnMobile?: boolean           // Use compact spacing on mobile
  }
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  pagination = { enabled: false, pageSize: 10 },
  search = { enabled: false },
  export: exportConfig = { enabled: false },
  columnControls = { resizable: true, reorderable: true },
  onColumnsChange,
  selection = { enabled: false },
  onSelectionChange,
  onCellEdit,
  cellValidation,
  frozenColumns = [],
  maxHeight,
  frozenHeader = false,
  responsive = { enabled: false }
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T
    direction: 'asc' | 'desc'
  } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(pagination.pageSize || 10)
  const [localColumns, setLocalColumns] = useState(columns)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null)
  const [resizingColumn, setResizingColumn] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const tableRef = useRef<HTMLTableElement>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)

  // Helper function to check if column is frozen
  const isFrozenColumn = useCallback((columnIndex: number) => {
    return frozenColumns.includes(columnIndex)
  }, [frozenColumns])

  // Get selection column width
  const getSelectionColumnWidth = useCallback(() => {
    return selection.columnWidth || 32 // Default to 32px
  }, [selection.columnWidth])

  // Handle responsive design
  useEffect(() => {
    if (!responsive.enabled) return
    
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [responsive.enabled])
  
  // Get current device type
  const deviceType = useMemo(() => {
    if (!responsive.enabled) return 'desktop'
    
    const mobileBreakpoint = responsive.breakpoints?.mobile || 768
    const tabletBreakpoint = responsive.breakpoints?.tablet || 1024
    
    if (screenWidth < mobileBreakpoint) return 'mobile'
    if (screenWidth < tabletBreakpoint) return 'tablet'
    return 'desktop'
  }, [screenWidth, responsive])
  
  // Filter columns based on responsive settings
  const responsiveColumns = useMemo(() => {
    if (!responsive.enabled) return localColumns
    
    return localColumns.filter(column => {
      if (deviceType === 'mobile' && responsive.hideColumnsOnMobile?.includes(column.key)) {
        return false
      }
      if (deviceType === 'tablet' && responsive.hideColumnsOnTablet?.includes(column.key)) {
        return false
      }
      return true
    })
  }, [localColumns, deviceType, responsive])
  
  // Calculate left offset for frozen columns
  const getFrozenLeft = useCallback((columnIndex: number) => {
    if (!isFrozenColumn(columnIndex)) return undefined
    
    let left = 0
    
    // Selection column is always at left: 0, so frozen columns start after it
    if (selection.enabled) {
      left = getSelectionColumnWidth()
    }
    
    // Find position of current column in sorted frozen columns array
    const sortedFrozenColumns = [...frozenColumns].sort((a, b) => a - b)
    const currentColumnPositionInFrozen = sortedFrozenColumns.indexOf(columnIndex)
    
    // Add width of all frozen columns that come before this one (in visual order)
    for (let i = 0; i < currentColumnPositionInFrozen; i++) {
      const frozenColIndex = sortedFrozenColumns[i]
      const column = responsiveColumns[frozenColIndex]
      if (column) {
        const width = columnWidths[String(column.key)] || column.width || 150
        left += width
      }
    }
    
    return left
  }, [isFrozenColumn, selection.enabled, getSelectionColumnWidth, frozenColumns, responsiveColumns, columnWidths])




  // Update local columns when props change
  useMemo(() => {
    setLocalColumns(columns)
  }, [columns])

  // Process grouped columns for multi-level headers
  const groupedColumns = useMemo(() => {
    const groups: { [key: string]: Column<T>[] } = {}
    const ungrouped: Column<T>[] = []

    responsiveColumns.forEach(column => {
      if (column.groupHeader) {
        if (!groups[column.groupHeader]) {
          groups[column.groupHeader] = []
        }
        groups[column.groupHeader].push(column)
      } else {
        ungrouped.push(column)
      }
    })

    return { groups, ungrouped }
  }, [responsiveColumns])


  // Column management functions
  const handleColumnReorder = useCallback((fromIndex: number, toIndex: number) => {
    if (!columnControls.reorderable) return
    
    const newColumns = [...responsiveColumns]
    const [removed] = newColumns.splice(fromIndex, 1)
    newColumns.splice(toIndex, 0, removed)
    
    setLocalColumns(newColumns)
    onColumnsChange?.(newColumns)
  }, [responsiveColumns, columnControls.reorderable, onColumnsChange])

  const handleColumnResize = useCallback((columnIndex: number, newWidth: number) => {
    if (!columnControls.resizable) return
    
    const column = responsiveColumns[columnIndex]
    const minWidth = column.minWidth || (deviceType === 'mobile' && responsive.compactOnMobile ? 80 : 100)
    const maxWidth = column.maxWidth || 500
    const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    
    setColumnWidths(prev => ({
      ...prev,
      [String(column.key)]: constrainedWidth
    }))
  }, [responsiveColumns, columnControls.resizable, deviceType, responsive.compactOnMobile])

  // Filter and search data
  const filteredData = useMemo(() => {
    if (!search.enabled || !searchTerm) return data

    return data.filter(item => 
      responsiveColumns.some(column => {
        if (column.searchable === false) return false
        const value = item[column.key]
        return String(value).toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
  }, [data, searchTerm, responsiveColumns, search.enabled])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination.enabled) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination.enabled])

  const totalPages = Math.ceil(sortedData.length / pageSize)

  // Selection management
  const selectedItemsArray = useMemo(() => {
    return Array.from(selectedItems).map(index => paginatedData[index])
  }, [selectedItems, paginatedData])

  useEffect(() => {
    onSelectionChange?.(selectedItemsArray)
  }, [selectedItemsArray, onSelectionChange])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(paginatedData.map((_, index) => index)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const handleSelectItem = (index: number, checked: boolean) => {
    const newSelection = new Set(selectedItems)
    if (checked) {
      newSelection.add(index)
    } else {
      newSelection.delete(index)
    }
    setSelectedItems(newSelection)
  }

  const isAllSelected = paginatedData.length > 0 && selectedItems.size === paginatedData.length
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < paginatedData.length

  const handleBulkAction = (action: BulkAction<T>) => {
    const items = Array.from(selectedItems).map(index => paginatedData[index])
    action.action(items)
    setSelectedItems(new Set()) // Clear selection after action
  }

  const handleSort = (key: keyof T) => {
    const column = responsiveColumns.find(col => col.key === key)
    if (column?.sortable === false) return

    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!columnControls.reorderable) return
    setDraggedColumn(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!columnControls.reorderable) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!columnControls.reorderable || draggedColumn === null) return
    e.preventDefault()
    
    if (draggedColumn !== dropIndex) {
      handleColumnReorder(draggedColumn, dropIndex)
    }
    setDraggedColumn(null)
  }

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, columnIndex: number) => {
    if (!columnControls.resizable) return
    
    e.preventDefault()
    setResizingColumn(columnIndex)
    resizeStartX.current = e.clientX
    
    const column = responsiveColumns[columnIndex]
    const currentWidth = columnWidths[String(column.key)] || column.width || 150
    resizeStartWidth.current = currentWidth
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (resizingColumn === null) return
    
    const deltaX = e.clientX - resizeStartX.current
    const newWidth = resizeStartWidth.current + deltaX
    
    handleColumnResize(resizingColumn, newWidth)
  }, [resizingColumn, handleColumnResize])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }, [handleResizeMove])

  const handleExport = () => {
    if (!exportConfig.enabled) return

    const headers = responsiveColumns.map(col => col.label).join(',')
    const rows = sortedData.map(item => 
      responsiveColumns.map(col => {
        const value = item[col.key]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : String(value)
      }).join(',')
    ).join('\n')
    
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportConfig.filename || 'data'}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Cell rendering function with inline editing support
  const renderCell = useCallback((column: Column<T>, item: T, value: T[keyof T]) => {
    // Helper function to render dynamic badges
    const renderDynamicBadge = () => {
      if (!column.dynamicBadge) return null
      
      const badgeData = column.dynamicBadge.getValue(item)
      
      if (column.dynamicBadge.type === 'inventory' && 'available' in badgeData && 'total' in badgeData) {
        return (
          <InventoryBadge
            available={badgeData.available}
            total={badgeData.total}
            showPercentage={column.dynamicBadge.showPercentage}
            className="ml-1"
          />
        )
      }
      
      if (column.dynamicBadge.type === 'custom' && 'value' in badgeData) {
        return (
          <Badge
            variant={badgeData.variant || 'default'}
            size="sm"
            className="ml-1"
          >
            {badgeData.value}
          </Badge>
        )
      }
      
      return null
    }

    // Check if cell has custom render function
    if (column.render) {
      const renderedContent = column.render(value, item)
      
      // If dynamicBadge position is 'append', wrap with badge
      if (column.dynamicBadge?.position === 'append') {
        return (
          <div className="flex items-center justify-between">
            {renderedContent}
            {renderDynamicBadge()}
          </div>
        )
      }
      
      return renderedContent
    }

    // Check if cell should be replaced with dynamic badge
    if (column.dynamicBadge?.position === 'replace') {
      return renderDynamicBadge()
    }

    // Check if cell is editable
    if (column.editable?.enabled) {
      const isDisabled = column.editable.disabled?.(item) || false

      // Handle different editable types
      if (column.editable.type === 'number') {
        const numValue = typeof value === 'number' ? value : 0
        const maxValue = column.editable.max || 999999
        
        const editor = (
          <UnifiedInlineEditor
            value={numValue}
            type="number"
            max={maxValue}
            min={column.editable.min || 0}
            onSave={async (newValue) => {
              // Apply validation if available
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
              
              // Save the value
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

        // If dynamicBadge position is 'append', wrap with badge
        if (column.dynamicBadge?.position === 'append') {
          return (
            <div className="flex items-center justify-between">
              {editor}
              {renderDynamicBadge()}
            </div>
          )
        }

        return editor
      }

      if (column.editable.type === 'select' && column.editable.options) {
        const select = (
          <select
            value={String(value)}
            disabled={isDisabled}
            onChange={async (e) => {
              const newValue = e.target.value
              
              // Apply validation if available
              if (column.editable?.onValidate) {
                const validation = column.editable.onValidate(newValue as T[keyof T], item)
                if (!validation.isValid) {
                  console.error(validation.error || 'Invalid value')
                  return // Don't save invalid values
                }
              } else if (cellValidation) {
                const validation = cellValidation(item, column, newValue as T[keyof T])
                if (!validation.isValid) {
                  console.error(validation.error || 'Invalid value')
                  return // Don't save invalid values
                }
              }

              // Save the value
              if (column.editable?.onSave) {
                await column.editable.onSave(item, newValue as T[keyof T])
              } else if (onCellEdit) {
                await onCellEdit(item, column, newValue as T[keyof T])
              }
            }}
            className="w-full px-1 py-0.5 text-sm border border-muted rounded bg-background text-foreground focus:border-primary focus:outline-none"
          >
            {column.editable.options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        )

        // If dynamicBadge position is 'append', wrap with badge
        if (column.dynamicBadge?.position === 'append') {
          return (
            <div className="flex items-center justify-between">
              {select}
              {renderDynamicBadge()}
            </div>
          )
        }

        return select
      }

      // Default text editing (type === 'text' or unspecified)
      const textEditor = (
        <UnifiedInlineEditor
          value={String(value)}
          type="text"
          onSave={async (newValue) => {
            // Apply validation if available
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

            // Save the value
            if (column.editable?.onSave) {
              await column.editable.onSave(item, newValue as T[keyof T])
            } else if (onCellEdit) {
              await onCellEdit(item, column, newValue as T[keyof T])
            }
          }}
          disabled={isDisabled}
          maxLength={column.editable.maxLength}
          validation={column.editable.onValidate ? (val) => {
            const result = column.editable!.onValidate!(val as T[keyof T], item)
            return { isValid: result.isValid, error: result.error }
          } : undefined}
          className="w-full"
        />
      )

      // If dynamicBadge position is 'append', wrap with badge
      if (column.dynamicBadge?.position === 'append') {
        return (
          <div className="flex items-center justify-between">
            {textEditor}
            {renderDynamicBadge()}
          </div>
        )
      }

      return textEditor
    }

    // Default non-editable cell rendering with optional badge
    const defaultContent = String(value)
    
    if (column.dynamicBadge?.position === 'append') {
      return (
        <div className="flex items-center justify-between">
          <span>{defaultContent}</span>
          {renderDynamicBadge()}
        </div>
      )
    }

    return defaultContent
  }, [onCellEdit, cellValidation])

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {search.enabled && (
          <div className="animate-pulse h-10 bg-muted rounded"></div>
        )}
        <div className="overflow-x-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-2"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted/50 rounded mb-1"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 p-6 ${className}`}>
      {/* Search, Export, and Bulk Actions Controls */}
      {(search.enabled || exportConfig.enabled || (selection.enabled && selectedItems.size > 0)) && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {search.enabled && (
              <div className="flex-1 max-w-sm">
                <Input
                  type="text"
                  placeholder={search.placeholder || 'Search...'}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1) // Reset to first page on search
                  }}
                  className="w-full"
                />
              </div>
            )}
            
            {/* Bulk Actions */}
            {selection.enabled && selectedItems.size > 0 && selection.bulkActions && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} selected
                </span>
                {selection.bulkActions.map((action) => (
                  <Button
                    key={action.id}
                    onClick={() => handleBulkAction(action)}
                    variant="outline"
                    size="sm"
                    className={action.variant === 'destructive' ? 'text-red-600 hover:bg-red-50 border-red-200 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-red-800/50' : ''}
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          
          {exportConfig.enabled && (
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
            >
              Export CSV
            </Button>
          )}
        </div>
      )}

      {/* Data Display */}
      {filteredData.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground bg-table-container-elevated rounded-xl shadow-table-elevated border border-table">
          {searchTerm ? `No results found for "${searchTerm}"` : emptyMessage}
        </div>
      ) : (
        <>
          {/* Table */}
          <div 
            className="overflow-auto border border-table rounded-xl shadow-table-elevated bg-table-container-elevated"
            style={{ maxHeight: maxHeight }}
          >
            <table ref={tableRef} className={`w-full bg-transparent text-foreground border-collapse ${
              deviceType === 'mobile' && responsive.compactOnMobile ? 'text-xs' : 'text-table-body'
            }`}>
              <thead className={frozenHeader ? 'sticky top-0 z-[52]' : ''}>
                {/* Group Headers Row (if any columns have groupHeader) */}
                {Object.keys(groupedColumns?.groups || {}).length > 0 && (
                  <tr className={`border-b border-table bg-table-header-elevated ${frozenHeader ? 'sticky top-0 z-[52]' : ''}`}>
                    {/* Selection column spacer */}
                    {selection.enabled && (
                      <th 
                        className={`p-2 sticky left-0 ${frozenHeader ? 'z-[54]' : 'z-[52]'} bg-table-group-header shadow-[1px_0_3px_rgba(0,0,0,0.1)] border-r border-table`}
                        style={{ width: `${getSelectionColumnWidth()}px`, minWidth: `${getSelectionColumnWidth()}px`, maxWidth: `${getSelectionColumnWidth()}px` }}
                      />
                    )}
                    
                    {/* Render group headers in original column order */}
                    {(() => {
                      const renderedColumns = new Set<string>()
                      const headers: React.ReactNode[] = []
                      
                      responsiveColumns.forEach((column) => {
                        const columnKey = String(column.key)
                        
                        if (column.groupHeader && !renderedColumns.has(column.groupHeader)) {
                          // Find all columns in this group
                          const groupColumns = responsiveColumns.filter(col => col.groupHeader === column.groupHeader)
                          const groupWidth = groupColumns.reduce((sum, col) => {
                            return sum + (columnWidths[String(col.key)] || col.width || 150)
                          }, 0)
                          
                          headers.push(
                            <th
                              key={column.groupHeader}
                              colSpan={groupColumns.length}
                              className="text-center bg-table-group-header border-l border-r border-table text-foreground text-table-group-header shadow-table"
                              style={{ 
                                width: `${groupWidth}px`, 
                                minWidth: `${groupWidth}px`, 
                                minHeight: 'var(--table-group-header-height)',
                                padding: 'var(--table-group-header-padding-y) var(--table-group-header-padding-x)'
                              }}
                            >
                              <div className="flex items-center justify-center gap-1.5" style={{ 
                                minHeight: 'var(--table-group-header-height)',
                                lineHeight: '1.2'
                              }}>
                                <span className="text-table-group-header leading-tight">{column.groupHeader}</span>
                              </div>
                            </th>
                          )
                          
                          // Mark all columns in this group as rendered
                          groupColumns.forEach(col => renderedColumns.add(col.groupHeader!))
                        } else if (!column.groupHeader) {
                          // Ungrouped column spacer - enhanced visibility
                          const width = columnWidths[columnKey] || column.width || 150
                          headers.push(
                            <th 
                              key={columnKey} 
                              className="bg-table-group-header border-r border-table shadow-table"
                              style={{ 
                                width: `${width}px`, 
                                minWidth: `${width}px`,
                                padding: 'var(--table-group-header-padding-y) var(--table-group-header-padding-x)'
                              }}
                            >
                              <div className="flex items-center justify-center" style={{ 
                                height: 'var(--table-group-header-height)',
                                minHeight: 'var(--table-group-header-height)'
                              }}>
                                <div className="w-4 h-px border-table-group-header-line border-t"></div>
                              </div>
                            </th>
                          )
                        }
                      })
                      
                      return headers
                    })()}
                  </tr>
                )}
                
                {/* Main Headers Row */}
                <tr className={`border-b border-table bg-table-header text-foreground shadow-table ${frozenHeader ? 'sticky top-0 z-[52]' : ''}`}>
                  {/* Selection column */}
                  {selection.enabled && (
                    <th 
                      className={`p-2 sticky left-0 ${frozenHeader ? 'z-[54]' : 'z-[52]'} bg-table-header border-r border-table shadow-[1px_0_3px_rgba(0,0,0,0.1)]`}
                      style={{ width: `${getSelectionColumnWidth()}px`, minWidth: `${getSelectionColumnWidth()}px`, maxWidth: `${getSelectionColumnWidth()}px` }}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-table bg-card checked:bg-primary checked:border-primary"
                      />
                    </th>
                  )}
                  {responsiveColumns.map((column, index) => {
                    const width = columnWidths[String(column.key)] || column.width || 150
                    const isFrozen = isFrozenColumn(index)
                    const frozenLeft = getFrozenLeft(index)
                    
                    
                    return (
                      <th
                        key={String(column.key)}
                        className={`${
                          deviceType === 'mobile' && responsive.compactOnMobile ? '' : ''
                        } select-none relative group text-muted-foreground ${
                          column.sortable !== false ? 'cursor-pointer hover:bg-muted hover:shadow-table transition-all duration-200' : ''
                        } ${
                          column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        } ${
                          draggedColumn === index ? 'opacity-50' : ''
                        } ${
                          column.groupHeader ? 'border-l border-r border-table' : ''
                        } ${
                          isFrozen ? `sticky ${frozenHeader ? 'z-[53]' : 'z-[51]'} bg-table-header shadow-[2px_0_4px_rgba(0,0,0,0.1)] border-r border-table` : ''
                        }`}
                        style={{ 
                          width: `${width}px`, 
                          minWidth: `${width}px`,
                          maxWidth: isFrozen ? `${width}px` : undefined,
                          left: isFrozen ? `${frozenLeft}px` : undefined
                        }}
                        draggable={columnControls.reorderable}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={() => handleSort(column.key)}
                      >
                        <div className="flex flex-col items-center gap-0.5 justify-center" style={{ minHeight: 'var(--table-header-height)', padding: 'var(--table-cell-padding-y) var(--table-cell-padding-x)' }}>
                          <div className="flex items-center gap-1 w-full justify-center">
                            {columnControls.reorderable && (
                              <span className="opacity-0 group-hover:opacity-50 cursor-grab text-xs mr-1">
                                ⋮⋮
                              </span>
                            )}
                            <span className="text-center text-table-header leading-tight">{column.label}</span>
                            
                            {/* Column-specific badge */}
                            {column.badge && (
                              <Badge 
                                variant={column.badge.variant || 'default'} 
                                size="sm"
                                className="ml-1 shrink-0"
                              >
                                {column.badge.value}
                              </Badge>
                            )}
                            
                            {column.sortable !== false && sortConfig?.key === column.key && (
                              <span className="text-xs shrink-0 ml-1 text-primary">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                          
                          {/* Header badge below label */}
                          {column.headerBadge && column.headerBadge.position === 'below-label' && (
                            <div className="w-full flex justify-center mt-1">
                              <InventoryBadge
                                {...column.headerBadge.getValue(paginatedData)}
                                format="issued"
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* Resize handle */}
                        {columnControls.resizable && column.resizable !== false && (
                          <div
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-primary hover:opacity-100"
                            onMouseDown={(e) => handleResizeStart(e, index)}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((item, index) => {
                  const isSelected = selectedItems.has(index)
                  return (
                    <tr
                      key={index}
                      className={`bg-table-row border-b border-table hover:bg-table-row-hover text-foreground transition-all duration-200 hover:shadow-sm ${
                        isSelected ? 'bg-primary/10 border-primary/30' : ''
                      } ${
                        onRowClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={(e) => {
                        // Don't trigger row click if clicking on checkbox
                        const target = e.target as HTMLInputElement
                        if (target.type === 'checkbox') return
                        onRowClick?.(item)
                      }}
                    >
                      {/* Selection column */}
                      {selection.enabled && (
                        <td 
                          className="p-2 sticky left-0 z-[51] bg-table-row shadow-[1px_0_3px_rgba(0,0,0,0.1)] border-r border-table"
                          style={{ width: `${getSelectionColumnWidth()}px`, minWidth: `${getSelectionColumnWidth()}px`, maxWidth: `${getSelectionColumnWidth()}px` }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectItem(index, e.target.checked)}
                            className="rounded border-table bg-card checked:bg-primary checked:border-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      {responsiveColumns.map((column, columnIndex) => {
                        const width = columnWidths[String(column.key)] || column.width || 150
                        const isFrozen = isFrozenColumn(columnIndex)
                        const frozenLeft = getFrozenLeft(columnIndex)
                        
                        
                        // Check if this is the first data column (when selection is enabled)
                        const isFirstDataColumn = selection.enabled && columnIndex === 0
                        
                        return (
                          <td
                            key={String(column.key)}
                            className={`${
                              deviceType === 'mobile' && responsive.compactOnMobile ? '' : ''
                            } text-foreground ${
                              column.align === 'center' ? 'text-center' :
                              column.align === 'right' ? 'text-right' : 'text-left'
                            } ${
                              isFrozen ? 'sticky z-[50] bg-table-row shadow-[2px_0_4px_rgba(0,0,0,0.1)] border-r border-table' : ''
                            } ${
                              isFirstDataColumn ? 'border-l-0' : ''
                            }`}
                            style={{ 
                              width: `${width}px`, 
                              minWidth: `${width}px`,
                              maxWidth: isFrozen ? `${width}px` : undefined,
                              left: isFrozen ? `${frozenLeft}px` : undefined
                            }}
                          >
                            <div className={`${
                              column.align === 'center' ? 'flex items-center justify-center' :
                              column.align === 'right' ? 'flex items-center justify-end' : 
                              'flex items-center justify-start'
                            } w-full`} style={{ minHeight: 'var(--table-row-height)', padding: 'var(--table-cell-padding-y) var(--table-cell-padding-x)' }}>
                              {renderCell(column, item, item[column.key])}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.enabled && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
                {pagination.showPageSizeOptions && (
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="ml-2 px-2 py-1 border border-table rounded text-sm bg-card text-foreground"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
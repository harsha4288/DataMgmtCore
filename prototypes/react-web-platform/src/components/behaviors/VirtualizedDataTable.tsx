import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useMemo } from 'react'
import { Column, BulkAction } from './DataTable'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { InventoryBadge } from './InventoryBadge'
import { UnifiedInlineEditor } from './UnifiedInlineEditor'

export interface VirtualizedDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
  // Virtual scrolling configuration
  virtualScrolling?: {
    enabled: boolean
    itemHeight?: number | ((index: number) => number) // Row height in pixels
    overscan?: number // Number of items to render outside visible area
    estimateSize?: number // Estimated size for dynamic heights
  }
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

export function VirtualizedDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className = '',
  virtualScrolling = { enabled: false, itemHeight: 48, overscan: 5 },
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
  maxHeight = '600px',
  frozenHeader = false,
  responsive = { enabled: false }
}: VirtualizedDataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)

  // Configure virtualizer
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      if (typeof virtualScrolling.itemHeight === 'function') {
        return virtualScrolling.estimateSize || 48
      }
      return virtualScrolling.itemHeight || 48
    },
    overscan: virtualScrolling.overscan || 5,
    getItemKey: (index) => index
  })

  // Calculate total size for container
  const totalSize = rowVirtualizer.getTotalSize()
  const virtualItems = rowVirtualizer.getVirtualItems()

  // Render cell content (reused from DataTable)
  const renderCellContent = (item: T, column: Column<T>) => {
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
  }

  if (!virtualScrolling.enabled) {
    throw new Error('VirtualizedDataTable requires virtualScrolling.enabled to be true. Use DataTable for non-virtualized rendering.')
  }

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

  return (
    <div className={`rounded-lg border border-muted/50 overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-muted/15 border-b border-muted/50">
        <table className="w-full">
          <thead>
            <tr className="min-h-[40px]">
              {selection?.enabled && (
                <th 
                  className="px-2 py-1 text-left text-xs font-semibold border-r border-muted/50 last:border-r-0"
                  style={{ width: `${selection.columnWidth || 48}px` }}
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    onChange={() => {
                      // Handle select all logic
                    }}
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={String(column.key)}
                  className={`px-2 py-1 text-left text-xs font-semibold border-r border-muted/50 last:border-r-0 ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                  style={{ 
                    width: column.width ? `${column.width}px` : undefined,
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
                </th>
              ))}
            </tr>
          </thead>
        </table>
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
            const item = data[virtualRow.index]
            const rowHeight = typeof virtualScrolling.itemHeight === 'function' 
              ? virtualScrolling.itemHeight(virtualRow.index)
              : virtualScrolling.itemHeight || 48

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${rowHeight}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <table className="w-full h-full">
                  <tbody>
                    <tr
                      className={`border-b border-muted/40 hover:bg-muted/40 transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => onRowClick?.(item)}
                    >
                      {selection?.enabled && (
                        <td 
                          className="px-2 py-1 border-r border-muted/40 last:border-r-0"
                          style={{ width: `${selection.columnWidth || 48}px` }}
                        >
                          <input
                            type="checkbox"
                            className="rounded"
                            onChange={() => {
                              // Handle individual row selection
                            }}
                          />
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td
                          key={String(column.key)}
                          className={`px-2 py-1 border-r border-muted/40 last:border-r-0 ${
                            column.align === 'center' ? 'text-center' : 
                            column.align === 'right' ? 'text-right' : 'text-left'
                          }`}
                          style={{ 
                            width: column.width ? `${column.width}px` : undefined,
                            minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
                            maxWidth: column.maxWidth ? `${column.maxWidth}px` : undefined
                          }}
                        >
                          {renderCellContent(item, column)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="px-3 py-2 bg-muted/10 border-t border-muted/50 text-xs text-muted-foreground">
        Virtual scrolling: {virtualItems.length} of {data.length} rows rendered
      </div>
    </div>
  )
}
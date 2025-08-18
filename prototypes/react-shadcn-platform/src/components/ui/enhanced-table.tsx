import * as React from "react"
import { cn } from "@/lib"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./table"
import { Checkbox } from "./checkbox"
// import { Badge } from "./badge"

// Enhanced table interfaces based on proven VolunteerDashboard patterns
export interface ColumnDef<T = any> {
  key: string
  label: string
  groupHeader?: string
  align?: 'left' | 'center' | 'right'
  width?: number
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  searchable?: boolean
  resizable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface GroupHeader {
  label: string
  colSpan: number
  startIndex: number
}

export interface SelectionConfig<T = any> {
  enabled: boolean
  selectedRows: T[]
  onSelectionChange: (rows: T[]) => void
  getRowId?: (row: T) => string | number
}

export interface EnhancedTableProps<T = any> {
  data: T[]
  columns: ColumnDef<T>[]
  selection?: SelectionConfig<T>
  groupHeaders?: GroupHeader[]
  frozenColumns?: number
  className?: string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
}

// Helper function to generate group headers from columns
export function generateGroupHeaders<T>(columns: ColumnDef<T>[]): GroupHeader[] {
  const groups: { [key: string]: { startIndex: number; count: number } } = {}
  const groupHeaders: GroupHeader[] = []
  
  columns.forEach((column, index) => {
    if (column.groupHeader) {
      if (!groups[column.groupHeader]) {
        groups[column.groupHeader] = { startIndex: index, count: 0 }
      }
      groups[column.groupHeader].count++
    }
  })
  
  Object.entries(groups).forEach(([label, { startIndex, count }]) => {
    groupHeaders.push({
      label,
      colSpan: count,
      startIndex
    })
  })
  
  return groupHeaders
}

// Enhanced Table component with selection and group headers
export function EnhancedTable<T = any>({
  data,
  columns,
  selection,
  groupHeaders,
  frozenColumns = 0,
  className,
  onRowClick,
  loading = false,
  emptyMessage = "No data available"
}: EnhancedTableProps<T>) {
  const [internalSelectedRows, setInternalSelectedRows] = React.useState<T[]>([])
  
  // Use internal state if no external selection config provided
  const selectedRows = selection?.selectedRows ?? internalSelectedRows
  const onSelectionChange = selection?.onSelectionChange ?? setInternalSelectedRows
  const getRowId = selection?.getRowId ?? ((_row: T, index: number) => index)
  
  // Generate group headers from columns if not provided
  const computedGroupHeaders = groupHeaders ?? generateGroupHeaders(columns)
  
  // Selection handlers
  const isRowSelected = (row: T, index: number) => {
    const rowId = getRowId(row, index)
    return selectedRows.some((selectedRow, idx) => getRowId(selectedRow, idx) === rowId)
  }

  const toggleRowSelection = (row: T, index: number) => {
    const rowId = getRowId(row, index)
    const isSelected = isRowSelected(row, index)

    if (isSelected) {
      onSelectionChange(selectedRows.filter((selectedRow, idx) => getRowId(selectedRow, idx) !== rowId))
    } else {
      onSelectionChange([...selectedRows, row])
    }
  }
  
  const toggleAllSelection = () => {
    if (selectedRows.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange([...data])
    }
  }
  
  const isAllSelected = data.length > 0 && selectedRows.length === data.length
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length
  
  // Frozen column styles
  const getFrozenColumnStyle = (columnIndex: number) => {
    if (columnIndex >= frozenColumns) return ""
    
    let leftOffset = 0
    for (let i = 0; i < columnIndex; i++) {
      leftOffset += columns[i]?.width ?? 120 // Default width
    }
    
    return cn(
      "sticky z-10",
      "bg-[var(--table-header)] border-r border-[var(--table-border)]",
      "shadow-[var(--table-freeze-shadow)]"
    )
  }
  
  return (
    <div className={cn("relative w-full", className)}>
      <Table>
        {/* Group Headers */}
        {computedGroupHeaders.length > 0 && (
          <TableHeader>
            <TableRow className="bg-[var(--table-group-header)]">
              {selection?.enabled && (
                <TableHead className="w-12 text-center">
                  {/* Empty cell for selection column */}
                </TableHead>
              )}
              {computedGroupHeaders.map((group, index) => (
                <TableHead
                  key={`group-${index}`}
                  colSpan={group.colSpan}
                  className={cn(
                    "text-center font-semibold text-[var(--text-header)]",
                    "bg-[var(--table-group-header)] border-b border-[var(--table-border)]",
                    "h-8 px-3 py-1 text-xs"
                  )}
                >
                  {group.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        
        {/* Column Headers */}
        <TableHeader>
          <TableRow className="bg-[var(--table-header)]">
            {selection?.enabled && (
              <TableHead 
                className={cn(
                  "w-12 text-center",
                  getFrozenColumnStyle(0)
                )}
                style={{ left: 0 }}
              >
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) (el as any).indeterminate = isIndeterminate
                  }}
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
            )}
            {columns.map((column, index) => (
              <TableHead
                key={column.key}
                className={cn(
                  "font-semibold text-[var(--text-header)]",
                  column.align === 'center' && "text-center",
                  column.align === 'right' && "text-right",
                  getFrozenColumnStyle(selection?.enabled ? index + 1 : index)
                )}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                  left: selection?.enabled && index < frozenColumns ? 
                    (index === 0 ? 48 : 48 + (columns.slice(0, index).reduce((acc, col) => acc + (col.width ?? 120), 0))) : 
                    undefined
                }}
              >
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        {/* Table Body */}
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length + (selection?.enabled ? 1 : 0)}
                className="text-center py-8 text-[var(--text-secondary)]"
              >
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length + (selection?.enabled ? 1 : 0)}
                className="text-center py-8 text-[var(--text-secondary)]"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow
                key={getRowId(row, rowIndex)}
                className={cn(
                  "transition-colors hover:bg-[var(--table-row-hover)]",
                  isRowSelected(row, rowIndex) && "bg-[var(--table-row-hover)]",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
                data-state={isRowSelected(row, rowIndex) ? "selected" : undefined}
              >
                {selection?.enabled && (
                  <TableCell
                    className={cn(
                      "w-12 text-center",
                      getFrozenColumnStyle(0)
                    )}
                    style={{ left: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isRowSelected(row, rowIndex)}
                      onCheckedChange={() => toggleRowSelection(row, rowIndex)}
                    />
                  </TableCell>
                )}
                {columns.map((column, columnIndex) => (
                  <TableCell
                    key={`${getRowId(row, rowIndex)}-${column.key}`}
                    className={cn(
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right",
                      getFrozenColumnStyle(selection?.enabled ? columnIndex + 1 : columnIndex)
                    )}
                    style={{
                      left: selection?.enabled && columnIndex < frozenColumns ? 
                        (columnIndex === 0 ? 48 : 48 + (columns.slice(0, columnIndex).reduce((acc, col) => acc + (col.width ?? 120), 0))) : 
                        undefined
                    }}
                  >
                    {column.render ? column.render(row[column.key as keyof T], row) : String(row[column.key as keyof T] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Export helper functions and types
// Note: Types are exported from advanced-data-table.tsx to avoid conflicts

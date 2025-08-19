import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
  ColumnOrderState,
  ColumnSizingState,
  Header,
  Table,
} from "@tanstack/react-table"
import { cn } from "@/lib"
// Note: Using native HTML elements instead of shadcn/ui Table components
// to avoid double overflow wrapper that breaks sticky positioning
import { Checkbox } from "./checkbox"
import { Button } from "./button"
import { Input } from "./input"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  GripVertical,
  Edit2,
  Check,
  X
} from "lucide-react"

// Advanced table interfaces based on TanStack Table and proven patterns
export interface GroupHeaderConfig {
  label: string
  columns: string[]
  className?: string
}

export interface FrozenColumnsConfig {
  count: number
  shadowIntensity?: 'light' | 'medium' | 'heavy'
}

export interface SelectionConfig<T = any> {
  enabled: boolean
  mode?: 'single' | 'multiple'
  selectedRows?: T[]
  onSelectionChange?: (rows: T[]) => void
  getRowId?: (row: T) => string | number
}

export interface MobileConfig {
  enabled: boolean
  hideColumns?: string[]
  stackColumns?: boolean
  touchOptimized?: boolean
}

// Column resizing configuration
export interface ResizingConfig {
  enabled: boolean
  minSize?: number
  maxSize?: number
  defaultSize?: number
}

// Column reordering configuration
export interface ReorderingConfig {
  enabled: boolean
  onReorder?: (fromIndex: number, toIndex: number) => void
}

// Inline editing configuration
export interface EditingConfig<T = any> {
  enabled: boolean
  mode?: 'cell' | 'row'
  onSave?: (rowIndex: number, columnId: string, value: any, row: T) => Promise<void>
  onCancel?: () => void
  validation?: (value: any, columnId: string, row: T) => boolean | string
}

export interface AdvancedDataTableProps<T = any> {
  data: T[]
  columns: ColumnDef<T>[]
  selection?: SelectionConfig<T>
  groupHeaders?: GroupHeaderConfig[]
  frozenColumns?: FrozenColumnsConfig
  mobile?: MobileConfig
  resizing?: ResizingConfig
  reordering?: ReorderingConfig
  editing?: EditingConfig<T>
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: boolean
  pageSize?: number
  className?: string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  exportable?: boolean
  onExport?: (data: T[]) => void
  maxHeight?: string
}

// Helper function to generate group headers from column definitions
export function generateGroupHeaders<T>(
  columns: ColumnDef<T>[],
  groupConfigs: GroupHeaderConfig[]
): { label: string; colSpan: number; startIndex: number }[] {
  const groupHeaders: { label: string; colSpan: number; startIndex: number }[] = []
  
  groupConfigs.forEach(config => {
    const startIndex = columns.findIndex(col => 
      config.columns.includes((col as any).accessorKey || (col as any).id)
    )
    if (startIndex !== -1) {
      groupHeaders.push({
        label: config.label,
        colSpan: config.columns.length,
        startIndex
      })
    }
  })
  
  return groupHeaders
}

// Helper function to check if column is frozen (based on reference implementation)
function isFrozenColumn(columnIndex: number, frozenCount: number, hasSelection: boolean): boolean {
  // Simple approach: freeze the first 'frozenCount' columns (including selection if enabled)
  return columnIndex < frozenCount
}

// Calculate cumulative frozen column widths for positioning
function calculateFrozenColumnOffsets<T>(
  columns: ColumnDef<T>[],
  frozenCount: number,
  hasSelection: boolean,
  columnSizing: ColumnSizingState
): Record<number, number> {
  const offsets: Record<number, number> = {}
  let cumulativeWidth = hasSelection ? 48 : 0 // Selection column width
  
  for (let i = 0; i < frozenCount && i < columns.length; i++) {
    offsets[i] = cumulativeWidth
    const columnId = (columns[i] as any).id || (columns[i] as any).accessorKey
    const width = columnSizing[columnId] || (columns[i] as any).size || 150
    cumulativeWidth += width
  }
  
  return offsets
}

// Helper function to get frozen column left position (simplified for debugging)
// Currently unused but kept for future dynamic width calculation
// function getFrozenLeft(
//   columnIndex: number,
//   frozenCount: number,
//   hasSelection: boolean,
//   tableColumns: any[]
// ): number {
//   if (!isFrozenColumn(columnIndex, frozenCount, hasSelection)) return 0

//   // Simplified calculation for debugging
//   if (hasSelection) {
//     if (columnIndex === 0) return 0      // Selection column
//     if (columnIndex === 1) return 60     // Name column after selection (updated to match CSS)
//   } else {
//     if (columnIndex === 0) return 0      // First column
//     if (columnIndex === 1) return 150    // Second column
//   }

//   return 0
// }

// Dynamic inline editing component for cells
function InlineEditor<T>({ 
  value, 
  onSave, 
  onCancel, 
  type = 'text' 
}: { 
  value: any
  onSave: (value: any) => void
  onCancel: () => void
  type?: 'text' | 'number' | 'select'
}) {
  const [editValue, setEditValue] = React.useState(value)

  return (
    <div className="flex items-center gap-1">
      <Input
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave(editValue)
          if (e.key === 'Escape') onCancel()
        }}
        className="h-8 text-sm"
        autoFocus
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={() => onSave(editValue)}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Main AdvancedDataTable component
export function AdvancedDataTable<T = any>({
  data,
  columns,
  selection,
  groupHeaders = [],
  frozenColumns,
  mobile,
  resizing,
  reordering,
  editing,
  searchable = true,
  filterable = false,
  sortable = true,
  pagination = true,
  pageSize = 10,
  className,
  onRowClick,
  loading = false,
  emptyMessage = "No data available",
  exportable = false,
  onExport,
  maxHeight
}: AdvancedDataTableProps<T>) {
  // Table ref for dynamic width calculation
  const tableRef = React.useRef<HTMLTableElement>(null)

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  
  // Editing state
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number; columnId: string } | null>(null)
  const [editingValue, setEditingValue] = React.useState<any>(null)
  
  // Initialize column sizing from column definitions (only for columns with explicit sizes)
  React.useEffect(() => {
    const initialSizing: ColumnSizingState = {}
    columns.forEach(col => {
      const columnId = (col as any).id || (col as any).accessorKey
      // Only set size if explicitly defined
      if (columnId && (col as any).size) {
        initialSizing[columnId] = (col as any).size
      }
    })
    setColumnSizing(initialSizing)
  }, [columns])

  // Prepare columns with selection if enabled
  const tableColumns = React.useMemo(() => {
    const cols = [...columns]

    if (selection?.enabled) {
      const selectionColumn: ColumnDef<T> = {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      }
      cols.unshift(selectionColumn)
    }

    return cols
  }, [columns, selection?.enabled])

  // Calculate frozen column offsets for proper positioning
  const frozenOffsets = React.useMemo(() => {
    const offsets: Record<number, number> = {}
    let cumulativeWidth = 0
    
    // Calculate offsets for all potentially frozen columns
    const maxFrozen = selection?.enabled ? (frozenColumns?.count || 0) + 1 : (frozenColumns?.count || 0)
    
    for (let i = 0; i < maxFrozen && i < tableColumns.length; i++) {
      offsets[i] = cumulativeWidth
      const column = tableColumns[i]
      const columnId = (column as any).id || (column as any).accessorKey
      const width = columnSizing[columnId] || (column as any).size || 150
      cumulativeWidth += width
    }
    
    return offsets
  }, [frozenColumns, tableColumns, selection?.enabled, columnSizing])

  // Mobile responsive column hiding
  React.useEffect(() => {
    if (mobile?.enabled && mobile.hideColumns) {
      const hiddenColumns: VisibilityState = {}
      mobile.hideColumns.forEach(columnId => {
        hiddenColumns[columnId] = false
      })
      setColumnVisibility(hiddenColumns)
    }
  }, [mobile])

  // Initialize table with advanced features
  const table = useReactTable({
    data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    globalFilterFn: "includesString",
    columnResizeMode: "onChange",
    enableColumnResizing: resizing?.enabled ?? false,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      columnOrder,
      columnSizing,
      pagination: pagination ? { pageIndex: 0, pageSize } : undefined,
    },
    initialState: {
      pagination: pagination ? { pageIndex: 0, pageSize } : undefined,
    },
  })

  // Handle selection changes
  React.useEffect(() => {
    if (selection?.enabled && selection.onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      selection.onSelectionChange(selectedRows)
    }
  }, [rowSelection, selection, table])

  // Generate computed group headers
  const computedGroupHeaders = React.useMemo(() => {
    return generateGroupHeaders(tableColumns, groupHeaders)
  }, [tableColumns, groupHeaders])

  // Export functionality
  const handleExport = () => {
    if (onExport) {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const dataToExport = selectedRows.length > 0
        ? selectedRows.map(row => row.original)
        : table.getFilteredRowModel().rows.map(row => row.original)
      onExport(dataToExport)
    }
  }

  // Inline editing handlers
  const handleEditCell = (rowIndex: number, columnId: string, value: any) => {
    setEditingCell({ rowIndex, columnId })
    setEditingValue(value)
  }

  const handleSaveEdit = async () => {
    if (!editingCell || !editing?.onSave) return
    
    try {
      const row = table.getRowModel().rows[editingCell.rowIndex]
      if (row) {
        // Validate if validation function provided
        if (editing.validation) {
          const validationResult = editing.validation(editingValue, editingCell.columnId, row.original)
          if (typeof validationResult === 'string') {
            console.error('Validation error:', validationResult)
            return
          }
          if (!validationResult) {
            console.error('Validation failed')
            return
          }
        }
        
        await editing.onSave(editingCell.rowIndex, editingCell.columnId, editingValue, row.original)
        setEditingCell(null)
        setEditingValue(null)
      }
    } catch (error) {
      console.error('Error saving edit:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditingValue(null)
    editing?.onCancel?.()
  }

  // Column reordering with drag and drop
  const handleDragStart = (e: React.DragEvent<HTMLTableCellElement>, header: Header<T, unknown>) => {
    if (!reordering?.enabled) return
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', header.column.id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLTableCellElement>) => {
    if (!reordering?.enabled) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLTableCellElement>, targetHeader: Header<T, unknown>) => {
    if (!reordering?.enabled) return
    e.preventDefault()
    
    const sourceColumnId = e.dataTransfer.getData('text/plain')
    if (sourceColumnId !== targetHeader.column.id) {
      const newColumnOrder = [...table.getState().columnOrder]
      const sourceIndex = newColumnOrder.indexOf(sourceColumnId)
      const targetIndex = newColumnOrder.indexOf(targetHeader.column.id)
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        newColumnOrder.splice(sourceIndex, 1)
        newColumnOrder.splice(targetIndex, 0, sourceColumnId)
        setColumnOrder(newColumnOrder)
        reordering.onReorder?.(sourceIndex, targetIndex)
      }
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {(searchable || exportable || filterable) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(String(event.target.value))}
                  className="pl-8 max-w-sm"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={loading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export {table.getFilteredSelectedRowModel().rows.length > 0
                  ? `(${table.getFilteredSelectedRowModel().rows.length})`
                  : ''}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-md border" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="relative w-full overflow-auto" style={{ maxHeight: maxHeight || '600px' }}>
          <table
            ref={tableRef}
            className="w-full caption-bottom text-sm"
            style={{ minWidth: '800px', tableLayout: 'auto' }}
          >
            <thead className="[&_tr]:border-b sticky top-0 z-[52]" style={{ backgroundColor: 'hsl(var(--muted))' }}>
              {/* Group Headers */}
              {computedGroupHeaders.length > 0 && (
                <tr className="border-b sticky top-0 z-[53]" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                  {selection?.enabled && (
                    <th className="w-[40px] h-12 px-4 text-left align-middle font-medium sticky left-0 z-[54] border-r border-border shadow-[2px_0_4px_rgba(0,0,0,0.05)]" style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }} />
                  )}
                  {computedGroupHeaders.map((group, index) => {
                    // Determine if this group header spans any frozen columns
                    const groupStartIndex = group.startIndex
                    const isFrozen = frozenColumns && groupStartIndex < frozenColumns.count
                    const frozenLeft = isFrozen ? frozenOffsets[groupStartIndex] : undefined
                    
                    return (
                      <th
                        key={`group-${index}`}
                        colSpan={group.colSpan}
                        className={cn(
                          "h-12 px-4 text-center align-middle font-semibold border-r border-border",
                          isFrozen && "sticky z-[54] shadow-[2px_0_4px_rgba(0,0,0,0.05)]"
                        )}
                        style={{
                          backgroundColor: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))',
                          ...(isFrozen && { left: `${frozenLeft}px` })
                        }}
                      >
                        {group.label}
                      </th>
                    )
                  })}
                </tr>
              )}

              {/* Column Headers */}
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b sticky z-[52]" style={{ backgroundColor: 'hsl(var(--muted))', top: computedGroupHeaders.length > 0 ? '48px' : '0' }}>
                  {headerGroup.headers.map((header, columnIndex) => {
                    // Selection column (index 0) is always frozen if enabled
                    const isSelectionColumn = selection?.enabled && columnIndex === 0
                    const adjustedFrozenCount = selection?.enabled ? (frozenColumns?.count || 0) + 1 : (frozenColumns?.count || 0)
                    const isFrozen = isSelectionColumn || (frozenColumns && columnIndex < adjustedFrozenCount)
                    const frozenLeft = isFrozen ? frozenOffsets[columnIndex] : undefined
                    const columnSize = header.column.getSize()

                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "h-12 px-2 text-left align-middle font-medium border-r border-border relative group",
                          isFrozen && "sticky z-[54]",
                          header.column.getCanSort() && "cursor-pointer hover:bg-muted/50"
                        )}
                        style={{
                          backgroundColor: 'hsl(var(--muted))',
                          color: 'hsl(var(--muted-foreground))',
                          boxShadow: isFrozen ? '2px 0 4px rgba(0,0,0,0.05)' : undefined,
                          ...(columnSize && { width: columnSize }),
                          ...(isFrozen && { left: `${frozenLeft}px` })
                        }}
                        draggable={reordering?.enabled}
                        onDragStart={(e) => handleDragStart(e, header)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, header)}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center justify-between">
                            <div
                              className={cn(
                                "flex items-center space-x-2 flex-1",
                                header.column.getCanSort() && "select-none"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {reordering?.enabled && (
                                <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 cursor-grab" />
                              )}
                              <span>
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </span>
                              {header.column.getCanSort() && (
                                <span className="ml-2">
                                  {header.column.getIsSorted() === "desc" ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === "asc" ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                                  )}
                                </span>
                              )}
                            </div>
                            {resizing?.enabled && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={cn(
                                  "absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 hover:opacity-100 bg-primary",
                                  header.column.getIsResizing() && "opacity-100"
                                )}
                              />
                            )}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td
                    colSpan={table.getVisibleFlatColumns().length}
                    className="p-4 align-middle text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "border-b transition-colors cursor-pointer",
                      row.getIsSelected() && "bg-muted/50",
                      mobile?.touchOptimized && "min-h-[44px]"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                    style={{ 
                      backgroundColor: row.getIsSelected() ? 'hsl(var(--muted) / 0.5)' : 'hsl(var(--background))',
                    }}
                    onMouseEnter={(e) => {
                      if (!row.getIsSelected()) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--muted) / 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!row.getIsSelected()) {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--background))';
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell, columnIndex) => {
                      // Selection column (index 0) is always frozen if enabled
                      const isSelectionColumn = selection?.enabled && columnIndex === 0
                      const adjustedFrozenCount = selection?.enabled ? (frozenColumns?.count || 0) + 1 : (frozenColumns?.count || 0)
                      const isFrozen = isSelectionColumn || (frozenColumns && columnIndex < adjustedFrozenCount)
                      const frozenLeft = isFrozen ? frozenOffsets[columnIndex] : undefined
                      const isEditing = editingCell?.rowIndex === row.index && 
                                       editingCell?.columnId === cell.column.id

                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "p-2 align-middle border-r border-border overflow-hidden",
                            isFrozen && "sticky z-[50]",
                            "last:border-r-0"
                          )}
                          style={{
                            backgroundColor: 'inherit',
                            color: 'hsl(var(--foreground))',
                            boxShadow: isFrozen ? '2px 0 4px rgba(0,0,0,0.05)' : undefined,
                            ...(isFrozen && { left: `${frozenLeft}px` })
                          }}
                          onDoubleClick={() => {
                            if (editing?.enabled && cell.column.columnDef.enableSorting !== false) {
                              handleEditCell(row.index, cell.column.id, cell.getValue())
                            }
                          }}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit()
                                  if (e.key === 'Escape') handleCancelEdit()
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={handleSaveEdit}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group w-full overflow-hidden">
                              <div className="w-full overflow-hidden">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                              {editing?.enabled && (
                                <Edit2 
                                  className="h-4 w-4 opacity-0 group-hover:opacity-50 cursor-pointer ml-2 flex-shrink-0" 
                                  onClick={() => handleEditCell(row.index, cell.column.id, cell.getValue())}
                                />
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getVisibleFlatColumns().length}
                    className="p-4 align-middle text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
                className="h-8 w-[70px] rounded border border-input bg-background px-3 py-1 text-sm"
                aria-label="Rows per page"
              >
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



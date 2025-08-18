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
} from "@tanstack/react-table"
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
import { Button } from "./button"
import { Input } from "./input"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Filter,
  Download
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

export interface AdvancedDataTableProps<T = any> {
  data: T[]
  columns: ColumnDef<T>[]
  selection?: SelectionConfig<T>
  groupHeaders?: GroupHeaderConfig[]
  frozenColumns?: FrozenColumnsConfig
  mobile?: MobileConfig
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

// Helper function to get frozen column styles
function getFrozenColumnStyle(
  columnIndex: number, 
  frozenCount: number, 
  hasSelection: boolean,
  shadowIntensity: 'light' | 'medium' | 'heavy' = 'medium'
): React.CSSProperties | undefined {
  const adjustedIndex = hasSelection ? columnIndex + 1 : columnIndex
  
  if (adjustedIndex < frozenCount) {
    const shadowMap = {
      light: 'var(--table-freeze-shadow, 1px 0 3px rgba(0,0,0,0.1))',
      medium: 'var(--table-freeze-shadow, 2px 0 4px rgba(0,0,0,0.15))',
      heavy: 'var(--table-freeze-shadow, 3px 0 6px rgba(0,0,0,0.2))'
    }
    
    return {
      position: 'sticky',
      left: adjustedIndex === 0 ? 0 : `${adjustedIndex * 120}px`, // Approximate column width
      zIndex: 10,
      backgroundColor: 'var(--table-header)',
      boxShadow: adjustedIndex === frozenCount - 1 ? shadowMap[shadowIntensity] : undefined
    }
  }
  
  return undefined
}

// Main AdvancedDataTable component
export function AdvancedDataTable<T = any>({
  data,
  columns,
  selection,
  groupHeaders = [],
  frozenColumns,
  mobile,
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
  onExport
}: AdvancedDataTableProps<T>) {
  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

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

  // Initialize table
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
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
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
      <div className="rounded-md border bg-[var(--table-container)] overflow-hidden">
        <div className="relative overflow-auto">
          <Table>
            <TableHeader>
              {/* Group Headers */}
              {computedGroupHeaders.length > 0 && (
                <TableRow className="bg-[var(--table-group-header)] border-b border-[var(--table-border)]">
                  {selection?.enabled && (
                    <TableHead className="w-[40px]" />
                  )}
                  {computedGroupHeaders.map((group, index) => (
                    <TableHead
                      key={`group-${index}`}
                      colSpan={group.colSpan}
                      className="text-center font-semibold text-[var(--text-header)] bg-[var(--table-group-header)]"
                    >
                      {group.label}
                    </TableHead>
                  ))}
                </TableRow>
              )}

              {/* Column Headers */}
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-[var(--table-header)] border-b border-[var(--table-border)]">
                  {headerGroup.headers.map((header, columnIndex) => {
                    const frozenStyle = frozenColumns ? getFrozenColumnStyle(
                      columnIndex,
                      frozenColumns.count,
                      selection?.enabled || false,
                      frozenColumns.shadowIntensity
                    ) : undefined

                    return (
                      <TableHead
                        key={header.id}
                        style={frozenStyle}
                        className={cn(
                          "text-[var(--text-header)] bg-[var(--table-header)]",
                          frozenStyle && "sticky"
                        )}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center space-x-2",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
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
                                  <ChevronsUpDown className="h-4 w-4" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleFlatColumns().length}
                    className="text-center py-8 text-[var(--text-secondary)]"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "transition-colors hover:bg-[var(--table-row-hover)] cursor-pointer",
                      row.getIsSelected() && "bg-[var(--table-row-hover)]",
                      mobile?.touchOptimized && "min-h-[44px]"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell, columnIndex) => {
                      const frozenStyle = frozenColumns ? getFrozenColumnStyle(
                        columnIndex,
                        frozenColumns.count,
                        selection?.enabled || false,
                        frozenColumns.shadowIntensity
                      ) : undefined

                      return (
                        <TableCell
                          key={cell.id}
                          style={frozenStyle}
                          className={cn(
                            "text-[var(--text-primary)]",
                            frozenStyle && "sticky bg-[var(--table-container)]"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={table.getVisibleFlatColumns().length}
                    className="text-center py-8 text-[var(--text-secondary)]"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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



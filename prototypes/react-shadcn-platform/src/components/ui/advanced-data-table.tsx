"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib"
import "./advanced-data-table.css"

// Extended props for advanced features
interface AdvancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // Search & Filter
  searchKey?: string
  searchPlaceholder?: string
  globalFilter?: boolean
  // Enhanced Selection
  enableSelection?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
  selection?: SelectionConfig
  // Pagination
  pageSize?: number
  enablePagination?: boolean
  // Enhanced Features
  groupHeaders?: GroupHeaderConfig[]
  frozenColumns?: FrozenColumnConfig
  mobile?: MobileConfig
  // Styling
  className?: string
  // Loading & Empty states
  loading?: boolean
  emptyMessage?: string
  // Row actions
  onRowClick?: (row: TData) => void
  // Legacy support
  legacyGroupHeaders?: GroupHeader[]
}

// Enhanced interfaces for new features
interface GroupHeaderConfig {
  label: string
  columns: string[]
  level?: number
  className?: string
}

interface FrozenColumnConfig {
  count: number
  shadowIntensity?: 'light' | 'medium' | 'strong'
  mobileBreakpoint?: number
}

interface SelectionConfig {
  enabled: boolean
  mode?: 'single' | 'multiple'
  showSelectAll?: boolean
  selectAllText?: string
  selectedRowClassName?: string
  onSelectionChange?: (rows: any[]) => void
}

interface MobileConfig {
  enabled: boolean
  stackColumns?: boolean
  hideColumns?: string[]
  touchFriendly?: boolean
  swipeActions?: boolean
}

// Legacy interface for backward compatibility
interface GroupHeader {
  label: string
  colSpan: number
  startIndex: number
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey = "name",
  searchPlaceholder = "Search...",
  globalFilter = false,
  enableSelection = false,
  onSelectionChange,
  selection,
  pageSize = 10,
  enablePagination = true,
  groupHeaders,
  frozenColumns,
  mobile,
  className,
  loading = false,
  emptyMessage = "No results found.",
  onRowClick,
  legacyGroupHeaders,
}: AdvancedDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilterValue, setGlobalFilterValue] = React.useState("")

  // Enhanced selection configuration
  const selectionConfig = React.useMemo(() => {
    if (selection) return selection
    if (enableSelection) {
      return {
        enabled: true,
        mode: 'multiple' as const,
        showSelectAll: true,
        onSelectionChange,
      }
    }
    return { enabled: false }
  }, [selection, enableSelection, onSelectionChange])

  // Convert new GroupHeaderConfig to legacy format for backward compatibility
  const processedGroupHeaders = React.useMemo(() => {
    if (legacyGroupHeaders) return legacyGroupHeaders
    if (!groupHeaders) return undefined

    return groupHeaders.map((config) => {
      const startIndex = columns.findIndex(col => {
        const accessorKey = (col as any).accessorKey || col.id
        return config.columns.includes(accessorKey)
      })
      return {
        label: config.label,
        colSpan: config.columns.length,
        startIndex: startIndex >= 0 ? startIndex : 0,
      }
    })
  }, [groupHeaders, legacyGroupHeaders, columns])

  // Frozen columns styling
  const frozenColumnStyles = React.useMemo(() => {
    if (!frozenColumns || frozenColumns.count === 0) return {}

    const shadowIntensity = frozenColumns.shadowIntensity || 'medium'
    const shadows = {
      light: 'var(--table-frozen-shadow, 2px 0 4px rgba(0,0,0,0.05))',
      medium: 'var(--table-frozen-shadow, 2px 0 6px rgba(0,0,0,0.1))',
      strong: 'var(--table-frozen-shadow, 4px 0 8px rgba(0,0,0,0.15))',
    }

    return {
      '--frozen-shadow': shadows[shadowIntensity],
      '--frozen-count': frozenColumns.count,
    } as React.CSSProperties
  }, [frozenColumns])

  // Mobile configuration
  const mobileConfig = React.useMemo(() => {
    const defaultMobile: MobileConfig = {
      enabled: true,
      stackColumns: false,
      hideColumns: [],
      touchFriendly: true,
      swipeActions: false,
    }
    return mobile ? { ...defaultMobile, ...mobile } : defaultMobile
  }, [mobile])

  // Add enhanced selection column if enabled
  const enhancedColumns = React.useMemo(() => {
    if (!selectionConfig.enabled) return columns

    const showSelectAll = (selectionConfig as SelectionConfig).showSelectAll !== false
    const selectAllText = (selectionConfig as SelectionConfig).selectAllText || "Select all"

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center space-x-2">
          {showSelectAll && (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label={selectAllText}
              className="border-2"
            />
          )}
        </div>
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-2"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }

    return [selectionColumn, ...columns]
  }, [columns, selectionConfig])

  // Mobile-responsive columns
  const responsiveColumns = React.useMemo(() => {
    if (!mobileConfig.enabled || !mobileConfig.hideColumns?.length) {
      return enhancedColumns
    }

    return enhancedColumns.map(col => ({
      ...col,
      meta: {
        ...col.meta,
        hideOnMobile: mobileConfig.hideColumns?.includes((col as any).accessorKey || col.id)
      }
    }))
  }, [enhancedColumns, mobileConfig])

  const table = useReactTable({
    data,
    columns: responsiveColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: globalFilterValue,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  // Handle selection changes
  React.useEffect(() => {
    if (enableSelection && onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, enableSelection, onSelectionChange, table])

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                globalFilter
                  ? globalFilterValue
                  : (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) => {
                if (globalFilter) {
                  setGlobalFilterValue(event.target.value)
                } else {
                  table.getColumn(searchKey)?.setFilterValue(event.target.value)
                }
              }}
              className="pl-8 max-w-sm"
            />
          </div>
        </div>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Enhanced Table */}
      <div
        className={cn(
          "advanced-data-table",
          "rounded-md border border-[var(--table-border,hsl(var(--border)))]",
          "bg-[var(--table-bg,hsl(var(--background)))]",
          "overflow-hidden",
          frozenColumns && frozenColumns.count > 0 && "relative",
          mobileConfig.enabled && "mobile-optimized",
          mobileConfig.touchFriendly && "touch-friendly"
        )}
        style={frozenColumnStyles}
        data-frozen-columns={frozenColumns && frozenColumns.count > 0 ? frozenColumns.count : undefined}
      >
        <Table className="relative">
          {/* Enhanced Group Headers (if provided) */}
          {processedGroupHeaders && processedGroupHeaders.length > 0 && (
            <TableHeader>
              <TableRow
                className="bg-[var(--table-group-header-bg,hsl(var(--muted)))] border-b-2 border-[var(--table-border,hsl(var(--border)))]"
                style={frozenColumnStyles}
              >
                {selectionConfig.enabled && <TableHead className="w-12" />}
                {processedGroupHeaders.map((group, index) => (
                  <TableHead
                    key={`group-${index}`}
                    colSpan={group.colSpan}
                    className={cn(
                      "text-center font-semibold text-[var(--table-header-text,hsl(var(--foreground)))] py-4",
                      "border-r border-[var(--table-border,hsl(var(--border)))] last:border-r-0"
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
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>

          {/* Table Body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={enhancedColumns.length}
                  className="h-24 text-center"
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
                    // Base row styling
                    "border-b border-[var(--table-border,hsl(var(--border)))]",
                    // Hover effects
                    onRowClick && "cursor-pointer",
                    "hover:bg-[var(--table-row-hover,hsl(var(--muted/50)))]",
                    // Enhanced selection styling
                    row.getIsSelected() && [
                      "bg-[var(--table-selection-bg,hsl(var(--primary/5)))]",
                      "border-l-2 border-l-[var(--table-selection-border,hsl(var(--primary/20)))]",
                      (selectionConfig as SelectionConfig).selectedRowClassName
                    ].filter(Boolean)
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enhancedColumns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {enableSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
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
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                {"<<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                {"<"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                {">"}
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                {">>"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// HELPER UTILITIES - Make it easy to create common column patterns
// ============================================================================

// Create sortable header with icon
export function createSortableHeader(title: string) {
  return ({ column }: { column: any }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {title}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  }
}

// Create badge column with automatic color mapping
export function createBadgeColumn<T>(
  accessorKey: string,
  title: string,
  variantMap?: Record<string, string>
) {
  const defaultVariantMap: Record<string, string> = {
    active: "grade-a",
    pending: "grade-c",
    inactive: "grade-f",
    "team lead": "grade-a",
    coordinator: "grade-b",
    specialist: "grade-c",
    volunteer: "neutral",
  }

  return {
    accessorKey,
    header: title,
    cell: ({ row }: { row: Row<T> }) => {
      const value = row.getValue(accessorKey) as string
      const mappings = variantMap || defaultVariantMap
      const variant = mappings[value.toLowerCase()] || "neutral"

      return <Badge variant={variant as any}>{value}</Badge>
    },
  }
}

// Create action column with common actions
export function createActionColumn<T>(actions: {
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onCustom?: { label: string; action: (row: T) => void }[]
}) {
  return {
    id: "actions",
    enableHiding: false,
    cell: ({ row }: { row: Row<T> }) => {
      const data = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(String((data as any).id))}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {actions.onView && (
              <DropdownMenuItem onClick={() => actions.onView!(data)}>
                View details
              </DropdownMenuItem>
            )}
            {actions.onEdit && (
              <DropdownMenuItem onClick={() => actions.onEdit!(data)}>
                Edit
              </DropdownMenuItem>
            )}
            {actions.onDelete && (
              <DropdownMenuItem
                onClick={() => actions.onDelete!(data)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            )}
            {actions.onCustom?.map((custom, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => custom.action(data)}
              >
                {custom.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }
}

// Create numeric column with formatting
export function createNumericColumn(
  accessorKey: string,
  title: string,
  format?: "currency" | "percentage" | "number"
) {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }: { row: any }) => {
      const value = row.getValue(accessorKey) as number

      if (format === "currency") {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value)
      }

      if (format === "percentage") {
        return `${(value * 100).toFixed(1)}%`
      }

      return value.toLocaleString()
    },
  }
}

// Create date column with formatting
export function createDateColumn(
  accessorKey: string,
  title: string,
  format: "short" | "long" | "relative" = "short"
) {
  return {
    accessorKey,
    header: createSortableHeader(title),
    cell: ({ row }: { row: any }) => {
      const value = row.getValue(accessorKey) as string | Date
      const date = new Date(value)

      if (format === "relative") {
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return "Today"
        if (diffDays === 1) return "Yesterday"
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString()
      }

      return format === "long"
        ? date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })
        : date.toLocaleDateString()
    },
  }
}

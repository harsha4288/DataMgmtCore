import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { TanStackAdvancedTable } from './ui/tanstack-advanced-table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { InventoryBadge } from './ui/inventory-badge'
import { RoleBadge } from './ui/role-badge'
import { StatusBadge } from './ui/status-badge'
import { MoreHorizontal, Mail, Edit } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

// Volunteer interface matching Prototype 1
interface Volunteer extends Record<string, unknown> {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  preferences: string
  events: number
  hours: number
  // T-shirt inventory (matching SGS pattern)
  tshirt_s: string  // Format: "issued/total"
  tshirt_m: string  // Format: "issued/total"
  tshirt_l: string  // Format: "issued/total"
  tshirt_xl: string // Format: "issued/total"
  tshirt_xxl: string // Format: "issued/total"
}

// Mock data matching Prototype 1 patterns
const mockVolunteers: Volunteer[] = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'Team Lead',
    status: 'active',
    preferences: '11/19',
    events: 4,
    hours: 24,
    tshirt_s: '2/7',
    tshirt_m: '10/18',
    tshirt_l: '21/32',
    tshirt_xl: '18/16',
    tshirt_xxl: '3/8'
  },
  {
    id: 2,
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'Coordinator',
    status: 'active',
    preferences: '11/16',
    events: 6,
    hours: 32,
    tshirt_s: '1/1',
    tshirt_m: '2/3',
    tshirt_l: '4/6',
    tshirt_xl: '3/4',
    tshirt_xxl: '1/2'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily@example.com',
    role: 'Volunteer',
    status: 'pending',
    preferences: '3/15',
    events: 2,
    hours: 8,
    tshirt_s: '1/3',
    tshirt_m: '1/4',
    tshirt_l: '2/5',
    tshirt_xl: '0/2',
    tshirt_xxl: '0/1'
  },
  {
    id: 4,
    name: 'David Park',
    email: 'david@example.com',
    role: 'Specialist',
    status: 'active',
    preferences: '14/17',
    events: 5,
    hours: 28,
    tshirt_s: '0/0',
    tshirt_m: '2/2',
    tshirt_l: '6/7',
    tshirt_xl: '4/5',
    tshirt_xxl: '2/3'
  },
  {
    id: 5,
    name: 'Lisa Wang',
    email: 'lisa@example.com',
    role: 'Team Lead',
    status: 'active',
    preferences: '7/14',
    events: 3,
    hours: 18,
    tshirt_s: '0/1',
    tshirt_m: '2/4',
    tshirt_l: '4/6',
    tshirt_xl: '1/2',
    tshirt_xxl: '0/1'
  },
  {
    id: 6,
    name: 'James Smith',
    email: 'james@example.com',
    role: 'Volunteer',
    status: 'active',
    preferences: '9/14',
    events: 4,
    hours: 22,
    tshirt_s: '1/2',
    tshirt_m: '3/3',
    tshirt_l: '2/4',
    tshirt_xl: '2/3',
    tshirt_xxl: '1/2'
  },
  {
    id: 7,
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'Coordinator',
    status: 'pending',
    preferences: '7/19',
    events: 2,
    hours: 12,
    tshirt_s: '0/1',
    tshirt_m: '1/5',
    tshirt_l: '3/7',
    tshirt_xl: '2/4',
    tshirt_xxl: '1/2'
  },
  {
    id: 8,
    name: 'Robert Taylor',
    email: 'robert@example.com',
    role: 'Specialist',
    status: 'active',
    preferences: '14/20',
    events: 7,
    hours: 35,
    tshirt_s: '0/0',
    tshirt_m: '3/3',
    tshirt_l: '5/8',
    tshirt_xl: '4/6',
    tshirt_xxl: '2/3'
  },
  {
    id: 9,
    name: 'Anna Lee',
    email: 'anna@example.com',
    role: 'Volunteer',
    status: 'active',
    preferences: '6/13',
    events: 3,
    hours: 16,
    tshirt_s: '1/3',
    tshirt_m: '1/2',
    tshirt_l: '3/5',
    tshirt_xl: '1/2',
    tshirt_xxl: '0/1'
  },
  {
    id: 10,
    name: 'Kevin Brown',
    email: 'kevin@example.com',
    role: 'Team Lead',
    status: 'active',
    preferences: '15/22',
    events: 6,
    hours: 30,
    tshirt_s: '1/1',
    tshirt_m: '4/6',
    tshirt_l: '6/9',
    tshirt_xl: '3/4',
    tshirt_xxl: '1/2'
  }
]


export function TanStackTableDemo() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(mockVolunteers)

  // Define columns with advanced features
  const columns: ColumnDef<Volunteer>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Volunteer Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="font-medium">{row.getValue('name')}</div>
        </div>
      ),
      // Auto-size based on content
      enablePinning: true,
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        return <RoleBadge role={role} />
      },
      // Auto-size based on content
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return <StatusBadge status={status} />
      },
      // Auto-size based on content
    },
    {
      id: 'preferences',
      accessorKey: 'preferences',
      header: 'PREFS',
      cell: ({ row }) => {
        const prefs = row.getValue('preferences') as string
        const [issued, total] = prefs.split('/').map(Number)
        const variant = issued >= total * 0.8 ? 'grade-f' : 'grade-d'
        return <Badge variant={variant as any} size="sm" className="font-mono">{prefs}</Badge>
      },
      // Auto-size based on content
    },
    {
      id: 'tshirt_s',
      accessorKey: 'tshirt_s',
      header: () => <div className="text-center">👕 S</div>,
      cell: ({ row }) => {
        const value = row.getValue('tshirt_s') as string
        const [issued, total] = value.split('/').map(Number)
        return <InventoryBadge issued={issued} total={total} />
      },
      // Auto-size based on content - no fixed width to prevent truncation
    },
    {
      id: 'tshirt_m',
      accessorKey: 'tshirt_m',
      header: () => <div className="text-center">👕 M</div>,
      cell: ({ row }) => {
        const value = row.getValue('tshirt_m') as string
        const [issued, total] = value.split('/').map(Number)
        return <InventoryBadge issued={issued} total={total} />
      },
      // Auto-size based on content - no fixed width to prevent truncation
    },
    {
      id: 'tshirt_l',
      accessorKey: 'tshirt_l',
      header: () => <div className="text-center">👕 L</div>,
      cell: ({ row }) => {
        const value = row.getValue('tshirt_l') as string
        const [issued, total] = value.split('/').map(Number)
        return <InventoryBadge issued={issued} total={total} />
      },
      // Auto-size based on content - no fixed width to prevent truncation
    },
    {
      id: 'tshirt_xl',
      accessorKey: 'tshirt_xl',
      header: () => <div className="text-center">👕 XL</div>,
      cell: ({ row }) => {
        const value = row.getValue('tshirt_xl') as string
        const [issued, total] = value.split('/').map(Number)
        return <InventoryBadge issued={issued} total={total} />
      },
      // Auto-size based on content - no fixed width to prevent truncation
    },
    {
      id: 'tshirt_xxl',
      accessorKey: 'tshirt_xxl',
      header: () => <div className="text-center">👕 2XL</div>,
      cell: ({ row }) => {
        const value = row.getValue('tshirt_xxl') as string
        const [issued, total] = value.split('/').map(Number)
        return <InventoryBadge issued={issued} total={total} />
      },
      // Auto-size based on content - no fixed width to prevent truncation
    },
    {
      id: 'events',
      accessorKey: 'events',
      header: 'Events',
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue('events')}</div>
      },
      // Auto-size based on content
    },
    {
      id: 'hours',
      accessorKey: 'hours',
      header: 'Hours',
      cell: ({ row }) => {
        return <div className="text-center">{row.getValue('hours')}</div>
      },
      // Auto-size based on content
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const volunteer = row.original
        
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
                onClick={() => navigator.clipboard.writeText(volunteer.email)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Copy email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit volunteer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: false,
      enableHiding: false,
      size: 40, // Keep actions column fixed
    },
  ]

  const handleCellEdit = async (_rowIndex: number, columnId: string, value: any, _row: Volunteer) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update the data
    setVolunteers(prev => 
      prev.map((volunteer, index) => 
        index === _rowIndex 
          ? { ...volunteer, [columnId]: value }
          : volunteer
      )
    )
  }

  const groupHeaders = [
    {
      label: 'T-Shirt Inventory (ISSUED/MAX)',
      columns: ['tshirt_s', 'tshirt_m', 'tshirt_l', 'tshirt_xl', 'tshirt_xxl']
    }
  ]

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">TanStack Advanced Table Demo</h2>
        <p className="text-muted-foreground">
          Volunteer management with frozen columns, sorting, resizing, inline editing, and full theme support.
        </p>
      </div>

      <TanStackAdvancedTable<Volunteer>
        data={volunteers}
        columns={columns}
        selection={{
          enabled: true,
          mode: 'multiple',
          onSelectionChange: (_rows) => {
            console.log('Selected rows:', _rows)
          }
        }}
        groupHeaders={groupHeaders}
        frozenColumns={{
          count: 1, // Freeze only 'name' column (selection is automatically frozen)
          shadowIntensity: 'medium'
        }}
        resizing={{
          enabled: true,
          minSize: 60,
          maxSize: 400,
          defaultSize: 150
        }}
        reordering={{
          enabled: true,
          onReorder: (_fromIndex, _toIndex) => {
            console.log(`Reordered column from ${_fromIndex} to ${_toIndex}`)
          }
        }}
        editing={{
          enabled: true,
          mode: 'cell',
          onSave: handleCellEdit,
          validation: (value, columnId, _row) => {
            if (columnId === 'events' || columnId === 'hours') {
              const numValue = Number(value)
              if (isNaN(numValue) || numValue < 0) {
                return 'Must be a positive number'
              }
            }
            return true
          }
        }}
        searchable={true}
        filterable={true}
        sortable={true}
        pagination={true}
        pageSize={10}
        exportable={true}
        exportFilename="volunteers"
        maxHeight="600px"
        onRowClick={(_row) => {
          console.log('Row clicked:', _row)
        }}
        className="border rounded-lg"
      />
    </div>
  )
}
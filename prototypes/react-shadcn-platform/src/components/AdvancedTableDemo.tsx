import { useState } from 'react'
import { AdvancedDataTable, type GroupHeaderConfig } from './ui/advanced-data-table'
import { Badge } from './ui/badge'
import { ColumnDef } from '@tanstack/react-table'

// Sample data type
interface VolunteerData {
  id: number
  name: string
  role: string
  status: string
  department: string
  email: string
  phone: string
  events: number
  hours: number
  tshirtS: number
  tshirtM: number
  tshirtL: number
  tshirtXL: number
  tshirt2XL: number
  preferences: string
}

// Sample data with T-shirt inventory
const volunteerData: VolunteerData[] = [
  { 
    id: 1, 
    name: 'Sarah Johnson', 
    role: 'Team Lead', 
    status: 'active', 
    department: 'Operations',
    email: 'sarah@example.com',
    phone: '555-0101',
    events: 4, 
    hours: 24,
    tshirtS: 2,
    tshirtM: 10,
    tshirtL: 21,
    tshirtXL: 10,
    tshirt2XL: 3,
    preferences: '11/19'
  },
  { 
    id: 2, 
    name: 'Mike Chen', 
    role: 'Coordinator', 
    status: 'active', 
    department: 'Marketing',
    email: 'mike@example.com',
    phone: '555-0102',
    events: 6, 
    hours: 32,
    tshirtS: 1,
    tshirtM: 2,
    tshirtL: 4,
    tshirtXL: 3,
    tshirt2XL: 1,
    preferences: '11/16'
  },
  { 
    id: 3, 
    name: 'Emily Rodriguez', 
    role: 'Volunteer', 
    status: 'pending', 
    department: 'Events',
    email: 'emily@example.com',
    phone: '555-0103',
    events: 2, 
    hours: 8,
    tshirtS: 0,
    tshirtM: 1,
    tshirtL: 2,
    tshirtXL: 0,
    tshirt2XL: 0,
    preferences: '3/15'
  },
  { 
    id: 4, 
    name: 'David Park', 
    role: 'Specialist', 
    status: 'active', 
    department: 'Technology',
    email: 'david@example.com',
    phone: '555-0104',
    events: 5, 
    hours: 28,
    tshirtS: 0,
    tshirtM: 2,
    tshirtL: 6,
    tshirtXL: 4,
    tshirt2XL: 2,
    preferences: '14/17'
  },
  { 
    id: 5, 
    name: 'Lisa Wang', 
    role: 'Team Lead', 
    status: 'active', 
    department: 'Operations',
    email: 'lisa@example.com',
    phone: '555-0105',
    events: 3, 
    hours: 18,
    tshirtS: 0,
    tshirtM: 2,
    tshirtL: 4,
    tshirtXL: 1,
    tshirt2XL: 0,
    preferences: '7/14'
  },
]

// T-shirt inventory badge component
function TShirtBadge({ available, total }: { available: number; total: number }) {
  const percentage = total > 0 ? (available / total) * 100 : 0
  const variant = percentage > 50 ? 'grade-a' : percentage > 20 ? 'grade-c' : 'grade-f'
  
  return (
    <Badge variant={variant} size="sm" className="font-mono">
      {available}/{total}
    </Badge>
  )
}

export function AdvancedTableDemo() {
  const [data, setData] = useState(volunteerData)
  const [selectedRows, setSelectedRows] = useState<VolunteerData[]>([])

  // Column definitions with all advanced features
  const columns: ColumnDef<VolunteerData>[] = [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Volunteer Name',
      size: 150,
      enableSorting: true,
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: 'Role',
      size: 120,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return (
          <Badge
            variant={
              value === 'Team Lead' ? 'grade-a' :
              value === 'Coordinator' ? 'grade-b' :
              value === 'Specialist' ? 'grade-c' : 'neutral'
            }
          >
            {value}
          </Badge>
        )
      }
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      size: 100,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return (
          <Badge
            variant={value === 'active' ? 'grade-a' : 'grade-c'}
            size="sm"
          >
            {value.toUpperCase()}
          </Badge>
        )
      }
    },
    {
      id: 'preferences',
      accessorKey: 'preferences',
      header: 'PREFS',
      size: 80,
      cell: ({ getValue }) => {
        const value = getValue() as string
        return (
          <Badge variant="grade-d" size="sm" className="font-mono">
            {value}
          </Badge>
        )
      }
    },
    // T-shirt inventory columns
    {
      id: 'tshirtS',
      accessorKey: 'tshirtS',
      header: 'S',
      size: 60,
      cell: ({ getValue }) => <TShirtBadge available={getValue() as number} total={7} />
    },
    {
      id: 'tshirtM',
      accessorKey: 'tshirtM',
      header: 'M',
      size: 70,
      cell: ({ getValue }) => <TShirtBadge available={getValue() as number} total={18} />
    },
    {
      id: 'tshirtL',
      accessorKey: 'tshirtL',
      header: 'L',
      size: 70,
      cell: ({ getValue }) => <TShirtBadge available={getValue() as number} total={32} />
    },
    {
      id: 'tshirtXL',
      accessorKey: 'tshirtXL',
      header: 'XL',
      size: 70,
      cell: ({ getValue }) => <TShirtBadge available={getValue() as number} total={16} />
    },
    {
      id: 'tshirt2XL',
      accessorKey: 'tshirt2XL',
      header: '2XL',
      size: 70,
      cell: ({ getValue }) => <TShirtBadge available={getValue() as number} total={8} />
    },
    {
      id: 'department',
      accessorKey: 'department',
      header: 'Department',
      size: 120,
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
      size: 180,
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Phone',
      size: 120,
    },
    {
      id: 'events',
      accessorKey: 'events',
      header: 'Events',
      size: 80,
      cell: ({ getValue }) => (
        <Badge variant="neutral" size="sm" className="font-semibold">
          {getValue() as number}
        </Badge>
      )
    },
    {
      id: 'hours',
      accessorKey: 'hours',
      header: 'Hours',
      size: 80,
      cell: ({ getValue }) => (
        <span className="font-semibold">{getValue() as number}</span>
      )
    },
  ]

  // Group headers configuration
  const groupHeaders: GroupHeaderConfig[] = [
    {
      label: 'Personal Information',
      columns: ['name']
    },
    {
      label: 'Role & Status',
      columns: ['role', 'status']
    },
    {
      label: 'T-Shirt Inventory (MAX/ISSUED)',
      columns: ['tshirtS', 'tshirtM', 'tshirtL', 'tshirtXL', 'tshirt2XL']
    },
    {
      label: 'Contact & Details',
      columns: ['department', 'email', 'phone']
    },
    {
      label: 'Activity',
      columns: ['events', 'hours']
    }
  ]

  // Handle cell editing
  const handleCellEdit = async (rowIndex: number, columnId: string, value: any) => {
    console.log('Editing cell:', { rowIndex, columnId, value, row })
    
    // Update the data
    const newData = [...data]
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnId]: value
    }
    setData(newData)
    
    // Simulate API call
    return new Promise<void>((resolve) => {
      setTimeout(resolve, 500)
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Advanced Data Table Demo</h2>
        <p className="text-muted-foreground">
          All features from Prototype 1: Frozen columns, resizing, reordering, inline editing, group headers, and more
        </p>
        <div className="flex gap-2 text-sm">
          <Badge variant="grade-a">Double-click to edit</Badge>
          <Badge variant="grade-b">Drag columns to reorder</Badge>
          <Badge variant="grade-c">Resize columns</Badge>
          <Badge variant="grade-d">First 2 columns frozen</Badge>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm">
        <AdvancedDataTable
          data={data}
          columns={columns}
          selection={{
            enabled: true,
            mode: 'multiple',
            selectedRows,
            onSelectionChange: setSelectedRows
          }}
          groupHeaders={groupHeaders}
          frozenColumns={{
            count: 2, // Freeze selection + name columns
            shadowIntensity: 'medium'
          }}
          resizing={{
            enabled: true,
            minSize: 50,
            maxSize: 400
          }}
          reordering={{
            enabled: true,
            onReorder: (from, to) => {
              console.log(`Column moved from ${from} to ${to}`)
            }
          }}
          editing={{
            enabled: true,
            mode: 'cell',
            onSave: handleCellEdit,
            validation: (value, columnId, row) => {
              // Example validation
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
          sortable={true}
          pagination={true}
          pageSize={10}
          exportable={true}
          maxHeight="600px"
          onExport={(data) => console.log('Exporting:', data)}
          onRowClick={(row) => console.log('Row clicked:', row)}
        />
      </div>

      {selectedRows.length > 0 && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">
            Selected {selectedRows.length} volunteer(s):
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedRows.map(r => r.name).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

export default AdvancedTableDemo
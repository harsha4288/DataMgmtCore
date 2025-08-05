import { useState, useEffect } from 'react'
import { DataTable } from '../../components/behaviors/DataTable'
import type { Column, BulkAction } from '../../components/behaviors/DataTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { UnifiedInlineEditor } from '../../components/behaviors/UnifiedInlineEditor'

interface Volunteer extends Record<string, unknown> {
  id: number
  name: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'pending'
  
  // T-shirt inventory tracking (SGS pattern)
  tshirt_s_max: number
  tshirt_s_issued: number
  tshirt_m_max: number
  tshirt_m_issued: number
  tshirt_l_max: number
  tshirt_l_issued: number
  tshirt_xl_max: number
  tshirt_xl_issued: number
  tshirt_xxl_max: number
  tshirt_xxl_issued: number
  
  // Calculated fields for display
  preferences: string
  
  // Event participation
  events_assigned: number
  hours_logged: number
}

export function VolunteerDashboard() {
  console.log('VolunteerDashboard: Component starting to render')
  const [loading, setLoading] = useState(false)
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])

  // Mock data with SGS T-shirt patterns
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockVolunteers: Volunteer[] = [
        {
          id: 1,
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          role: 'Team Lead',
          status: 'active',
          tshirt_s_max: 2, tshirt_s_issued: 1,
          tshirt_m_max: 5, tshirt_m_issued: 3,
          tshirt_l_max: 8, tshirt_l_issued: 5,
          tshirt_xl_max: 3, tshirt_xl_issued: 2,
          tshirt_xxl_max: 1, tshirt_xxl_issued: 0,
          preferences: '11/19',
          events_assigned: 4,
          hours_logged: 24
        },
        {
          id: 2,
          name: 'Mike Chen',
          email: 'mike@example.com',
          role: 'Coordinator',
          status: 'active',
          tshirt_s_max: 1, tshirt_s_issued: 1,
          tshirt_m_max: 3, tshirt_m_issued: 2,
          tshirt_l_max: 6, tshirt_l_issued: 4,
          tshirt_xl_max: 4, tshirt_xl_issued: 3,
          tshirt_xxl_max: 2, tshirt_xxl_issued: 1,
          preferences: '11/16',
          events_assigned: 6,
          hours_logged: 32
        },
        {
          id: 3,
          name: 'Emily Rodriguez',
          email: 'emily@example.com',
          role: 'Volunteer',
          status: 'pending',
          tshirt_s_max: 3, tshirt_s_issued: 0,
          tshirt_m_max: 4, tshirt_m_issued: 1,
          tshirt_l_max: 5, tshirt_l_issued: 2,
          tshirt_xl_max: 2, tshirt_xl_issued: 0,
          tshirt_xxl_max: 1, tshirt_xxl_issued: 0,
          preferences: '3/15',
          events_assigned: 2,
          hours_logged: 8
        },
        {
          id: 4,
          name: 'David Park',
          email: 'david@example.com',
          role: 'Specialist',
          status: 'active',
          tshirt_s_max: 0, tshirt_s_issued: 0,
          tshirt_m_max: 2, tshirt_m_issued: 2,
          tshirt_l_max: 7, tshirt_l_issued: 6,
          tshirt_xl_max: 5, tshirt_xl_issued: 4,
          tshirt_xxl_max: 3, tshirt_xxl_issued: 2,
          preferences: '14/17',
          events_assigned: 5,
          hours_logged: 28
        },
        {
          id: 5,
          name: 'Lisa Wang',
          email: 'lisa@example.com',
          role: 'Team Lead',
          status: 'active',
          tshirt_s_max: 1, tshirt_s_issued: 0,
          tshirt_m_max: 4, tshirt_m_issued: 2,
          tshirt_l_max: 6, tshirt_l_issued: 4,
          tshirt_xl_max: 2, tshirt_xl_issued: 1,
          tshirt_xxl_max: 1, tshirt_xxl_issued: 0,
          preferences: '7/14',
          events_assigned: 3,
          hours_logged: 18
        },
        {
          id: 6,
          name: 'James Smith',
          email: 'james@example.com',
          role: 'Volunteer',
          status: 'active',
          tshirt_s_max: 2, tshirt_s_issued: 1,
          tshirt_m_max: 3, tshirt_m_issued: 3,
          tshirt_l_max: 4, tshirt_l_issued: 2,
          tshirt_xl_max: 3, tshirt_xl_issued: 2,
          tshirt_xxl_max: 2, tshirt_xxl_issued: 1,
          preferences: '9/14',
          events_assigned: 4,
          hours_logged: 22
        },
        {
          id: 7,
          name: 'Maria Garcia',
          email: 'maria@example.com',
          role: 'Coordinator',
          status: 'pending',
          tshirt_s_max: 1, tshirt_s_issued: 0,
          tshirt_m_max: 5, tshirt_m_issued: 1,
          tshirt_l_max: 7, tshirt_l_issued: 3,
          tshirt_xl_max: 4, tshirt_xl_issued: 2,
          tshirt_xxl_max: 2, tshirt_xxl_issued: 1,
          preferences: '7/19',
          events_assigned: 2,
          hours_logged: 12
        },
        {
          id: 8,
          name: 'Robert Taylor',
          email: 'robert@example.com',
          role: 'Specialist',
          status: 'active',
          tshirt_s_max: 0, tshirt_s_issued: 0,
          tshirt_m_max: 3, tshirt_m_issued: 3,
          tshirt_l_max: 8, tshirt_l_issued: 5,
          tshirt_xl_max: 6, tshirt_xl_issued: 4,
          tshirt_xxl_max: 3, tshirt_xxl_issued: 2,
          preferences: '14/20',
          events_assigned: 7,
          hours_logged: 35
        },
        {
          id: 9,
          name: 'Anna Lee',
          email: 'anna@example.com',
          role: 'Volunteer',
          status: 'active',
          tshirt_s_max: 3, tshirt_s_issued: 1,
          tshirt_m_max: 2, tshirt_m_issued: 1,
          tshirt_l_max: 5, tshirt_l_issued: 3,
          tshirt_xl_max: 2, tshirt_xl_issued: 1,
          tshirt_xxl_max: 1, tshirt_xxl_issued: 0,
          preferences: '6/13',
          events_assigned: 3,
          hours_logged: 16
        },
        {
          id: 10,
          name: 'Kevin Brown',
          email: 'kevin@example.com',
          role: 'Team Lead',
          status: 'active',
          tshirt_s_max: 1, tshirt_s_issued: 1,
          tshirt_m_max: 6, tshirt_m_issued: 4,
          tshirt_l_max: 9, tshirt_l_issued: 6,
          tshirt_xl_max: 4, tshirt_xl_issued: 3,
          tshirt_xxl_max: 2, tshirt_xxl_issued: 1,
          preferences: '15/22',
          events_assigned: 6,
          hours_logged: 30
        }
      ]
      setVolunteers(mockVolunteers)
      setLoading(false)
    }, 800)
  }, [])

  const handleQuantityChange = async (volunteerId: number, field: keyof Volunteer, newValue: number) => {
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    setVolunteers(prev => 
      prev.map(volunteer => 
        volunteer.id === volunteerId 
          ? { ...volunteer, [field]: newValue }
          : volunteer
      )
    )
  }

  const handleCellEdit = async (volunteer: Volunteer, column: Column<Volunteer>, newValue: unknown) => {
    const field = column.key as keyof Volunteer
    
    // Update volunteer data with proper type handling
    setVolunteers(prev => 
      prev.map(v => 
        v.id === volunteer.id 
          ? { ...v, [field]: newValue }
          : v
      )
    )
  }

  const validateTShirtQuantity = (volunteer: Volunteer, column: Column<Volunteer>, value: unknown): { isValid: boolean; error?: string } => {
    const numValue = Number(value)
    
    if (isNaN(numValue) || numValue < 0) {
      return { isValid: false, error: 'Must be a positive number' }
    }

    // Determine max value based on field type
    if (String(column.key).includes('_issued')) {
      const sizeKey = String(column.key).replace('_issued', '_max') as keyof Volunteer
      const maxValue = volunteer[sizeKey] as number
      
      if (numValue > maxValue) {
        return { isValid: false, error: `Cannot exceed maximum of ${maxValue}` }
      }
    }

    return { isValid: true }
  }

  // Reusable T-shirt size renderer with unified inline editing
  const renderTShirtQuantity = (size: string, issued: unknown, volunteer: Volunteer) => {
    const maxKey = `tshirt_${size}_max` as keyof Volunteer
    const issuedKey = `tshirt_${size}_issued` as keyof Volunteer
    const max = volunteer[maxKey] as number
    const issuedNum = issued as number
    const showControls = issuedNum > 0

    return (
      <UnifiedInlineEditor
          value={issuedNum}
          type="quantity"
          max={max}
          min={0}
          showControls={showControls}
          controlsPosition="between"
          showTShirtButton={!showControls}
          tshirtButtonSize="md"
          onSave={async (newValue) => {
            await handleQuantityChange(volunteer.id as number, issuedKey, newValue as number)
          }}
          onIncrement={async () => {
            await handleQuantityChange(volunteer.id as number, issuedKey, Math.min(max, issuedNum + 1))
          }}
          onDecrement={async () => {
            await handleQuantityChange(volunteer.id as number, issuedKey, Math.max(0, issuedNum - 1))
          }}
          className="text-lg font-bold font-mono"
        />
    )
  }

  const columns: Column<Volunteer>[] = [
    {
      key: 'name',
      label: 'Volunteer Name',
      sortable: true,
      searchable: true,
      resizable: true,
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      editable: {
        enabled: true,
        type: 'text',
        maxLength: 100,
        onValidate: (value) => {
          const strValue = String(value).trim()
          if (strValue.length < 2) {
            return { isValid: false, error: 'Name must be at least 2 characters' }
          }
          return { isValid: true }
        }
      }
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      searchable: true,
      resizable: true,
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      render: (value) => (
        <Badge 
          variant={
            value === 'Team Lead' ? 'grade-a' : 
            value === 'Coordinator' ? 'grade-b' : 
            value === 'Specialist' ? 'grade-c' : 'neutral'
          }
        >
          {String(value)}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      filterable: true,
      resizable: true,
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      render: (value) => (
        <Badge 
          variant={
            value === 'active' ? 'grade-a' : 
            value === 'pending' ? 'grade-c' : 'grade-f'
          }
          size="sm"
        >
          {String(value).toUpperCase()}
        </Badge>
      )
    },
    
    // PREFS column (SGS pattern)
    {
      key: 'preferences',
      label: 'PREFS',
      groupHeader: 'T-Shirt Inventory (MAX/ISSUED)',
      align: 'center',
      resizable: true,
      width: 100,
      minWidth: 90,
      maxWidth: 120,
      render: (_, volunteer) => {
        const totalMax = (volunteer.tshirt_s_max as number) + (volunteer.tshirt_m_max as number) + 
                        (volunteer.tshirt_l_max as number) + (volunteer.tshirt_xl_max as number) + 
                        (volunteer.tshirt_xxl_max as number)
        const totalIssued = (volunteer.tshirt_s_issued as number) + (volunteer.tshirt_m_issued as number) + 
                           (volunteer.tshirt_l_issued as number) + (volunteer.tshirt_xl_issued as number) + 
                           (volunteer.tshirt_xxl_issued as number)
        return (
          <div className="flex items-center justify-center h-full w-full">
            <Badge variant="grade-d" size="sm" className="font-mono">
              {totalIssued}/{totalMax}
            </Badge>
          </div>
        )
      }
    },
    
    // Multi-level T-shirt inventory headers (SGS pattern) - Enhanced with inline editing
    {
      key: 'tshirt_s_issued',
      label: '👕 S',
      groupHeader: 'T-Shirt Inventory (MAX/ISSUED)',
      align: 'center',
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      headerBadge: {
        getValue: (data) => {
          const total = data.reduce((sum, v) => sum + (v.tshirt_s_max as number), 0)
          const issued = data.reduce((sum, v) => sum + (v.tshirt_s_issued as number), 0)
          return {
            available: total - issued,
            total: total
          }
        },
        position: 'below-label'
      },
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 20, // Will be validated dynamically
        onValidate: (value, volunteer) => validateTShirtQuantity(volunteer, { key: 'tshirt_s_issued' } as Column<Volunteer>, value)
      },
      render: (issued, volunteer) => renderTShirtQuantity('s', issued, volunteer)
    },
    {
      key: 'tshirt_m_issued',
      label: '👕 M',
      groupHeader: 'T-Shirt Inventory (MAX/ISSUED)',
      align: 'center',
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      headerBadge: {
        getValue: (data) => {
          const total = data.reduce((sum, v) => sum + (v.tshirt_m_max as number), 0)
          const issued = data.reduce((sum, v) => sum + (v.tshirt_m_issued as number), 0)
          return { available: total - issued, total: total }
        },
        position: 'below-label'
      },
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 20,
        onValidate: (value, volunteer) => validateTShirtQuantity(volunteer, { key: 'tshirt_m_issued' } as Column<Volunteer>, value)
      },
      render: (issued, volunteer) => renderTShirtQuantity('m', issued, volunteer)
    },
    {
      key: 'tshirt_l_issued',
      label: '👕 L',
      groupHeader: 'T-Shirt Inventory (MAX/ISSUED)',
      align: 'center',
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      headerBadge: {
        getValue: (data) => {
          const total = data.reduce((sum, v) => sum + (v.tshirt_l_max as number), 0)
          const issued = data.reduce((sum, v) => sum + (v.tshirt_l_issued as number), 0)
          return { available: total - issued, total: total }
        },
        position: 'below-label'
      },
      editable: { enabled: true, type: 'number', min: 0, max: 20, onValidate: (value, volunteer) => validateTShirtQuantity(volunteer, { key: 'tshirt_l_issued' } as Column<Volunteer>, value) },
      render: (issued, volunteer) => renderTShirtQuantity('l', issued, volunteer)
    },
    {
      key: 'tshirt_xl_issued',
      label: '👕 XL',
      groupHeader: 'T-Shirt Inventory (MAX/ISSUED)',
      align: 'center',
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      headerBadge: {
        getValue: (data) => {
          const total = data.reduce((sum, v) => sum + (v.tshirt_xl_max as number), 0)
          const issued = data.reduce((sum, v) => sum + (v.tshirt_xl_issued as number), 0)
          return { available: total - issued, total: total }
        },
        position: 'below-label'
      },
      editable: { enabled: true, type: 'number', min: 0, max: 20, onValidate: (value, volunteer) => validateTShirtQuantity(volunteer, { key: 'tshirt_xl_issued' } as Column<Volunteer>, value) },
      render: (issued, volunteer) => renderTShirtQuantity('xl', issued, volunteer)
    },
    {
      key: 'tshirt_xxl_issued',
      label: '👕 2XL',
      groupHeader: 'T-Shirt Inventory (MAX/ISSUED)',
      align: 'center',
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      headerBadge: {
        getValue: (data) => {
          const total = data.reduce((sum, v) => sum + (v.tshirt_xxl_max as number), 0)
          const issued = data.reduce((sum, v) => sum + (v.tshirt_xxl_issued as number), 0)
          return { available: total - issued, total: total }
        },
        position: 'below-label'
      },
      editable: { enabled: true, type: 'number', min: 0, max: 20, onValidate: (value, volunteer) => validateTShirtQuantity(volunteer, { key: 'tshirt_xxl_issued' } as Column<Volunteer>, value) },
      render: (issued, volunteer) => renderTShirtQuantity('xxl', issued, volunteer)
    },
    
    {
      key: 'events_assigned',
      label: 'Events',
      align: 'center',
      sortable: true,
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      render: (value) => (
        <Badge variant="neutral" size="sm" className="font-mono">
          {String(value)}
        </Badge>
      )
    },
    {
      key: 'hours_logged',
      label: 'Hours',
      align: 'center',
      sortable: true,
      resizable: true,
      width: 90,
      minWidth: 80,
      maxWidth: 110,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 200,
        onValidate: (value) => {
          const numValue = Number(value)
          if (isNaN(numValue) || numValue < 0) {
            return { isValid: false, error: 'Hours must be a positive number' }
          }
          if (numValue > 200) {
            return { isValid: false, error: 'Hours cannot exceed 200' }
          }
          return { isValid: true }
        }
      },
      render: (value, volunteer) => (
        <UnifiedInlineEditor
          value={value as number}
          type="number"
          min={0}
          max={200}
          onSave={async (newValue) => {
            await handleCellEdit(volunteer, { key: 'hours_logged' } as Column<Volunteer>, newValue)
          }}
          validation={(val) => {
            const numValue = Number(val)
            if (isNaN(numValue) || numValue < 0) {
              return { isValid: false, error: 'Hours must be a positive number' }
            }
            if (numValue > 200) {
              return { isValid: false, error: 'Hours cannot exceed 200' }
            }
            return { isValid: true }
          }}
          className="font-mono"
        />
      )
    }
  ]

  // Bulk actions for volunteer management
  const bulkActions: BulkAction<Volunteer>[] = [
    {
      id: 'assign-event',
      label: 'Assign to Event',
      icon: '📅',
      action: (selectedVolunteers) => {
        console.log('Assigning to event:', selectedVolunteers.map(v => v.name))
        alert(`Assigned ${selectedVolunteers.length} volunteers to event`)
      }
    },
    {
      id: 'bulk-tshirt-issue',
      label: 'Bulk T-shirt Issue',
      icon: '👕',
      action: (selectedVolunteers) => {
        console.log('Bulk t-shirt issue:', selectedVolunteers.map(v => v.name))
        alert(`Opening bulk t-shirt issuance for ${selectedVolunteers.length} volunteers`)
      }
    },
    {
      id: 'export-list',
      label: 'Export List',
      icon: '📤',
      action: (selectedVolunteers) => {
        const csv = `Name,Role,Status,Events,Hours\n${selectedVolunteers.map(v => 
          `${v.name},${v.role},${v.status},${v.events_assigned},${v.hours_logged}`
        ).join('\n')}`
        
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'volunteer-list.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    },
    {
      id: 'deactivate',
      label: 'Deactivate',
      icon: '🚫',
      variant: 'destructive' as const,
      action: (selectedVolunteers) => {
        const names = selectedVolunteers.map(v => v.name).join(', ')
        const confirmed = confirm(`Deactivate ${selectedVolunteers.length} volunteers? (${names})`)
        if (confirmed) {
          setVolunteers(prev => 
            prev.map(volunteer => 
              selectedVolunteers.some(selected => selected.id === volunteer.id)
                ? { ...volunteer, status: 'inactive' as const }
                : volunteer
            )
          )
        }
      }
    }
  ]

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">👕 Volunteer T-shirt Management</span>
          <span className="text-sm text-muted-foreground">
            SGS-inspired patterns: Multi-level headers, +/- quantity controls, and real-time inventory tracking
          </span>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="secondary"
          loading={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>
      
      <DataTable
        data={volunteers}
        columns={columns}
        loading={loading}
        emptyMessage="No volunteers found. Add volunteers to get started."
        onRowClick={(volunteer) => console.log('Selected volunteer:', volunteer)}
        onCellEdit={handleCellEdit}
        cellValidation={validateTShirtQuantity}
        frozenColumns={[0, 1]} // Freeze the first two columns (name and role)
        frozenHeader={true} // Freeze the header row for scrolling
        maxHeight="calc(100vh - 300px)"
        pagination={{
          enabled: true,
          pageSize: 5,
          showPageSizeOptions: true
        }}
        search={{
          enabled: true,
          placeholder: 'Search volunteers by name, role, or email...'
        }}
        export={{
          enabled: true,
          filename: 'volunteer-tshirt-inventory'
        }}
        columnControls={{
          resizable: true,
          reorderable: true
        }}
        onColumnsChange={(newColumns) => {
          console.log('Column order changed:', newColumns.map(c => c.key))
        }}
        selection={{
          enabled: true,
          bulkActions: bulkActions
        }}
        onSelectionChange={(selectedVolunteers) => {
          console.log('Selection changed:', selectedVolunteers.length, 'volunteers selected')
        }}
        responsive={{
          enabled: true,
          hideColumnsOnMobile: ['email', 'events_assigned', 'hours_logged'] as (keyof Volunteer)[],
          hideColumnsOnTablet: ['events_assigned', 'hours_logged'] as (keyof Volunteer)[],
          compactOnMobile: true,
          breakpoints: {
            mobile: 768,
            tablet: 1024
          }
        }}
      />
    </div>
  )
}
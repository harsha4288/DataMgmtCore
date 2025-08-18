
import { AdvancedDataTable, type GroupHeaderConfig } from '@/components/ui/advanced-data-table';
import { Badge } from '@/components/ui/badge';

// Simple test data
const testData = [
  { id: 1, name: 'Sarah Johnson', role: 'Team Lead', status: 'active', events: 4, hours: 24, department: 'Operations', email: 'sarah@example.com', phone: '555-0101' },
  { id: 2, name: 'Mike Chen', role: 'Coordinator', status: 'active', events: 6, hours: 32, department: 'Marketing', email: 'mike@example.com', phone: '555-0102' },
  { id: 3, name: 'Emily Rodriguez', role: 'Volunteer', status: 'pending', events: 2, hours: 8, department: 'Events', email: 'emily@example.com', phone: '555-0103' },
  { id: 4, name: 'David Park', role: 'Specialist', status: 'active', events: 5, hours: 28, department: 'Technology', email: 'david@example.com', phone: '555-0104' },
  { id: 5, name: 'Lisa Wang', role: 'Team Lead', status: 'active', events: 3, hours: 18, department: 'Operations', email: 'lisa@example.com', phone: '555-0105' },
];

// Expanded columns to force horizontal scrolling
const testColumns = [
  {
    accessorKey: 'name',
    header: 'Volunteer Name',
    size: 150,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    size: 120,
    cell: ({ getValue }: any) => {
      const value = getValue() as string;
      return (
        <Badge variant={value === 'Team Lead' ? 'grade-a' : value === 'Coordinator' ? 'grade-b' : 'neutral'}>
          {value}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    cell: ({ getValue }: any) => {
      const value = getValue() as string;
      return (
        <Badge variant={value === 'active' ? 'grade-a' : 'grade-c'} size="sm">
          {value.toUpperCase()}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'department',
    header: 'Department',
    size: 120,
  },
  {
    accessorKey: 'email',
    header: 'Email Address',
    size: 180,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    size: 120,
  },
  {
    accessorKey: 'events',
    header: 'Events',
    size: 90,
  },
  {
    accessorKey: 'hours',
    header: 'Hours',
    size: 90,
  },
];

// Group headers configuration to match ComponentShowcase
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
    label: 'Contact & Details',
    columns: ['department', 'email', 'phone']
  },
  {
    label: 'Activity Summary',
    columns: ['events', 'hours']
  }
];

export function TestFrozenColumns() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Frozen Columns Test</h1>
      <p className="text-muted-foreground">
        This table should have the first 2 columns (selection + name) frozen when scrolling horizontally.
      </p>
      
      <div style={{ width: '500px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
        <AdvancedDataTable
          data={testData}
          columns={testColumns}
          selection={{
            enabled: true,
            mode: 'multiple',
            selectedRows: [],
            onSelectionChange: (selectedRows) => console.log('Selected:', selectedRows.length, 'rows')
          }}
          groupHeaders={groupHeaders}
          frozenColumns={{
            count: 2, // Freeze selection + name columns
            shadowIntensity: 'medium'
          }}
          searchable={false}
          pagination={false}
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p><strong>Expected behavior:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Selection checkbox column should be sticky at left: 0px (frozen-column-0)</li>
          <li>Name column should be sticky at left: 48px (frozen-column-1)</li>
          <li>Other columns should scroll horizontally</li>
          <li>Frozen columns should have a shadow on the right edge</li>
          <li>Background colors should match the theme</li>
        </ul>
        
        <div className="mt-4 p-3 bg-muted rounded border">
          <p><strong>Debug info:</strong></p>
          <p>frozenColumns config: count={2} (selection + name columns)</p>
          <p>This should freeze columns at indices 0 (selection) and 1 (name)</p>
          <p>CSS classes: .frozen-column-0 and .frozen-column-1 should be applied</p>
        </div>
      </div>
    </div>
  );
}

export default TestFrozenColumns;

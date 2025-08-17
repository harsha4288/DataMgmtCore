import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnhancedTable, generateGroupHeaders, type ColumnDef } from '../enhanced-table';

// Mock data for testing
const mockData = [
  { id: 1, name: 'John Doe', role: 'Team Lead', status: 'active' },
  { id: 2, name: 'Jane Smith', role: 'Coordinator', status: 'pending' },
  { id: 3, name: 'Bob Johnson', role: 'Volunteer', status: 'active' }
];

const mockColumns: ColumnDef[] = [
  { key: 'name', label: 'Name', groupHeader: 'Personal Info' },
  { key: 'role', label: 'Role', groupHeader: 'Work Info' },
  { key: 'status', label: 'Status', groupHeader: 'Work Info' }
];

describe('EnhancedTable', () => {
  it('renders table with data', () => {
    render(
      <EnhancedTable
        data={mockData}
        columns={mockColumns}
      />
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders group headers correctly', () => {
    render(
      <EnhancedTable
        data={mockData}
        columns={mockColumns}
      />
    );
    
    expect(screen.getByText('Personal Info')).toBeInTheDocument();
    expect(screen.getByText('Work Info')).toBeInTheDocument();
  });

  it('handles selection when enabled', () => {
    const mockOnSelectionChange = jest.fn();
    
    render(
      <EnhancedTable
        data={mockData}
        columns={mockColumns}
        selection={{
          enabled: true,
          selectedRows: [],
          onSelectionChange: mockOnSelectionChange,
          getRowId: (row) => row.id
        }}
      />
    );
    
    // Should render checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // 3 rows + 1 select all
    
    // Click first row checkbox
    fireEvent.click(checkboxes[1]);
    expect(mockOnSelectionChange).toHaveBeenCalledWith([mockData[0]]);
  });

  it('shows empty message when no data', () => {
    render(
      <EnhancedTable
        data={[]}
        columns={mockColumns}
        emptyMessage="No volunteers found"
      />
    );
    
    expect(screen.getByText('No volunteers found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <EnhancedTable
        data={[]}
        columns={mockColumns}
        loading={true}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('generateGroupHeaders', () => {
  it('generates correct group headers from columns', () => {
    const groupHeaders = generateGroupHeaders(mockColumns);
    
    expect(groupHeaders).toHaveLength(2);
    expect(groupHeaders[0]).toEqual({
      label: 'Personal Info',
      colSpan: 1,
      startIndex: 0
    });
    expect(groupHeaders[1]).toEqual({
      label: 'Work Info',
      colSpan: 2,
      startIndex: 1
    });
  });

  it('handles columns without group headers', () => {
    const columnsWithoutGroups: ColumnDef[] = [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' }
    ];
    
    const groupHeaders = generateGroupHeaders(columnsWithoutGroups);
    expect(groupHeaders).toHaveLength(0);
  });
});

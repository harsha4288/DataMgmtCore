// Test file to verify exports work
import { DataTable, Column, BulkAction } from './components/behaviors/DataTable'

interface TestData {
  id: number
  name: string
}

// Test that we can use the types
const testColumns: Column<TestData>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' }
]

const testBulkActions: BulkAction<TestData>[] = [
  {
    id: 'test',
    label: 'Test Action',
    action: (items) => console.log(items)
  }
]

export function TestComponent() {
  return (
    <DataTable
      data={[]}
      columns={testColumns}
      selection={{ enabled: true, bulkActions: testBulkActions }}
    />
  )
}
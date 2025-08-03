// Test type imports specifically
import type { BulkAction, Column } from './components/behaviors/DataTable'
import { DataTable } from './components/behaviors/DataTable'

type TestBulkAction = BulkAction<{ id: number }>
type TestColumn = Column<{ id: number }>

console.log('Type imports successful')
export { TestBulkAction, TestColumn, DataTable }
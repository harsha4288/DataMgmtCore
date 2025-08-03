// Quick test to verify exports are working
import { DataTable, Column, BulkAction } from './components/behaviors/DataTable'

console.log('DataTable exported:', typeof DataTable)
console.log('Column exported:', typeof Column)  
console.log('BulkAction exported:', typeof BulkAction)

export const testExports = { DataTable, Column, BulkAction }
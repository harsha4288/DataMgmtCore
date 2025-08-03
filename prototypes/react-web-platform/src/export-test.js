// Simple JS test for exports
import('./components/behaviors/DataTable.tsx')
  .then(module => {
    console.log('Available exports:', Object.keys(module))
    console.log('BulkAction type:', typeof module.BulkAction)
    console.log('Column type:', typeof module.Column)
    console.log('DataTable component:', typeof module.DataTable)
  })
  .catch(err => {
    console.error('Import failed:', err.message)
  })
// Minimal test to isolate BulkAction export issue
export type BulkAction<T> = {
  id: string
  label: string
  icon?: React.ReactNode
  action: (selectedItems: T[]) => void
  variant?: 'default' | 'destructive'
}

export interface Column<T> {
  key: keyof T
  label: string
}

export function TestComponent() {
  return <div>Test Component</div>
}
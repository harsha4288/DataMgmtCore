import { VirtualizedDataTableOptimized } from '../../components/behaviors/VirtualizedDataTableOptimized'

// Simple test data to bypass API issues
const testProducts = Array.from({ length: 100 }, (_, i) => ({
  id: `test-${i}`,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 100) + 10,
  category: ['Electronics', 'Clothing', 'Books'][i % 3],
  inStock: Math.random() > 0.3
}))

type TestProduct = typeof testProducts[0]

// Inline Column type to avoid import issues
interface Column<T> {
  key: keyof T
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: T[keyof T], item: T) => React.ReactNode
  searchable?: boolean
}

export function SimpleVirtualTest() {
  console.log('🧪 SimpleVirtualTest: Component mounting')

  const columns: Column<TestProduct>[] = [
    {
      key: 'name',
      label: 'Product Name',
      searchable: true
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: any) => `$${value}`
    },
    {
      key: 'category',
      label: 'Category'
    },
    {
      key: 'inStock',
      label: 'In Stock',
      render: (value: any) => value ? '✅ Yes' : '❌ No'
    }
  ]

  return (
    <div className="p-6 space-y-4">
      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <strong>🧪 Virtual Scrolling Test:</strong> Simple test with 100 items to verify the VirtualizedDataTableOptimized component works
      </div>
      
      <VirtualizedDataTableOptimized
        data={testProducts}
        columns={columns}
        virtualScrolling={{
          enabled: true,
          itemHeight: 48,
          overscan: 5
        }}
        maxHeight="200px"
        search={{
          enabled: true,
          placeholder: "Search test products..."
        }}
        export={{
          enabled: true,
          filename: "test-products.csv"
        }}
        selection={{
          enabled: true,
          bulkActions: [
            {
              id: 'test-action',
              label: 'Test Action',
              action: (items) => console.log('Selected:', items.length)
            }
          ]
        }}
      />
    </div>
  )
}
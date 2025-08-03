import { VirtualizedDataTableOptimized } from '../../components/behaviors/VirtualizedDataTableOptimized'
import { useState, useEffect } from 'react'

// DummyJSON API data type
interface DummyProduct {
  id: number
  title: string
  description: string
  category: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  brand: string
  thumbnail: string
}

type TestProduct = DummyProduct

// Inline Column type to avoid import issues
interface Column<T> {
  key: keyof T
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: T[keyof T], item: T) => React.ReactNode
  searchable?: boolean
}

export function SimpleVirtualTest() {
  const [products, setProducts] = useState<TestProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🧪 SimpleVirtualTest: Fetching data from DummyJSON API...')
        
        const response = await fetch('https://dummyjson.com/products?limit=100')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('🧪 SimpleVirtualTest: API response received, products count:', data.products?.length || 0)
        
        setProducts(data.products || [])
      } catch (err) {
        console.error('🧪 SimpleVirtualTest: API fetch failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const columns: Column<TestProduct>[] = [
    {
      key: 'title',
      label: 'Product Name',
      searchable: true
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: any) => `$${Number(value).toFixed(2)}`
    },
    {
      key: 'category',
      label: 'Category'
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value: any) => `${value} units`
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value: any) => `⭐ ${Number(value).toFixed(1)}`
    }
  ]

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <strong>❌ Error:</strong> {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <strong>🧪 Virtual Scrolling Test:</strong> Testing with {products.length} real products from DummyJSON API
        <br />
        <span className="text-sm">maxHeight=200px, itemHeight=48px → Should show ~4 rows with virtual scrolling</span>
      </div>
      
      <VirtualizedDataTableOptimized
        data={products}
        columns={columns}
        loading={loading}
        virtualScrolling={{
          enabled: true,
          itemHeight: 48,
          overscan: 5
        }}
        maxHeight="200px"
        search={{
          enabled: true,
          placeholder: "Search products..."
        }}
        export={{
          enabled: true,
          filename: "dummyjson-products.csv"
        }}
        selection={{
          enabled: true,
          bulkActions: [
            {
              id: 'test-action',
              label: 'Test Action',
              action: (items) => console.log('Selected:', items.length, 'items')
            }
          ]
        }}
      />
    </div>
  )
}
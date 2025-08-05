import { useEffect, useState, useMemo } from 'react'
import { FakeStoreAdapter, ProductData } from '../../core/data-adapters/fake-store'
import { VirtualizedDataTableOptimized } from '../../components/behaviors/VirtualizedDataTableOptimized'
import { DataTable, Column, BulkAction } from '../../components/behaviors/DataTable'
import { AdvancedFiltering, FilterConfig, ActiveFilter } from '../../components/behaviors/AdvancedFiltering'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

export function ProductCatalogDashboard() {
  console.log('🛍️ ProductCatalogDashboard: Component mounting')
  
  const [products, setProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [datasetSize, setDatasetSize] = useState<'small' | 'large'>('small')
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false)
  const [adapter] = useState(() => new FakeStoreAdapter())
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([])

  // Load product data
  useEffect(() => {
    loadProducts()
  }, [datasetSize])

  const loadProducts = async () => {
    console.log('🛍️ ProductCatalogDashboard: Loading products, datasetSize:', datasetSize)
    setLoading(true)
    setError(null)
    
    try {
      let productData: ProductData[]
      
      if (datasetSize === 'large') {
        console.log('🛍️ Loading large dataset...')
        productData = await adapter.getLargeProductDataset(25) // 500 products
      } else {
        console.log('🛍️ Loading small dataset...')
        productData = await adapter.getProducts()
      }
      
      console.log('🛍️ Products loaded successfully:', productData.length)
      setProducts(productData)
    } catch (err) {
      console.error('🛍️ Error loading products:', err)
      setError(`Failed to load product data: ${err instanceof Error ? err.message : String(err)}`)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'title',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name...'
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: Array.from(new Set(products.map(p => p.category))).map(cat => ({
        value: cat,
        label: cat,
        count: products.filter(p => p.category === cat).length
      }))
    },
    {
      key: 'brand',
      label: 'Brand',
      type: 'select',
      options: Array.from(new Set(products.map(p => p.brand || 'Unknown'))).map(brand => ({
        value: brand,
        label: brand,
        count: products.filter(p => p.brand === brand).length
      }))
    },
    {
      key: 'price',
      label: 'Price',
      type: 'number',
      min: 0,
      max: Math.max(...products.map(p => p.price))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'discontinued', label: 'Discontinued' }
      ]
    },
    {
      key: 'inStock',
      label: 'In Stock',
      type: 'boolean'
    }
  ]

  // Apply filters to data
  const filteredProducts = useMemo(() => {
    if (activeFilters.length === 0) return products

    return products.filter(product => {
      return activeFilters.every(filter => {
        let value: any
        
        switch (filter.key) {
          case 'inStock':
            value = product.inventory.inStock
            break
          default:
            value = product[filter.key as keyof ProductData]
        }

        if (value === undefined || value === null) return false

        const stringValue = String(value).toLowerCase()
        const filterValue = String(filter.value).toLowerCase()

        switch (filter.operator) {
          case 'contains':
            return stringValue.includes(filterValue)
          case 'equals':
            return stringValue === filterValue || value === filter.value
          case 'greaterThan':
            return Number(value) > Number(filter.value)
          case 'lessThan':
            return Number(value) < Number(filter.value)
          default:
            return true
        }
      })
    })
  }, [products, activeFilters])

  // Define columns
  const columns: Column<ProductData>[] = [
    {
      key: 'image',
      label: 'Image',
      width: 80,
      render: (value) => (
        <img 
          src={String(value)} 
          alt="Product" 
          className="w-12 h-12 object-cover rounded"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/vite.svg'
          }}
        />
      )
    },
    {
      key: 'title',
      label: 'Product Name',
      searchable: true,
      render: (value, product) => (
        <div>
          <div className="font-medium truncate max-w-xs">{String(value)}</div>
          <div className="text-xs text-muted-foreground">{product.sku}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value, product) => (
        <div>
          <Badge variant="default" size="sm">{String(value)}</Badge>
          {product.brand && (
            <div className="text-xs text-muted-foreground mt-1">{product.brand}</div>
          )}
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      render: (value, product) => (
        <div className="text-right">
          <div className="font-medium">${Number(value).toFixed(2)}</div>
          {product.originalPrice && product.originalPrice > Number(value) && (
            <div className="text-xs text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </div>
          )}
          {product.discount && product.discount > 0 && (
            <Badge variant="grade-a" size="sm" className="mt-1">
              -{product.discount}%
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'inventory',
      label: 'Stock',
      align: 'center',
      render: (value, product) => {
        const inventory = product.inventory
        return (
          <div className="text-center">
            <Badge 
              variant={inventory.inStock ? 'grade-a' : 'grade-f'} 
              size="sm"
            >
              {inventory.inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
            <div className="text-xs text-muted-foreground mt-1">
              {inventory.quantity} units
            </div>
          </div>
        )
      }
    },
    {
      key: 'rating',
      label: 'Rating',
      align: 'center',
      render: (value, product) => (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <span>⭐</span>
            <span className="font-medium">{product.rating.average.toFixed(1)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            ({product.rating.count} reviews)
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => {
        const variant = value === 'active' ? 'grade-a' : 
                      value === 'inactive' ? 'grade-c' : 'grade-f'
        return (
          <Badge variant={variant} size="sm">
            {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
          </Badge>
        )
      }
    }
  ]

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted/20 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-muted/20 rounded"></div>
        </div>
      </div>
    )
  }

  const TableComponent = useVirtualScrolling ? VirtualizedDataTableOptimized : DataTable

  console.log('🛍️ ProductCatalogDashboard: Rendering, loading:', loading, 'error:', error, 'products:', products.length)

  // Debug panel
  const debugInfo = (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs">
      <strong>🐛 ProductCatalog Debug:</strong> Loading: {loading ? 'YES' : 'NO'} | 
      Products: {products.length} | 
      Error: {error || 'None'} | 
      Dataset: {datasetSize} | 
      Virtual: {useVirtualScrolling ? 'YES' : 'NO'}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {debugInfo}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">
            Browse and manage product inventory with advanced filtering
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="grade-b" size="sm">
            {filteredProducts.length} products
            {activeFilters.length > 0 && (
              <span className="ml-1 text-xs opacity-70">
                of {products.length}
              </span>
            )}
          </Badge>
          {datasetSize === 'large' && (
            <Badge variant={useVirtualScrolling ? "grade-a" : "grade-c"} size="sm">
              {useVirtualScrolling ? "✅ Virtual Scrolling Active" : "⚠️ Standard Rendering"}
            </Badge>
          )}
          {useVirtualScrolling && (
            <Badge variant="grade-b" size="sm">
              🚀 Optimized Component
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/10 rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Dataset Size:</span>
          <Button
            variant={datasetSize === 'small' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDatasetSize('small')}
          >
            Small (20 products)
          </Button>
          <Button
            variant={datasetSize === 'large' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDatasetSize('large')}
          >
            Large (500 products)
          </Button>
        </div>

        {datasetSize === 'large' && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rendering:</span>
            <Button
              variant={!useVirtualScrolling ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseVirtualScrolling(false)}
            >
              Standard (All DOM)
            </Button>
            <Button
              variant={useVirtualScrolling ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseVirtualScrolling(true)}
            >
              Virtual (Optimized)
            </Button>
          </div>
        )}

        {useVirtualScrolling && (
          <div className="text-xs text-muted-foreground max-w-md">
            <strong>🧪 Testing Virtual Scrolling:</strong> Open dev tools → Elements → Look for "Virtual scrolling: X of Y rows rendered" at table bottom. Only visible rows are in DOM!
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Advanced Filtering */}
      <AdvancedFiltering
        filters={filterConfigs}
        activeFilters={activeFilters}
        onFiltersChange={setActiveFilters}
        className="shadow-sm"
      />

      {/* Data Table */}
{useVirtualScrolling ? (
        <VirtualizedDataTableOptimized
          data={filteredProducts}
          columns={columns}
          loading={loading}
          emptyMessage="No products found"
          className="shadow-sm"
          virtualScrolling={{
            enabled: true,
            itemHeight: 80,
            overscan: 10
          }}
          maxHeight="500px"
          search={{
            enabled: true,
            placeholder: "Search products by name..."
          }}
          export={{
            enabled: true,
            filename: `products-${new Date().toISOString().split('T')[0]}.csv`
          }}
          selection={{
            enabled: true,
            bulkActions: [
              {
                id: 'bulk-activate',
                label: 'Activate Selected',
                action: (selectedProducts) => {
                  console.log('Activating products:', selectedProducts)
                }
              },
              {
                id: 'bulk-deactivate',
                label: 'Deactivate Selected',
                variant: 'destructive',
                action: (selectedProducts) => {
                  console.log('Deactivating products:', selectedProducts)
                }
              }
            ]
          }}
          responsive={{
            enabled: true,
            hideColumnsOnMobile: ['image', 'rating', 'status'],
            hideColumnsOnTablet: ['image'],
            compactOnMobile: true
          }}
        />
      ) : (
        <DataTable
          data={filteredProducts}
          columns={columns}
          loading={loading}
          emptyMessage="No products found"
          className="shadow-sm"
          pagination={{
            enabled: true,
            pageSize: 20,
            showPageSizeOptions: true
          }}
          search={{
            enabled: true,
            placeholder: "Search products by name..."
          }}
          export={{
            enabled: true,
            filename: `products-${new Date().toISOString().split('T')[0]}.csv`
          }}
          selection={{
            enabled: true,
            bulkActions: [
              {
                id: 'bulk-activate',
                label: 'Activate Selected',
                action: (selectedProducts) => {
                  console.log('Activating products:', selectedProducts)
                }
              },
              {
                id: 'bulk-deactivate',
                label: 'Deactivate Selected',
                variant: 'destructive',
                action: (selectedProducts) => {
                  console.log('Deactivating products:', selectedProducts)
                }
              }
            ]
          }}
          responsive={{
            enabled: true,
            hideColumnsOnMobile: ['image', 'rating', 'status'],
            hideColumnsOnTablet: ['image'],
            compactOnMobile: true
          }}
        />
      )}
    </div>
  )
}
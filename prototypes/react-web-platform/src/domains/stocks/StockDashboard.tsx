import { useState, useEffect } from 'react'
import { DataTable } from '../../components/behaviors/DataTable'
import type { Column, BulkAction } from '../../components/behaviors/DataTable'
import { Button } from '../../components/ui/Button'
import { AlphaVantageAdapter } from '../../core/data-adapters/alpha-vantage'
import type { StockData } from '../../types/api'

interface Stock extends Record<string, unknown> {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: string
}

export function StockDashboard() {
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [error, setError] = useState<string | null>(null)

  // Initialize the Alpha Vantage adapter
  const alphaVantageAdapter = new AlphaVantageAdapter(
    import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo'
  )

  const handleFetchStocks = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use the real Alpha Vantage adapter
      const response = await alphaVantageAdapter.list({ limit: 8 })
      
      // Transform StockData to our local Stock interface
      const transformedStocks: Stock[] = response.data.map((stockData: StockData) => ({
        symbol: stockData.symbol,
        name: stockData.name,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent.startsWith('-') || stockData.changePercent.startsWith('+') 
          ? `${stockData.changePercent}%` 
          : `${parseFloat(stockData.changePercent) >= 0 ? '+' : ''}${stockData.changePercent}%`
      }))
      
      setStocks(transformedStocks)
    } catch (error) {
      console.error('Error fetching stocks:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch stock data')
      
      // Fallback to mock data for demo
      const mockStocks: Stock[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 185.50, change: 2.25, changePercent: '+1.23%' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.80, change: -15.40, changePercent: '-0.56%' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 420.15, change: 8.75, changePercent: '+2.13%' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: -12.30, changePercent: '-4.72%' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 145.20, change: 3.80, changePercent: '+2.69%' },
      ]
      setStocks(mockStocks)
    } finally {
      setLoading(false)
    }
  }

  // Auto-load data on component mount
  useEffect(() => {
    handleFetchStocks()
  }, [])

  const [columns, setColumns] = useState<Column<Stock>[]>([
    {
      key: 'symbol',
      label: 'Symbol',
      sortable: true,
      searchable: true,
      resizable: true,
      width: 100,
      minWidth: 80,
      maxWidth: 150,
      render: (value) => (
        <span className="font-mono font-semibold">{String(value)}</span>
      )
    },
    {
      key: 'name',
      label: 'Company Name',
      sortable: true,
      searchable: true,
      resizable: true,
      width: 200,
      minWidth: 150,
      maxWidth: 300
    },
    {
      key: 'price',
      label: 'Price',
      groupHeader: 'Market Data',
      align: 'right',
      sortable: true,
      resizable: true,
      width: 120,
      minWidth: 100,
      maxWidth: 180,
      badge: {
        value: stocks.length,
        variant: 'info'
      },
      render: (value) => (
        <span className="font-mono">${String(value)}</span>
      )
    },
    {
      key: 'change',
      label: 'Change ($)',
      groupHeader: 'Market Data',
      align: 'right',
      sortable: true,
      resizable: true,
      width: 110,
      minWidth: 90,
      maxWidth: 150,
      badge: {
        value: stocks.filter(s => s.change >= 0).length,
        variant: 'success'
      },
      render: (value) => (
        <span className={`font-mono ${
          (value as number) >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {(value as number) >= 0 ? '+' : ''}{String(value)}
        </span>
      )
    },
    {
      key: 'changePercent',
      label: 'Change (%)',
      groupHeader: 'Market Data',
      align: 'right',
      sortable: true,
      resizable: true,
      width: 110,
      minWidth: 90,
      maxWidth: 150,
      badge: {
        value: stocks.filter(s => String(s.changePercent).startsWith('+')).length,
        variant: 'success'
      },
      render: (value) => (
        <span className={`font-mono ${
          String(value).startsWith('+') ? 'text-green-600' : 'text-red-600'
        }`}>
          {String(value)}
        </span>
      )
    }
  ])

  // Bulk actions for stock management
  const bulkActions: BulkAction<Stock>[] = [
    {
      id: 'add-to-watchlist',
      label: 'Add to Watchlist',
      icon: '⭐',
      action: (selectedStocks) => {
        console.log('Adding to watchlist:', selectedStocks.map(s => s.symbol))
        alert(`Added ${selectedStocks.length} stocks to watchlist: ${selectedStocks.map(s => s.symbol).join(', ')}`)
      }
    },
    {
      id: 'export-selected',
      label: 'Export Selected',
      icon: '📤',
      action: (selectedStocks) => {
        const csv = `Symbol,Name,Price,Change\n${selectedStocks.map(s => 
          `${s.symbol},${s.name},${s.price},${s.change}`
        ).join('\n')}`
        
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'selected-stocks.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    },
    {
      id: 'remove-selection',
      label: 'Remove from View',
      icon: '🗑️',
      variant: 'destructive' as const,
      action: (selectedStocks) => {
        const symbols = selectedStocks.map(s => s.symbol).join(', ')
        const confirmed = confirm(`Remove ${selectedStocks.length} stocks from view? (${symbols})`)
        if (confirmed) {
          setStocks(current => 
            current.filter(stock => 
              !selectedStocks.some(selected => selected.symbol === stock.symbol)
            )
          )
        }
      }
    }
  ]

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Stock Dashboard</span>
          <span className="text-xs text-muted-foreground">
            Real-time market data with bulk actions - select rows to see watchlist and export options!
          </span>
        </div>
        <Button
          onClick={handleFetchStocks}
          loading={loading}
          variant="secondary"
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-table-container-elevated rounded-xl shadow-table-elevated border border-table">
          <p className="text-sm text-foreground">
            <strong>API Error:</strong> {error}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Showing demo data as fallback. Get a free API key at alphavantage.co
          </p>
        </div>
      )}
      
      <DataTable
        data={stocks}
        columns={columns}
        loading={loading}
        emptyMessage="No stock data available. Data will load automatically on first visit."
        onRowClick={(stock) => console.log('Selected stock:', stock)}
        pagination={{
          enabled: true,
          pageSize: 5,
          showPageSizeOptions: true
        }}
        search={{
          enabled: true,
          placeholder: 'Search stocks by symbol or name...'
        }}
        export={{
          enabled: true,
          filename: 'stock-data'
        }}
        columnControls={{
          resizable: true,
          reorderable: true
        }}
        onColumnsChange={(newColumns) => {
          setColumns(newColumns)
          console.log('Column order changed:', newColumns.map(c => c.key))
        }}
        selection={{
          enabled: true,
          bulkActions: bulkActions
        }}
        onSelectionChange={(selectedStocks) => {
          console.log('Selection changed:', selectedStocks.length, 'stocks selected')
        }}
      />
    </div>
  )
}
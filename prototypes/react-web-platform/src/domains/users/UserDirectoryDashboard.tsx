import { useEffect, useState } from 'react'
import { JsonPlaceholderUser } from '../../types/api'
import { JSONPlaceholderAdapter } from '../../core/data-adapters/jsonplaceholder'
import { DataTable } from '../../components/behaviors/DataTable'
import { Badge } from '../../components/ui/Badge'

type User = JsonPlaceholderUser

interface Column<T> {
  key: keyof T
  label: string
  align?: 'left' | 'center' | 'right'
  render?: (value: T[keyof T], item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
  width?: number
}

export function UserDirectoryDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adapter] = useState(() => new JSONPlaceholderAdapter())

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const userData = await adapter.getUsers()
      setUsers(userData)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load user data.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'id',
      label: 'ID',
      width: 80,
      align: 'center',
      sortable: true
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      searchable: true
    },
    {
      key: 'username',
      label: 'Username',
      sortable: true,
      searchable: true,
      render: (value) => (
        <span className="font-mono text-sm bg-muted/20 px-2 py-1 rounded">
          @{String(value)}
        </span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      searchable: true,
      render: (value) => (
        <a 
          href={`mailto:${value}`} 
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      searchable: true,
      render: (value) => (
        <span className="font-mono text-sm">{String(value)}</span>
      )
    },
    {
      key: 'website',
      label: 'Website',
      render: (value) => (
        <a 
          href={`http://${value}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {String(value)}
        </a>
      )
    },
    {
      key: 'company',
      label: 'Company',
      searchable: true,
      render: (value, user) => {
        const company = user.company
        return (
          <div>
            <div className="font-medium">{company.name}</div>
            <div className="text-xs text-muted-foreground">{company.catchPhrase}</div>
          </div>
        )
      }
    }
  ]

  const handleRowClick = (user: User) => {
    console.log('Selected user:', user)
  }

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Directory</h1>
          <p className="text-muted-foreground">
            Manage and browse user accounts from JSONPlaceholder API
          </p>
        </div>
        <Badge variant="grade-b" size="sm">
          {users.length} users
        </Badge>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyMessage="No users found"
        onRowClick={handleRowClick}
        className="shadow-sm"
        pagination={{
          enabled: true,
          pageSize: 10
        }}
        search={{
          enabled: true,
          placeholder: "Search users by name, username, email, or company..."
        }}
        export={{
          enabled: true,
          filename: `users-${new Date().toISOString().split('T')[0]}.csv`
        }}
      />
    </div>
  )
}
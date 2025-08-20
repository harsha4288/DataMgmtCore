import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Flag,
  MessageSquare,
  FileText,
  TrendingUp,
  ChevronDown,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

interface ModerationItem {
  id: string
  type: 'posting' | 'comment' | 'user_report' | 'chat_message'
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    role: string
    domain: string
  }
  reporter?: {
    id: string
    name: string
    reason: string
  }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'rejected' | 'needs_changes'
  submittedAt: string
  category: string
  flags: string[]
  reviewedBy?: string
  reviewedAt?: string
  moderatorNotes?: string
}

interface ModerationStats {
  pendingReviews: number
  approvedToday: number
  rejectedToday: number
  avgResponseTime: string
  flaggedContent: number
  totalReports: number
}

const mockStats: ModerationStats = {
  pendingReviews: 23,
  approvedToday: 45,
  rejectedToday: 8,
  avgResponseTime: '12 min',
  flaggedContent: 5,
  totalReports: 156
}

const mockModerationItems: ModerationItem[] = [
  {
    id: 'mod-1',
    type: 'posting',
    title: 'Seeking Medical Equipment for Rural Clinic',
    content: 'We are setting up a rural clinic and need basic medical equipment including stethoscopes, blood pressure monitors, and digital thermometers. Any donations or guidance on procurement would be greatly appreciated.',
    author: {
      id: 'user-1',
      name: 'Dr. Amit Patel',
      avatar: '/avatars/amit.jpg',
      role: 'member',
      domain: 'Healthcare'
    },
    priority: 'medium',
    status: 'pending',
    submittedAt: '2024-12-20T14:30:00Z',
    category: 'Equipment Request',
    flags: ['medical_supplies', 'rural_development']
  },
  {
    id: 'mod-2',
    type: 'user_report',
    title: 'Inappropriate behavior in group chat',
    content: 'User was using unprofessional language and making personal attacks during our healthcare innovation discussion.',
    author: {
      id: 'user-2',
      name: 'Reported User',
      avatar: '/avatars/reported.jpg',
      role: 'member',
      domain: 'Engineering'
    },
    reporter: {
      id: 'user-3',
      name: 'Dr. Sarah Chen',
      reason: 'Harassment and unprofessional conduct'
    },
    priority: 'high',
    status: 'pending',
    submittedAt: '2024-12-20T13:45:00Z',
    category: 'User Conduct',
    flags: ['harassment', 'chat_violation']
  },
  {
    id: 'mod-3',
    type: 'posting',
    title: 'Engineering Consultation Services',
    content: 'Offering structural engineering consultation for infrastructure projects. 20+ years experience in bridge and building design. Competitive rates available.',
    author: {
      id: 'user-4',
      name: 'Prof. Michael Kumar',
      avatar: '/avatars/michael.jpg',
      role: 'moderator',
      domain: 'Engineering'
    },
    priority: 'low',
    status: 'approved',
    submittedAt: '2024-12-20T12:15:00Z',
    category: 'Service Offering',
    flags: ['professional_services'],
    reviewedBy: 'Admin Team',
    reviewedAt: '2024-12-20T12:30:00Z',
    moderatorNotes: 'Approved - experienced professional with verified credentials'
  },
  {
    id: 'mod-4',
    type: 'comment',
    title: 'Comment on "Healthcare Innovation Discussion"',
    content: 'This idea has already been tried and failed multiple times. The author clearly hasn\'t done their research.',
    author: {
      id: 'user-5',
      name: 'Anonymous User',
      role: 'member',
      domain: 'Business'
    },
    priority: 'medium',
    status: 'needs_changes',
    submittedAt: '2024-12-20T11:20:00Z',
    category: 'Discussion Comment',
    flags: ['negative_feedback'],
    reviewedBy: 'Mod Team',
    reviewedAt: '2024-12-20T11:45:00Z',
    moderatorNotes: 'Requested more constructive feedback approach'
  },
  {
    id: 'mod-5',
    type: 'posting',
    title: 'Graphic Design Services for Non-Profits',
    content: 'Experienced graphic designer offering pro-bono services for verified non-profit organizations. Portfolio available upon request.',
    author: {
      id: 'user-6',
      name: 'Priya Sharma',
      avatar: '/avatars/priya.jpg',
      role: 'member',
      domain: 'Arts & Design'
    },
    priority: 'low',
    status: 'pending',
    submittedAt: '2024-12-20T10:45:00Z',
    category: 'Service Offering',
    flags: ['creative_services', 'non_profit']
  }
]

export default function ModerationDashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [moderatorNote, setModeratorNote] = useState('')
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'request_changes' | null>(null)

  const filteredItems = mockModerationItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeFilter === 'all') return matchesSearch
    if (activeFilter === 'pending') return matchesSearch && item.status === 'pending'
    if (activeFilter === 'high_priority') return matchesSearch && (item.priority === 'high' || item.priority === 'urgent')
    if (activeFilter === 'user_reports') return matchesSearch && item.type === 'user_report'
    if (activeFilter === 'postings') return matchesSearch && item.type === 'posting'
    
    return matchesSearch
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      case 'oldest':
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      case 'priority': {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      default:
        return 0
    }
  })

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'needs_changes': return 'bg-orange-500'
      case 'pending': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'posting': return <FileText className="h-4 w-4" />
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'user_report': return <Flag className="h-4 w-4" />
      case 'chat_message': return <MessageSquare className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const handleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === sortedItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(sortedItems.map(item => item.id))
    }
  }

  const handleModerationAction = (action: 'approve' | 'reject' | 'request_changes') => {
    setPendingAction(action)
    setIsActionDialogOpen(true)
  }

  const confirmModerationAction = () => {
    if (!selectedItem || !pendingAction) return
    
    console.log(`${pendingAction} item ${selectedItem.id} with note: ${moderatorNote}`)
    
    setIsActionDialogOpen(false)
    setSelectedItem(null)
    setModeratorNote('')
    setPendingAction(null)
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk ${action} for items:`, selectedItems)
    setSelectedItems([])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/member-dashboard')}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold">Moderation Dashboard</h1>
              <Badge variant="secondary">
                {mockStats.pendingReviews} pending
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{mockStats.pendingReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{mockStats.approvedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{mockStats.rejectedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                  <p className="text-2xl font-bold">{mockStats.avgResponseTime}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Flag className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Flagged</p>
                  <p className="text-2xl font-bold">{mockStats.flaggedContent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Reports</p>
                  <p className="text-2xl font-bold">{mockStats.totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, content, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setActiveFilter('all')}>
                      All Items
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter('pending')}>
                      Pending Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter('high_priority')}>
                      High Priority
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter('user_reports')}>
                      User Reports
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveFilter('postings')}>
                      Postings Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                      Oldest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('priority')}>
                      By Priority
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('approve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve ({selectedItems.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject ({selectedItems.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Moderation Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Moderation Queue</span>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedItems.length === sortedItems.length && sortedItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleItemSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm capitalize">{item.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-xs">{item.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {item.content}
                        </p>
                        {item.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.flags.slice(0, 2).map((flag) => (
                              <Badge key={flag} variant="outline" className="text-xs">
                                {flag.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.author.avatar} />
                          <AvatarFallback>
                            {item.author.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{item.author.name}</p>
                          <p className="text-xs text-muted-foreground">{item.author.domain}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPriorityColor(item.priority)} text-white`}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(item.status)} text-white`}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(item.submittedAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              {getTypeIcon(item.type)}
                              <span>{item.title}</span>
                              <Badge className={`${getPriorityColor(item.priority)} text-white ml-2`}>
                                {item.priority}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              Review and moderate this {item.type.replace('_', ' ')}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* Author Info */}
                            <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={item.author.avatar} />
                                <AvatarFallback>
                                  {item.author.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{item.author.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.author.role} • {item.author.domain}
                                </p>
                              </div>
                              {item.reporter && (
                                <div className="ml-auto text-right">
                                  <p className="text-sm font-medium text-red-600">Reported by:</p>
                                  <p className="text-sm">{item.reporter.name}</p>
                                  <p className="text-xs text-muted-foreground">{item.reporter.reason}</p>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div>
                              <h4 className="font-medium mb-2">Content</h4>
                              <div className="p-4 border rounded-lg bg-background">
                                <p className="whitespace-pre-wrap">{item.content}</p>
                              </div>
                            </div>

                            {/* Flags */}
                            {item.flags.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                  {item.flags.map((flag) => (
                                    <Badge key={flag} variant="outline">
                                      {flag.replace('_', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Previous Reviews */}
                            {item.reviewedBy && (
                              <div>
                                <h4 className="font-medium mb-2">Previous Review</h4>
                                <div className="p-4 border rounded-lg bg-muted">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Reviewed by: {item.reviewedBy}</span>
                                    <span className="text-sm text-muted-foreground">{formatTime(item.reviewedAt!)}</span>
                                  </div>
                                  {item.moderatorNotes && (
                                    <p className="text-sm">{item.moderatorNotes}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Moderator Notes */}
                            <div>
                              <h4 className="font-medium mb-2">Moderator Notes</h4>
                              <Textarea
                                placeholder="Add notes about your review decision..."
                                value={moderatorNote}
                                onChange={(e) => setModeratorNote(e.target.value)}
                                className="min-h-[100px]"
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <div className="flex space-x-2 w-full">
                              <Button
                                variant="outline"
                                onClick={() => handleModerationAction('request_changes')}
                                className="flex-1"
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Request Changes
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleModerationAction('reject')}
                                className="flex-1 text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button
                                onClick={() => handleModerationAction('approve')}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </div>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm {pendingAction?.replace('_', ' ')} Action
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {pendingAction?.replace('_', ' ')} this item?
              {moderatorNote && ' Your notes will be saved with this decision.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmModerationAction}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
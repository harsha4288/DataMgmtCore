import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { PageIntroduction } from '@/components/ui/page-introduction'
import { moduleFeatures } from '@/lib/module-features'
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
} from '@/components/ui/dialog'
import { 
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Eye,
  MoreVertical,
  Clock,
  Calendar,
  MapPin,
  // Users,
  MessageSquare,
  Heart,
  BarChart3,
  Target,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pause,
  Play,
  Download
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MyPosting {
  id: string
  type: 'offer' | 'seek'
  title: string
  description: string
  category: string
  domain: string
  status: 'active' | 'paused' | 'expired' | 'closed'
  createdAt: string
  updatedAt: string
  expiresAt: string
  location: string
  tags: string[]
  analytics: {
    views: number
    interested: number
    responses: number
    clicks: number
    saves: number
  }
  responses: {
    id: string
    name: string
    avatar?: string
    message: string
    timestamp: string
    status: 'new' | 'reviewed' | 'contacted' | 'declined'
  }[]
}

const mockMyPostings: MyPosting[] = [
  {
    id: 'post-1',
    type: 'offer',
    title: 'Healthcare Technology Consulting Services',
    description: 'Offering consultation on implementing healthcare technology solutions for small to medium practices. Specializing in EHR systems, telemedicine platforms, and HIPAA compliance.',
    category: 'Professional Services',
    domain: 'Healthcare',
    status: 'active',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-19T14:20:00Z',
    expiresAt: '2025-01-15T10:30:00Z',
    location: 'San Francisco, CA (Remote Available)',
    tags: ['Healthcare', 'Technology', 'Consulting', 'EHR', 'HIPAA'],
    analytics: {
      views: 156,
      interested: 12,
      responses: 8,
      clicks: 34,
      saves: 15
    },
    responses: [
      {
        id: 'resp-1',
        name: 'Dr. Michael Park',
        avatar: '/avatars/michael.jpg',
        message: 'Hi! I run a family practice and we\'re looking to upgrade our EHR system. Would love to discuss our needs.',
        timestamp: '2024-12-19T09:15:00Z',
        status: 'new'
      },
      {
        id: 'resp-2',
        name: 'Sarah Rodriguez',
        message: 'Interested in telemedicine implementation for our clinic. What\'s your experience with patient portals?',
        timestamp: '2024-12-18T16:45:00Z',
        status: 'reviewed'
      }
    ]
  },
  {
    id: 'post-2',
    type: 'seek',
    title: 'Looking for Mobile App Development Mentor',
    description: 'Recent graduate seeking mentorship in mobile app development. Specifically interested in React Native and Flutter. Looking for guidance on best practices and career advice.',
    category: 'Mentorship',
    domain: 'Technology',
    status: 'active',
    createdAt: '2024-12-10T15:45:00Z',
    updatedAt: '2024-12-17T11:30:00Z',
    expiresAt: '2025-01-10T15:45:00Z',
    location: 'Remote',
    tags: ['Mobile Development', 'React Native', 'Flutter', 'Mentorship', 'Career'],
    analytics: {
      views: 89,
      interested: 7,
      responses: 5,
      clicks: 22,
      saves: 8
    },
    responses: [
      {
        id: 'resp-3',
        name: 'Alex Thompson',
        avatar: '/avatars/alex.jpg',
        message: 'I\'ve been doing mobile development for 8 years. Happy to help with React Native questions.',
        timestamp: '2024-12-17T10:20:00Z',
        status: 'contacted'
      }
    ]
  },
  {
    id: 'post-3',
    type: 'offer',
    title: 'Pro Bono Legal Services for Startups',
    description: 'Offering free legal consultation for early-stage startups. Can help with incorporation, contracts, and intellectual property basics.',
    category: 'Legal Services',
    domain: 'Law',
    status: 'paused',
    createdAt: '2024-11-20T09:00:00Z',
    updatedAt: '2024-12-01T16:15:00Z',
    expiresAt: '2024-12-20T09:00:00Z',
    location: 'New York, NY',
    tags: ['Legal', 'Startups', 'Pro Bono', 'Contracts', 'IP'],
    analytics: {
      views: 234,
      interested: 18,
      responses: 12,
      clicks: 67,
      saves: 25
    },
    responses: [
      {
        id: 'resp-4',
        name: 'Jennifer Kim',
        message: 'We\'re a early-stage fintech startup looking for help with our terms of service.',
        timestamp: '2024-11-25T14:30:00Z',
        status: 'declined'
      }
    ]
  },
  {
    id: 'post-4',
    type: 'seek',
    title: 'Investment Advice for First-Time Entrepreneurs',
    description: 'Looking for guidance on raising seed funding. Need advice on pitch decks, investor relations, and term sheets.',
    category: 'Investment',
    domain: 'Business',
    status: 'expired',
    createdAt: '2024-10-15T12:00:00Z',
    updatedAt: '2024-11-10T09:45:00Z',
    expiresAt: '2024-11-15T12:00:00Z',
    location: 'Boston, MA',
    tags: ['Investment', 'Funding', 'Pitch Deck', 'Startups'],
    analytics: {
      views: 178,
      interested: 14,
      responses: 9,
      clicks: 45,
      saves: 12
    },
    responses: []
  }
]

export default function MyPostingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [postings, setPostings] = useState<MyPosting[]>(mockMyPostings)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPosting, setSelectedPosting] = useState<MyPosting | null>(null)
  // eslint-disable-next-line no-unused-vars
  const [_isAnalyticsOpen, _setIsAnalyticsOpen] = useState(false)

  const filteredPostings = postings.filter(posting => {
    const matchesSearch = searchQuery === '' || 
      posting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      posting.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'active') return matchesSearch && posting.status === 'active'
    if (activeTab === 'paused') return matchesSearch && posting.status === 'paused'
    if (activeTab === 'expired') return matchesSearch && (posting.status === 'expired' || posting.status === 'closed')
    
    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'expired': return 'bg-red-500'
      case 'closed': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'expired': return <XCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const handleStatusChange = (postingId: string, newStatus: 'active' | 'paused' | 'closed') => {
    setPostings(prev => prev.map(posting => 
      posting.id === postingId 
        ? { ...posting, status: newStatus, updatedAt: new Date().toISOString() }
        : posting
    ))
    
    toast({
      title: "Status Updated",
      description: `Posting status changed to ${newStatus}`,
    })
  }

  const handleDelete = (postingId: string) => {
    setPostings(prev => prev.filter(posting => posting.id !== postingId))
    toast({
      title: "Posting Deleted",
      description: "Your posting has been permanently deleted",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getTotalStats = () => {
    return postings.reduce((acc, posting) => ({
      views: acc.views + posting.analytics.views,
      responses: acc.responses + posting.analytics.responses,
      interested: acc.interested + posting.analytics.interested,
      saves: acc.saves + posting.analytics.saves
    }), { views: 0, responses: 0, interested: 0, saves: 0 })
  }

  const totalStats = getTotalStats()

  return (
    <div className="min-h-screen bg-background">
      <PageIntroduction 
        title={moduleFeatures.myPostings.title}
        description={moduleFeatures.myPostings.description}
        features={moduleFeatures.myPostings.features}
      />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/member-dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">My Postings</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">{postings.length} total postings</Badge>
              <Button onClick={() => navigate('/create-posting')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Posting
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{totalStats.views.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Responses</p>
                  <p className="text-2xl font-bold">{totalStats.responses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Interested</p>
                  <p className="text-2xl font-bold">{totalStats.interested}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Saves</p>
                  <p className="text-2xl font-bold">{totalStats.saves}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search your postings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All ({postings.length})</TabsTrigger>
                  <TabsTrigger value="active">
                    Active ({postings.filter(p => p.status === 'active').length})
                  </TabsTrigger>
                  <TabsTrigger value="paused">
                    Paused ({postings.filter(p => p.status === 'paused').length})
                  </TabsTrigger>
                  <TabsTrigger value="expired">
                    Expired ({postings.filter(p => p.status === 'expired' || p.status === 'closed').length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Postings List */}
        <div className="space-y-4">
          {filteredPostings.map((posting) => (
            <Card key={posting.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{posting.title}</h3>
                          <Badge 
                            variant={posting.type === 'offer' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {posting.type === 'offer' ? 'Offering' : 'Seeking'}
                          </Badge>
                          <Badge className={`${getStatusColor(posting.status)} text-white flex items-center gap-1`}>
                            {getStatusIcon(posting.status)}
                            {posting.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {posting.description}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            // Edit functionality - placeholder for now
                            toast({
                              title: "Edit Feature",
                              description: "Posting edit functionality will be available in the next phase."
                            })
                          }}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedPosting(posting)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          {posting.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(posting.id, 'paused')}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {posting.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(posting.id, 'active')}>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleStatusChange(posting.id, 'closed')}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Close
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(posting.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {formatDate(posting.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Updated {formatTimeAgo(posting.updatedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {posting.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Expires {formatDate(posting.expiresAt)}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {posting.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Analytics Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold">{posting.analytics.views}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{posting.analytics.responses}</p>
                        <p className="text-xs text-muted-foreground">Responses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{posting.analytics.interested}</p>
                        <p className="text-xs text-muted-foreground">Interested</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{posting.analytics.clicks}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">{posting.analytics.saves}</p>
                        <p className="text-xs text-muted-foreground">Saves</p>
                      </div>
                    </div>

                    {/* Responses Preview */}
                    {posting.responses.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Recent Responses</h4>
                          <Badge variant="outline">
                            {posting.responses.filter(r => r.status === 'new').length} new
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {posting.responses.slice(0, 2).map(response => (
                            <div key={response.id} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={response.avatar} />
                                <AvatarFallback>
                                  {response.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{response.name}</p>
                                  <div className="flex items-center space-x-2">
                                    <Badge 
                                      variant={response.status === 'new' ? 'default' : 'outline'}
                                      className="text-xs"
                                    >
                                      {response.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTimeAgo(response.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {response.message}
                                </p>
                              </div>
                            </div>
                          ))}
                          {posting.responses.length > 2 && (
                            <Button variant="link" className="w-full text-sm">
                              View all {posting.responses.length} responses
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPostings.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No postings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first posting to get started'}
              </p>
              <Button onClick={() => navigate('/create-posting')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Posting
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analytics Dialog */}
        <Dialog open={!!selectedPosting} onOpenChange={() => setSelectedPosting(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Analytics for "{selectedPosting?.title}"</DialogTitle>
              <DialogDescription>
                Detailed analytics and performance metrics for your posting
              </DialogDescription>
            </DialogHeader>
            
            {selectedPosting && (
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Eye className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{selectedPosting.analytics.views}</p>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{selectedPosting.analytics.responses}</p>
                      <p className="text-sm text-muted-foreground">Responses</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Heart className="h-6 w-6 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold">{selectedPosting.analytics.interested}</p>
                      <p className="text-sm text-muted-foreground">Interested</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <p className="text-2xl font-bold">{selectedPosting.analytics.saves}</p>
                      <p className="text-sm text-muted-foreground">Saves</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Engagement Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Click-through Rate</span>
                          <span className="text-sm">
                            {((selectedPosting.analytics.clicks / selectedPosting.analytics.views) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(selectedPosting.analytics.clicks / selectedPosting.analytics.views) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Response Rate</span>
                          <span className="text-sm">
                            {((selectedPosting.analytics.responses / selectedPosting.analytics.views) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(selectedPosting.analytics.responses / selectedPosting.analytics.views) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Save Rate</span>
                          <span className="text-sm">
                            {((selectedPosting.analytics.saves / selectedPosting.analytics.views) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={(selectedPosting.analytics.saves / selectedPosting.analytics.views) * 100} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Management */}
                {selectedPosting.responses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Response Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedPosting.responses.map(response => (
                          <div key={response.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={response.avatar} />
                              <AvatarFallback>
                                {response.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium">{response.name}</p>
                                <div className="flex items-center space-x-2">
                                  <Badge variant={response.status === 'new' ? 'default' : 'outline'}>
                                    {response.status}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {formatTimeAgo(response.timestamp)}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{response.message}</p>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // Reply functionality - placeholder for now
                                    toast({
                                      title: "Reply Feature",
                                      description: "Reply functionality will be available in the next phase."
                                    })
                                  }}
                                >
                                  Reply
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // Mark as reviewed functionality
                                    toast({
                                      title: "Marked as Reviewed",
                                      description: `Response from ${response.name} has been marked as reviewed.`
                                    })
                                  }}
                                >
                                  Mark Reviewed
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate('/chat', { state: { recipient: response } })}
                                >
                                  Contact
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPosting(null)}>
                Close
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Analytics
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
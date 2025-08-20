import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  MapPin, 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark,
  ArrowLeft,
  GitBranch,
  Briefcase,
  GraduationCap,
  Star,
  Eye,
  MoreHorizontal,
  Calendar,
  Building
} from 'lucide-react'

// Mock data for postings
const mockPostings = [
  {
    id: '1',
    type: 'offer' as const,
    title: 'Senior Software Engineer Position at Tech Startup',
    description: 'We are looking for an experienced software engineer to join our growing team. Must have experience with React, Node.js, and cloud technologies.',
    category: 'Job Opportunities',
    domain: 'Technology',
    subdomain: 'Software Development',
    urgency: 'medium' as const,
    location: 'San Francisco, CA',
    remote: true,
    tags: ['React', 'Node.js', 'AWS', 'Full-time'],
    author: {
      id: 'u1',
      name: 'Sarah Chen',
      avatar: '/avatars/sarah.jpg',
      title: 'CTO at TechFlow',
      graduationYear: 2018,
      domain: 'Technology'
    },
    postedAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-02-15T23:59:59Z',
    responses: 12,
    views: 156,
    likes: 8,
    saved: 3,
    featured: true
  },
  {
    id: '2',
    type: 'seek' as const,
    title: 'Looking for Mentorship in Healthcare Administration',
    description: 'Recent graduate seeking guidance from experienced healthcare administrators. Interested in hospital operations and healthcare policy.',
    category: 'Mentorship',
    domain: 'Healthcare',
    subdomain: 'Administration',
    urgency: 'low' as const,
    location: 'Remote',
    remote: true,
    tags: ['Mentorship', 'Healthcare', 'Administration', 'Policy'],
    author: {
      id: 'u2',
      name: 'Michael Rodriguez',
      avatar: '/avatars/michael.jpg',
      title: 'Healthcare Administrator',
      graduationYear: 2023,
      domain: 'Healthcare'
    },
    postedAt: '2024-01-14T14:15:00Z',
    expiresAt: '2024-03-14T23:59:59Z',
    responses: 3,
    views: 45,
    likes: 2,
    saved: 1,
    featured: false
  },
  {
    id: '3',
    type: 'offer' as const,
    title: 'Consulting Opportunity: Digital Transformation',
    description: 'Established consulting firm seeking alumni for digital transformation projects. Flexible engagement model.',
    category: 'Business Opportunities',
    domain: 'Business',
    subdomain: 'Consulting',
    urgency: 'high' as const,
    location: 'New York, NY',
    remote: false,
    tags: ['Consulting', 'Digital', 'Transformation', 'Contract'],
    author: {
      id: 'u3',
      name: 'Jennifer Park',
      avatar: '/avatars/jennifer.jpg',
      title: 'Partner at Strategic Solutions',
      graduationYear: 2015,
      domain: 'Business'
    },
    postedAt: '2024-01-13T09:00:00Z',
    expiresAt: '2024-02-01T23:59:59Z',
    responses: 18,
    views: 234,
    likes: 15,
    saved: 7,
    featured: true
  },
  {
    id: '4',
    type: 'seek' as const,
    title: 'Research Collaboration in Environmental Science',
    description: 'PhD student looking for collaboration on climate change research. Specifically interested in sustainable technology applications.',
    category: 'Research Collaboration',
    domain: 'Science',
    subdomain: 'Environmental',
    urgency: 'medium' as const,
    location: 'Boston, MA',
    remote: true,
    tags: ['Research', 'Climate', 'Environmental', 'PhD'],
    author: {
      id: 'u4',
      name: 'David Kim',
      avatar: '/avatars/david.jpg',
      title: 'PhD Candidate at MIT',
      graduationYear: 2020,
      domain: 'Science'
    },
    postedAt: '2024-01-12T16:45:00Z',
    expiresAt: '2024-04-12T23:59:59Z',
    responses: 7,
    views: 89,
    likes: 5,
    saved: 4,
    featured: false
  }
]

type PostingType = 'all' | 'offer' | 'seek'
type SortOption = 'recent' | 'popular' | 'expiring' | 'responses'

export default function BrowsePostingsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<PostingType>('all')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filteredPostings, setFilteredPostings] = useState(mockPostings)

  useEffect(() => {
    let filtered = mockPostings

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(posting =>
        posting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        posting.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        posting.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(posting => posting.type === selectedType)
    }

    // Filter by domain
    if (selectedDomain !== 'all') {
      filtered = filtered.filter(posting => posting.domain === selectedDomain)
    }

    // Sort results
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
        break
      case 'popular':
        filtered.sort((a, b) => (b.likes + b.views) - (a.likes + a.views))
        break
      case 'expiring':
        filtered.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
        break
      case 'responses':
        filtered.sort((a, b) => b.responses - a.responses)
        break
    }

    setFilteredPostings(filtered)
  }, [searchQuery, selectedType, selectedDomain, sortBy])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const formatExpiresIn = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays < 0) {
      return 'Expired'
    } else if (diffInDays === 0) {
      return 'Expires today'
    } else if (diffInDays === 1) {
      return 'Expires tomorrow'
    } else {
      return `Expires in ${diffInDays} days`
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'offer' ? <Briefcase className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />
  }

  return (
    <div className="min-h-screen bg-background">
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
                <GitBranch className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Browse Postings</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">Phase 2 Demo</Badge>
              <Button onClick={() => navigate('/create-posting')}>
                Create Posting
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search postings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as PostingType)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="offer">Offers</TabsTrigger>
                      <TabsTrigger value="seek">Seeking</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Domain Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Domain</label>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="expiring">Expiring Soon</SelectItem>
                      <SelectItem value="responses">Most Responses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Postings List */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {filteredPostings.length} Posting{filteredPostings.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-muted-foreground">
                  {selectedType !== 'all' && `${selectedType === 'offer' ? 'Offering' : 'Seeking'} • `}
                  {selectedDomain !== 'all' && `${selectedDomain} • `}
                  Sorted by {sortBy.replace('_', ' ')}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </div>

            {/* Postings Grid */}
            <div className="space-y-6">
              {filteredPostings.map((posting) => (
                <Card key={posting.id} className="hover:shadow-lg transition-all duration-200 group cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={posting.author.avatar} />
                          <AvatarFallback>
                            {posting.author.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={posting.type === 'offer' ? 'default' : 'secondary'}>
                              {getTypeIcon(posting.type)}
                              <span className="ml-1 capitalize">{posting.type}</span>
                            </Badge>
                            <Badge variant={getUrgencyColor(posting.urgency)}>
                              {posting.urgency} priority
                            </Badge>
                            {posting.featured && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                            {posting.title}
                          </CardTitle>
                          <p className="text-muted-foreground line-clamp-2 mb-3">
                            {posting.description}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground space-x-4">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {posting.author.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-4 w-4" />
                              Class of {posting.author.graduationYear}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {posting.location}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {posting.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Separator />

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTimeAgo(posting.postedAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatExpiresIn(posting.expiresAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {posting.views} views
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {posting.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {posting.responses}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredPostings.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No postings found</h3>
                      <p>Try adjusting your filters or search criteria</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
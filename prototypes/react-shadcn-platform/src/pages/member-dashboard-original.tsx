import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  TrendingUp,
  Users,
  Users2,
  Star,
  Eye,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  Activity,
  Target,
  BarChart3,
  MessageSquare,
  Filter,
  Settings,
  Briefcase,
  GraduationCap,
  HelpCircle,
  Search,
  Plus,
  ArrowUpRight,
  AlertCircle,
  Home,
  FileText,
  UserPlus
} from 'lucide-react'
import { type UserProfile } from '@/lib/mock-data/auth'
import { getDashboardStats, mockPostings, getNotificationsByUser, getConversationsByUser } from '@/lib/mock-data'
import { getPersonalizedAlumniPosts, type AlumniPost } from '@/lib/mock-data/enhanced-alumni-posts'
import { type Posting } from '@/lib/mock-data/postings'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { WelcomeHero } from '@/components/dashboard/WelcomeHeroSection'

// Unified display type for both alumni posts and regular postings
type UnifiedPost = {
  id: string
  title: string
  description: string
  authorName: string
  authorAvatar?: string
  createdAt: string
  location?: string
  type: 'offer' | 'seek' | 'offering' | 'seeking'
  category: string
  tags: string[]
  expiresAt?: string
  engagement: {
    likes: number
    comments: number
    views: number
    interested?: number
  }
  image?: string
  isUrgent?: boolean
  organization?: string
}

export default function MemberDashboard() {
  const navigate = useNavigate()
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showProgramDetails, setShowProgramDetails] = useState(false)

  useEffect(() => {
    // Get current profile
    const storedProfile = localStorage.getItem('currentProfile')
    if (storedProfile) {
      const profile = JSON.parse(storedProfile)
      setCurrentProfile(profile)
      
      // Load dashboard data
      const dashboardStats = getDashboardStats(profile.userId)
      setStats(dashboardStats)
      
      // Load notifications
      const userNotifications = getNotificationsByUser(profile.userId)
      setNotifications(userNotifications.slice(0, 8))
      
      // Load conversations
      const userConversations = getConversationsByUser(profile.userId)
      setConversations(userConversations.slice(0, 3))
    } else {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('authenticated')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentProfile')
    navigate('/login')
  }

  const handleSwitchProfile = () => {
    navigate('/profile-selection')
  }

  const getPersonalizedPosts = (): UnifiedPost[] => {
    if (!currentProfile) return []
    
    // Get enhanced alumni posts first, then fallback to regular postings
    const alumniPosts = getPersonalizedAlumniPosts({
      domains: currentProfile.preferences.domains
    }).slice(0, 4)
    
    const regularPosts = mockPostings.filter(post => 
      post.status === 'active' &&
      currentProfile.preferences.domains.some(domain => 
        post.category === domain || post.subcategory === domain
      )
    ).slice(0, 2)
    
    // Convert alumni posts to unified format
    const unifiedAlumniPosts: UnifiedPost[] = alumniPosts.map((post: AlumniPost) => ({
      id: post.id,
      title: post.title,
      description: post.content,
      authorName: post.author,
      authorAvatar: post.authorAvatar,
      createdAt: post.createdAt,
      location: post.location,
      type: post.postType,
      category: post.category,
      tags: post.tags,
      expiresAt: post.deadline,
      engagement: {
        likes: post.likes,
        comments: post.comments.length,
        views: 0,
        interested: 0
      },
      image: post.image,
      isUrgent: post.isUrgent,
      organization: post.organization
    }))
    
    // Convert regular posts to unified format
    const unifiedRegularPosts: UnifiedPost[] = regularPosts.map((post: Posting) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      createdAt: post.createdAt,
      location: post.location,
      type: post.type,
      category: post.category,
      tags: post.tags,
      expiresAt: post.expiresAt,
      engagement: post.engagement,
      isUrgent: false
    }))
    
    return [...unifiedAlumniPosts, ...unifiedRegularPosts]
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  const getDomainIcon = (domain: string) => {
    const iconMap: Record<string, any> = {
      'Healthcare': Heart,
      'Engineering': Settings,
      'Medical': Heart,
      'Computer Science': Settings,
      'Arts & Crafts': Star,
      'Business': Briefcase,
      'Education': GraduationCap,
    }
    const Icon = iconMap[domain] || HelpCircle
    return <Icon className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Healthcare': 'text-red-500',
      'Engineering': 'text-blue-500',
      'Medical': 'text-pink-500',
      'Computer Science': 'text-purple-500',
      'Arts & Crafts': 'text-yellow-500',
      'Business': 'text-green-500',
      'Education': 'text-indigo-500',
    }
    return colorMap[category] || 'text-gray-500'
  }

  if (!currentProfile || !stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const personalizedPosts = getPersonalizedPosts()
  const totalEngagement = personalizedPosts.reduce((acc, post) => 
    acc + post.engagement.likes + post.engagement.comments + post.engagement.views, 0
  )


  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        currentProfile={currentProfile}
        stats={{
          notifications: { unread: stats.notifications.unread },
          chat: { totalUnread: stats.chat.totalUnread }
        }}
        onSwitchProfile={handleSwitchProfile}
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <WelcomeHero 
          profile={currentProfile}
          stats={stats}
          totalEngagement={totalEngagement}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Sidebar - Quick Actions & Domains */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-sm sm:text-base font-semibold flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 sm:p-6">
                <Button 
                  className="w-full justify-start group min-h-[44px] text-sm" 
                  variant="default"
                  onClick={() => navigate('/alumni-directory')}
                >
                  <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="truncate">Alumni Directory</span>
                  <Badge variant="secondary" className="ml-auto hidden sm:flex">
                    New
                  </Badge>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group min-h-[44px] text-sm"
                  onClick={() => navigate('/mentorship')}
                >
                  <GraduationCap className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="truncate">Mentorship Platform</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group min-h-[44px] text-sm"
                  onClick={() => navigate('/browse-postings')}
                >
                  <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="truncate">Browse Requests</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group min-h-[44px] text-sm"
                  onClick={() => navigate('/create-posting')}
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  <span className="truncate">Create Posting</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group min-h-[44px] text-sm"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="truncate">Start Chat</span>
                  {stats.chat.totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.chat.totalUnread}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group min-h-[44px] text-sm"
                  onClick={() => navigate('/express-interest')}
                >
                  <Star className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  <span className="truncate">Express Interest</span>
                </Button>
              </CardContent>
            </Card>

            {/* Domain Expertise */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center">
                  <Target className="h-4 w-4 mr-2 text-primary" />
                  Your Expertise Areas
                </CardTitle>
                <CardDescription className="text-xs">
                  {currentProfile.preferences.domains.length}/5 domains selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentProfile.preferences.domains.map((domain, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`${getCategoryColor(domain)}`}>
                          {getDomainIcon(domain)}
                        </div>
                        <span className="text-sm font-medium">{domain}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="grade-a" className="text-xs">
                          Active
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => {
                            // Handle domain management
                            navigate('/preferences')
                          }}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="link" 
                  className="w-full mt-3 text-xs"
                  onClick={() => navigate('/preferences')}
                >
                  Manage Domains
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                  Pending Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors"
                       onClick={() => navigate('/responses')}>
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium">Review responses</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="grade-c" count={3} />
                      <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors"
                       onClick={() => navigate('/profile')}>
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">Complete profile</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="grade-b" content="85%" />
                      <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors"
                       onClick={() => navigate('/ratings')}>
                    <div className="flex items-center space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Rate helpers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="grade-a" count={2} />
                      <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Tabs */}
          <div className="lg:col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 lg:space-y-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full h-auto p-1">
                <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Home</span>
                </TabsTrigger>
                <TabsTrigger value="feed" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <FileText className="h-4 w-4" />
                  <span>Feed</span>
                  {personalizedPosts.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs hidden sm:flex">
                      {personalizedPosts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="connections" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 hidden lg:flex">
                  <Users className="h-4 w-4" />
                  Network
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 hidden lg:flex">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Messages</span>
                  <span className="sm:hidden">Chat</span>
                  {stats.chat.totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
                      {stats.chat.totalUnread}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Activity</CardTitle>
                      <CardDescription>Your latest interactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {notifications.slice(0, 5).map((notification) => (
                          <div key={notification.id} className="flex items-start space-x-3">
                            <div className={`mt-1 h-2 w-2 rounded-full ${
                              notification.isRead ? 'bg-muted' : 'bg-primary'
                            }`} />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="link" 
                        className="w-full mt-3 text-xs"
                        onClick={() => navigate('/responses')}
                      >
                        View All Activity
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recommended Connections */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recommended For You</CardTitle>
                      <CardDescription>Based on your interests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { name: 'Dr. Sarah Chen', role: 'Medical Advisor', match: '92%' },
                          { name: 'John Kumar', role: 'Software Engineer', match: '88%' },
                          { name: 'Priya Patel', role: 'Career Counselor', match: '85%' },
                        ].map((person, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8" name={person.name} size="sm">
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{person.name}</p>
                                <p className="text-xs text-muted-foreground">{person.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {person.match} match
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigate('/alumni-directory')}
                              >
                                Connect
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="link" 
                        className="w-full mt-3 text-xs"
                        onClick={() => navigate('/alumni-directory')}
                      >
                        Discover More Alumni
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Trending in Your Domains */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                      Trending in Your Domains
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {personalizedPosts.slice(0, 3).map((post) => (
                        <div 
                          key={post.id} 
                          className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigate('/browse-postings')}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.authorAvatar} />
                              <AvatarFallback className="text-xs">
                                {post.authorName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium truncate">{post.authorName}</span>
                          </div>
                          <h4 className="text-sm font-semibold mb-1 line-clamp-1">{post.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {post.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant={post.type === 'offer' ? 'default' : 'secondary'} className="text-xs">
                              {post.type === 'offer' ? 'Offering' : 'Seeking'}
                            </Badge>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              <span>{post.engagement.views}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Feed Tab */}
              <TabsContent value="feed" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Personalized Feed</h3>
                    <p className="text-sm text-muted-foreground">
                      Showing {personalizedPosts.length} posts matching your preferences
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {personalizedPosts.map((post: UnifiedPost) => {
                    // Check if this is an alumni post (has organization or image)
                    const isAlumniPost = Boolean(post.organization || post.image)

                    return (
                      <Card key={post.id} className="hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 border-2 border-primary/10">
                                <AvatarImage src={post.authorAvatar} />
                                <AvatarFallback>
                                  {post.authorName.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold">{post.authorName}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {isAlumniPost ? 'Alumni' : 'Member'}
                                  </Badge>
                                  {post.organization && (
                                    <Badge variant="secondary" className="text-xs">
                                      {post.organization}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(post.createdAt)}</span>
                                  {post.location && (
                                    <>
                                      <span>•</span>
                                      <MapPin className="h-3 w-3" />
                                      <span>{post.location}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={post.type === 'offer' || post.type === 'offering' ? 'default' : 'secondary'}
                                className="flex items-center space-x-1"
                              >
                                {post.type === 'offer' || post.type === 'offering' ? (
                                  <>
                                    <Users2 className="h-3 w-3" />
                                    <span>Offering</span>
                                  </>
                                ) : (
                                  <>
                                    <HelpCircle className="h-3 w-3" />
                                    <span>Seeking</span>
                                  </>
                                )}
                              </Badge>
                              {post.isUrgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Post Image */}
                          {post.image && (
                            <div className="mb-4">
                              <img 
                                src={post.image} 
                                alt={post.title}
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          )}

                          {/* Post Content */}
                          <div className="mb-4">
                            <h4 className="text-lg font-semibold mb-2">{post.title}</h4>
                            <div className="text-muted-foreground mb-3">
                              {isAlumniPost && post.description.includes('<p>') ? (
                                <div 
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: post.description }}
                                />
                              ) : (
                                <p>{post.description}</p>
                              )}
                            </div>
                            
                            {/* Category & Tags */}
                            <div className="flex items-center space-x-2 mb-3">
                              <div className={`flex items-center space-x-1 ${getCategoryColor(post.category)}`}>
                                {getDomainIcon(post.category)}
                                <span className="text-sm font-medium">{post.category}</span>
                              </div>
                              <span className="text-muted-foreground">•</span>
                              <div className="flex flex-wrap gap-1">
                                {post.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {post.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Expiry Date if applicable */}
                            {post.expiresAt && (
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Expires {formatTimeAgo(post.expiresAt)}</span>
                              </div>
                            )}
                          </div>

                          {/* Engagement Section */}
                          <Separator className="my-4" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <Heart className="h-4 w-4 mr-1" />
                                <span className="text-sm">{post.engagement.likes}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                <span className="text-sm">{post.engagement.comments}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="text-sm">{post.engagement.views}</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <Share className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                                <Bookmark className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center space-x-2">
                              {post.engagement.interested && post.engagement.interested > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {post.engagement.interested} interested
                                </span>
                              )}
                              <Button 
                                size="sm" 
                                className="font-medium"
                                onClick={() => navigate(post.type === 'offer' || post.type === 'offering' ? '/chat' : '/express-interest')}
                              >
                                {post.type === 'offer' || post.type === 'offering' ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Connect Now
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Express Interest
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="text-center py-8">
                  <Button variant="outline" onClick={() => navigate('/browse-postings')}>
                    Load More Posts
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </TabsContent>

              {/* Connections Tab */}
              <TabsContent value="connections" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Network</CardTitle>
                    <CardDescription>Manage your alumni connections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Build Your Network</h3>
                      <p className="text-muted-foreground mb-4">
                        Connect with alumni who share your interests and expertise
                      </p>
                      <Button onClick={() => navigate('/alumni-directory')}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Find Alumni
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                {/* Program Overview */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Alumni Network Program Overview
                    </CardTitle>
                    <CardDescription>Connect, share knowledge, and grow together with fellow alumni</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Our alumni network is designed to foster meaningful connections and professional growth through peer-to-peer support, knowledge sharing, and mentorship opportunities.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowProgramDetails(!showProgramDetails)}
                          className="mb-4"
                        >
                          {showProgramDetails ? 'Hide Details' : 'Learn More'}
                          <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showProgramDetails ? 'rotate-180' : ''}`} />
                        </Button>
                        
                        {showProgramDetails && (
                          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-start space-x-3">
                              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                              <div>
                                <p className="text-sm font-medium">Knowledge Sharing</p>
                                <p className="text-xs text-muted-foreground">Share expertise across domains like Technology, Healthcare, Finance, and more</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                              <div>
                                <p className="text-sm font-medium">Mentorship Network</p>
                                <p className="text-xs text-muted-foreground">Connect experienced professionals with those seeking guidance</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <div className="h-2 w-2 rounded-full bg-purple-500 mt-2" />
                              <div>
                                <p className="text-sm font-medium">Professional Growth</p>
                                <p className="text-xs text-muted-foreground">Build meaningful relationships that support career advancement</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3">
                              <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
                              <div>
                                <p className="text-sm font-medium">Chat & Collaboration</p>
                                <p className="text-xs text-muted-foreground">Real-time messaging and collaboration tools for seamless communication</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">1,247</p>
                            <p className="text-sm text-muted-foreground">Profile Views</p>
                            <p className="text-xs text-green-600 mt-1">+23% this month</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">42</p>
                            <p className="text-sm text-muted-foreground">Active Connections</p>
                            <p className="text-xs text-green-600 mt-1">+8 this week</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">18</p>
                            <p className="text-sm text-muted-foreground">Knowledge Shares</p>
                            <p className="text-xs text-blue-600 mt-1">94% helpful rate</p>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <p className="text-2xl font-bold text-orange-600">12</p>
                            <p className="text-sm text-muted-foreground">Active Chats</p>
                            <p className="text-xs text-green-600 mt-1">2.3hr avg response</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {/* Engagement Trends */}
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Activity className="h-4 w-4 mr-2" />
                        Engagement Trends
                      </CardTitle>
                      <CardDescription>Your activity over the past 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Monthly engagement data */}
                        {[
                          { month: 'Jan', connections: 5, posts: 12, views: 180 },
                          { month: 'Feb', connections: 8, posts: 15, views: 220 },
                          { month: 'Mar', connections: 12, posts: 18, views: 280 },
                          { month: 'Apr', connections: 15, posts: 22, views: 340 },
                          { month: 'May', connections: 18, posts: 25, views: 390 },
                          { month: 'Jun', connections: 22, posts: 28, views: 450 }
                        ].map((data, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2">
                            <span className="text-sm font-medium w-12">{data.month}</span>
                            <div className="flex-1 mx-4">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                      style={{ width: `${(data.connections / 25) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">Connections</span>
                                </div>
                                <div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                                      style={{ width: `${(data.posts / 30) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">Posts</span>
                                </div>
                                <div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                                      style={{ width: `${(data.views / 500) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">Views</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right w-16">
                              {data.views} views
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Domain Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Target className="h-4 w-4 mr-2" />
                        Domain Impact
                      </CardTitle>
                      <CardDescription>Your expertise contributions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {currentProfile.preferences.domains.map((domain, idx) => {
                          const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600']
                          const bgColors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100']
                          const performance = [92, 87, 83, 78, 74][idx] || 70
                          const helpCount = [15, 12, 8, 6, 4][idx] || 2
                          
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`h-3 w-3 rounded-full ${bgColors[idx % bgColors.length]}`} />
                                  <span className="text-sm font-medium">{domain}</span>
                                </div>
                                <span className={`text-xs font-medium ${colors[idx % colors.length]}`}>
                                  {performance}%
                                </span>
                              </div>
                              <Progress value={performance} className="h-2" />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{helpCount} help sessions</span>
                                <span>4.{8 + idx}/5 rating</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Network Growth & Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Users2 className="h-4 w-4 mr-2" />
                        Network Growth
                      </CardTitle>
                      <CardDescription>Your alumni network expansion</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">42</p>
                            <p className="text-xs text-muted-foreground">Total Connections</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">12</p>
                            <p className="text-xs text-muted-foreground">Active Chats</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">8</p>
                            <p className="text-xs text-muted-foreground">Mentoring</p>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Connection Rate</span>
                            <span className="text-sm font-medium text-green-600">85%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Response Time</span>
                            <span className="text-sm font-medium">2.3 hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Recommendation Score</span>
                            <span className="text-sm font-medium text-yellow-600">4.8/5</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Star className="h-4 w-4 mr-2" />
                        Insights & Recommendations
                      </CardTitle>
                      <CardDescription>Personalized growth suggestions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="flex items-start space-x-2">
                            <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">High Engagement</p>
                              <p className="text-xs text-blue-700">Your posts in Healthcare get 40% more views</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                          <div className="flex items-start space-x-2">
                            <Users className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-green-900">Network Opportunity</p>
                              <p className="text-xs text-green-700">15 new alumni joined in your domains this week</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                          <div className="flex items-start space-x-2">
                            <BookOpen className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">Knowledge Sharing</p>
                              <p className="text-xs text-purple-700">15 alumni seek guidance in your expertise areas</p>
                            </div>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full mt-4" 
                          onClick={() => navigate('/alumni-directory')}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Explore New Connections
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Conversations</CardTitle>
                    <CardDescription>Your active chat sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {conversations.map((conversation) => (
                          <div 
                            key={conversation.id} 
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => navigate('/chat')}
                          >
                            <div className="flex -space-x-2">
                              {conversation.participants.filter((p: any) => p.id !== currentProfile.userId).slice(0, 2).map((participant: any) => (
                                <Avatar key={participant.id} className="h-10 w-10 border-2 border-background">
                                  <AvatarImage src={participant.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {participant.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(conversation.updatedAt)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage?.content}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="mt-4 text-center">
                      <Button variant="outline" onClick={() => navigate('/chat')}>
                        View All Messages
                        <MessageSquare className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
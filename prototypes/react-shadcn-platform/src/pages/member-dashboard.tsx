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
  Bell, 
  MessageSquare, 
  Search, 
  Plus,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  TrendingUp,
  Users,
  Users2,
  Star,
  Filter,
  Settings,
  LogOut,
  Home,
  FileText,
  Eye,
  ChevronRight,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Activity,
  UserPlus,
  ArrowUpRight,
  BarChart3,
  Target,
  Sparkles,
  Globe
} from 'lucide-react'
import { type UserProfile } from '@/lib/mock-data/auth'
import { getDashboardStats, mockPostings, getNotificationsByUser, getConversationsByUser } from '@/lib/mock-data'

export default function MemberDashboard() {
  const navigate = useNavigate()
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

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
      setNotifications(userNotifications.slice(0, 5))
      
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

  const getPersonalizedPosts = () => {
    if (!currentProfile) return []
    
    return mockPostings.filter(post => 
      post.status === 'active' &&
      currentProfile.preferences.domains.some(domain => 
        post.category === domain || post.subcategory === domain
      )
    ).slice(0, 6)
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
      'Computer Science': Globe,
      'Arts & Crafts': Sparkles,
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
      {/* Enhanced Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">Gita Alumni Connect</h1>
                  <p className="text-xs text-muted-foreground">Member Portal</p>
                </div>
              </div>
            </div>
            
            {/* Navigation and Actions */}
            <div className="flex items-center space-x-4">
              {/* Quick Search */}
              <div className="hidden lg:flex items-center">
                <Button variant="outline" size="sm" className="text-muted-foreground">
                  <Search className="h-4 w-4 mr-2" />
                  Search alumni...
                </Button>
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {stats.notifications.unread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {stats.notifications.unread}
                  </span>
                )}
              </Button>
              
              {/* Messages */}
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-5 w-5" />
                {stats.chat.totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-medium">
                    {stats.chat.totalUnread}
                  </span>
                )}
              </Button>

              <Separator orientation="vertical" className="h-8" />
              
              {/* Profile Section */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">{currentProfile.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{currentProfile.preferences.professionalStatus || 'member'} • {currentProfile.role}</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={currentProfile.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {currentProfile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={handleSwitchProfile}>
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Hero Welcome Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">
                    Welcome back, {currentProfile.name.split(' ')[0]}!
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Connect, collaborate, and grow with the Gita alumni community
                  </p>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Connections</p>
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +3 this week
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Help Provided</p>
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-xs text-blue-600 flex items-center mt-1">
                        <Star className="h-3 w-3 mr-1" />
                        4.8 rating
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Profile Views</p>
                      <p className="text-2xl font-bold">45</p>
                      <p className="text-xs text-purple-600 flex items-center mt-1">
                        <Eye className="h-3 w-3 mr-1" />
                        +12% growth
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
                      <p className="text-2xl font-bold">92%</p>
                      <Progress value={92} className="h-2 mt-2" />
                    </div>
                  </div>

                  {/* Current Mode Indicator */}
                  <div className="flex items-center space-x-4">
                    <Badge variant="default" className="py-1.5 px-3">
                      {currentProfile.preferences.supportMode === 'offer' ? (
                        <>
                          <Users2 className="h-4 w-4 mr-2" />
                          Offering Support
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-4 w-4 mr-2" />
                          Seeking Support
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline" className="py-1.5 px-3">
                      {currentProfile.preferences.professionalStatus === 'student' ? (
                        <>
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Student
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-4 w-4 mr-2" />
                          Professional
                        </>
                      )}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/preferences')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Update Preferences
                    </Button>
                  </div>
                </div>

                {/* Quick Stats Visual */}
                <div className="hidden xl:block ml-8">
                  <div className="relative h-32 w-32">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
                    <div className="absolute inset-2 bg-primary/30 rounded-full animate-pulse animation-delay-200"></div>
                    <div className="absolute inset-4 bg-primary/40 rounded-full animate-pulse animation-delay-400"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{totalEngagement}</p>
                        <p className="text-xs text-muted-foreground">Total Reach</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Quick Actions & Domains */}
          <div className="col-span-3 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start group" 
                  variant="default"
                  onClick={() => navigate('/alumni-directory')}
                >
                  <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Alumni Directory
                  <Badge variant="secondary" className="ml-auto">
                    New
                  </Badge>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group"
                  onClick={() => navigate('/mentorship')}
                >
                  <GraduationCap className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Mentorship Platform
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group"
                  onClick={() => navigate('/browse-postings')}
                >
                  <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Browse Requests
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group"
                  onClick={() => navigate('/create-posting')}
                >
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  Create Posting
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group"
                  onClick={() => navigate('/chat')}
                >
                  <MessageSquare className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Start Chat
                  {stats.chat.totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.chat.totalUnread}
                    </Badge>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start group"
                  onClick={() => navigate('/express-interest')}
                >
                  <Star className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                  Express Interest
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
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`${getCategoryColor(domain)}`}>
                          {getDomainIcon(domain)}
                        </div>
                        <span className="text-sm font-medium">{domain}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
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
                  <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                    <span className="text-sm">Review responses</span>
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30">
                      3
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <span className="text-sm">Complete profile</span>
                    <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30">
                      85%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <span className="text-sm">Rate helpers</span>
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
                      2
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Tabs */}
          <div className="col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Feed
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {personalizedPosts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="connections" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Network
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2 relative">
                  <MessageCircle className="h-4 w-4" />
                  Messages
                  {stats.chat.totalUnread > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                      {stats.chat.totalUnread}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Activity</CardTitle>
                      <CardDescription>Your latest interactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {notifications.slice(0, 3).map((notification) => (
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
                      <Button variant="link" className="w-full mt-3 text-xs">
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
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {person.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
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
                              <Button size="sm" variant="ghost">
                                Connect
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="link" className="w-full mt-3 text-xs">
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
                    <div className="grid grid-cols-3 gap-4">
                      {personalizedPosts.slice(0, 3).map((post) => (
                        <div 
                          key={post.id} 
                          className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
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
                  {personalizedPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-all duration-200">
                      <CardContent className="p-6">
                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10 border-2 border-primary/10">
                              <AvatarImage src={post.authorAvatar} />
                              <AvatarFallback>
                                {post.authorName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold">{post.authorName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {'Alumni'}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(post.createdAt)}</span>
                                <span>•</span>
                                <MapPin className="h-3 w-3" />
                                <span>{post.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={post.type === 'offer' ? 'default' : 'secondary'}
                              className="flex items-center space-x-1"
                            >
                              {post.type === 'offer' ? (
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
                            {false && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold mb-2">{post.title}</h4>
                          <p className="text-muted-foreground mb-3">
                            {post.description}
                          </p>
                          
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
                              <span>Expires in 5 days</span>
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
                            <Button size="sm" className="font-medium">
                              {post.type === 'offer' ? (
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
                  ))}
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
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Find Alumni
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Impact Analytics</CardTitle>
                    <CardDescription>Track your engagement and contribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium mb-4">Engagement Trend</h4>
                        <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-4">Top Domains</h4>
                        <div className="space-y-2">
                          {currentProfile.preferences.domains.slice(0, 3).map((domain, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="text-sm">{domain}</span>
                              <Progress value={80 - idx * 20} className="w-24 h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
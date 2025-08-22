import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Heart,
  Share2,
  Clock,
  Target,
  Award,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageIntroduction } from '@/components/ui/page-introduction'
import { moduleFeatures } from '@/lib/module-features'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

interface AnalyticsMetric {
  id: string
  title: string
  value: string | number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  period: string
  icon: any
  color: string
}

interface CategoryBreakdown {
  category: string
  count: number
  percentage: number
  change: number
  color: string
}

interface UserEngagement {
  userId: string
  name: string
  avatar?: string
  domain: string
  postsCreated: number
  commentsPosted: number
  likesReceived: number
  responseRate: number
  lastActive: string
}

interface SuccessMetric {
  id: string
  title: string
  description: string
  current: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  color: string
}

const mockMetrics: AnalyticsMetric[] = [
  {
    id: 'total_users',
    title: 'Total Users',
    value: 2847,
    change: 12.5,
    changeType: 'increase',
    period: 'vs last month',
    icon: Users,
    color: 'text-blue-500'
  },
  {
    id: 'active_postings',
    title: 'Active Postings',
    value: 1254,
    change: -3.2,
    changeType: 'decrease',
    period: 'vs last week',
    icon: FileText,
    color: 'text-green-500'
  },
  {
    id: 'total_interactions',
    title: 'Total Interactions',
    value: '45.8K',
    change: 18.7,
    changeType: 'increase',
    period: 'vs last month',
    icon: MessageSquare,
    color: 'text-purple-500'
  },
  {
    id: 'success_rate',
    title: 'Connection Success',
    value: '78%',
    change: 5.4,
    changeType: 'increase',
    period: 'vs last quarter',
    icon: Target,
    color: 'text-orange-500'
  },
  {
    id: 'avg_response_time',
    title: 'Avg Response Time',
    value: '2.4h',
    change: -15.3,
    changeType: 'increase',
    period: 'vs last week',
    icon: Clock,
    color: 'text-red-500'
  },
  {
    id: 'platform_growth',
    title: 'Platform Growth',
    value: '24.3%',
    change: 8.1,
    changeType: 'increase',
    period: 'monthly rate',
    icon: TrendingUp,
    color: 'text-emerald-500'
  }
]

const mockCategoryBreakdown: CategoryBreakdown[] = [
  { category: 'Healthcare', count: 485, percentage: 38.7, change: 12.3, color: 'bg-blue-500' },
  { category: 'Engineering', count: 342, percentage: 27.3, change: -2.1, color: 'bg-green-500' },
  { category: 'Arts & Design', count: 187, percentage: 14.9, change: 24.5, color: 'bg-purple-500' },
  { category: 'Business', count: 124, percentage: 9.9, change: 5.7, color: 'bg-orange-500' },
  { category: 'Education', count: 89, percentage: 7.1, change: -8.2, color: 'bg-red-500' },
  { category: 'Technology', count: 27, percentage: 2.1, change: 45.8, color: 'bg-emerald-500' }
]

const mockTopUsers: UserEngagement[] = [
  {
    userId: 'user-1',
    name: 'Dr. Sarah Chen',
    avatar: '/avatars/sarah.jpg',
    domain: 'Healthcare',
    postsCreated: 47,
    commentsPosted: 156,
    likesReceived: 892,
    responseRate: 94.5,
    lastActive: '2 hours ago'
  },
  {
    userId: 'user-2',
    name: 'Prof. Michael Kumar',
    avatar: '/avatars/michael.jpg',
    domain: 'Engineering',
    postsCreated: 32,
    commentsPosted: 98,
    likesReceived: 634,
    responseRate: 87.3,
    lastActive: '4 hours ago'
  },
  {
    userId: 'user-3',
    name: 'Priya Sharma',
    avatar: '/avatars/priya.jpg',
    domain: 'Arts & Design',
    postsCreated: 28,
    commentsPosted: 142,
    likesReceived: 567,
    responseRate: 91.2,
    lastActive: '1 hour ago'
  },
  {
    userId: 'user-4',
    name: 'Dr. Amit Patel',
    avatar: '/avatars/amit.jpg',
    domain: 'Healthcare',
    postsCreated: 23,
    commentsPosted: 78,
    likesReceived: 445,
    responseRate: 83.7,
    lastActive: '6 hours ago'
  },
  {
    userId: 'user-5',
    name: 'Ravi Singh',
    avatar: '/avatars/ravi.jpg',
    domain: 'Business',
    postsCreated: 19,
    commentsPosted: 65,
    likesReceived: 378,
    responseRate: 76.4,
    lastActive: '12 hours ago'
  }
]

const mockSuccessMetrics: SuccessMetric[] = [
  {
    id: 'help_resolution',
    title: 'Help Request Resolution',
    description: 'Percentage of help requests that receive satisfactory responses',
    current: 84,
    target: 90,
    unit: '%',
    trend: 'up',
    color: 'bg-green-500'
  },
  {
    id: 'connection_success',
    title: 'Connection Success Rate',
    description: 'Successful connections leading to meaningful collaborations',
    current: 78,
    target: 85,
    unit: '%',
    trend: 'up',
    color: 'bg-blue-500'
  },
  {
    id: 'user_satisfaction',
    title: 'User Satisfaction Score',
    description: 'Average satisfaction rating from platform feedback',
    current: 4.6,
    target: 5.0,
    unit: '/5',
    trend: 'stable',
    color: 'bg-purple-500'
  },
  {
    id: 'response_time',
    title: 'Average Response Time',
    description: 'Time from posting to first meaningful response',
    current: 2.4,
    target: 2.0,
    unit: 'hrs',
    trend: 'down',
    color: 'bg-orange-500'
  },
  {
    id: 'retention_rate',
    title: 'User Retention Rate',
    description: 'Percentage of users active after 3 months',
    current: 67,
    target: 75,
    unit: '%',
    trend: 'up',
    color: 'bg-emerald-500'
  },
  {
    id: 'quality_score',
    title: 'Content Quality Score',
    description: 'Average quality rating of posts and interactions',
    current: 4.2,
    target: 4.5,
    unit: '/5',
    trend: 'up',
    color: 'bg-pink-500'
  }
]

export default function AnalyticsDashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState('7d')

  const formatChange = (change: number, changeType: string) => {
    const sign = change >= 0 ? '+' : ''
    const color = changeType === 'increase' ? 'text-green-600' : 
                  changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
    
    return (
      <span className={`text-sm ${color} flex items-center`}>
        {changeType === 'increase' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
         changeType === 'decrease' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
        {sign}{Math.abs(change).toFixed(1)}%
      </span>
    )
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageIntroduction 
        title={moduleFeatures.analyticsDashboard.title}
        description={moduleFeatures.analyticsDashboard.description}
        features={moduleFeatures.analyticsDashboard.features}
      />
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
              <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
              <Badge variant="secondary">
                Real-time data
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setTimeRange('7d')}>
                    Last 7 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeRange('30d')}>
                    Last 30 days
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeRange('90d')}>
                    Last 90 days
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Export analytics data functionality
                  const data = {
                    timestamp: new Date().toISOString(),
                    metrics: 'sample analytics data'
                  }
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
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
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics, users, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="success">Success Metrics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockMetrics.map((metric) => {
                const IconComponent = metric.icon
                return (
                  <Card key={metric.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{metric.title}</p>
                          <p className="text-2xl font-bold">{metric.value}</p>
                          <div className="flex items-center mt-1">
                            {formatChange(metric.change, metric.changeType)}
                            <span className="text-xs text-muted-foreground ml-2">
                              {metric.period}
                            </span>
                          </div>
                        </div>
                        <div className={`${metric.color}`}>
                          <IconComponent className="h-8 w-8" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockCategoryBreakdown.map((category) => (
                      <div key={category.category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{category.category}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{category.count}</span>
                            <span className={`text-xs ${category.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {category.change >= 0 ? '+' : ''}{category.change.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={category.percentage} className="flex-1" />
                          <span className="text-sm text-muted-foreground w-12">
                            {category.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Peak Activity</span>
                      </div>
                      <span className="text-sm font-medium">2:00 PM - 4:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Most Active Day</span>
                      </div>
                      <span className="text-sm font-medium">Tuesday</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Top Domain</span>
                      </div>
                      <span className="text-sm font-medium">Healthcare</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Avg Session</span>
                      </div>
                      <span className="text-sm font-medium">12 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Response Rate</TableHead>
                      <TableHead>Last Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTopUsers.map((user, index) => (
                      <TableRow key={user.userId}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                                {index + 1}
                              </Badge>
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.domain}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{user.postsCreated}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span>{user.commentsPosted}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span>{user.likesReceived}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={user.responseRate} className="w-16" />
                            <span className="text-sm">{user.responseRate.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{user.lastActive}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="text-2xl font-bold">127.4K</p>
                      <p className="text-sm text-green-600">+12.3% this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Heart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Likes</p>
                      <p className="text-2xl font-bold">23.8K</p>
                      <p className="text-sm text-green-600">+8.7% this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Share2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Shares</p>
                      <p className="text-2xl font-bold">5.6K</p>
                      <p className="text-sm text-green-600">+15.2% this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Success Metrics Tab */}
          <TabsContent value="success" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockSuccessMetrics.map((metric) => (
                <Card key={metric.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-base">{metric.title}</span>
                      {getTrendIcon(metric.trend)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{metric.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Current</span>
                        <span className="text-lg font-bold">
                          {metric.current}{metric.unit}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Target</span>
                        <span className="text-sm text-muted-foreground">
                          {metric.target}{metric.unit}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <Progress 
                          value={(metric.current / metric.target) * 100} 
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0{metric.unit}</span>
                          <span>{metric.target}{metric.unit}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Badge 
                          variant={metric.current >= metric.target ? 'default' : 'secondary'}
                          className="w-full justify-center"
                        >
                          {metric.current >= metric.target ? (
                            <>
                              <Award className="h-3 w-3 mr-1" />
                              Target Achieved
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-1" />
                              {(((metric.target - metric.current) / metric.target) * 100).toFixed(1)}% to target
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Weekly Summary</h3>
                      <p className="text-sm text-muted-foreground">Platform activity overview</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">User Engagement</h3>
                      <p className="text-sm text-muted-foreground">Detailed user metrics</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Success Metrics</h3>
                      <p className="text-sm text-muted-foreground">Platform effectiveness</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <PieChart className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Domain Analysis</h3>
                      <p className="text-sm text-muted-foreground">Category breakdown</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Growth Analysis</h3>
                      <p className="text-sm text-muted-foreground">Platform growth trends</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <Activity className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Custom Report</h3>
                      <p className="text-sm text-muted-foreground">Build your own report</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Create Custom
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
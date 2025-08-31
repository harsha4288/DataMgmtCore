import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { 
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  TrendingUp,
  Users,
  Eye,
  Clock,
  MapPin,
  Activity,
} from 'lucide-react'

interface DashboardTabsProps {
  stats: any;
  personalizedPosts: any[];
  recentActivity: any[];
  recommendedConnections: any[];
  trendingPosts: any[];
  connections: any[];
  conversationPreviews: any[];
  profile: any;
}

export function DashboardTabs({ 
  stats, 
  personalizedPosts, 
  recentActivity, 
  recommendedConnections, 
  trendingPosts, 
  conversationPreviews 
}: DashboardTabsProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const formatTimeAgo = (date: Date | undefined) => {
    if (!date) return 'Unknown'
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return `${Math.floor(diffInHours / 168)}w ago`
  }

  return (
    <div className="flex-1">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="connections">Network</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('feed')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Activity className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 text-sm">
                          <p>{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recommended Connections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">People You May Know</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/alumni-directory')}>
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {recommendedConnections.slice(0, 4).map((person, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={person.avatar} />
                            <AvatarFallback>{person.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{person.name}</p>
                            <p className="text-xs text-muted-foreground">{person.title}</p>
                            <p className="text-xs text-muted-foreground">{person.mutualConnections} mutual connections</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Trending in Your Domains */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Trending in Your Domains
              </CardTitle>
              <CardDescription>
                Popular posts and discussions in your areas of expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendingPosts.slice(0, 4).map((post, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>{post.engagement?.views || 0} views</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium mb-1 line-clamp-2">{post.title}</h4>
                    <p className="text-xs text-muted-foreground">{post.author}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feed Tab */}
        <TabsContent value="feed" className="space-y-4">
          {personalizedPosts.map((post, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Post Header */}
                <div className="p-4 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={post.authorAvatar} />
                        <AvatarFallback>{post.author?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold">{post.author}</h4>
                          <Badge variant="secondary" className="text-xs">Alumni</Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{post.organization || 'Alumni'}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(new Date(post.createdAt))}</span>
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
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">More options</span>
                      •••
                    </Button>
                  </div>
                </div>

                {/* Post Image */}
                {post.image && (
                  <div className="relative">
                    <img 
                      src={post.image} 
                      alt="Post content" 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                      <div className="text-sm text-muted-foreground">
                        {post.content?.includes('<p>') ? (
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                          />
                        ) : (
                          <p>{post.content}</p>
                        )}
                      </div>
                    </div>

                    {/* Category & Tags */}
                    {(post.category || post.tags) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {post.category && (
                          <Badge variant="outline" className="text-xs">
                            {post.category}
                          </Badge>
                        )}
                        {post.tags?.map((tag: string, tagIndex: number) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Expiry Date if applicable */}
                    {post.deadline && (
                      <div className="flex items-center space-x-1 text-xs text-orange-600">
                        <Clock className="h-3 w-3" />
                        <span>Deadline: {new Date(post.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Engagement Section */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments?.length || 0}
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {post.engagement?.views || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Heart className="h-4 w-4 mr-2" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Comment
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Other tabs content would be similar extractions... */}
        <TabsContent value="connections">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your Network</h3>
            <p className="text-muted-foreground mb-4">Connect with fellow alumni and expand your professional network</p>
            <Button onClick={() => navigate('/alumni-directory')}>Browse Directory</Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profile Views</span>
                    <span className="font-medium">{stats.profile?.views || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Connection Requests</span>
                    <span className="font-medium">{stats.connections?.requests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Post Engagement</span>
                    <span className="font-medium">{stats.engagement?.total || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={75} className="mb-4" />
                <p className="text-sm text-muted-foreground">
                  Your network has grown by 15% this month
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages">
          <div className="grid grid-cols-1 gap-4">
            {conversationPreviews.map((conversation, index) => (
              <Card key={index} className="cursor-pointer hover:bg-accent/50" onClick={() => navigate('/chat')}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarImage src={conversation.avatar} />
                      <AvatarFallback>{conversation.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-medium">{conversation.name}</h4>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(conversation.timestamp)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{conversation.preview}</p>
                      {conversation.unread > 0 && (
                        <Badge className="mt-2" variant="destructive">{conversation.unread} new</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
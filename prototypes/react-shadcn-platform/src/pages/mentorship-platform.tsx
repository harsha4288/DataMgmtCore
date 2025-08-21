import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Star, 
  Calendar, 
  MessageSquare, 
  Search,
  UserCheck,
  Trophy,
  Target,
  CheckCircle
} from 'lucide-react'
import { mockMentors, getMentorshipStats } from '@/lib/mock-data/mentorship'

export default function MentorshipPlatform() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExpertise, setSelectedExpertise] = useState('')

  const stats = getMentorshipStats()

  const filteredMentors = mockMentors.filter(mentor => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mentor.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesExpertise = !selectedExpertise || mentor.expertise.includes(selectedExpertise)
    
    return matchesSearch && matchesExpertise
  })

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500'
      case 'limited': return 'bg-yellow-500'
      case 'unavailable': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const MentorCard = ({ mentor }: { mentor: typeof mockMentors[0] }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentor.avatar} alt={mentor.name} />
              <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{mentor.name}</h3>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
              <p className="text-xs text-muted-foreground">{mentor.company}</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${getAvailabilityColor(mentor.availability)}`} 
               title={`Availability: ${mentor.availability}`} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Expertise</h4>
          <div className="flex flex-wrap gap-1">
            {mentor.expertise.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {mentor.expertise.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{mentor.expertise.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2">
          <div>
            <div className="text-lg font-semibold">{mentor.totalMentees}</div>
            <div className="text-xs text-muted-foreground">Mentees</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-lg font-semibold">{mentor.rating}</span>
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{mentor.reviews}</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Response Time:</span>
            <span className="font-medium">{mentor.responseTime}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Languages:</span>
            <span className="font-medium">{mentor.languages.join(', ')}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Request Mentorship
          </Button>
          <Button size="sm" variant="outline">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // SessionCard component removed - replaced with chat-based mentorship

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Mentorship Platform</h1>
        <p className="text-muted-foreground">
          Connect with experienced mentors to accelerate your career growth and development.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mentors</p>
                <p className="text-2xl font-bold">{stats.totalMentors}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Mentors</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableMentors}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Conversations</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">
            <Search className="h-4 w-4 mr-2" />
            Discover Mentors
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            My Sessions
          </TabsTrigger>
          <TabsTrigger value="goals">
            <Target className="h-4 w-4 mr-2" />
            Goals & Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Find Your Ideal Mentor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentors by name or expertise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={selectedExpertise}
                  onChange={(e) => setSelectedExpertise(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">All Expertise Areas</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Career Growth">Career Growth</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Interview Prep">Interview Prep</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredMentors.length} of {mockMentors.length} mentors
          </div>

          {/* Top Mentors */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Rated Mentors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors
                .filter(mentor => mentor.rating >= 4.8)
                .map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </div>

          {/* All Mentors */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Available Mentors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors
                .filter(mentor => mentor.rating < 4.8)
                .map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          </div>

          {filteredMentors.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No mentors found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedExpertise('')
                  }} 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <div className="space-y-6">
            {/* Active Mentorship Conversations */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Mentorship Chats</h2>
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    mentor: 'Priya Sharma',
                    expertise: 'Career Transition',
                    topic: 'Setting goals and building leadership skills',
                    lastMessage: 'Great question about technical leadership! Let me share some frameworks...',
                    lastActivity: '2 hours ago',
                    status: 'active',
                    unreadCount: 2
                  },
                  {
                    id: 2,
                    mentor: 'Meera Reddy',
                    expertise: 'Technical Growth',
                    topic: 'Discussing transition to technical leadership',
                    lastMessage: 'The resources I mentioned yesterday should help with...',
                    lastActivity: '1 day ago',
                    status: 'active',
                    unreadCount: 0
                  },
                  {
                    id: 3,
                    mentor: 'Dr. Sarah Chen',
                    expertise: 'Healthcare Innovation',
                    topic: 'Healthcare technology career guidance',
                    lastMessage: 'You: Thank you for the insight on the industry trends!',
                    lastActivity: '3 days ago',
                    status: 'responded',
                    unreadCount: 1
                  }
                ].map((conversation) => (
                  <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                            {conversation.mentor.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-base">{conversation.mentor}</h3>
                              <div className="flex items-center space-x-2">
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="default" className="bg-blue-500 text-xs px-2 py-1">
                                    {conversation.unreadCount} new
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{conversation.lastActivity}</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Focus:</strong> {conversation.topic}
                            </p>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {conversation.lastMessage}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {conversation.expertise}
                              </Badge>
                              <Button size="sm" variant="default">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Continue Chat
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Request New Mentorship */}
            <Card className="border-dashed">
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Start New Mentorship</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with mentors through our chat-based mentorship program. Get guidance, share experiences, and grow together.
                </p>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Find Mentors
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Set Your Goals</h3>
              <p className="text-muted-foreground mb-4">
                Define your learning objectives and track your progress with mentors.
              </p>
              <Button>
                <Target className="h-4 w-4 mr-2" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
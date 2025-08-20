import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  UserCheck,
  Users,
  Calendar,
  Clock,
  Target,
  MessageSquare,
  Star,
  TrendingUp,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Filter,
  Search,
  Video,
  FileText,
  Heart,
  BarChart3,
  Sparkles,
  Trophy,
  Zap,
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { mockMentorshipData } from '@/lib/mock-data/mentorship'

interface Mentor {
  id: string
  name: string
  title: string
  company: string
  avatar?: string
  bio: string
  expertise: string[]
  mentees: number
  sessions: number
  rating: number
  availability: string
  responseTime: string
  isTopMentor?: boolean
}

export default function MentorshipPlatform() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('discover')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExpertise, setSelectedExpertise] = useState('')
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [mentorshipGoals, setMentorshipGoals] = useState('')

  // Mock current user's mentorship data
  const currentUserMentorship = {
    activeMentors: mockMentorshipData.mentors.slice(0, 2),
    pendingRequests: 1,
    completedSessions: 12,
    upcomingSessions: 3,
    goals: [
      { id: 1, title: 'Career transition to Product Management', progress: 65, mentor: 'Sarah Johnson' },
      { id: 2, title: 'Technical interview preparation', progress: 40, mentor: 'Mike Chen' }
    ],
    achievements: [
      { id: 1, title: 'First Milestone', description: 'Completed 5 mentorship sessions', icon: Trophy },
      { id: 2, title: 'Quick Learner', description: 'Achieved goals ahead of schedule', icon: Zap },
      { id: 3, title: 'Active Participant', description: 'Engaged in all sessions', icon: Star }
    ]
  }

  const handleMentorshipRequest = () => {
    if (!mentorshipGoals.trim()) {
      toast({
        title: "Goals Required",
        description: "Please describe your mentorship goals",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Request Sent",
      description: `Your mentorship request has been sent to ${selectedMentor?.name}`,
    })
    setRequestDialogOpen(false)
    setMentorshipGoals('')
    setSelectedMentor(null)
  }

  const MentorCard = ({ mentor }: { mentor: Mentor }) => (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={mentor.avatar} />
              <AvatarFallback>{mentor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{mentor.name}</CardTitle>
              <CardDescription>{mentor.title} at {mentor.company}</CardDescription>
            </div>
          </div>
          {mentor.isTopMentor && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
              <Trophy className="h-3 w-3 mr-1" />
              Top Mentor
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>
        
        {/* Expertise Areas */}
        <div>
          <p className="text-xs font-semibold mb-2">Areas of Expertise</p>
          <div className="flex flex-wrap gap-1">
            {mentor.expertise.slice(0, 3).map((skill: string) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {mentor.expertise.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{mentor.expertise.length - 3}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{mentor.mentees}</p>
            <p className="text-xs text-muted-foreground">Mentees</p>
          </div>
          <div>
            <p className="text-lg font-bold">{mentor.sessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <div className="flex items-center justify-center">
              <p className="text-lg font-bold">{mentor.rating}</p>
              <Star className="h-4 w-4 text-yellow-500 fill-current ml-0.5" />
            </div>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between">
          <Badge variant={mentor.availability === 'Available' ? 'default' : 'secondary'} className="gap-1">
            <div className={`w-2 h-2 rounded-full ${mentor.availability === 'Available' ? 'bg-green-500' : 'bg-orange-500'}`} />
            {mentor.availability}
          </Badge>
          <span className="text-xs text-muted-foreground">{mentor.responseTime}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={() => {
              setSelectedMentor(mentor)
              setRequestDialogOpen(true)
            }}
          >
            Request Mentorship
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/alumni-profile/${mentor.id}`)}
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ActiveMentorshipCard = ({ mentor }: { mentor: Mentor }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mentor.avatar} />
              <AvatarFallback>{mentor.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{mentor.name}</p>
              <p className="text-sm text-muted-foreground">{mentor.title}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next Session</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="font-medium">Feb 25, 2024 at 3:00 PM</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sessions Completed</span>
            <span className="font-medium">8 / 12</span>
          </div>
          <Progress value={67} className="h-2" />
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" className="flex-1">
            <Video className="h-4 w-4 mr-1" />
            Join Session
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-1" />
            Message
          </Button>
          <Button size="sm" variant="outline">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mentorship Platform</h1>
          <p className="text-muted-foreground">
            Connect with experienced professionals to accelerate your career growth
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Mentors</p>
                  <p className="text-2xl font-bold">{currentUserMentorship.activeMentors.length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                  <p className="text-2xl font-bold">{currentUserMentorship.upcomingSessions}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Sessions</p>
                  <p className="text-2xl font-bold">{currentUserMentorship.completedSessions}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Goals Progress</p>
                  <div className="flex items-center gap-2">
                    <Progress value={52} className="w-20" />
                    <span className="text-sm font-semibold">52%</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">
              <Search className="h-4 w-4 mr-2" />
              Discover Mentors
            </TabsTrigger>
            <TabsTrigger value="my-mentors">
              <Users className="h-4 w-4 mr-2" />
              My Mentors
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="h-4 w-4 mr-2" />
              Goals & Progress
            </TabsTrigger>
            <TabsTrigger value="resources">
              <BookOpen className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search mentors by name, skills, or expertise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Expertise Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Areas</SelectItem>
                      <SelectItem value="career">Career Development</SelectItem>
                      <SelectItem value="technical">Technical Skills</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="entrepreneurship">Entrepreneurship</SelectItem>
                      <SelectItem value="product">Product Management</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Featured Mentors */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Featured Mentors
                </h2>
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMentorshipData.mentors.filter((m: Mentor) => m.isTopMentor).map((mentor: Mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            </div>

            {/* All Mentors */}
            <div>
              <h2 className="text-xl font-semibold mb-4">All Available Mentors</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockMentorshipData.mentors.filter((m: Mentor) => !m.isTopMentor).map((mentor: Mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* My Mentors Tab */}
          <TabsContent value="my-mentors" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Active Mentorships */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Mentorships</h2>
                <div className="space-y-4">
                  {currentUserMentorship.activeMentors.map((mentor: Mentor) => (
                    <ActiveMentorshipCard key={mentor.id} mentor={mentor} />
                  ))}
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
                <Card>
                  <CardContent className="p-6">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Career Planning Session</p>
                            <p className="text-sm text-muted-foreground">with Sarah Johnson</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Feb 25, 3:00 PM
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                45 minutes
                              </span>
                            </div>
                            <Button size="sm" className="mt-2">Join Session</Button>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">Technical Interview Prep</p>
                            <p className="text-sm text-muted-foreground">with Mike Chen</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Feb 27, 5:00 PM
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                60 minutes
                              </span>
                            </div>
                            <Button size="sm" variant="outline" className="mt-2">Reschedule</Button>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pending Requests */}
            {currentUserMentorship.pendingRequests > 0 && (
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <div>
                        <p className="font-semibold">Pending Mentorship Requests</p>
                        <p className="text-sm text-muted-foreground">
                          You have {currentUserMentorship.pendingRequests} pending request(s)
                        </p>
                      </div>
                    </div>
                    <Button variant="outline">View Requests</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Current Goals */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Current Goals</h2>
                <div className="space-y-4">
                  {currentUserMentorship.goals.map(goal => (
                    <Card key={goal.id}>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{goal.title}</h3>
                              <p className="text-sm text-muted-foreground">Mentor: {goal.mentor}</p>
                            </div>
                            <Badge variant="outline">In Progress</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{goal.progress}%</span>
                            </div>
                            <Progress value={goal.progress} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Update Progress
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add New Goal */}
                <Card className="mt-4 border-dashed">
                  <CardContent className="p-6 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-2">Set a New Goal</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Define your learning objectives and track your progress
                    </p>
                    <Button>
                      <Target className="h-4 w-4 mr-2" />
                      Create New Goal
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Achievements */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Achievements</h2>
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {currentUserMentorship.achievements.map(achievement => (
                        <div key={achievement.id} className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                            <achievement.icon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
                      <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">Level 3</span>
                      </div>
                      <Progress value={65} className="mt-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Mentorship Guide</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Best practices for successful mentorship relationships
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        Read Guide <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Video Tutorials</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Learn from recorded mentorship sessions
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        Watch Videos <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Templates</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Goal setting and progress tracking templates
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        Download <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Community Forum</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Connect with other mentees and share experiences
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        Join Forum <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Success Stories</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Inspiring mentorship success stories
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        Read Stories <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Webinars</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upcoming and recorded webinar sessions
                      </p>
                      <Button variant="link" className="px-0 mt-2">
                        View Webinars <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mentorship Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            <DialogDescription>
              Send a mentorship request to {selectedMentor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goals">What are your mentorship goals?</Label>
              <Textarea
                id="goals"
                placeholder="Describe what you hope to achieve through this mentorship..."
                value={mentorshipGoals}
                onChange={(e) => setMentorshipGoals(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Preferred Duration</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month</SelectItem>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Meeting Frequency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMentorshipRequest}>
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockAlumniData } from '@/lib/mock-data/alumni'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft,
  MapPin, 
  Building2, 
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Github,
  Twitter,
  Calendar,
  Award,
  Briefcase,
  BookOpen,
  MessageSquare,
  UserCheck,
  Clock,
  TrendingUp,
  Target,
  CheckCircle,
  Star,
  Share2,
  MoreVertical,
  Heart,
  Send
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from '@/hooks/use-toast'

export default function AlumniProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Find the alumni member (in real app, this would be an API call)
  const member = mockAlumniData.find(m => m.id === id) || mockAlumniData[0]

  // Mock data for profile enrichment
  const achievements = [
    { id: 1, title: 'Dean\'s List', year: 2018, description: 'Academic Excellence Award' },
    { id: 2, title: 'Best Thesis Award', year: 2019, description: 'Computer Science Department' },
    { id: 3, title: 'Innovation Champion', year: 2023, description: 'Google Annual Awards' }
  ]

  const projects = [
    { 
      id: 1, 
      name: 'AI-Powered Healthcare Platform',
      role: 'Lead Developer',
      duration: '2022 - Present',
      description: 'Building ML models for early disease detection',
      technologies: ['Python', 'TensorFlow', 'AWS'],
      impact: '50K+ patients served'
    },
    { 
      id: 2, 
      name: 'Open Source Contribution - React',
      role: 'Contributor',
      duration: '2021 - 2023',
      description: 'Contributing to React core and documentation',
      technologies: ['JavaScript', 'React', 'Node.js'],
      impact: '15+ PRs merged'
    }
  ]

  const mentorshipStats = {
    mentees: 12,
    sessions: 45,
    rating: 4.8,
    expertise: ['Career Development', 'Technical Interview Prep', 'System Design'],
    availability: 'Available for new mentees'
  }

  const handleConnect = () => {
    toast({
      title: "Connection Request Sent",
      description: `Your request to connect with ${member.name} has been sent.`,
    })
  }

  const handleMessage = () => {
    navigate(`/chat?user=${member.id}`)
  }

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: isFollowing 
        ? `You've unfollowed ${member.name}` 
        : `You're now following ${member.name}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Back Navigation */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/alumni-directory')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Avatar and Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-3xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-2">
                  <Button onClick={handleConnect} size="sm">
                    <UserCheck className="h-4 w-4 mr-1" />
                    Connect
                  </Button>
                  <Button onClick={handleMessage} variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button 
                    onClick={handleFollow} 
                    variant={isFollowing ? "secondary" : "outline"} 
                    size="sm"
                  >
                    <Heart className={`h-4 w-4 mr-1 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold">{member.name}</h1>
                      <p className="text-xl text-muted-foreground">
                        {member.jobTitle} at {member.company}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="h-4 w-4 mr-2" />
                          Recommend
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Report Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {member.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {member.industry}
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      Class of {member.graduationYear}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Active {new Date(member.lastActive).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-muted-foreground">{member.bio}</p>

                {/* Skills */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map(skill => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Mentor Status */}
                {member.mentorStatus === 'available' && (
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-green-900 dark:text-green-100">
                            Available as Mentor
                          </span>
                        </div>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Request Mentorship
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone || '+1 (555) 123-4567'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href="#" className="text-primary hover:underline">
                      {member.website || 'portfolio.example.com'}
                    </a>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-3">
                    <Button variant="outline" size="icon">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Github className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Twitter className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profile Views</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">234</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Connections</span>
                    <span className="font-semibold">89</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Endorsements</span>
                    <span className="font-semibold">45</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Profile Strength</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-semibold">85%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          Shared an article: <span className="font-semibold">"The Future of AI in Healthcare"</span>
                        </p>
                        <p className="text-xs text-muted-foreground">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          Completed mentorship session with <span className="font-semibold">John Smith</span>
                        </p>
                        <p className="text-xs text-muted-foreground">5 days ago</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">
                          Joined the event: <span className="font-semibold">"Alumni Tech Meetup 2024"</span>
                        </p>
                        <p className="text-xs text-muted-foreground">1 week ago</p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Professional Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{member.jobTitle}</h3>
                        <p className="text-muted-foreground">{member.company}</p>
                        <p className="text-sm text-muted-foreground">2020 - Present</p>
                        <p className="mt-2 text-sm">
                          Leading the development of AI-powered healthcare solutions, managing a team of 15 engineers.
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {['Leadership', 'AI/ML', 'Healthcare Tech'].map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-secondary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Senior Software Engineer</h3>
                        <p className="text-muted-foreground">Microsoft</p>
                        <p className="text-sm text-muted-foreground">2018 - 2020</p>
                        <p className="mt-2 text-sm">
                          Worked on Azure cloud services, focusing on scalability and performance optimization.
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {['Azure', 'Cloud Computing', 'C#'].map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map(project => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription>{project.role} • {project.duration}</CardDescription>
                      </div>
                      <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map(tech => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">{project.impact}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mentorship Tab */}
          <TabsContent value="mentorship" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mentorship Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{mentorshipStats.mentees}</div>
                    <p className="text-sm text-muted-foreground">Total Mentees</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{mentorshipStats.sessions}</div>
                    <p className="text-sm text-muted-foreground">Sessions Conducted</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-3xl font-bold text-primary">{mentorshipStats.rating}</span>
                      <Star className="h-6 w-6 text-yellow-500 fill-current" />
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  <div className="text-center">
                    <Badge className="mb-2" variant="secondary">
                      {mentorshipStats.availability}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Current Status</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-3">Areas of Expertise</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {mentorshipStats.expertise.map(area => (
                      <div key={area} className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Button className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule a Mentorship Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Testimonials */}
            <Card>
              <CardHeader>
                <CardTitle>Mentee Testimonials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-primary pl-4">
                    <p className="text-sm italic">
                      "An incredible mentor who helped me navigate my career transition into tech. 
                      Their guidance was invaluable!"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">- Sarah Johnson, Software Engineer</p>
                  </div>
                  <div className="border-l-2 border-primary pl-4">
                    <p className="text-sm italic">
                      "Great at breaking down complex concepts and providing actionable advice. 
                      Highly recommend!"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">- Mike Chen, Product Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {achievements.map(achievement => (
                <Card key={achievement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                        <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.year}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle>Certifications & Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">AWS</Badge>
                      <span className="text-sm">AWS Certified Solutions Architect</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2023</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Google</Badge>
                      <span className="text-sm">Google Cloud Professional Developer</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2022</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">PMI</Badge>
                      <span className="text-sm">Project Management Professional (PMP)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2021</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
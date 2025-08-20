import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockAlumniData } from '@/lib/mock-data/alumni'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { 
  Search, 
  MapPin, 
  Building2, 
  GraduationCap,
  Users,
  UserCheck,
  Clock,
  Grid3x3,
  List,
  X,
  MessageSquare,
  Eye,
  Bookmark,
  Star,
  CheckCircle,
  Trophy,
  Activity,
  Shield
} from 'lucide-react'

// Enhanced mock data with engagement metrics
const enhancedAlumniData = mockAlumniData.map(member => ({
  ...member,
  isOnline: Math.random() > 0.6,
  lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  verified: Math.random() > 0.7,
  topMentor: Math.random() > 0.85,
  connectionsHelped: Math.floor(Math.random() * 50) + 5,
  rating: (Math.random() * 2 + 3).toFixed(1),
  responseTime: ['2 hours', '1 day', '12 hours', '3 hours'][Math.floor(Math.random() * 4)],
  responseRate: Math.floor(Math.random() * 30) + 70,
  profileViews: Math.floor(Math.random() * 200) + 50,
  endorsements: Math.floor(Math.random() * 20) + 3
}))

export default function AlumniDirectory() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMentorStatus, setSelectedMentorStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)

  // Get unique values for filters
  const industries = useMemo(() => 
    [...new Set(enhancedAlumniData.map(a => a.industry))].sort(),
    []
  )
  
  const graduationYears = useMemo(() => 
    [...new Set(enhancedAlumniData.map(a => a.graduationYear))].sort((a, b) => b - a),
    []
  )

  // Filter alumni based on search and filters
  const filteredAlumni = useMemo(() => {
    let filtered = enhancedAlumniData

    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.company.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedIndustry) {
      filtered = filtered.filter(a => a.industry === selectedIndustry)
    }

    if (selectedYear) {
      filtered = filtered.filter(a => a.graduationYear === parseInt(selectedYear))
    }

    if (selectedMentorStatus) {
      filtered = filtered.filter(a => a.mentorStatus === selectedMentorStatus)
    }

    if (showOnlineOnly) {
      filtered = filtered.filter(a => a.isOnline)
    }

    return filtered
  }, [searchQuery, selectedIndustry, selectedYear, selectedMentorStatus, showOnlineOnly])

  // Statistics with enhanced metrics
  const stats = useMemo(() => ({
    total: filteredAlumni.length,
    mentors: filteredAlumni.filter(a => a.mentorStatus === 'available').length,
    industries: [...new Set(filteredAlumni.map(a => a.industry))].length,
    onlineNow: filteredAlumni.filter(a => a.isOnline).length,
    verifiedMembers: filteredAlumni.filter(a => a.verified).length
  }), [filteredAlumni])

  // Active filters for display
  const activeFilters = useMemo(() => {
    const filters = []
    if (selectedIndustry) filters.push({ type: 'industry', value: selectedIndustry })
    if (selectedYear) filters.push({ type: 'year', value: `Class of ${selectedYear}` })
    if (selectedMentorStatus) filters.push({ type: 'mentor', value: 'Available Mentors' })
    if (showOnlineOnly) filters.push({ type: 'online', value: 'Online Now' })
    return filters
  }, [selectedIndustry, selectedYear, selectedMentorStatus, showOnlineOnly])

  const clearFilter = (filterType: string) => {
    switch(filterType) {
      case 'industry': setSelectedIndustry(''); break
      case 'year': setSelectedYear(''); break
      case 'mentor': setSelectedMentorStatus(''); break
      case 'online': setShowOnlineOnly(false); break
    }
  }

  const AlumniCard = ({ member }: { member: typeof enhancedAlumniData[0] }) => (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
      {/* Premium/Top Mentor Indicator */}
      {member.topMentor && (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400/20 to-transparent w-24 h-24 pointer-events-none" />
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar with status indicator */}
            <div className="relative">
              <Avatar className="h-12 w-12 ring-2 ring-background">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-background",
                member.isOnline ? "bg-green-500" : "bg-gray-400"
              )} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">{member.name}</CardTitle>
                {member.verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
                {member.topMentor && (
                  <Trophy className="h-4 w-4 text-yellow-500" />
                )}
              </div>
              <CardDescription className="text-sm">
                {member.jobTitle} at {member.company}
              </CardDescription>
              {/* Response time indicator */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>Usually responds in {member.responseTime}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Bio */}
        <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
        
        {/* Engagement Metrics */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{member.connectionsHelped}</div>
            <div className="text-xs text-muted-foreground">Helped</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-lg font-semibold text-green-600">{member.rating}</span>
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{member.responseRate}%</div>
            <div className="text-xs text-muted-foreground">Response</div>
          </div>
        </div>
        
        {/* Skills with better styling */}
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="secondary" className="text-xs bg-secondary/50">
              {skill}
            </Badge>
          ))}
          {member.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{member.skills.length - 3} more
            </Badge>
          )}
        </div>
        
        {/* Location and Graduation */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            <span>Class of {member.graduationYear}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{member.location}</span>
          </div>
        </div>
        
        {/* Mentor Badge */}
        {member.mentorStatus === 'available' && (
          <div className="flex items-center justify-center py-2">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
              <UserCheck className="h-3 w-3 mr-1" />
              Available for Mentorship
            </Badge>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1 group-hover:shadow-md transition-all"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Connect
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="group-hover:bg-secondary transition-colors"
            onClick={() => navigate(`/alumni-profile/${member.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="group-hover:bg-secondary transition-colors"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const AlumniListItem = ({ member }: { member: typeof enhancedAlumniData[0] }) => (
    <Card className="hover:shadow-lg transition-all duration-200 hover:bg-accent/50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          {/* Avatar with status */}
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
              member.isOnline ? "bg-green-500" : "bg-gray-400"
            )} />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{member.name}</span>
              {member.verified && (
                <CheckCircle className="h-3 w-3 text-blue-500" />
              )}
              {member.topMentor && (
                <Trophy className="h-3 w-3 text-yellow-500" />
              )}
              {member.mentorStatus === 'available' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Mentor
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {member.jobTitle} at {member.company} • {member.location}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {member.connectionsHelped} helped
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {member.rating}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {member.responseTime}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <div className="text-sm font-medium">{member.industry}</div>
            <div className="text-xs text-muted-foreground">Class of {member.graduationYear}</div>
          </div>
          <Button size="sm" variant="ghost" className="hover:bg-primary hover:text-primary-foreground">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            className="hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate(`/alumni-profile/${member.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Alumni Directory
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Connect with our global network of {enhancedAlumniData.length} verified alumni
            </p>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Alumni</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-20" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Available Mentors</p>
                  <p className="text-2xl font-bold text-green-600">{stats.mentors}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500 opacity-20" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Industries</p>
                  <p className="text-2xl font-bold">{stats.industries}</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500 opacity-20" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Online Now</p>
                  <p className="text-2xl font-bold text-green-600">{stats.onlineNow}</p>
                </div>
                <Activity className="h-8 w-8 text-green-500 opacity-20" />
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.verifiedMembers}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500 opacity-20" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, title, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
                  {industries.map(industry => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {graduationYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      Class of {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMentorStatus} onValueChange={setSelectedMentorStatus}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Members</SelectItem>
                  <SelectItem value="available">Available Mentors</SelectItem>
                  <SelectItem value="unavailable">Not Available</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showOnlineOnly ? "default" : "outline"}
                size="default"
                onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                className="whitespace-nowrap"
              >
                <Activity className="h-4 w-4 mr-2" />
                Online Only
              </Button>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {filter.value}
                    <button
                      onClick={() => clearFilter(filter.type)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedIndustry('')
                    setSelectedYear('')
                    setSelectedMentorStatus('')
                    setShowOnlineOnly(false)
                  }}
                  className="h-6 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAlumni.length} of {enhancedAlumniData.length} alumni
          </p>
          {filteredAlumni.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {stats.onlineNow} currently online
            </p>
          )}
        </div>

        {/* Alumni Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map(member => (
              <AlumniCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlumni.map(member => (
              <AlumniListItem key={member.id} member={member} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredAlumni.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-3">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">No alumni found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedIndustry('')
                  setSelectedYear('')
                  setSelectedMentorStatus('')
                  setShowOnlineOnly(false)
                }}
              >
                Clear filters
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
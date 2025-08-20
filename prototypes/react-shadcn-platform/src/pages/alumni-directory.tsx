import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockAlumniData, filterAlumni, type AlumniMember } from '@/lib/mock-data/alumni'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Search, 
  MapPin, 
  Building2, 
  GraduationCap,
  Users,
  Mail,
  UserCheck,
  Clock
} from 'lucide-react'

export default function AlumniDirectory() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedMentorStatus, setSelectedMentorStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Get unique values for filters
  const industries = useMemo(() => 
    [...new Set(mockAlumniData.map(a => a.industry))].sort(),
    []
  )
  
  const graduationYears = useMemo(() => 
    [...new Set(mockAlumniData.map(a => a.graduationYear))].sort((a, b) => b - a),
    []
  )

  // Filter alumni based on search and filters
  const filteredAlumni = useMemo(() => {
    return filterAlumni({
      name: searchQuery,
      industry: selectedIndustry,
      graduationYear: selectedYear ? parseInt(selectedYear) : undefined,
      mentorStatus: selectedMentorStatus
    })
  }, [searchQuery, selectedIndustry, selectedYear, selectedMentorStatus])

  // Statistics
  const stats = useMemo(() => ({
    total: filteredAlumni.length,
    mentors: filteredAlumni.filter(a => a.mentorStatus === 'available').length,
    industries: [...new Set(filteredAlumni.map(a => a.industry))].length,
    recentlyActive: filteredAlumni.filter(a => {
      const lastActive = new Date(a.lastActive)
      const daysSince = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length
  }), [filteredAlumni])

  const AlumniCard = ({ member }: { member: AlumniMember }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{member.name}</CardTitle>
              <CardDescription className="text-sm">
                {member.jobTitle} at {member.company}
              </CardDescription>
            </div>
          </div>
          {member.mentorStatus === 'available' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <UserCheck className="h-3 w-3 mr-1" />
              Mentor
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{member.bio}</p>
        
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map(skill => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {member.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{member.skills.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            <span>Class of {member.graduationYear}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{member.location}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Button size="sm" variant="default" className="flex-1">
            <Mail className="h-3 w-3 mr-1" />
            Connect
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/alumni-profile/${member.id}`)}
          >
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const AlumniListItem = ({ member }: { member: AlumniMember }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatar} />
            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{member.name}</span>
              {member.mentorStatus === 'available' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Mentor
                </Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {member.jobTitle} at {member.company} • {member.location}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right mr-4">
            <div className="text-sm font-medium">{member.industry}</div>
            <div className="text-xs text-muted-foreground">Class of {member.graduationYear}</div>
          </div>
          <Button size="sm" variant="ghost">
            <Mail className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate(`/alumni-profile/${member.id}`)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold">Alumni Directory</h1>
            <p className="text-muted-foreground">
              Connect with our global network of {mockAlumniData.length} alumni
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alumni</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Available Mentors</p>
                  <p className="text-2xl font-bold">{stats.mentors}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Industries</p>
                  <p className="text-2xl font-bold">{stats.industries}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Recently Active</p>
                  <p className="text-2xl font-bold">{stats.recentlyActive}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, company, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Industry" />
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
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Graduation Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Years</SelectItem>
                    {graduationYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedMentorStatus} onValueChange={setSelectedMentorStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Mentor Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Members</SelectItem>
                    <SelectItem value="available">Available Mentors</SelectItem>
                    <SelectItem value="busy">Busy Mentors</SelectItem>
                    <SelectItem value="unavailable">Not Mentoring</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                    </svg>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
            
            {(searchQuery || selectedIndustry || selectedYear || selectedMentorStatus) && (
              <div className="flex items-center gap-2 mt-3">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1">×</button>
                  </Badge>
                )}
                {selectedIndustry && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedIndustry}
                    <button onClick={() => setSelectedIndustry('')} className="ml-1">×</button>
                  </Badge>
                )}
                {selectedYear && (
                  <Badge variant="secondary" className="gap-1">
                    Class of {selectedYear}
                    <button onClick={() => setSelectedYear('')} className="ml-1">×</button>
                  </Badge>
                )}
                {selectedMentorStatus && (
                  <Badge variant="secondary" className="gap-1">
                    {selectedMentorStatus === 'available' ? 'Available Mentors' : 
                     selectedMentorStatus === 'busy' ? 'Busy Mentors' : 'Not Mentoring'}
                    <button onClick={() => setSelectedMentorStatus('')} className="ml-1">×</button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedIndustry('')
                    setSelectedYear('')
                    setSelectedMentorStatus('')
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alumni Grid/List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAlumni.length} of {mockAlumniData.length} alumni
            </p>
          </div>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAlumni.map(member => (
                <AlumniCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlumni.map(member => (
                <AlumniListItem key={member.id} member={member} />
              ))}
            </div>
          )}
          
          {filteredAlumni.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No alumni found</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Try adjusting your search or filters to find more alumni
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
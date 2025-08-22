import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MapPin, Briefcase, Calendar, Mail, ExternalLink, ArrowLeft } from 'lucide-react'
import { mockAlumniData, AlumniMember, filterAlumni } from '@/lib/mock-data/alumni'
import { PageIntroduction } from '@/components/ui/page-introduction'
import { moduleFeatures } from '@/lib/module-features'

export default function AlumniDirectory() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')

  const industries = useMemo(() => {
    const allIndustries = mockAlumniData.map(member => member.industry)
    return [...new Set(allIndustries)].sort()
  }, [])

  const graduationYears = useMemo(() => {
    const allYears = mockAlumniData.map(member => member.graduationYear)
    return [...new Set(allYears)].sort((a, b) => b - a)
  }, [])

  const filteredAlumni = useMemo(() => {
    return filterAlumni({
      name: searchTerm,
      industry: selectedIndustry || undefined,
      graduationYear: selectedYear ? parseInt(selectedYear) : undefined
    })
  }, [searchTerm, selectedIndustry, selectedYear])

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedIndustry('')
    setSelectedYear('')
  }

  const getMentorStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'unavailable': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <PageIntroduction 
        title={moduleFeatures.alumniDirectory.title}
        description={moduleFeatures.alumniDirectory.description}
        features={moduleFeatures.alumniDirectory.features}
      />
      
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/member-dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Alumni Directory</h1>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">All Years</option>
              {graduationYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full min-h-[44px] text-sm"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAlumni.length} of {mockAlumniData.length} alumni
      </div>

      {/* Alumni Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredAlumni.map((member: AlumniMember) => (
          <Card key={member.id} className="h-full hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 
                      className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/alumni-profile/${member.id}`)}
                    >
                      {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{member.jobTitle}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${getMentorStatusColor(member.mentorStatus)}`} 
                     title={`Mentor Status: ${member.mentorStatus}`} />
              </div>
            </CardHeader>

            <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{member.company}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{member.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Class of {member.graduationYear}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {member.bio}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {member.skills.slice(0, 4).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {member.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{member.skills.length - 4}
                    </Badge>
                  )}
                </div>
              </div>

              {member.achievements && member.achievements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Achievements</h4>
                  <div className="space-y-1">
                    {member.achievements.slice(0, 2).map((achievement, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        • {achievement}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 min-h-[44px] text-sm"
                  onClick={() => navigate('/chat', { state: { recipient: member } })}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">Contact</span>
                </Button>
                {member.linkedIn && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="min-h-[44px] min-w-[44px]"
                    onClick={() => window.open(member.linkedIn, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No alumni found matching your criteria.</p>
            <Button variant="outline" onClick={clearFilters} className="mt-4 min-h-[44px]">
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
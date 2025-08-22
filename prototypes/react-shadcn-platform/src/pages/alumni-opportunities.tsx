import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OpportunityCard } from "@/components/opportunities/opportunity-card"
import { 
  mockAlumniOpportunities, 
  filterOpportunities, 
  getOpportunityStats,
  getPopularTags
} from "@/lib/mock-data/alumni-opportunities"
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MapPin, 
  Briefcase,
  Users,
  Star,
  TrendingUp,
  X,
  ArrowLeft
} from "lucide-react"
import { PageIntroduction } from '@/components/ui/page-introduction'
import { moduleFeatures } from '@/lib/module-features'

export const AlumniOpportunities: React.FC = () => {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all')
  const [selectedExperience, setSelectedExperience] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [favoritedOpportunities, setFavoritedOpportunities] = useState<Set<string>>(new Set())

  const stats = getOpportunityStats()
  const popularTags = getPopularTags()
  const industries = [...new Set(mockAlumniOpportunities.map(o => o.industryCategory))].sort()
  const locations = [...new Set(mockAlumniOpportunities.map(o => o.location))].sort()

  const filteredOpportunities = useMemo(() => {
    let filtered = mockAlumniOpportunities

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(query) ||
        opp.description.toLowerCase().includes(query) ||
        opp.company?.toLowerCase().includes(query) ||
        opp.organization?.toLowerCase().includes(query) ||
        opp.institution?.toLowerCase().includes(query) ||
        opp.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply filters
    const filters: any = {}
    if (selectedType !== 'all') filters.type = selectedType
    if (selectedIndustry !== 'all') filters.industryCategory = selectedIndustry
    if (selectedExperience !== 'all') filters.experienceLevel = selectedExperience
    if (selectedLocation !== 'all') filters.location = selectedLocation
    if (remoteOnly) filters.remote = true
    if (selectedTags.length > 0) filters.tags = selectedTags

    filtered = filterOpportunities(filters).filter(opp => filtered.includes(opp))

    return filtered.sort((a, b) => {
      // Priority sorting: sponsored > priority > verified > recent
      if (a.isSponsored && !b.isSponsored) return -1
      if (!a.isSponsored && b.isSponsored) return 1
      if (a.isPriority && !b.isPriority) return -1
      if (!a.isPriority && b.isPriority) return 1
      if (a.isVerified && !b.isVerified) return -1
      if (!a.isVerified && b.isVerified) return 1
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    })
  }, [searchQuery, selectedType, selectedIndustry, selectedExperience, selectedLocation, selectedTags, remoteOnly])

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleFavorite = (id: string) => {
    setFavoritedOpportunities(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedType('all')
    setSelectedIndustry('all')
    setSelectedExperience('all')
    setSelectedLocation('all')
    setSelectedTags([])
    setRemoteOnly(false)
  }

  const activeFiltersCount = [
    selectedType !== 'all',
    selectedIndustry !== 'all',
    selectedExperience !== 'all',
    selectedLocation !== 'all',
    selectedTags.length > 0,
    remoteOnly
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <PageIntroduction 
            title={moduleFeatures.alumniOpportunities.title}
            description={moduleFeatures.alumniOpportunities.description}
            features={moduleFeatures.alumniOpportunities.features}
          />
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate('/member-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alumni Opportunities</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                    <p className="text-sm text-gray-600">Active Opportunities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.sponsored}</p>
                    <p className="text-sm text-gray-600">Sponsored Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.remote}</p>
                    <p className="text-sm text-gray-600">Remote Opportunities</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{filteredOpportunities.length}</p>
                    <p className="text-sm text-gray-600">Matching Results</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-80 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary">{activeFiltersCount}</Badge>
                    )}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Search */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Search opportunities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <Tabs value={selectedType} onValueChange={setSelectedType}>
                    <TabsList className="grid grid-cols-3 w-full mb-4">
                      <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                      <TabsTrigger value="job" className="text-xs">Jobs</TabsTrigger>
                      <TabsTrigger value="internship" className="text-xs">Internships</TabsTrigger>
                    </TabsList>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="scholarship" className="text-xs">Scholarships</TabsTrigger>
                      <TabsTrigger value="college" className="text-xs">Admissions</TabsTrigger>
                      <TabsTrigger value="mentorship" className="text-xs">Mentorship</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Detailed Filters */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Industry</label>
                    <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Industries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Industries</SelectItem>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Experience Level</label>
                    <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remote-only"
                      checked={remoteOnly}
                      onChange={(e) => setRemoteOnly(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="remote-only" className="text-sm font-medium text-gray-700">
                      Remote Only
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 15).map(({ tag, count }) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-blue-100 hover:text-blue-800"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Selected Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleTagToggle(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Opportunities Found</h3>
                  <p className="text-gray-500 mb-4">
                    Try adjusting your filters or search terms to find more opportunities.
                  </p>
                  <Button onClick={clearAllFilters}>Clear All Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-6"
              }>
                {filteredOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onApply={(id) => console.log('Apply to:', id)}
                    onFavorite={handleFavorite}
                    onComment={(id) => console.log('Comment on:', id)}
                    isFavorited={favoritedOpportunities.has(opportunity.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
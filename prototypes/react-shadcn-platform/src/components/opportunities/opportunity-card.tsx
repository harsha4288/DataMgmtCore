import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MapPin, 
  Eye, 
  Heart, 
  Users, 
  Verified,
  Star,
  Calendar,
  DollarSign
} from "lucide-react"
import { AlumniOpportunity } from "@/lib/mock-data/alumni-opportunities"
import { formatDistanceToNow } from "date-fns"

interface OpportunityCardProps {
  opportunity: AlumniOpportunity
  onApply?: (_id: string) => void
  onFavorite?: (_id: string) => void
  onComment?: (_id: string) => void
  isFavorited?: boolean
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onApply,
  onFavorite,
  onComment,
  isFavorited = false
}) => {
  const getTypeColor = (type: string) => {
    const colors = {
      internship: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      scholarship: 'bg-green-100 text-green-800 hover:bg-green-200',
      college: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      job: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      mentorship: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      networking: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getExperienceLevelColor = (level: string) => {
    const colors = {
      entry: 'bg-green-50 text-green-700 border-green-200',
      mid: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      senior: 'bg-red-50 text-red-700 border-red-200',
      any: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const formatSalary = (salaryRange?: { min: number; max: number; currency: string }) => {
    if (!salaryRange) return null
    const { min, max } = salaryRange
    
    if (min < 1000) {
      return `$${min}-${max}/hr`
    }
    return `$${(min/1000).toFixed(0)}k-${(max/1000).toFixed(0)}k`
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 overflow-hidden">
      {/* Image Header */}
      {opportunity.image && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={opportunity.image} 
            alt={opportunity.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            {opportunity.isSponsored && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600">
                <Star className="w-3 h-3 mr-1" />
                Sponsored
              </Badge>
            )}
            {opportunity.isPriority && (
              <Badge className="bg-red-500 hover:bg-red-600">
                Priority
              </Badge>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white ${
                isFavorited ? 'text-red-500' : 'text-gray-600'
              }`}
              onClick={() => onFavorite?.(opportunity.id)}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getTypeColor(opportunity.type)}>
                {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
              </Badge>
              {opportunity.isVerified && (
                <Verified className="w-4 h-4 text-blue-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {opportunity.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {opportunity.company || opportunity.organization || opportunity.institution}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-gray-700 line-clamp-3 mb-4">
          {opportunity.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {opportunity.tags.slice(0, 4).map((tag, index) => (
            <Badge 
              key={index}
              variant="outline" 
              className="text-xs px-2 py-1 bg-gray-50 hover:bg-gray-100"
            >
              {tag}
            </Badge>
          ))}
          {opportunity.tags.length > 4 && (
            <Badge variant="outline" className="text-xs px-2 py-1 bg-gray-50">
              +{opportunity.tags.length - 4} more
            </Badge>
          )}
        </div>

        {/* Key Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{opportunity.location}</span>
            {opportunity.remote && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Remote
              </Badge>
            )}
          </div>
          
          {opportunity.salaryRange && (
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>{formatSalary(opportunity.salaryRange)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-gray-600">
            <Badge className={getExperienceLevelColor(opportunity.experienceLevel)}>
              {opportunity.experienceLevel.charAt(0).toUpperCase() + opportunity.experienceLevel.slice(1)} Level
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {opportunity.careerStage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          {opportunity.applicationDeadline && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Apply by {new Date(opportunity.applicationDeadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{opportunity.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{opportunity.applications}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{opportunity.favorites}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex-col gap-3">
        {/* Posted By */}
        <div className="flex items-center justify-between w-full text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={opportunity.postedBy.avatar} />
              <AvatarFallback className="text-xs">
                {opportunity.postedBy.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-gray-600">Posted by </span>
              <span className="font-medium text-gray-900">{opportunity.postedBy.name}</span>
            </div>
          </div>
          <span className="text-gray-500">
            {formatDistanceToNow(new Date(opportunity.postedDate), { addSuffix: true })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
          <Button 
            onClick={() => onApply?.(opportunity.id)}
            className="flex-1"
            disabled={opportunity.status !== 'active'}
          >
            {opportunity.type === 'networking' ? 'Register' : 'Apply Now'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onComment?.(opportunity.id)}
          >
            Comments
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
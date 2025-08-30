import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  TrendingUp,
  Users,
  Star,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react'

interface WelcomeHeroSectionProps {
  profile: any;
  stats: any;
  totalEngagement: number;
}

export function WelcomeHeroSection({ profile, stats, totalEngagement }: WelcomeHeroSectionProps) {
  const navigate = useNavigate()
  const [currentTime] = useState(new Date())

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Top Row - Welcome & Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-3xl font-bold mb-2">
              {getGreeting()}, {profile.name.split(' ')[0]}! 
            </h2>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Status Badges */}
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Active Member
              </Badge>
              {stats.profile?.completeness && stats.profile.completeness > 80 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Profile Complete
                </Badge>
              )}
              {stats.connections?.mentoring?.active && stats.connections.mentoring.active > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Mentor
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground max-w-2xl">
              Welcome back to your alumni network. Stay connected, discover opportunities, and grow your professional network.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/create-posting')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Share Update
            </Button>
            <Button variant="outline" onClick={() => navigate('/alumni-directory')}>
              <Users className="h-4 w-4 mr-2" />
              Find Alumni
            </Button>
          </div>

          {/* Animated Visual */}
          <div className="hidden xl:block">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Activity className="h-16 w-16 text-primary animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Connections</p>
                  <p className="text-2xl font-bold text-primary">{stats.connections?.total || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement</p>
                  <p className="text-2xl font-bold text-primary">{totalEngagement}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Opportunities</p>
                  <p className="text-2xl font-bold text-primary">{stats.opportunities?.active || 0}</p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Actions</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.notifications?.actionRequired || 0}</p>
                </div>
                {(stats.notifications?.actionRequired || 0) > 0 ? (
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
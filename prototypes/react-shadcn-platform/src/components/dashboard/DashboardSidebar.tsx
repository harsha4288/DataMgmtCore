import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity,
  Users,
  GraduationCap,
  Search,
  Plus,
  MessageSquare,
  Star,
  Target,
  AlertCircle,
  Heart,
  Settings,
  Briefcase,
  HelpCircle,
  ArrowUpRight
} from 'lucide-react'
import { type UserProfile } from '@/lib/mock-data/auth'

interface DashboardSidebarProps {
  currentProfile: UserProfile
  stats: {
    chat: { totalUnread: number }
  }
}

export function DashboardSidebar({ currentProfile, stats }: DashboardSidebarProps) {
  const navigate = useNavigate()

  const getDomainIcon = (domain: string) => {
    const iconMap: Record<string, any> = {
      'Healthcare': Heart,
      'Engineering': Settings,
      'Medical': Heart,
      'Computer Science': Settings,
      'Arts & Crafts': Star,
      'Business': Briefcase,
      'Education': GraduationCap,
    }
    const Icon = iconMap[domain] || HelpCircle
    return <Icon className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'Healthcare': 'text-red-500',
      'Engineering': 'text-blue-500',
      'Medical': 'text-pink-500',
      'Computer Science': 'text-purple-500',
      'Arts & Crafts': 'text-yellow-500',
      'Business': 'text-green-500',
      'Education': 'text-indigo-500',
    }
    return colorMap[category] || 'text-gray-500'
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center">
            <Activity className="h-4 w-4 mr-2 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 sm:p-6">
          <Button 
            className="w-full justify-start group min-h-[44px] text-sm" 
            variant="default"
            onClick={() => navigate('/alumni-directory')}
          >
            <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="truncate">Alumni Directory</span>
            <Badge variant="secondary" className="ml-auto hidden sm:flex">
              New
            </Badge>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start group min-h-[44px] text-sm"
            onClick={() => navigate('/mentorship')}
          >
            <GraduationCap className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="truncate">Mentorship Platform</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start group min-h-[44px] text-sm"
            onClick={() => navigate('/browse-postings')}
          >
            <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="truncate">Browse Requests</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start group min-h-[44px] text-sm"
            onClick={() => navigate('/create-posting')}
          >
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
            <span className="truncate">Create Posting</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start group min-h-[44px] text-sm"
            onClick={() => navigate('/chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            <span className="truncate">Start Chat</span>
            {stats.chat.totalUnread > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {stats.chat.totalUnread}
              </Badge>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start group min-h-[44px] text-sm"
            onClick={() => navigate('/express-interest')}
          >
            <Star className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            <span className="truncate">Express Interest</span>
          </Button>
        </CardContent>
      </Card>

      {/* Domain Expertise */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center">
            <Target className="h-4 w-4 mr-2 text-primary" />
            Your Expertise Areas
          </CardTitle>
          <CardDescription className="text-xs">
            {currentProfile.preferences.domains.length}/5 domains selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {currentProfile.preferences.domains.map((domain, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`${getCategoryColor(domain)}`}>
                    {getDomainIcon(domain)}
                  </div>
                  <span className="text-sm font-medium">{domain}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      navigate('/preferences')
                    }}
                  >
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button 
            variant="link" 
            className="w-full mt-3 text-xs"
            onClick={() => navigate('/preferences')}
          >
            Manage Domains
            <ArrowUpRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
            Pending Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors"
                 onClick={() => navigate('/responses')}>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium">Review responses</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">3</Badge>
                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors"
                 onClick={() => navigate('/profile')}>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium">Complete profile</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">85%</Badge>
                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border group cursor-pointer transition-colors"
                 onClick={() => navigate('/ratings')}>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Rate helpers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">2</Badge>
                <ArrowUpRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus,
  MessageSquare, 
  Users,
  Users2,
  Star,
  BookOpen,
  Briefcase,
  GraduationCap,
  UserPlus,
  CheckCircle2,
  HelpCircle,
  Eye,
} from 'lucide-react'

interface DashboardSidebarProps {
  stats: any;
  domains: string[];
}

export function DashboardSidebar({ stats, domains }: DashboardSidebarProps) {
  const navigate = useNavigate()

  const getActionIcon = (action: any) => {
    const iconMap: { [key: string]: any } = {
      connection_request: UserPlus,
      mentoring_request: Users,
      profile_review: Eye,
      opportunity_response: Briefcase,
      feedback_request: MessageSquare,
      document_approval: CheckCircle2
    }
    const Icon = iconMap[action.type] || HelpCircle
    return <Icon className="h-4 w-4" />
  }

  return (
    <div className="w-80 space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            className="w-full justify-start" 
            variant="outline" 
            onClick={() => navigate('/create-posting')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Share an Update
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline" 
            onClick={() => navigate('/chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Conversation
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline" 
            onClick={() => navigate('/alumni-directory')}
          >
            <Users className="h-4 w-4 mr-2" />
            Browse Directory
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline" 
            onClick={() => navigate('/alumni-opportunities')}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Find Opportunities
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline" 
            onClick={() => navigate('/alumni-profile')}
          >
            <Users2 className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
        </CardContent>
      </Card>

      {/* Domain Expertise */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Your Domains
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {domains.map((domain, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 
                    index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-sm font-medium">{domain}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.floor(Math.random() * 20) + 5} connections
                </Badge>
              </div>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => navigate('/alumni-profile')}
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              Add More Domains
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Pending Actions</span>
            <Badge variant={(stats.notifications?.actionRequired || 0) > 0 ? "destructive" : "secondary"}>
              {stats.notifications?.actionRequired || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(stats.notifications?.actionRequired || 0) > 0 ? (
            <div className="space-y-3">
              {[
                { type: 'connection_request', title: 'Connection Request', subtitle: 'From Rajesh Kumar' },
                { type: 'mentoring_request', title: 'Mentoring Opportunity', subtitle: 'Tech startup guidance' },
                { type: 'profile_review', title: 'Profile Completion', subtitle: '85% complete' }
              ].slice(0, stats.notifications?.actionRequired || 0).map((action, index) => (
                <div key={index} className="flex items-start space-x-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 mt-1">
                    {getActionIcon(action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{action.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.subtitle}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="flex-shrink-0">
                    View
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/responses')}
              >
                View All Actions
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending actions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Completeness */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Strength</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completeness</span>
              <span className="text-sm font-medium">{stats.profile?.completeness || 85}%</span>
            </div>
            <Progress value={stats.profile?.completeness || 85} className="h-2" />
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                {(stats.profile?.completeness || 85) > 90 ? 'Excellent' :
                 (stats.profile?.completeness || 85) > 75 ? 'Great' :
                 (stats.profile?.completeness || 85) > 50 ? 'Good' : 'Needs improvement'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
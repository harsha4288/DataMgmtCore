import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  MessageSquare, 
  Search, 
  Settings,
  LogOut,
  Home,
  FileText,
  ChevronDown,
} from 'lucide-react'

interface DashboardHeaderProps {
  stats: any;
  profile: any;
}

export function DashboardHeader({ stats, profile }: DashboardHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <img
              src="/images/opportunities/sgsgf-logo.png"
              alt="SGS Gita Foundation Logo"
              className="h-8 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold">SGS Connect</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Alumni Network</p>
            </div>
          </div>
          
          {/* Navigation and Actions */}
          <div className="flex items-center space-x-2">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {/* Quick Search */}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-muted-foreground"
                onClick={() => navigate('/alumni-directory')}
              >
                <Search className="h-4 w-4 mr-2" />
                Search alumni...
              </Button>

              {/* Notifications */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/responses')}
              >
                <Bell className="h-5 w-5" />
                {stats.notifications.unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {stats.notifications.unread}
                  </Badge>
                )}
              </Button>

              {/* Messages */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="h-5 w-5" />
                {stats.messages.unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                    {stats.messages.unread}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Mobile Menu Dropdown */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/alumni-directory')}>
                    <Search className="mr-2 h-4 w-4" />
                    Search Alumni
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/responses')}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {stats.notifications.unread > 0 && (
                      <Badge className="ml-auto">{stats.notifications.unread}</Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/chat')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                    {stats.messages.unread > 0 && (
                      <Badge className="ml-auto">{stats.messages.unread}</Badge>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Profile Section */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar} />
                    <AvatarFallback>
                      {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Desktop Profile Actions */}
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email || 'user@example.com'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/alumni-profile')}>
                  <FileText className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/preferences')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
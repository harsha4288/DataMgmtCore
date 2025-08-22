import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  User, 
  Plus, 
  Settings, 
  Shield, 
  Crown,
  Clock,
  Edit,
  Trash2,
  ChevronRight,
  LogOut
} from 'lucide-react'
import { getCurrentUser, type UserProfile, type User as UserType } from '@/lib/mock-data/auth'

export default function ProfileSelectionPage() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<UserType | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Get current user from localStorage or default
    const storedUser = localStorage.getItem('currentUser')
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser))
    } else {
      // Fallback to default user for demo
      const user = getCurrentUser()
      setCurrentUser(user)
      localStorage.setItem('currentUser', JSON.stringify(user))
    }
  }, [])

  const getRoleIcon = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 'moderator':
        return <Shield className="h-5 w-5 text-blue-500" />
      default:
        return <User className="h-5 w-5 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return 'default' as const
      case 'moderator':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  const getRoleDisplayName = (role: UserProfile['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'moderator':
        return 'Moderator'
      default:
        return 'Member'
    }
  }

  const handleProfileSelect = async (profile: UserProfile) => {
    setIsLoading(true)
    setSelectedProfile(profile)

    try {
      // Simulate loading time
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store selected profile
      localStorage.setItem('currentProfile', JSON.stringify(profile))

      // Navigate to appropriate dashboard
      switch (profile.role) {
        case 'admin':
          navigate('/admin-dashboard')
          break
        case 'moderator':
          navigate('/moderator-dashboard')
          break
        default:
          navigate('/member-dashboard')
      }
    } finally {
      setIsLoading(false)
      setSelectedProfile(null)
    }
  }

  const handleCreateProfile = () => {
    // In a real app, this would open a profile creation form
    alert('Profile creation would be implemented here. For the demo, use existing profiles.')
  }

  const handleEditProfile = (profile: UserProfile) => {
    // In a real app, this would open a profile editing form
    alert(`Edit profile functionality would be implemented here for: ${profile.name}`)
  }

  const handleDeleteProfile = (profile: UserProfile) => {
    // In a real app, this would delete the profile after confirmation
    alert(`Delete profile functionality would be implemented here for: ${profile.name}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('authenticated')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('currentProfile')
    localStorage.removeItem('rememberMe')
    navigate('/login')
  }

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/img/sgsgf-logo.png"
                alt="SGS Gita Foundation Logo"
                className="h-6 w-auto"
              />
              <h1 className="text-xl font-bold">SGS Gita Connect</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Phase 2 Demo</Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Selection Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser.email}</h2>
            <p className="text-muted-foreground text-lg">
              Choose a profile to continue to your dashboard
            </p>
          </div>

          {/* Profile Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentUser.profiles.map((profile) => (
              <Card 
                key={profile.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group ${
                  selectedProfile?.id === profile.id && isLoading ? 'ring-2 ring-primary animate-pulse' : ''
                }`}
                onClick={() => handleProfileSelect(profile)}
              >
                <CardHeader className="text-center pb-3">
                  <div className="flex justify-center mb-3">
                    <div className="relative">
                      <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.avatar} />
                        <AvatarFallback className="text-lg font-semibold">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {profile.isActive && (
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 border-2 border-background rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-1">{profile.name}</CardTitle>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {getRoleIcon(profile.role)}
                    <Badge variant={getRoleBadgeVariant(profile.role)}>
                      {getRoleDisplayName(profile.role)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Last Used */}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      Last used {formatLastUsed(profile.lastUsed)}
                    </div>

                    {/* Preferences Summary */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Preferences:</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.preferences.domains.slice(0, 2).map((domain) => (
                          <Badge key={domain} variant="outline" className="text-xs">
                            {domain}
                          </Badge>
                        ))}
                        {profile.preferences.domains.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.preferences.domains.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons - Shown on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProfile(profile)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {currentUser.profiles.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Profile</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the profile "{profile.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProfile(profile)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Loading State */}
                    {selectedProfile?.id === profile.id && isLoading && (
                      <div className="flex items-center justify-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        <span className="text-sm text-muted-foreground">Loading dashboard...</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add New Profile Card */}
            <Card 
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-dashed border-2 group"
              onClick={handleCreateProfile}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Plus className="h-8 w-8" />
                </div>
                <CardTitle className="text-lg mb-2">Add New Profile</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create additional profile for family members
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Options */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <Button 
                variant="link" 
                className="text-muted-foreground"
                onClick={() => {
                  // TODO: Navigate to account settings when implemented
                  alert('Account Settings will be available in the next phase.')
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button 
                variant="link" 
                className="text-muted-foreground"
                onClick={() => {
                  // TODO: Navigate to help & support when implemented
                  alert('Help & Support resources will be available in the next phase.')
                }}
              >
                Help & Support
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p>SGS Gita Connect - Alumni Network</p>
              <p>Profile-based authentication system demo</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
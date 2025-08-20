import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { 
  ArrowLeft,
  User,
  Bell,
  Globe,
  Shield,
  Palette,
  Smartphone,
  Settings,
  Save,
  RefreshCw,
  X,
  Plus,
  Star,
  AlertCircle
} from 'lucide-react'

interface UserPreferences {
  profile: {
    displayName: string
    bio: string
    location: string
    website: string
    phoneNumber: string
    visibility: 'public' | 'alumni-only' | 'private'
  }
  domains: {
    primary: string
    secondary: string[]
    interests: string[]
  }
  notifications: {
    email: {
      newPostings: boolean
      responses: boolean
      mentions: boolean
      digest: 'daily' | 'weekly' | 'never'
    }
    push: {
      enabled: boolean
      responses: boolean
      mentions: boolean
    }
  }
  privacy: {
    showGraduationYear: boolean
    showLocation: boolean
    showContactInfo: boolean
    allowDirectMessages: boolean
  }
  interface: {
    theme: 'light' | 'dark' | 'system'
    language: string
    timezone: string
    compactMode: boolean
  }
}

const AVAILABLE_DOMAINS = [
  'Technology',
  'Healthcare',
  'Business',
  'Science',
  'Education',
  'Engineering',
  'Arts & Design',
  'Law',
  'Finance',
  'Non-Profit'
]

const TECHNOLOGY_INTERESTS = [
  'Software Development',
  'Data Science',
  'Cybersecurity',
  'AI/Machine Learning',
  'Cloud Computing',
  'DevOps',
  'Mobile Development',
  'Web Development'
]

const HEALTHCARE_INTERESTS = [
  'Clinical Medicine',
  'Public Health',
  'Healthcare Administration',
  'Medical Research',
  'Nursing',
  'Pharmacy',
  'Mental Health',
  'Healthcare Technology'
]

const BUSINESS_INTERESTS = [
  'Strategy & Consulting',
  'Marketing',
  'Sales',
  'Operations',
  'Product Management',
  'Entrepreneurship',
  'Investment',
  'HR & Talent'
]

export default function PreferencesPage() {
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState<UserPreferences>({
    profile: {
      displayName: 'Dr. Sarah Chen',
      bio: 'Healthcare technology professional passionate about improving patient outcomes through innovation.',
      location: 'San Francisco, CA',
      website: 'https://sarahchen.dev',
      phoneNumber: '+1 (555) 123-4567',
      visibility: 'alumni-only'
    },
    domains: {
      primary: 'Technology',
      secondary: ['Healthcare', 'Business'],
      interests: ['Software Development', 'Healthcare Technology', 'AI/Machine Learning']
    },
    notifications: {
      email: {
        newPostings: true,
        responses: true,
        mentions: true,
        digest: 'weekly'
      },
      push: {
        enabled: true,
        responses: true,
        mentions: true
      }
    },
    privacy: {
      showGraduationYear: true,
      showLocation: true,
      showContactInfo: false,
      allowDirectMessages: true
    },
    interface: {
      theme: 'system',
      language: 'en',
      timezone: 'America/Los_Angeles',
      compactMode: false
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    // Load preferences from localStorage or API
    const storedPreferences = localStorage.getItem('userPreferences')
    if (storedPreferences) {
      setPreferences(JSON.parse(storedPreferences))
    }
  }, [])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Save to localStorage (in real app, this would be an API call)
      localStorage.setItem('userPreferences', JSON.stringify(preferences))
      
      setHasChanges(false)
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    // Reset to defaults or reload from server
    const defaultPreferences: UserPreferences = {
      profile: {
        displayName: '',
        bio: '',
        location: '',
        website: '',
        phoneNumber: '',
        visibility: 'alumni-only'
      },
      domains: {
        primary: '',
        secondary: [],
        interests: []
      },
      notifications: {
        email: {
          newPostings: true,
          responses: true,
          mentions: true,
          digest: 'weekly'
        },
        push: {
          enabled: true,
          responses: true,
          mentions: true
        }
      },
      privacy: {
        showGraduationYear: true,
        showLocation: true,
        showContactInfo: false,
        allowDirectMessages: true
      },
      interface: {
        theme: 'system',
        language: 'en',
        timezone: 'America/Los_Angeles',
        compactMode: false
      }
    }
    setPreferences(defaultPreferences)
    setHasChanges(true)
  }

  const updatePreferences = (section: keyof UserPreferences, field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const addSecondaryDomain = (domain: string) => {
    if (!preferences.domains.secondary.includes(domain) && domain !== preferences.domains.primary) {
      setPreferences(prev => ({
        ...prev,
        domains: {
          ...prev.domains,
          secondary: [...prev.domains.secondary, domain]
        }
      }))
      setHasChanges(true)
    }
  }

  const removeSecondaryDomain = (domain: string) => {
    setPreferences(prev => ({
      ...prev,
      domains: {
        ...prev.domains,
        secondary: prev.domains.secondary.filter(d => d !== domain)
      }
    }))
    setHasChanges(true)
  }

  const addInterest = (interest: string) => {
    if (!preferences.domains.interests.includes(interest)) {
      setPreferences(prev => ({
        ...prev,
        domains: {
          ...prev.domains,
          interests: [...prev.domains.interests, interest]
        }
      }))
      setHasChanges(true)
    }
  }

  const removeInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      domains: {
        ...prev.domains,
        interests: prev.domains.interests.filter(i => i !== interest)
      }
    }))
    setHasChanges(true)
  }

  const getInterestsForDomain = (domain: string) => {
    switch (domain) {
      case 'Technology': return TECHNOLOGY_INTERESTS
      case 'Healthcare': return HEALTHCARE_INTERESTS
      case 'Business': return BUSINESS_INTERESTS
      default: return []
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/member-dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Preferences</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </div>
              )}
              <Badge variant="secondary">Phase 2 Demo</Badge>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="domains">Domains</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="interface">Interface</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={preferences.profile.displayName}
                        onChange={(e) => updatePreferences('profile', 'displayName', e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={preferences.profile.location}
                        onChange={(e) => updatePreferences('profile', 'location', e.target.value)}
                        placeholder="City, State/Country"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={preferences.profile.bio}
                      onChange={(e) => updatePreferences('profile', 'bio', e.target.value)}
                      placeholder="Tell other alumni about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={preferences.profile.website}
                        onChange={(e) => updatePreferences('profile', 'website', e.target.value)}
                        placeholder="https://your-website.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={preferences.profile.phoneNumber}
                        onChange={(e) => updatePreferences('profile', 'phoneNumber', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="visibility">Profile Visibility</Label>
                    <Select 
                      value={preferences.profile.visibility} 
                      onValueChange={(value) => updatePreferences('profile', 'visibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Visible to everyone</SelectItem>
                        <SelectItem value="alumni-only">Alumni Only - Only visible to Gita alumni</SelectItem>
                        <SelectItem value="private">Private - Only visible to direct connections</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Domains Tab */}
            <TabsContent value="domains" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Domain */}
                  <div>
                    <Label htmlFor="primaryDomain">Primary Domain</Label>
                    <Select 
                      value={preferences.domains.primary} 
                      onValueChange={(value) => updatePreferences('domains', 'primary', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_DOMAINS.map(domain => (
                          <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Secondary Domains */}
                  <div>
                    <Label>Secondary Domains</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {preferences.domains.secondary.map(domain => (
                        <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                          {domain}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeSecondaryDomain(domain)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <Select onValueChange={addSecondaryDomain}>
                      <SelectTrigger>
                        <SelectValue placeholder="Add secondary domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_DOMAINS
                          .filter(domain => 
                            domain !== preferences.domains.primary && 
                            !preferences.domains.secondary.includes(domain)
                          )
                          .map(domain => (
                            <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Interests */}
                  <div>
                    <Label>Areas of Interest</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Select specific areas within your domains that interest you
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {preferences.domains.interests.map(interest => (
                        <Badge key={interest} variant="default" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {interest}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeInterest(interest)}
                          />
                        </Badge>
                      ))}
                    </div>

                    {/* Available interests based on selected domains */}
                    <div className="space-y-4">
                      {[preferences.domains.primary, ...preferences.domains.secondary]
                        .filter(Boolean)
                        .map(domain => {
                          const availableInterests = getInterestsForDomain(domain)
                            .filter(interest => !preferences.domains.interests.includes(interest))
                          
                          if (availableInterests.length === 0) return null

                          return (
                            <div key={domain}>
                              <h4 className="font-medium text-sm mb-2">{domain}</h4>
                              <div className="flex flex-wrap gap-2">
                                {availableInterests.map(interest => (
                                  <Button
                                    key={interest}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addInterest(interest)}
                                    className="h-8"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {interest}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Email Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailNewPostings">New Postings in Your Domains</Label>
                      <p className="text-sm text-muted-foreground">Receive emails when new postings match your interests</p>
                    </div>
                    <Switch
                      id="emailNewPostings"
                      checked={preferences.notifications.email.newPostings}
                      onCheckedChange={(checked: boolean) => updatePreferences('notifications', 'email', {
                        ...preferences.notifications.email,
                        newPostings: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailResponses">Responses to Your Postings</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone responds to your postings</p>
                    </div>
                    <Switch
                      id="emailResponses"
                      checked={preferences.notifications.email.responses}
                      onCheckedChange={(checked: boolean) => updatePreferences('notifications', 'email', {
                        ...preferences.notifications.email,
                        responses: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="emailMentions">Mentions & Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">Be notified when someone mentions you or sends a direct message</p>
                    </div>
                    <Switch
                      id="emailMentions"
                      checked={preferences.notifications.email.mentions}
                      onCheckedChange={(checked: boolean) => updatePreferences('notifications', 'email', {
                        ...preferences.notifications.email,
                        mentions: checked
                      })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailDigest">Weekly Digest</Label>
                    <Select 
                      value={preferences.notifications.email.digest} 
                      onValueChange={(value) => updatePreferences('notifications', 'email', {
                        ...preferences.notifications.email,
                        digest: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Push Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pushEnabled">Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive real-time notifications on your device</p>
                    </div>
                    <Switch
                      id="pushEnabled"
                      checked={preferences.notifications.push.enabled}
                      onCheckedChange={(checked: boolean) => updatePreferences('notifications', 'push', {
                        ...preferences.notifications.push,
                        enabled: checked
                      })}
                    />
                  </div>

                  {preferences.notifications.push.enabled && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushResponses">Responses to Your Postings</Label>
                        <Switch
                          id="pushResponses"
                          checked={preferences.notifications.push.responses}
                          onCheckedChange={(checked: boolean) => updatePreferences('notifications', 'push', {
                            ...preferences.notifications.push,
                            responses: checked
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="pushMentions">Mentions & Direct Messages</Label>
                        <Switch
                          id="pushMentions"
                          checked={preferences.notifications.push.mentions}
                          onCheckedChange={(checked: boolean) => updatePreferences('notifications', 'push', {
                            ...preferences.notifications.push,
                            mentions: checked
                          })}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showGradYear">Show Graduation Year</Label>
                      <p className="text-sm text-muted-foreground">Display your graduation year on your profile</p>
                    </div>
                    <Switch
                      id="showGradYear"
                      checked={preferences.privacy.showGraduationYear}
                      onCheckedChange={(checked: boolean) => updatePreferences('privacy', 'showGraduationYear', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showLocation">Show Location</Label>
                      <p className="text-sm text-muted-foreground">Display your location on your profile</p>
                    </div>
                    <Switch
                      id="showLocation"
                      checked={preferences.privacy.showLocation}
                      onCheckedChange={(checked: boolean) => updatePreferences('privacy', 'showLocation', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="showContact">Show Contact Information</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see your phone number and website</p>
                    </div>
                    <Switch
                      id="showContact"
                      checked={preferences.privacy.showContactInfo}
                      onCheckedChange={(checked: boolean) => updatePreferences('privacy', 'showContactInfo', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allowDM">Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">Let other alumni send you direct messages</p>
                    </div>
                    <Switch
                      id="allowDM"
                      checked={preferences.privacy.allowDirectMessages}
                      onCheckedChange={(checked: boolean) => updatePreferences('privacy', 'allowDirectMessages', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interface Tab */}
            <TabsContent value="interface" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Interface Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select 
                      value={preferences.interface.theme} 
                      onValueChange={(value) => updatePreferences('interface', 'theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System (Auto)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={preferences.interface.language} 
                      onValueChange={(value) => updatePreferences('interface', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={preferences.interface.timezone} 
                      onValueChange={(value) => updatePreferences('interface', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compactMode">Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Use a more compact layout with smaller spacing</p>
                    </div>
                    <Switch
                      id="compactMode"
                      checked={preferences.interface.compactMode}
                      onCheckedChange={(checked: boolean) => updatePreferences('interface', 'compactMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
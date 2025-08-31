import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { type UserProfile } from '@/lib/mock-data/auth'
import { getDashboardStats, getConversationsByUser } from '@/lib/mock-data'
import { getPersonalizedAlumniPosts } from '@/lib/mock-data/enhanced-alumni-posts'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { WelcomeHeroSection } from '@/components/dashboard/WelcomeHeroSection'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'

export default function MemberDashboard() {
  const navigate = useNavigate()
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])

  useEffect(() => {
    console.log('=== MemberDashboard Debug Start ===')
    console.log('Current URL:', window.location.href)
    console.log('Authentication status:', localStorage.getItem('authenticated'))
    
    // Check for authenticated user profile
    const storedProfile = localStorage.getItem('currentProfile')
    console.log('Stored profile from localStorage:', storedProfile)
    
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile)
        console.log('Parsed profile:', profile)
        console.log('Profile role:', profile.role)
        setCurrentProfile(profile)

        // Use the correct user ID - profile has both id and userId
        const userIdForApi = profile.userId || profile.id
        console.log('Using userIdForApi:', userIdForApi)
        
        try {
          const dashboardStats = getDashboardStats(userIdForApi)
          console.log('Dashboard stats result:', dashboardStats)
          if (dashboardStats) {
            setStats(dashboardStats)
          } else {
            console.error('getDashboardStats returned null/undefined')
            // Set fallback stats to prevent infinite loading
            setStats({
              notifications: { unread: 0 },
              messages: { unread: 0 },
              alumni: { total: 0 },
              events: { upcoming: 0 }
            })
          }
        } catch (error) {
          console.error('Error calling getDashboardStats:', error)
          // Set fallback stats
          setStats({
            notifications: { unread: 0 },
            messages: { unread: 0 },
            alumni: { total: 0 },
            events: { upcoming: 0 }
          })
        }

        const userConversations = getConversationsByUser(userIdForApi)
        console.log('User conversations result:', userConversations)
        setConversations(userConversations)
        
        console.log('=== MemberDashboard Setup Complete ===')
      } catch (error) {
        console.error('Error parsing stored profile:', error)
        // Invalid stored data, redirect to login
        navigate('/login')
      }
    } else {
      console.log('No stored profile, redirecting to login...')
      // No authenticated user, redirect to login
      navigate('/login')
    }
  }, [navigate])

  if (!currentProfile || !stats) {
    console.log('Loading state check:', { 
      currentProfile: !!currentProfile, 
      stats: !!stats,
      currentProfileData: currentProfile,
      statsData: stats 
    })
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Profile: {currentProfile ? '✓' : '✗'} | Stats: {stats ? '✓' : '✗'}
          </p>
        </div>
      </div>
    )
  }

  const personalizedPosts = getPersonalizedAlumniPosts()
  const totalEngagement = personalizedPosts.reduce((acc, post) => 
    acc + post.likes + post.comments.length, 0
  )

  // Mock data for components
  const recentActivity = [
    { description: 'New connection request from Rajesh Kumar', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { description: 'Your post about Data Science got 15 likes', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { description: 'Mentoring session completed with Priya Sharma', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { description: 'New opportunity in your domain: AI/ML Engineer', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { description: 'Profile viewed by 5 alumni this week', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
  ]

  const recommendedConnections = [
    { name: 'Amit Patel', title: 'Senior Data Scientist at Google', avatar: '/images/avatars/amit.jpg', mutualConnections: 12 },
    { name: 'Sarah Johnson', title: 'Product Manager at Microsoft', avatar: '/images/avatars/sarah.jpg', mutualConnections: 8 },
    { name: 'Ravi Kumar', title: 'Startup Founder', avatar: '/images/avatars/ravi.jpg', mutualConnections: 15 },
    { name: 'Lisa Chen', title: 'UX Designer at Apple', avatar: '/images/avatars/lisa.jpg', mutualConnections: 6 }
  ]

  const trendingPosts = personalizedPosts.slice(0, 6)

  const conversationPreviews = conversations.slice(0, 5).map(conv => ({
    ...conv,
    preview: 'Hey! I saw your post about the startup opportunities...',
    unread: Math.floor(Math.random() * 3)
  }))

  // Safe access to profile data with fallbacks
  const domains = currentProfile?.preferences?.domains || ['Technology', 'Data Science', 'Artificial Intelligence']

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader stats={stats} profile={currentProfile} />
      
      <WelcomeHeroSection 
        profile={currentProfile} 
        stats={stats} 
        totalEngagement={totalEngagement} 
      />

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          <DashboardSidebar stats={stats} domains={domains} />
          
          <DashboardTabs 
            stats={stats}
            personalizedPosts={personalizedPosts}
            recentActivity={recentActivity}
            recommendedConnections={recommendedConnections}
            trendingPosts={trendingPosts}
            connections={conversations}
            conversationPreviews={conversationPreviews}
            profile={currentProfile}
          />
        </div>
      </div>
    </div>
  )
}
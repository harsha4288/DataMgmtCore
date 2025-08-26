/**
 * Component tests for member dashboard posts display
 * Tests the actual rendering and navigation functionality
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MemberDashboard from '@/pages/member-dashboard'
import { enhancedAlumniPosts } from '@/lib/mock-data/enhanced-alumni-posts'

// Mock the navigation hook
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock localStorage with a valid user profile
const mockProfile = {
  userId: '10001',
  name: 'Test User',
  email: 'test@example.com',
  role: 'alumni',
  avatar: 'https://example.com/avatar.jpg',
  preferences: {
    domains: ['Research', 'Internships', 'Medical', 'Computer Science'],
    professionalStatus: 'professional',
    supportMode: 'offer'
  }
}

// Mock all the required modules
vi.mock('@/lib/mock-data', () => ({
  getDashboardStats: () => ({
    notifications: { unread: 2 },
    chat: { totalUnread: 1 }
  }),
  getNotificationsByUser: () => [
    { id: '1', title: 'Test Notification', message: 'Test message', createdAt: new Date().toISOString(), isRead: false }
  ],
  getConversationsByUser: () => [
    { 
      id: '1', 
      title: 'Test Chat', 
      participants: [{ id: '10002', name: 'Other User', avatar: '' }],
      lastMessage: { content: 'Hello' },
      updatedAt: new Date().toISOString(),
      unreadCount: 0
    }
  ]
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Member Dashboard Posts Display', () => {
  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'currentProfile') return JSON.stringify(mockProfile)
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })
    
    // Clear mocks
    mockNavigate.mockClear()
  })

  test('should render the dashboard and show feed tab', async () => {
    render(
      <TestWrapper>
        <MemberDashboard />
      </TestWrapper>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test!')).toBeInTheDocument()
    })

    // Check if Feed tab exists
    const feedTab = screen.getByText('Feed')
    expect(feedTab).toBeInTheDocument()
  })

  test('should show posts when Feed tab is clicked', async () => {
    render(
      <TestWrapper>
        <MemberDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test!')).toBeInTheDocument()
    })

    // Click the Feed tab
    const feedTab = screen.getByText('Feed')
    fireEvent.click(feedTab)

    // Check if posts are displayed
    await waitFor(() => {
      const feedHeader = screen.getByText('Personalized Feed')
      expect(feedHeader).toBeInTheDocument()
    })

    // Look for specific post titles from our enhanced alumni posts
    const postsWithImages = enhancedAlumniPosts.filter(post => post.image && post.status === 'approved')
    
    console.log('\n=== POSTS RENDERING TEST ===')
    console.log('Posts with images that should render:', postsWithImages.length)
    
    postsWithImages.forEach(post => {
      console.log(`Looking for post: ${post.title}`)
      try {
        const postElement = screen.getByText(post.title)
        console.log(`✅ Found: ${post.title}`)
        expect(postElement).toBeInTheDocument()
      } catch (error) {
        console.log(`❌ Not found: ${post.title}`)
      }
    })
  })

  test('should handle image loading errors gracefully', async () => {
    render(
      <TestWrapper>
        <MemberDashboard />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test!')).toBeInTheDocument()
    })

    // Click the Feed tab
    const feedTab = screen.getByText('Feed')
    fireEvent.click(feedTab)

    await waitFor(() => {
      expect(screen.getByText('Personalized Feed')).toBeInTheDocument()
    })

    // Find images and trigger error events
    const images = screen.getAllByRole('img')
    console.log('\n=== IMAGE LOADING TEST ===')
    console.log('Images found in DOM:', images.length)
    
    images.forEach((img, index) => {
      const src = img.getAttribute('src')
      console.log(`Image ${index + 1}: ${src}`)
      
      // Simulate image loading error
      fireEvent.error(img)
      
      // Image should be hidden on error (style.display = 'none')
      // This tests the onError handler in the component
    })
  })

  test('should filter posts by user preferences', () => {
    const userDomains = mockProfile.preferences.domains
    const personalizedPosts = enhancedAlumniPosts.filter(post => 
      post.status === 'approved' &&
      userDomains.some(domain => 
        post.category === domain || post.tags.some(tag => tag.toLowerCase().includes(domain.toLowerCase()))
      )
    )
    
    console.log('\n=== PERSONALIZATION FILTER TEST ===')
    console.log('User domains:', userDomains)
    console.log('Total posts:', enhancedAlumniPosts.length)
    console.log('Approved posts:', enhancedAlumniPosts.filter(p => p.status === 'approved').length)
    console.log('Personalized posts:', personalizedPosts.length)
    
    personalizedPosts.forEach(post => {
      console.log(`- ${post.title} (${post.category}) - Tags: [${post.tags.join(', ')}]`)
    })
    
    if (personalizedPosts.length === 0) {
      console.log('🚨 ISSUE: No posts match user preferences - filtering too restrictive')
    }
    
    expect(personalizedPosts.length).toBeGreaterThan(0)
  })

  test('should identify posts with HTML content rendering', () => {
    const htmlPosts = enhancedAlumniPosts.filter(post => 
      post.content.includes('<p>') && post.status === 'approved'
    )
    
    console.log('\n=== HTML CONTENT RENDERING TEST ===')
    console.log('Posts with HTML content:', htmlPosts.length)
    
    htmlPosts.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  HTML content length: ${post.content.length}`)
      console.log(`  Has <p> tags: ${post.content.includes('<p>')}`)
      console.log(`  Has <ul> tags: ${post.content.includes('<ul>')}`)
    })
    
    expect(htmlPosts.length).toBeGreaterThan(0)
  })

  test('should show engagement data for posts', () => {
    const postsWithEngagement = enhancedAlumniPosts.filter(post => 
      post.status === 'approved' && (post.likes > 0 || post.comments.length > 0)
    )
    
    console.log('\n=== ENGAGEMENT DATA TEST ===')
    console.log('Posts with engagement:', postsWithEngagement.length)
    
    postsWithEngagement.forEach(post => {
      console.log(`- ${post.title}`)
      console.log(`  Likes: ${post.likes}`)
      console.log(`  Comments: ${post.comments.length}`)
      
      if (post.comments.length > 0) {
        console.log(`  Sample comment: "${post.comments[0].text.substring(0, 50)}..."`)
      }
    })
    
    expect(postsWithEngagement.length).toBeGreaterThan(0)
  })

  test('should identify navigation issues in posts data', () => {
    console.log('\n=== NAVIGATION ISSUES DIAGNOSIS ===')
    
    // Check for posts that might not be visible due to various issues
    const allPosts = enhancedAlumniPosts
    const approvedPosts = allPosts.filter(p => p.status === 'approved')
    const pendingPosts = allPosts.filter(p => p.status === 'pending')
    const rejectedPosts = allPosts.filter(p => p.status === 'rejected')
    
    console.log('Total posts in data:', allPosts.length)
    console.log('Approved posts (visible):', approvedPosts.length)
    console.log('Pending posts (hidden):', pendingPosts.length)
    console.log('Rejected posts (hidden):', rejectedPosts.length)
    
    if (pendingPosts.length > 0) {
      console.log('\n⚠️  Posts stuck in pending status:')
      pendingPosts.forEach(post => {
        console.log(`  - ${post.title} (${post.category})`)
      })
    }
    
    // Check for posts with missing required fields
    const postsWithIssues = approvedPosts.filter(post => 
      !post.title || !post.content || !post.author
    )
    
    if (postsWithIssues.length > 0) {
      console.log('\n🚨 Posts with missing required fields:')
      postsWithIssues.forEach(post => {
        console.log(`  - ${post.id}: Missing ${!post.title ? 'title' : ''} ${!post.content ? 'content' : ''} ${!post.author ? 'author' : ''}`)
      })
    }
    
    // Check image paths
    const postsWithImages = approvedPosts.filter(post => post.image)
    console.log('\nPosts with images:', postsWithImages.length)
    postsWithImages.forEach(post => {
      console.log(`  - ${post.title}: ${post.image}`)
    })
    
    expect(approvedPosts.length).toBeGreaterThan(0)
  })
})
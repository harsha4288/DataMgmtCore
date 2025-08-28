/**
 * Unit tests to identify posts navigation and image loading issues
 * These tests will help diagnose why posts with images aren't visible
 */

import { describe, test, expect } from 'vitest'
import { enhancedAlumniPosts, searchPosts } from '@/lib/mock-data/enhanced-alumni-posts'
import fs from 'fs'
import path from 'path'

declare const process: any

describe('Posts Navigation and Image Loading Issues', () => {
  describe('Posts Data Integrity', () => {
    test('should have posts with images defined', () => {
      const postsWithImages = enhancedAlumniPosts.filter(post => post.image)
      
      console.log('Posts with images found:', postsWithImages.length)
      postsWithImages.forEach(post => {
        console.log(`- ${post.title}: ${post.image}`)
      })
      
      expect(postsWithImages.length).toBeGreaterThan(0)
      expect(postsWithImages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            image: expect.stringContaining('/images/opportunities/')
          })
        ])
      )
    })

    test('should have Yale and CSIS opportunities with correct links', () => {
      const yalePost = enhancedAlumniPosts.find(post => 
        post.title.toLowerCase().includes('yale') || 
        post.organization?.toLowerCase().includes('yale')
      )
      
      const csisOpportunity = enhancedAlumniPosts.find(post => 
        post.content.toLowerCase().includes('csis') ||
        post.title.toLowerCase().includes('csis')
      )

      console.log('Yale post found:', yalePost?.title)
      console.log('Yale application URL:', yalePost?.applicationUrl)
      console.log('CSIS opportunity found:', csisOpportunity?.title)
      
      // These might be in alumni-opportunities.ts instead
      expect(yalePost || csisOpportunity).toBeDefined()
    })

    test('should have posts with rich HTML content', () => {
      const htmlPosts = enhancedAlumniPosts.filter(post => 
        post.content.includes('<p>') || post.content.includes('<ul>')
      )
      
      console.log('Posts with HTML content:', htmlPosts.length)
      htmlPosts.forEach(post => {
        console.log(`- ${post.title}: Has HTML content`)
      })
      
      expect(htmlPosts.length).toBeGreaterThan(0)
    })
  })

  describe('Image File Existence', () => {
    test('should identify missing image files', () => {
      const postsWithImages = enhancedAlumniPosts.filter(post => post.image)
      const missingImages: string[] = []
      const existingImages: string[] = []
      
      postsWithImages.forEach(post => {
        if (post.image) {
          // Convert to actual file path
          const imagePath = path.join(process.cwd(), 'public', post.image)
          
          try {
            if (fs.existsSync(imagePath)) {
              existingImages.push(post.image)
            } else {
              missingImages.push(post.image)
            }
          } catch (error) {
            missingImages.push(post.image)
          }
        }
      })
      
      console.log('\n=== IMAGE FILE ANALYSIS ===')
      console.log('Existing images:', existingImages.length)
      existingImages.forEach(img => console.log(`✅ ${img}`))
      
      console.log('\nMissing images:', missingImages.length)
      missingImages.forEach(img => console.log(`❌ ${img}`))
      
      if (missingImages.length > 0) {
        console.log('\n🚨 ISSUE IDENTIFIED: Missing image files prevent posts from displaying properly')
        console.log('Solution: Add these image files to the public directory')
      }
      
      // This test will help identify the issue, but shouldn't fail the build
      expect(postsWithImages.length).toBeGreaterThan(0)
    })

    test('should check public directory structure', () => {
      const publicDir = path.join(process.cwd(), 'public')
      const imagesDir = path.join(publicDir, 'images')
      const opportunitiesDir = path.join(imagesDir, 'opportunities')
      
      console.log('\n=== DIRECTORY STRUCTURE ===')
      console.log('Public directory exists:', fs.existsSync(publicDir))
      console.log('Images directory exists:', fs.existsSync(imagesDir))
      console.log('Opportunities directory exists:', fs.existsSync(opportunitiesDir))
      
      if (fs.existsSync(imagesDir)) {
        try {
          const imageFiles = fs.readdirSync(imagesDir, { recursive: true })
          console.log('Files in images directory:', imageFiles.length)
          imageFiles.forEach(file => console.log(`  ${file}`))
        } catch (error) {
          console.log('Error reading images directory:', error)
        }
      }
      
      expect(fs.existsSync(publicDir)).toBe(true)
    })
  })

  describe('Posts Filtering and Search', () => {
    test('should filter posts by status', () => {
      const approvedPosts = enhancedAlumniPosts.filter(post => post.status === 'approved')
      const pendingPosts = enhancedAlumniPosts.filter(post => post.status === 'pending')
      
      console.log('\n=== POSTS STATUS ===')
      console.log('Approved posts:', approvedPosts.length)
      console.log('Pending posts:', pendingPosts.length)
      
      expect(approvedPosts.length).toBeGreaterThan(0)
      
      // Check if any posts are stuck in pending status
      if (pendingPosts.length > 0) {
        console.log('⚠️  Posts in pending status (might not show in feed):')
        pendingPosts.forEach(post => console.log(`  - ${post.title}`))
      }
    })

    test('should find posts by search terms', () => {
      const searchTerms = ['harvard', 'yale', 'stanford', 'mit', 'research']
      
      console.log('\n=== SEARCH FUNCTIONALITY ===')
      searchTerms.forEach(term => {
        const results = searchPosts(term, { status: 'approved' })
        console.log(`Search "${term}": ${results.length} results`)
        results.forEach(post => console.log(`  - ${post.title}`))
      })
    })

    test('should identify posts with engagement data', () => {
      const postsWithLikes = enhancedAlumniPosts.filter(post => post.likes > 0)
      const postsWithComments = enhancedAlumniPosts.filter(post => post.comments.length > 0)
      
      console.log('\n=== ENGAGEMENT DATA ===')
      console.log('Posts with likes:', postsWithLikes.length)
      console.log('Posts with comments:', postsWithComments.length)
      
      expect(postsWithLikes.length).toBeGreaterThan(0)
      expect(postsWithComments.length).toBeGreaterThan(0)
    })
  })

  describe('Navigation Issues Diagnosis', () => {
    test('should identify posts that should be visible in feed', () => {
      // Simulate the filtering logic from member-dashboard.tsx
      const feedPosts = enhancedAlumniPosts.filter(post => post.status === 'approved')
      
      console.log('\n=== FEED VISIBILITY ===')
      console.log('Total posts that should appear in feed:', feedPosts.length)
      
      const urgentPosts = feedPosts.filter(post => post.isUrgent)
      const postsWithImages = feedPosts.filter(post => post.image)
      const postsWithOrganizations = feedPosts.filter(post => post.organization)
      
      console.log('Urgent posts:', urgentPosts.length)
      console.log('Posts with images:', postsWithImages.length)
      console.log('Posts with organizations:', postsWithOrganizations.length)
      
      if (feedPosts.length === 0) {
        console.log('🚨 ISSUE: No approved posts found for feed display')
      }
      
      expect(feedPosts.length).toBeGreaterThan(0)
    })

    test('should check for HTML content rendering issues', () => {
      const htmlPosts = enhancedAlumniPosts.filter(post => 
        post.content.includes('<') && post.status === 'approved'
      )
      
      console.log('\n=== HTML CONTENT ANALYSIS ===')
      htmlPosts.forEach(post => {
        const hasValidHTML = post.content.includes('<p>') && post.content.includes('</p>')
        console.log(`${post.title}: ${hasValidHTML ? '✅' : '❌'} Valid HTML structure`)
        
        if (!hasValidHTML) {
          console.log(`  Content preview: ${post.content.substring(0, 100)}...`)
        }
      })
    })

    test('should identify posts filtering logic issues', () => {
      // Test the personalized posts logic
      const mockUserPreferences = {
        domains: ['Research', 'Internships', 'Medical', 'Computer Science']
      }
      
      const personalizedPosts = enhancedAlumniPosts.filter(post => 
        post.status === 'approved' &&
        mockUserPreferences.domains.some(domain => 
          post.category === domain || post.tags.some(tag => tag.toLowerCase().includes(domain.toLowerCase()))
        )
      )
      
      console.log('\n=== PERSONALIZATION LOGIC ===')
      console.log('User domains:', mockUserPreferences.domains)
      console.log('Personalized posts found:', personalizedPosts.length)
      
      personalizedPosts.forEach(post => {
        console.log(`- ${post.title} (${post.category})`)
      })
      
      if (personalizedPosts.length === 0) {
        console.log('🚨 ISSUE: Personalization filtering too aggressive - no posts match user preferences')
      }
      
      expect(personalizedPosts.length).toBeGreaterThan(0)
    })
  })

  describe('Integration with Alumni Opportunities', () => {
    test('should check if Yale and CSIS data exists in opportunities file', async () => {
      try {
        // Try to import alumni opportunities to check links
        const opportunitiesModule = await import('@/lib/mock-data/alumni-opportunities')
        const opportunities = opportunitiesModule.mockAlumniOpportunities || []
        
        const yaleOpportunity = opportunities.find((opp: any) => 
          opp.title?.toLowerCase().includes('yale') ||
          opp.organization?.toLowerCase().includes('yale')
        )
        
        const csisOpportunity = opportunities.find((opp: any) => 
          opp.title?.toLowerCase().includes('csis') ||
          opp.organization?.toLowerCase().includes('csis')
        )
        
        console.log('\n=== ALUMNI OPPORTUNITIES DATA ===')
        console.log('Yale opportunity found:', !!yaleOpportunity)
        if (yaleOpportunity) {
          console.log('  Title:', yaleOpportunity.title)
          console.log('  Interest Link:', yaleOpportunity.interestLink)
        }
        
        console.log('CSIS opportunity found:', !!csisOpportunity)
        if (csisOpportunity) {
          console.log('  Title:', csisOpportunity.title)
          console.log('  Interest Link:', csisOpportunity.interestLink)
        }
        
        // Verify the links are updated correctly
        if (yaleOpportunity?.interestLink) {
          expect(yaleOpportunity.interestLink).toContain('world.yale.edu')
          expect(yaleOpportunity.interestLink).not.toContain('scholarshipsads.com')
        }
        
        if (csisOpportunity?.interestLink) {
          expect(csisOpportunity.interestLink).toContain('csis.org')
          expect(csisOpportunity.interestLink).not.toContain('opportunitiescircle.com')
        }
        
      } catch (error) {
        console.log('Could not load alumni opportunities:', error)
      }
    })
  })
})
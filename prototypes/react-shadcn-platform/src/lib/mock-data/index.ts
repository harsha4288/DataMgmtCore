// Central export for all mock data
export * from './alumni'
export * from './events'
export * from './mentorship'
export * from './auth'
export * from './postings'
export * from './notifications'

// Aggregated statistics
import { getAlumniStats } from './alumni'
import { mockEventsData } from './events'
import { getMentorshipStats } from './mentorship'
import { getPostingsStats } from './postings'
import { getNotificationStats, getChatStats } from './notifications'

export const getDashboardStats = (userId = 'user-1') => {
  console.log('getDashboardStats called with userId:', userId)
  
  try {
    const alumniStats = getAlumniStats()
    console.log('Alumni stats:', alumniStats)
    
    const mentorshipStats = getMentorshipStats()
    console.log('Mentorship stats:', mentorshipStats)
    
    const postingsStats = getPostingsStats()
    console.log('Postings stats:', postingsStats)
    
    const notificationStats = getNotificationStats(userId)
    console.log('Notification stats:', notificationStats)
    
    const chatStats = getChatStats(userId)
    console.log('Chat stats:', chatStats)
    
    const upcomingEvents = mockEventsData.filter(e => e.status === 'upcoming').length
    const totalEvents = mockEventsData.length
    const eventCapacity = mockEventsData.reduce((sum, e) => sum + e.capacity, 0)
    const eventRegistrations = mockEventsData.reduce((sum, e) => sum + e.registered, 0)
    
    const result = {
      alumni: {
        total: alumniStats.total,
        verified: alumniStats.verified,
        mentors: alumniStats.mentors,
        industries: alumniStats.industries
      },
      events: {
        upcoming: upcomingEvents,
        total: totalEvents,
        capacity: eventCapacity,
        registrations: eventRegistrations,
        fillRate: Math.round((eventRegistrations / eventCapacity) * 100)
      },
      mentorship: {
        mentors: mentorshipStats.totalMentors,
        available: mentorshipStats.availableMentors,
        mentees: mentorshipStats.totalMentees,
        sessions: mentorshipStats.totalSessions,
        completed: mentorshipStats.completedSessions,
        rating: mentorshipStats.averageRating
      },
      postings: {
        total: postingsStats.total,
        active: postingsStats.active,
        seeking: postingsStats.seeking,
        offering: postingsStats.offering,
        pendingReview: postingsStats.pendingReview,
        totalViews: postingsStats.totalViews,
        totalInterested: postingsStats.totalInterested,
        categories: postingsStats.categories
      },
      notifications: {
        total: notificationStats.total,
        unread: notificationStats.unread,
        byType: notificationStats.byType
      },
      messages: {
        unread: chatStats.totalUnread
      },
      chat: {
        totalConversations: chatStats.totalConversations,
        totalUnread: chatStats.totalUnread,
        activeChats: chatStats.activeChats,
        groupChats: chatStats.groupChats
      },
      engagement: {
        monthlyActive: Math.round(alumniStats.total * 0.65),
        newMembers: 12,
        messages: chatStats.totalConversations * 15, // Estimated messages
        forumPosts: postingsStats.total
      },
      profile: {
        completeness: 85, // Profile completion percentage
        views: Math.round(alumniStats.total * 25) // Profile views
      },
      connections: {
        total: Math.round(alumniStats.total * 12), // Total connections
        mentoring: {
          active: mentorshipStats.availableMentors
        }
      },
      opportunities: {
        active: postingsStats.active // Active opportunities
      }
    }
    
    console.log('getDashboardStats result:', result)
    return result
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    throw error
  }
}
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
  const alumniStats = getAlumniStats()
  const mentorshipStats = getMentorshipStats()
  const postingsStats = getPostingsStats()
  const notificationStats = getNotificationStats(userId)
  const chatStats = getChatStats(userId)
  
  const upcomingEvents = mockEventsData.filter(e => e.status === 'upcoming').length
  const totalEvents = mockEventsData.length
  const eventCapacity = mockEventsData.reduce((sum, e) => sum + e.capacity, 0)
  const eventRegistrations = mockEventsData.reduce((sum, e) => sum + e.registered, 0)
  
  return {
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
    }
  }
}
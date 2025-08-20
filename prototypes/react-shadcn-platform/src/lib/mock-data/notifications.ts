export interface UserNotification {
  id: string
  userId: string
  type: 'posting_interest' | 'new_message' | 'posting_approved' | 'posting_rejected' | 'connection_request' | 'mentorship_request' | 'system_announcement'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
  metadata?: Record<string, any>
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  isRead: boolean
  messageType: 'text' | 'image' | 'file'
}

export interface Conversation {
  id: string
  participants: {
    id: string
    name: string
    avatar?: string
    role: string
    lastSeen: string
  }[]
  title: string
  lastMessage?: ChatMessage
  isGroup: boolean
  unreadCount: number
  createdAt: string
  updatedAt: string
  relatedPostingId?: string
}

export const mockNotifications: UserNotification[] = [
  {
    id: 'notif-1',
    userId: 'user-2',
    type: 'posting_interest',
    title: 'New Interest in Your Posting',
    message: 'Raj Kumar has expressed interest in your "Data Science Mentorship" posting',
    isRead: false,
    createdAt: '2024-12-19T14:30:00Z',
    actionUrl: '/postings/posting-2',
    metadata: {
      postingId: 'posting-2',
      interestedUserId: 'user-4',
      interestedUserName: 'Raj Kumar'
    }
  },
  {
    id: 'notif-2',
    userId: 'user-4',
    type: 'new_message',
    title: 'New Message from Priya Sharma',
    message: 'Thanks for your interest in data science mentorship! I\'d be happy to help...',
    isRead: false,
    createdAt: '2024-12-19T13:45:00Z',
    actionUrl: '/messages/conv-1',
    metadata: {
      conversationId: 'conv-1',
      senderId: 'user-2'
    }
  },
  {
    id: 'notif-3',
    userId: 'user-5',
    type: 'posting_approved',
    title: 'Posting Approved',
    message: 'Your posting "Digital Marketing Partnership" has been approved and is now live',
    isRead: true,
    createdAt: '2024-12-19T10:15:00Z',
    actionUrl: '/postings/posting-7',
    metadata: {
      postingId: 'posting-7'
    }
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    type: 'mentorship_request',
    title: 'New Mentorship Request',
    message: 'Sarah Johnson has requested mentorship in Machine Learning',
    isRead: false,
    createdAt: '2024-12-19T09:20:00Z',
    actionUrl: '/mentorship/requests',
    metadata: {
      requesterId: 'user-12',
      requesterName: 'Sarah Johnson'
    }
  },
  {
    id: 'notif-5',
    userId: 'user-6',
    type: 'posting_interest',
    title: 'Multiple New Interests',
    message: '3 new people are interested in your "Aerospace Engineering Guidance" posting',
    isRead: true,
    createdAt: '2024-12-18T16:30:00Z',
    actionUrl: '/postings/posting-6',
    metadata: {
      postingId: 'posting-6',
      interestCount: 3
    }
  },
  {
    id: 'notif-6',
    userId: 'user-3',
    type: 'system_announcement',
    title: 'Platform Maintenance',
    message: 'Scheduled maintenance will occur this Sunday from 2-4 AM EST',
    isRead: false,
    createdAt: '2024-12-18T12:00:00Z',
    metadata: {
      maintenanceDate: '2024-12-22T07:00:00Z'
    }
  }
]

export const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-4',
    senderName: 'Raj Kumar',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    content: 'Hi Priya, I saw your data science mentorship posting and I\'m very interested. I have a background in finance but I\'m looking to transition into data science.',
    timestamp: '2024-12-19T11:30:00Z',
    isRead: true,
    messageType: 'text'
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    senderId: 'user-2',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
    content: 'Hi Raj! Thanks for reaching out. Your finance background could actually be a great advantage in data science, especially for fintech or financial analytics roles. What specific areas are you most interested in?',
    timestamp: '2024-12-19T13:45:00Z',
    isRead: true,
    messageType: 'text'
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    senderId: 'user-4',
    senderName: 'Raj Kumar',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    content: 'I\'m particularly interested in machine learning applications for risk analysis and algorithmic trading. I have some Python experience but need to strengthen my ML skills.',
    timestamp: '2024-12-19T14:10:00Z',
    isRead: true,
    messageType: 'text'
  },
  {
    id: 'msg-4',
    conversationId: 'conv-2',
    senderId: 'user-1',
    senderName: 'Arjun Patel',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    content: 'Hi team! I wanted to discuss the upcoming tech meetup. Should we focus on AI or general software development topics?',
    timestamp: '2024-12-19T10:15:00Z',
    isRead: true,
    messageType: 'text'
  },
  {
    id: 'msg-5',
    conversationId: 'conv-2',
    senderId: 'user-2',
    senderName: 'Priya Sharma',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
    content: 'I vote for AI! There\'s so much interest in that area right now, especially with the recent developments.',
    timestamp: '2024-12-19T10:22:00Z',
    isRead: true,
    messageType: 'text'
  },
  {
    id: 'msg-6',
    conversationId: 'conv-3',
    senderId: 'user-8',
    senderName: 'Kavita Nair',
    senderAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    content: 'Thank you for your interest in financial planning guidance! I\'d be happy to help you with budgeting and investment strategies.',
    timestamp: '2024-12-19T08:45:00Z',
    isRead: false,
    messageType: 'text'
  }
]

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: [
      {
        id: 'user-4',
        name: 'Raj Kumar',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        role: 'Member',
        lastSeen: '2024-12-19T14:10:00Z'
      },
      {
        id: 'user-2',
        name: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
        role: 'Moderator',
        lastSeen: '2024-12-19T13:45:00Z'
      }
    ],
    title: 'Data Science Mentorship Discussion',
    lastMessage: mockMessages[2],
    isGroup: false,
    unreadCount: 1,
    createdAt: '2024-12-19T11:30:00Z',
    updatedAt: '2024-12-19T14:10:00Z',
    relatedPostingId: 'posting-2'
  },
  {
    id: 'conv-2',
    participants: [
      {
        id: 'user-1',
        name: 'Arjun Patel',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        role: 'Member',
        lastSeen: '2024-12-19T10:15:00Z'
      },
      {
        id: 'user-2',
        name: 'Priya Sharma',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
        role: 'Moderator',
        lastSeen: '2024-12-19T10:22:00Z'
      },
      {
        id: 'user-6',
        name: 'Meera Reddy',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        role: 'Member',
        lastSeen: '2024-12-19T09:30:00Z'
      }
    ],
    title: 'Tech Alumni Meetup Planning',
    lastMessage: mockMessages[4],
    isGroup: true,
    unreadCount: 0,
    createdAt: '2024-12-19T10:00:00Z',
    updatedAt: '2024-12-19T10:22:00Z'
  },
  {
    id: 'conv-3',
    participants: [
      {
        id: 'user-8',
        name: 'Kavita Nair',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
        role: 'Member',
        lastSeen: '2024-12-19T08:45:00Z'
      },
      {
        id: 'user-1',
        name: 'Arjun Patel',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        role: 'Member',
        lastSeen: '2024-12-19T08:30:00Z'
      }
    ],
    title: 'Financial Planning Consultation',
    lastMessage: mockMessages[5],
    isGroup: false,
    unreadCount: 1,
    createdAt: '2024-12-19T08:30:00Z',
    updatedAt: '2024-12-19T08:45:00Z',
    relatedPostingId: 'posting-4'
  }
]

export const getNotificationsByUser = (userId: string) => 
  mockNotifications.filter(notification => notification.userId === userId)

export const getUnreadNotifications = (userId: string) => 
  mockNotifications.filter(notification => notification.userId === userId && !notification.isRead)

export const getConversationsByUser = (userId: string) => 
  mockConversations.filter(conversation => 
    conversation.participants.some(p => p.id === userId)
  )

export const getMessagesByConversation = (conversationId: string) => 
  mockMessages.filter(message => message.conversationId === conversationId)

export const getNotificationStats = (userId: string) => {
  const userNotifications = getNotificationsByUser(userId)
  const unread = userNotifications.filter(n => !n.isRead).length
  const byType = {
    posting_interest: userNotifications.filter(n => n.type === 'posting_interest').length,
    new_message: userNotifications.filter(n => n.type === 'new_message').length,
    posting_approved: userNotifications.filter(n => n.type === 'posting_approved').length,
    mentorship_request: userNotifications.filter(n => n.type === 'mentorship_request').length,
    system_announcement: userNotifications.filter(n => n.type === 'system_announcement').length
  }
  
  return {
    total: userNotifications.length,
    unread,
    byType
  }
}

export const getChatStats = (userId: string) => {
  const userConversations = getConversationsByUser(userId)
  const totalUnread = userConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
  const activeChats = userConversations.filter(conv => conv.unreadCount > 0 || 
    new Date(conv.updatedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length
  
  return {
    totalConversations: userConversations.length,
    totalUnread,
    activeChats,
    groupChats: userConversations.filter(conv => conv.isGroup).length
  }
}
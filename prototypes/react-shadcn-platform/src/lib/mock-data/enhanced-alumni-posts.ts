// Enhanced Alumni Posts Data Structure - Integrating Alumni App Content
export interface AlumniPost {
  id: string
  title: string
  content: string // Can contain HTML
  image?: string
  author: string
  authorId: string
  authorAvatar?: string
  createdAt: string
  updatedAt: string
  likes: number
  comments: AlumniComment[]
  category: string
  tags: string[]
  status: 'approved' | 'pending' | 'rejected'
  organization?: string
  location?: string
  deadline?: string
  contactInfo?: string
  applicationUrl?: string
  isUrgent?: boolean
  postType: 'offering' | 'seeking'
  engagement: {
    views: number
    shares: number
  }
  approvalDetails?: {
    requestedAt: string
    reviewedAt?: string
    reviewedBy?: string
    reviewerName?: string
    comments?: string
    expiresAt?: string
  }
}

export interface AlumniComment {
  text: string
  postedBy: string
  postedById: string
  createdAt: string
}

// Enhanced Alumni Posts with rich content from Alumni app
export const enhancedAlumniPosts: AlumniPost[] = [
  {
    id: 'post-000',
    title: 'Harvard Medical School Research Fellowship 2025',
    content: `<p>Harvard Medical School is offering a prestigious research fellowship for medical students interested in neurology and neuroscience. This is a fully funded opportunity with a stipend of $35,000 for the academic year.</p><p>The fellowship includes access to state-of-the-art research facilities and mentorship from leading faculty members. Selected candidates will work on cutting-edge research projects in areas such as neurodegeneration, brain imaging, and cognitive neuroscience.</p><p>Requirements include excellent academic standing, previous research experience, and a strong interest in neuroscience.</p>`,
    image: '/images/opportunities/harvard_logo.png',
    author: 'Dr. Elizabeth Chen',
    authorId: '10001',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
    createdAt: '2025-04-01T09:00:00Z',
    updatedAt: '2025-04-01T09:00:00Z',
    likes: 42,
    comments: [
      {
        text: 'This is an amazing opportunity! Does it require USMLE scores?',
        postedBy: 'Priya Sharma',
        postedById: '10022',
        createdAt: '2025-04-01T10:30:00Z'
      },
      {
        text: 'I participated in this fellowship last year and it was transformative for my career. Highly recommend applying!',
        postedBy: 'James Wilson',
        postedById: '10035',
        createdAt: '2025-04-01T14:15:00Z'
      },
      {
        text: 'Are international students eligible for this fellowship?',
        postedBy: 'Ahmed Hassan',
        postedById: '10042',
        createdAt: '2025-04-02T08:45:00Z'
      }
    ],
    category: 'Research',
    tags: ['Harvard', 'Medical', 'Neuroscience', 'Fellowship'],
    status: 'approved',
    organization: 'Harvard Medical School',
    location: 'Boston, Massachusetts',
    deadline: '2025-05-15T23:59:59Z',
    contactInfo: 'fellowships@hms.harvard.edu',
    applicationUrl: 'https://hms.harvard.edu/fellowships/neuroscience',
    isUrgent: true,
    postType: 'offering',
    engagement: {
      views: 1247,
      shares: 23
    },
    approvalDetails: {
      requestedAt: '2025-03-31T16:20:00Z',
      reviewedAt: '2025-04-01T08:30:00Z',
      reviewedBy: 'moderator-001',
      reviewerName: 'Dr. Smith',
      comments: 'Approved. Information verified with Harvard Medical School.',
      expiresAt: '2025-06-01T00:00:00Z'
    }
  },
  {
    id: 'post-001',
    title: 'Yale University Summer Internship 2025',
    content: 'Exciting opportunity! Apply for the Yale University Summer Internship 2025 in Senator Warnock\'s Office. Study in the USA and gain valuable experience. This internship offers hands-on experience in government policy and public service.',
    image: '/images/opportunities/Internship_1.png',
    author: 'Deepa Jaivadivel',
    authorId: '10008',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    createdAt: '2025-03-20T10:00:00Z',
    updatedAt: '2025-03-20T10:00:00Z',
    likes: 25,
    comments: [
      {
        text: 'This looks amazing! Does anyone know the eligibility criteria?',
        postedBy: 'Vedanth Sundaresh',
        postedById: '10010',
        createdAt: '2025-03-20T11:00:00Z'
      },
      {
        text: 'I applied last year and it was a life-changing experience! Highly recommend.',
        postedBy: 'Meenakshi Prabu',
        postedById: '10014',
        createdAt: '2025-03-20T14:30:00Z'
      }
    ],
    category: 'Internships',
    tags: ['Yale', 'Summer', 'USA', 'Government'],
    status: 'approved',
    organization: 'Yale University',
    location: 'New Haven, CT',
    deadline: '2025-04-30T23:59:59Z',
    contactInfo: 'internships@yale.edu',
    applicationUrl: 'https://yale.edu/internships/summer2025',
    isUrgent: false,
    postType: 'offering',
    engagement: {
      views: 892,
      shares: 15
    },
    approvalDetails: {
      requestedAt: '2025-03-19T15:00:00Z',
      reviewedAt: '2025-03-20T09:00:00Z',
      reviewedBy: 'moderator-001',
      reviewerName: 'Dr. Smith',
      comments: 'Approved. Information verified with Yale University.'
    }
  },
  {
    id: 'post-010',
    title: 'Research Assistant Position at MIT Labs',
    content: '<p>MIT Labs is seeking Research Assistants for Fall 2025. Full funding available for selected candidates.</p><p>Research areas include:</p><ul><li>Artificial Intelligence and Machine Learning</li><li>Quantum Computing and Information Theory</li><li>Computational Biology and Bioinformatics</li><li>Robotics and Autonomous Systems</li></ul><p>We offer competitive stipends, access to cutting-edge facilities, and mentorship from world-renowned faculty.</p>',
    image: '/images/opportunities/research_mit.png',
    author: 'Adrith Sai',
    authorId: '10031',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    createdAt: '2025-03-22T14:30:00Z',
    updatedAt: '2025-03-22T14:30:00Z',
    likes: 12,
    comments: [
      {
        text: 'What are the minimum GPA requirements?',
        postedBy: 'Bhavish Alapati',
        postedById: '10051',
        createdAt: '2025-03-22T16:00:00Z'
      }
    ],
    category: 'Research',
    tags: ['MIT', 'Research', 'AI', 'Quantum Computing'],
    status: 'approved',
    organization: 'Massachusetts Institute of Technology',
    location: 'Cambridge, Massachusetts',
    deadline: '2025-06-30T23:59:59Z',
    contactInfo: 'mitlabs@mit.edu',
    applicationUrl: 'https://mitlabs.mit.edu/apply',
    isUrgent: true,
    postType: 'offering',
    engagement: {
      views: 654,
      shares: 8
    },
    approvalDetails: {
      requestedAt: '2025-03-22T14:30:00Z',
      reviewedAt: '2025-03-22T15:45:00Z',
      reviewedBy: 'moderator-002',
      reviewerName: 'Prof. Johnson',
      comments: 'Approved. Information verified from MIT\'s official website.',
      expiresAt: '2025-07-30T00:00:00Z'
    }
  },
  {
    id: 'post-011',
    title: 'Stanford Summer Research Program 2025',
    content: '<p>Apply for Stanford\'s prestigious summer research program in Computer Science and Engineering.</p><p><strong>Program Details:</strong></p><ul><li>Duration: 10 weeks (June - August)</li><li>Stipend: $8,000</li><li>Housing provided on campus</li><li>Research areas: AI, HCI, Systems, Theory</li></ul><p>This program is designed for undergraduate students interested in pursuing graduate studies in CS.</p>',
    image: '/images/opportunities/stanford_research.jpg',
    author: 'Varnika Hagalwadi',
    authorId: '10038',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    createdAt: '2025-03-21T09:15:00Z',
    updatedAt: '2025-03-21T16:20:00Z',
    likes: 8,
    comments: [
      {
        text: 'Is this open to international students?',
        postedBy: 'Sahasra Gongidi',
        postedById: '10068',
        createdAt: '2025-03-21T11:00:00Z'
      }
    ],
    category: 'Research',
    tags: ['Stanford', 'Research', 'Summer', 'Computer Science'],
    status: 'approved',
    organization: 'Stanford University',
    location: 'Stanford, California',
    deadline: '2025-04-15T23:59:59Z',
    contactInfo: 'summer-research@stanford.edu',
    applicationUrl: 'https://stanford.edu/summer-research',
    isUrgent: true,
    postType: 'offering',
    engagement: {
      views: 743,
      shares: 12
    },
    approvalDetails: {
      requestedAt: '2025-03-21T09:15:00Z',
      reviewedAt: '2025-03-21T16:20:00Z',
      reviewedBy: 'moderator-002',
      reviewerName: 'Prof. Johnson',
      comments: 'Approved. Program details verified from department website.',
      expiresAt: '2025-05-15T00:00:00Z'
    }
  },
  {
    id: 'post-013',
    title: 'Need Advice on Medical School Applications',
    content: '<p>I\'m a pre-med student planning to apply to medical schools this year. I\'m specifically interested in neurology specialization and looking for advice on research experience requirements.</p><p>I have a 3.8 GPA and have worked in a research lab for one semester, but I\'m wondering if this is enough. Any guidance from current medical students or doctors would be greatly appreciated!</p><p><strong>Specific questions:</strong></p><ul><li>How much research experience is competitive?</li><li>Should I focus on neurology-specific research?</li><li>Any recommendations for gap year research positions?</li></ul>',
    author: 'Aisha Khan',
    authorId: '10062',
    authorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    createdAt: '2025-03-25T16:45:00Z',
    updatedAt: '2025-03-25T16:45:00Z',
    likes: 5,
    comments: [
      {
        text: 'I\'m a second-year medical student. I\'d recommend at least a year of research experience for neurology. Feel free to DM me for more specific advice!',
        postedBy: 'Michael Chen',
        postedById: '10073',
        createdAt: '2025-03-25T18:20:00Z'
      }
    ],
    category: 'Admissions',
    tags: ['Medical School', 'Neurology', 'Applications', 'Research'],
    status: 'approved',
    location: 'Online',
    deadline: '2025-04-10T23:59:59Z',
    isUrgent: true,
    postType: 'seeking',
    engagement: {
      views: 312,
      shares: 5
    },
    approvalDetails: {
      requestedAt: '2025-03-25T16:45:00Z',
      reviewedAt: '2025-03-25T17:30:00Z',
      reviewedBy: 'moderator-001',
      reviewerName: 'Dr. Smith',
      comments: 'Approved. Legitimate request for advice.',
      expiresAt: '2025-04-25T00:00:00Z'
    }
  },
  {
    id: 'post-012',
    title: 'Google Summer Internship 2025',
    content: '<p>Google is accepting applications for Summer 2025 internships across multiple teams and locations.</p><p><strong>Available Positions:</strong></p><ul><li>Software Engineering (Frontend, Backend, Mobile)</li><li>UX Design and Research</li><li>Product Management</li><li>Data Science and Analytics</li><li>Cloud Engineering</li></ul><p>We offer competitive compensation, mentorship from senior engineers, and the opportunity to work on products used by billions of people worldwide.</p>',
    author: 'Siddhant Peddi',
    authorId: '10048',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    createdAt: '2025-03-23T11:00:00Z',
    updatedAt: '2025-03-23T11:00:00Z',
    likes: 15,
    comments: [
      {
        text: 'When is the application deadline?',
        postedBy: 'Vahni Kurra',
        postedById: '10007',
        createdAt: '2025-03-23T13:00:00Z'
      }
    ],
    category: 'Internships',
    tags: ['Google', 'Tech', 'Summer', 'Software'],
    status: 'approved',
    organization: 'Google',
    location: 'Multiple Locations',
    deadline: '2025-04-30T23:59:59Z',
    contactInfo: 'university-programs@google.com',
    applicationUrl: 'https://careers.google.com/students/',
    isUrgent: true,
    postType: 'offering',
    engagement: {
      views: 1523,
      shares: 31
    },
    approvalDetails: {
      requestedAt: '2025-03-23T11:00:00Z',
      reviewedAt: '2025-03-23T12:30:00Z',
      reviewedBy: 'moderator-001',
      reviewerName: 'Dr. Smith',
      comments: 'Approved. Details verified from Google Careers page.',
      expiresAt: '2025-05-30T00:00:00Z'
    }
  }
]

// Helper functions for filtering and searching
export const getPostsByStatus = (status: AlumniPost['status']) =>
  enhancedAlumniPosts.filter(post => post.status === status)

export const getPostsByType = (type: AlumniPost['postType']) =>
  enhancedAlumniPosts.filter(post => post.postType === type)

export const getPostsByCategory = (category: string) =>
  enhancedAlumniPosts.filter(post => post.category === category)

export const getPostById = (id: string) =>
  enhancedAlumniPosts.find(post => post.id === id)

export const getUrgentPosts = () =>
  enhancedAlumniPosts.filter(post => post.isUrgent && post.status === 'approved')

export const searchPosts = (query: string, filters: {
  category?: string
  type?: AlumniPost['postType']
  status?: AlumniPost['status']
  isUrgent?: boolean
} = {}) => {
  return enhancedAlumniPosts.filter(post => {
    if (query) {
      const searchTerm = query.toLowerCase()
      const matchesQuery = 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        post.author.toLowerCase().includes(searchTerm)
      
      if (!matchesQuery) return false
    }
    
    if (filters.category && post.category !== filters.category) return false
    if (filters.type && post.postType !== filters.type) return false
    if (filters.status && post.status !== filters.status) return false
    if (filters.isUrgent !== undefined && post.isUrgent !== filters.isUrgent) return false
    
    return true
  })
}

// Function to get personalized posts for a user based on their preferences
export const getPersonalizedAlumniPosts = (userPreferences?: {
  domains?: string[]
  interests?: string[]
}) => {
  if (!userPreferences?.domains) return enhancedAlumniPosts.filter(post => post.status === 'approved')
  
  return enhancedAlumniPosts.filter(post => 
    post.status === 'approved' &&
    userPreferences.domains!.some(domain => 
      post.category === domain || post.tags.some(tag => tag.toLowerCase().includes(domain.toLowerCase()))
    )
  )
}
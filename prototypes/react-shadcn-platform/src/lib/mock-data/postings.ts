export interface Posting {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  tags: string[]
  authorId: string
  authorName: string
  authorAvatar?: string
  type: 'offer' | 'seek'
  status: 'active' | 'expired' | 'fulfilled' | 'pending_review'
  createdAt: string
  expiresAt: string
  updatedAt: string
  contactInfo: {
    email: string
    phone?: string
    linkedIn?: string
    website?: string
    preferredMethod: 'email' | 'phone' | 'linkedin' | 'platform'
  }
  location?: string
  remote: boolean
  engagement: {
    views: number
    likes: number
    comments: number
    interested: number
  }
  interestedUsers: string[]
}

export const mockPostings: Posting[] = [
  {
    id: 'posting-1',
    title: 'Seeking Mentorship in Machine Learning Career Transition',
    description: 'I am a software engineer with 3 years of experience looking to transition into machine learning. I would love to connect with someone who has successfully made this transition or is working in ML/AI. Specifically interested in learning about the required skills, best learning resources, and potential career paths. I have basic knowledge of Python and statistics but need guidance on advanced topics like deep learning frameworks and practical project experience.',
    category: 'Technology',
    subcategory: 'Machine Learning',
    tags: ['Machine Learning', 'Career Transition', 'Mentorship', 'Python', 'Deep Learning'],
    authorId: 'user-4',
    authorName: 'Raj Kumar',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    type: 'seek',
    status: 'active',
    createdAt: '2024-12-15',
    expiresAt: '2025-01-15',
    updatedAt: '2024-12-15',
    contactInfo: {
      email: 'raj.kumar@example.com',
      linkedIn: 'https://linkedin.com/in/rajkumar',
      preferredMethod: 'email'
    },
    location: 'Chicago, IL',
    remote: true,
    engagement: {
      views: 45,
      likes: 12,
      comments: 8,
      interested: 5
    },
    interestedUsers: ['user-1', 'user-2', 'user-5', 'user-7', 'user-8']
  },
  {
    id: 'posting-2',
    title: 'Offering Data Science Mentorship for New Graduates',
    description: 'I am a Lead Data Scientist with 6+ years of experience at DataCorp Analytics. I am offering mentorship to recent graduates or professionals looking to break into data science. I can help with technical skills (Python, R, ML algorithms), portfolio building, interview preparation, and career guidance. I have mentored 15+ professionals successfully into data science roles. Available for 1-hour monthly sessions via video call.',
    category: 'Technology',
    subcategory: 'Data Science',
    tags: ['Data Science', 'Mentorship', 'Career Guidance', 'Python', 'Portfolio Building'],
    authorId: 'user-2',
    authorName: 'Priya Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
    type: 'offer',
    status: 'active',
    createdAt: '2024-12-10',
    expiresAt: '2025-02-10',
    updatedAt: '2024-12-18',
    contactInfo: {
      email: 'priya.sharma@example.com',
      linkedIn: 'https://linkedin.com/in/priyasharma',
      preferredMethod: 'email'
    },
    location: 'New York, NY',
    remote: true,
    engagement: {
      views: 123,
      likes: 34,
      comments: 15,
      interested: 12
    },
    interestedUsers: ['user-4', 'user-7', 'user-9', 'user-10', 'user-11', 'user-12', 'user-13', 'user-14', 'user-15', 'user-16', 'user-17', 'user-18']
  },
  {
    id: 'posting-3',
    title: 'Looking for Collaboration on Healthcare IoT Startup',
    description: 'I am developing a healthcare IoT platform for remote patient monitoring and seeking collaborators with expertise in biomedical engineering, regulatory compliance, or healthcare technology commercialization. The project involves wearable sensors for chronic disease management. Looking for co-founders or advisors who can contribute to technical development, FDA approval process, or business development. Potential for equity participation.',
    category: 'Healthcare',
    subcategory: 'Medical Research',
    tags: ['Healthcare', 'IoT', 'Startup', 'Biomedical Engineering', 'FDA Regulatory'],
    authorId: 'user-4',
    authorName: 'Anita Desai',
    authorAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    type: 'seek',
    status: 'active',
    createdAt: '2024-12-12',
    expiresAt: '2025-03-12',
    updatedAt: '2024-12-16',
    contactInfo: {
      email: 'anita.desai@example.com',
      website: 'https://anitadesai-research.com',
      linkedIn: 'https://linkedin.com/in/anitadesai',
      preferredMethod: 'email'
    },
    location: 'Boston, MA',
    remote: false,
    engagement: {
      views: 78,
      likes: 23,
      comments: 11,
      interested: 7
    },
    interestedUsers: ['user-6', 'user-8', 'user-9', 'user-11', 'user-13', 'user-15', 'user-17']
  },
  {
    id: 'posting-4',
    title: 'Offering Financial Planning and Investment Guidance',
    description: 'Certified Financial Planner with 8 years of experience offering pro bono financial guidance to recent graduates and early-career professionals. Services include budgeting, investment portfolio planning, retirement planning, and debt management strategies. Particularly interested in helping fellow alumni navigate student loan repayment and building long-term wealth. Available for quarterly consultations and ongoing support.',
    category: 'Business & Finance',
    subcategory: 'Financial Planning',
    tags: ['Financial Planning', 'Investment', 'Budgeting', 'Career Finance', 'Student Loans'],
    authorId: 'user-8',
    authorName: 'Kavita Nair',
    authorAvatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    type: 'offer',
    status: 'active',
    createdAt: '2024-12-08',
    expiresAt: '2025-06-08',
    updatedAt: '2024-12-18',
    contactInfo: {
      email: 'kavita.nair@example.com',
      phone: '+1 (555) 890-1234',
      website: 'https://nairassociates.com',
      preferredMethod: 'email'
    },
    location: 'Washington, DC',
    remote: true,
    engagement: {
      views: 156,
      likes: 42,
      comments: 19,
      interested: 18
    },
    interestedUsers: ['user-1', 'user-4', 'user-5', 'user-7', 'user-9', 'user-10', 'user-11', 'user-12', 'user-13', 'user-14', 'user-15', 'user-16', 'user-17', 'user-18', 'user-19', 'user-20', 'user-21', 'user-22']
  },
  {
    id: 'posting-5',
    title: 'Need Advice on Sustainable Engineering Project',
    description: 'Environmental engineering student working on capstone project focused on waste-to-energy solutions for rural communities. Seeking guidance from experienced environmental engineers or sustainability consultants. Project involves technical feasibility analysis, community impact assessment, and implementation strategy. Would appreciate insights on real-world challenges, regulatory considerations, and successful case studies.',
    category: 'Engineering',
    subcategory: 'Environmental Engineering',
    tags: ['Environmental Engineering', 'Sustainability', 'Student Project', 'Waste Management', 'Rural Development'],
    authorId: 'user-7',
    authorName: 'Amit Gupta',
    authorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    type: 'seek',
    status: 'active',
    createdAt: '2024-12-14',
    expiresAt: '2025-04-14',
    updatedAt: '2024-12-14',
    contactInfo: {
      email: 'amit.gupta@example.com',
      linkedIn: 'https://linkedin.com/in/amitgupta',
      preferredMethod: 'email'
    },
    location: 'Portland, OR',
    remote: true,
    engagement: {
      views: 67,
      likes: 19,
      comments: 9,
      interested: 6
    },
    interestedUsers: ['user-6', 'user-8', 'user-12', 'user-14', 'user-16', 'user-18']
  },
  {
    id: 'posting-6',
    title: 'Aerospace Engineering Career Guidance Available',
    description: 'Principal Engineer at Aerospace Dynamics with 12+ years of experience in propulsion systems design. Offering career mentorship for aerospace engineering students and early-career engineers. Can provide insights into industry trends, technical skill development, project management in aerospace, and career advancement strategies. Also available for technical project reviews and internship guidance.',
    category: 'Engineering',
    subcategory: 'Aerospace Engineering',
    tags: ['Aerospace Engineering', 'Career Mentorship', 'Propulsion Systems', 'Project Management', 'Technical Guidance'],
    authorId: 'user-6',
    authorName: 'Meera Reddy',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    type: 'offer',
    status: 'active',
    createdAt: '2024-12-11',
    expiresAt: '2025-03-11',
    updatedAt: '2024-12-19',
    contactInfo: {
      email: 'meera.reddy@example.com',
      linkedIn: 'https://linkedin.com/in/meerareddy',
      preferredMethod: 'email'
    },
    location: 'Seattle, WA',
    remote: true,
    engagement: {
      views: 89,
      likes: 28,
      comments: 12,
      interested: 9
    },
    interestedUsers: ['user-7', 'user-10', 'user-12', 'user-15', 'user-17', 'user-19', 'user-21', 'user-23', 'user-25']
  },
  {
    id: 'posting-7',
    title: 'Seeking Partnership for Digital Marketing Agency',
    description: 'Looking for a business partner to co-found a digital marketing agency focused on small businesses and startups. I bring 4+ years of digital marketing experience and client relationships. Seeking someone with complementary skills in business development, operations, or specialized marketing areas (SEO, PPC, content marketing). Interested in establishing a presence in the LA market with potential for expansion.',
    category: 'Business & Finance',
    subcategory: 'Marketing',
    tags: ['Digital Marketing', 'Business Partnership', 'Startup', 'Small Business', 'Entrepreneurship'],
    authorId: 'user-5',
    authorName: 'Vikram Singh',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    type: 'seek',
    status: 'pending_review',
    createdAt: '2024-12-16',
    expiresAt: '2025-06-16',
    updatedAt: '2024-12-16',
    contactInfo: {
      email: 'vikram.singh@example.com',
      phone: '+1 (555) 567-8901',
      linkedIn: 'https://linkedin.com/in/vikramsingh',
      preferredMethod: 'email'
    },
    location: 'Los Angeles, CA',
    remote: false,
    engagement: {
      views: 23,
      likes: 7,
      comments: 3,
      interested: 2
    },
    interestedUsers: ['user-8', 'user-12']
  }
]

export const getPostingsByStatus = (status: Posting['status']) => 
  mockPostings.filter(posting => posting.status === status)

export const getPostingsByType = (type: Posting['type']) => 
  mockPostings.filter(posting => posting.type === type)

export const getPostingsByCategory = (category: string) => 
  mockPostings.filter(posting => posting.category === category)

export const getPostingById = (id: string) => 
  mockPostings.find(posting => posting.id === id)

export const getPostingsByAuthor = (authorId: string) => 
  mockPostings.filter(posting => posting.authorId === authorId)

export const getPostingsStats = () => {
  const total = mockPostings.length
  const active = mockPostings.filter(p => p.status === 'active').length
  const seeking = mockPostings.filter(p => p.type === 'seek' && p.status === 'active').length
  const offering = mockPostings.filter(p => p.type === 'offer' && p.status === 'active').length
  const pendingReview = mockPostings.filter(p => p.status === 'pending_review').length
  const totalViews = mockPostings.reduce((sum, p) => sum + p.engagement.views, 0)
  const totalInterested = mockPostings.reduce((sum, p) => sum + p.engagement.interested, 0)
  
  const categories = [...new Set(mockPostings.map(p => p.category))]
  const categoryStats = categories.map(category => ({
    name: category,
    count: mockPostings.filter(p => p.category === category).length
  }))
  
  return {
    total,
    active,
    seeking,
    offering,
    pendingReview,
    totalViews,
    totalInterested,
    averageViews: Math.round(totalViews / total),
    categories: categoryStats
  }
}

export const searchPostings = (query: string, filters: {
  category?: string
  type?: Posting['type']
  status?: Posting['status']
  remote?: boolean
} = {}) => {
  return mockPostings.filter(posting => {
    if (query) {
      const searchTerm = query.toLowerCase()
      const matchesQuery = 
        posting.title.toLowerCase().includes(searchTerm) ||
        posting.description.toLowerCase().includes(searchTerm) ||
        posting.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        posting.authorName.toLowerCase().includes(searchTerm)
      
      if (!matchesQuery) return false
    }
    
    if (filters.category && posting.category !== filters.category) return false
    if (filters.type && posting.type !== filters.type) return false
    if (filters.status && posting.status !== filters.status) return false
    if (filters.remote !== undefined && posting.remote !== filters.remote) return false
    
    return true
  })
}
export interface AlumniOpportunity {
  id: string
  title: string
  description: string
  
  // Legacy app features
  type: 'internship' | 'scholarship' | 'college' | 'job' | 'mentorship' | 'networking' | 'research'
  image?: string // New: Support for opportunity images
  tags: string[] // New: Enhanced tagging system
  
  // Organization details
  company?: string
  organization?: string
  institution?: string
  
  // Enhanced career features
  industryCategory: string
  skillsRequired: string[]
  experienceLevel: 'entry' | 'mid' | 'senior' | 'any'
  careerStage: 'student' | 'recent-grad' | 'professional' | 'senior-professional' | 'any'
  
  // Interactive features from legacy
  interestLink?: string
  commentLink?: string
  
  // Enhanced metadata
  location: string
  remote: boolean
  salaryRange?: {
    min: number
    max: number
    currency: string
  }
  applicationDeadline?: string
  requirements: string[]
  benefits: string[]
  
  // Engagement tracking
  postedBy: {
    id: string
    name: string
    title: string
    company: string
    avatar?: string
  }
  postedDate: string
  expiryDate?: string
  status: 'active' | 'expired' | 'filled'
  
  // Analytics
  views: number
  applications: number
  favorites: number
  
  // Social features
  isSponsored: boolean
  isPriority: boolean
  isVerified: boolean
}

// Real opportunity data from legacy SGS Alumni application
export const mockAlumniOpportunities: AlumniOpportunity[] = [
  {
    id: 'post-000',
    title: 'Harvard Medical School Research Fellowship 2025',
    description: 'Harvard Medical School is offering a prestigious research fellowship for medical students interested in neurology and neuroscience. This is a fully funded opportunity with a stipend of $35,000 for the academic year. The fellowship includes access to state-of-the-art research facilities and mentorship from leading faculty members. Selected candidates will work on cutting-edge research projects in areas such as neurodegeneration, brain imaging, and cognitive neuroscience. Requirements include excellent academic standing, previous research experience, and a strong interest in neuroscience.',
    type: 'research',
    image: '/images/opportunities/harvard_logo.png',
    tags: ['Harvard', 'Medical', 'Neuroscience', 'Fellowship'],
    
    organization: 'Harvard Medical School',
    industryCategory: 'Medical Research',
    skillsRequired: ['Research Experience', 'Neuroscience Knowledge', 'Academic Excellence'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Boston, Massachusetts',
    remote: false,
    salaryRange: {
      min: 35000,
      max: 35000,
      currency: 'USD'
    },
    applicationDeadline: '2025-05-15',
    requirements: [
      'Excellent academic standing',
      'Previous research experience', 
      'Strong interest in neuroscience',
      'Medical student status'
    ],
    benefits: [
      'Fully funded fellowship',
      '$35,000 annual stipend',
      'Access to state-of-the-art research facilities',
      'Mentorship from leading faculty',
      'Work on cutting-edge research projects'
    ],
    
    postedBy: {
      id: '10001',
      name: 'Dr. Elizabeth Chen',
      title: 'Research Director',
      company: 'Harvard Medical School',
      avatar: '/images/avatars/elizabeth-chen.jpg'
    },
    postedDate: '2025-04-01',
    expiryDate: '2025-06-01',
    status: 'active',
    
    views: 342,
    applications: 42,
    favorites: 67,
    
    isSponsored: false,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://hms.harvard.edu/fellowships/neuroscience',
    commentLink: '/opportunities/post-000/comments'
  },

  {
    id: 'post-001',
    title: 'Yale University Summer Internship 2025',
    description: 'Yale University offers a prestigious summer internship program in collaboration with Senator Warnock\'s Office. This program provides students with valuable experience in government and policy work while studying in the USA. Participants gain exposure to both academic excellence and practical government operations.',
    type: 'internship',
    image: '/images/opportunities/Internship_1.png',
    tags: ['Yale', 'Summer', 'USA', 'Government', 'Political Science'],
    
    organization: 'Yale University',
    company: 'Senator Warnock\'s Office',
    industryCategory: 'Government / Political Science',
    skillsRequired: ['Academic Excellence', 'Political Interest', 'Communication Skills'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'New Haven, Connecticut / Washington DC',
    remote: false,
    applicationDeadline: '2025-06-20',
    requirements: [
      'Current university student',
      'Interest in political science or government',
      'Strong academic record',
      'Excellent communication skills'
    ],
    benefits: [
      'Experience in prestigious institution',
      'Government and academic exposure',
      'Networking opportunities',
      'Resume enhancement',
      'Mentorship from faculty and staff'
    ],
    
    postedBy: {
      id: '10008',
      name: 'Deepa Jaivadivel',
      title: 'Alumni Coordinator',
      company: 'Yale University Alumni Network',
      avatar: '/images/avatars/deepa-jaivadivel.jpg'
    },
    postedDate: '2025-03-20',
    expiryDate: '2025-06-20',
    status: 'active',
    
    views: 225,
    applications: 25,
    favorites: 38,
    
    isSponsored: false,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://world.yale.edu/internships',
    commentLink: '/opportunities/post-001/comments'
  },

  {
    id: 'post-002',
    title: 'CSIS Internships 2025 in USA',
    description: 'The Center for Strategic and International Studies offers paid internship opportunities for students from around the world. These positions provide exposure to policy research and international affairs. Application deadlines vary by program, and international students are encouraged to apply.',
    type: 'internship',
    image: '/images/opportunities/Internship_2.png',
    tags: ['CSIS', 'USA', 'Paid', 'International', 'Policy'],
    
    organization: 'Center for Strategic and International Studies',
    industryCategory: 'Policy Research / Think Tank',
    skillsRequired: ['Policy Research', 'Writing Skills', 'International Relations'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Washington, DC',
    remote: false,
    requirements: [
      'Current university student',
      'Interest in international affairs',
      'Strong writing and research skills',
      'Open to international students'
    ],
    benefits: [
      'Paid internship opportunity',
      'Experience at prestigious think tank',
      'Policy research exposure',
      'Networking in Washington DC',
      'International perspective development'
    ],
    
    postedBy: {
      id: 'student-002',
      name: 'Student Jane',
      title: 'Alumni Ambassador',
      company: 'SGS Alumni Network',
      avatar: '/images/avatars/student-jane.jpg'
    },
    postedDate: '2025-03-20',
    status: 'active',
    
    views: 118,
    applications: 18,
    favorites: 25,
    
    isSponsored: false,
    isPriority: false,
    isVerified: false,
    
    interestLink: 'https://www.csis.org/programs/internships-fellowships',
    commentLink: '/opportunities/post-002/comments'
  },

  {
    id: 'post-003',
    title: 'WISE Summer 2025 Internships',
    description: 'Washington Internships for Students of Engineering (WISE) offers summer internship opportunities for engineering students. The program, recognized by The Princeton Review as one of the top programs in the U.S., focuses on the intersection of engineering and public policy. Application deadline is February 1, 2025.',
    type: 'internship',
    image: '/images/opportunities/Internship_3.jpg',
    tags: ['WISE', 'Summer', 'Engineering', 'Princeton Review'],
    
    organization: 'WISE (Washington Internships for Students of Engineering)',
    industryCategory: 'Engineering',
    skillsRequired: ['Engineering Knowledge', 'Policy Interest', 'Communication'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Washington, DC',
    remote: false,
    applicationDeadline: '2025-02-01',
    requirements: [
      'Engineering student (all disciplines)',
      'Strong academic record',
      'Interest in policy and engineering intersection',
      'Leadership experience preferred'
    ],
    benefits: [
      'Top-ranked program by Princeton Review',
      'Engineering policy exposure',
      'Washington DC experience',
      'Professional development',
      'Networking opportunities'
    ],
    
    postedBy: {
      id: 'student-004',
      name: 'Student Mike',
      title: 'Engineering Alumni',
      company: 'SGS Alumni Network',
      avatar: '/images/avatars/student-mike.jpg'
    },
    postedDate: '2025-03-20',
    expiryDate: '2025-02-15',
    status: 'expired',
    
    views: 230,
    applications: 30,
    favorites: 42,
    
    isSponsored: false,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://wise-intern.org',
    commentLink: '/opportunities/post-003/comments'
  },

  {
    id: 'post-004',
    title: 'North South University MS in CSE Spring 2025',
    description: 'Pursue your Master of Science in Computer Science and Engineering at North South University! Apply for Spring 2025 by 27 November 2024. Admission test on 29 November 2024. Visit www.northsouth.edu for more info!',
    type: 'college',
    image: '/images/opportunities/Admission_1.jpg',
    tags: ['North South University', 'MS', 'CSE', 'Spring', 'Computer Science'],
    
    institution: 'North South University',
    industryCategory: 'Education',
    skillsRequired: ['Computer Science Background', 'Academic Excellence', 'Programming'],
    experienceLevel: 'entry',
    careerStage: 'recent-grad',
    
    location: 'Dhaka, Bangladesh',
    remote: false,
    applicationDeadline: '2024-11-27',
    requirements: [
      'Bachelor\'s degree in Computer Science or related field',
      'Strong academic record',
      'Pass admission test on November 29, 2024',
      'Meeting university admission criteria'
    ],
    benefits: [
      'Comprehensive MS in CSE program',
      'Research opportunities',
      'Experienced faculty',
      'Modern facilities',
      'Industry connections'
    ],
    
    postedBy: {
      id: 'admin-nsu',
      name: 'Admin NSU Admissions',
      title: 'Admissions Officer',
      company: 'North South University',
      avatar: '/images/avatars/nsu-admissions.jpg'
    },
    postedDate: '2025-03-21',
    expiryDate: '2024-12-01',
    status: 'expired',
    
    views: 112,
    applications: 12,
    favorites: 28,
    
    isSponsored: false,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://www.northsouth.edu',
    commentLink: '/opportunities/post-004/comments'
  },

  {
    id: 'post-008',
    title: 'UCSI University Trust Scholarship 2025',
    description: 'UCSI University Trust Scholarship 2025 offers RM 30 million in funding! Open to undergraduate and postgraduate students. Apply by 15 March 2025 at www.ucsiuniversitytrust.com!',
    type: 'scholarship',
    image: '/images/opportunities/Scholarship3.jpg',
    tags: ['UCSI', 'Trust', 'Funding', 'Malaysia', 'Undergraduate', 'Postgraduate'],
    
    organization: 'UCSI University Trust',
    industryCategory: 'Education',
    skillsRequired: ['Academic Excellence', 'Leadership Potential'],
    experienceLevel: 'any',
    careerStage: 'student',
    
    location: 'Malaysia',
    remote: false,
    salaryRange: {
      min: 30000000,
      max: 30000000,
      currency: 'RM'
    },
    applicationDeadline: '2025-03-15',
    requirements: [
      'Undergraduate or postgraduate student status',
      'Strong academic record',
      'Demonstrate financial need',
      'Leadership qualities preferred'
    ],
    benefits: [
      'RM 30 million total funding available',
      'Full or partial tuition coverage',
      'Living allowance possible',
      'Academic support',
      'Career guidance'
    ],
    
    postedBy: {
      id: 'admin-ucsi',
      name: 'Admin UCSI Trust',
      title: 'Scholarship Coordinator',
      company: 'UCSI University Trust',
      avatar: '/images/avatars/ucsi-trust.jpg'
    },
    postedDate: '2025-03-22',
    expiryDate: '2025-03-20',
    status: 'active',
    
    views: 222,
    applications: 22,
    favorites: 55,
    
    isSponsored: true,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://www.ucsiuniversitytrust.com',
    commentLink: '/opportunities/post-008/comments'
  },
  
  {
    id: 'post-010',
    title: 'Research Assistant Position at MIT Labs',
    description: 'MIT Labs is seeking Research Assistants for Fall 2025. Full funding available for selected candidates. Areas: AI, Machine Learning, and Quantum Computing.',
    type: 'research',
    image: '/images/opportunities/research_mit.png',
    tags: ['MIT', 'Research', 'AI', 'Quantum Computing', 'Machine Learning'],
    
    organization: 'Massachusetts Institute of Technology',
    industryCategory: 'Research / Technology',
    skillsRequired: ['AI Knowledge', 'Machine Learning', 'Quantum Computing', 'Research Skills'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Cambridge, Massachusetts',
    remote: false,
    applicationDeadline: '2025-06-30',
    requirements: [
      'Strong background in AI or related field',
      'Programming experience',
      'Research interest in specified areas',
      'Minimum GPA requirements'
    ],
    benefits: [
      'Full funding available',
      'Work with cutting-edge technology',
      'MIT research environment',
      'Mentorship from top researchers',
      'Publication opportunities'
    ],
    
    postedBy: {
      id: '10031',
      name: 'Adrith Sai',
      title: 'Research Coordinator',
      company: 'MIT Labs',
      avatar: '/images/avatars/adrith-sai.jpg'
    },
    postedDate: '2025-03-22',
    expiryDate: '2025-07-15',
    status: 'active',
    
    views: 412,
    applications: 12,
    favorites: 89,
    
    isSponsored: false,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://mitlabs.mit.edu/apply',
    commentLink: '/opportunities/post-010/comments'
  },
  
  {
    id: 'post-011',
    title: 'Stanford Summer Research Program 2025',
    description: 'Apply for Stanford\'s prestigious summer research program. Stipend: $8000. Duration: 10 weeks.',
    type: 'research',
    image: '/images/opportunities/stanford_research.jpg',
    tags: ['Stanford', 'Research', 'Summer', 'Stipend'],
    
    organization: 'Stanford University',
    industryCategory: 'Research / Education',
    skillsRequired: ['Research Interest', 'Academic Excellence', 'Independent Work'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Stanford, California',
    remote: false,
    salaryRange: {
      min: 8000,
      max: 8000,
      currency: 'USD'
    },
    requirements: [
      'Undergraduate or graduate student',
      'Strong academic record',
      'Research interest',
      'International students welcome'
    ],
    benefits: [
      '$8,000 summer stipend',
      '10-week intensive program',
      'Stanford research environment',
      'Faculty mentorship',
      'Research publication potential'
    ],
    
    postedBy: {
      id: '10038',
      name: 'Varnika Hagalwadi',
      title: 'Research Program Coordinator',
      company: 'Stanford University',
      avatar: '/images/avatars/varnika-hagalwadi.jpg'
    },
    postedDate: '2025-03-21',
    expiryDate: '2025-04-30',
    status: 'active',
    
    views: 208,
    applications: 8,
    favorites: 34,
    
    isSponsored: false,
    isPriority: true,
    isVerified: false,
    
    commentLink: '/opportunities/post-011/comments'
  },
  
  {
    id: 'post-012',
    title: 'Google Summer Internship 2025',
    description: 'Google is accepting applications for Summer 2025 internships. Multiple positions available across different teams including Software Engineering, UX Design, Product Management, and Data Science.',
    type: 'internship',
    tags: ['Google', 'Tech', 'Summer', 'Software Engineering', 'UX Design', 'Product Management', 'Data Science'],
    
    company: 'Google',
    industryCategory: 'Technology',
    skillsRequired: ['Programming', 'Problem Solving', 'Technical Skills', 'Communication'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Multiple Locations',
    remote: true,
    applicationDeadline: '2025-04-30',
    requirements: [
      'Currently enrolled in university',
      'Technical skills relevant to role',
      'Strong problem-solving abilities',
      'Passion for technology'
    ],
    benefits: [
      'Competitive compensation',
      'Work on real Google products',
      'Mentorship from Google engineers',
      'Networking opportunities',
      'Potential return offer'
    ],
    
    postedBy: {
      id: '10048',
      name: 'Siddhant Peddi',
      title: 'University Programs',
      company: 'Google',
      avatar: '/images/avatars/siddhant-peddi.jpg'
    },
    postedDate: '2025-03-23',
    expiryDate: '2025-05-15',
    status: 'active',
    
    views: 515,
    applications: 15,
    favorites: 78,
    
    isSponsored: true,
    isPriority: true,
    isVerified: true,
    
    interestLink: 'https://careers.google.com/students/',
    commentLink: '/opportunities/post-012/comments'
  },
  
  {
    id: 'post-009',
    title: 'The Speakout Media Scholarship to America',
    description: 'The Speakout Media Scholarship provides fully funded educational opportunities at Tulane University in the United States. This scholarship program supports students pursuing studies in media, communications, and related fields. The program includes comprehensive financial support and cultural immersion opportunities.',
    type: 'scholarship',
    image: '/images/opportunities/Scholorship_2.jpeg',
    tags: ['Speakout Media', 'Tulane', 'USA', 'Fully Funded'],
    
    organization: 'Tulane University',
    company: 'Speakout Media',
    industryCategory: 'Education / Media',
    skillsRequired: ['Academic Excellence', 'Media Interest', 'Communication'],
    experienceLevel: 'any',
    careerStage: 'student',
    
    location: 'New Orleans, Louisiana, USA',
    remote: false,
    applicationDeadline: '2024-12-05',
    requirements: [
      'Demonstrate academic merit',
      'Financial need',
      'Interest in media or related field',
      'Meet Tulane admission requirements'
    ],
    benefits: [
      'Fully funded scholarship',
      'Study at prestigious Tulane University',
      'USA educational experience',
      'Cultural immersion',
      'Alumni network access'
    ],
    
    postedBy: {
      id: 'admin-speakout',
      name: 'Admin Speakout Media',
      title: 'Scholarship Coordinator',
      company: 'Speakout Media',
      avatar: '/images/avatars/speakout-media.jpg'
    },
    postedDate: '2025-03-22',
    expiryDate: '2024-12-10',
    status: 'expired',
    
    views: 328,
    applications: 28,
    favorites: 67,
    
    isSponsored: true,
    isPriority: true,
    isVerified: true,
    
    commentLink: '/opportunities/post-009/comments'
  },
  
  {
    id: 'post-013',
    title: 'Need Advice on Medical School Applications',
    description: 'I\'m a pre-med student planning to apply to medical schools this year. I\'m specifically interested in neurology specialization and looking for advice on research experience requirements. I have a 3.8 GPA and have worked in a research lab for one semester, but I\'m wondering if this is enough. Any guidance from current medical students or doctors would be greatly appreciated!',
    type: 'mentorship',
    tags: ['Medical School', 'Neurology', 'Applications', 'Research', 'Advice'],
    
    industryCategory: 'Medical / Healthcare',
    skillsRequired: ['Medical Interest', 'Research Background', 'Academic Excellence'],
    experienceLevel: 'entry',
    careerStage: 'student',
    
    location: 'Online',
    remote: true,
    applicationDeadline: '2025-04-10',
    requirements: [
      'Medical school application guidance needed',
      'Neurology specialization interest',
      'Research experience questions',
      'Peer mentorship seeking'
    ],
    benefits: [
      'Peer advice and mentorship',
      'Medical school application guidance',
      'Research experience insights',
      'Neurology specialization advice',
      'Alumni network support'
    ],
    
    postedBy: {
      id: '10062',
      name: 'Aisha Khan',
      title: 'Pre-Med Student',
      company: 'SGS Alumni Network',
      avatar: '/images/avatars/aisha-khan.jpg'
    },
    postedDate: '2025-03-25',
    expiryDate: '2025-04-25',
    status: 'active',
    
    views: 95,
    applications: 5,
    favorites: 12,
    
    isSponsored: false,
    isPriority: true,
    isVerified: true,
    
    commentLink: '/opportunities/post-013/comments'
  }
]

// Utility functions
export const getOpportunityById = (id: string) => 
  mockAlumniOpportunities.find(opp => opp.id === id)

export const filterOpportunities = (filters: {
  type?: string
  industryCategory?: string
  experienceLevel?: string
  careerStage?: string
  remote?: boolean
  location?: string
  tags?: string[]
}) => {
  return mockAlumniOpportunities.filter(opp => {
    if (filters.type && opp.type !== filters.type) return false
    if (filters.industryCategory && opp.industryCategory !== filters.industryCategory) return false
    if (filters.experienceLevel && opp.experienceLevel !== filters.experienceLevel && opp.experienceLevel !== 'any') return false
    if (filters.careerStage && opp.careerStage !== filters.careerStage && opp.careerStage !== 'any') return false
    if (filters.remote !== undefined && opp.remote !== filters.remote) return false
    if (filters.location && !opp.location.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (filters.tags && !filters.tags.some(tag => opp.tags.includes(tag))) return false
    
    return true
  })
}

export const getOpportunityStats = () => {
  const total = mockAlumniOpportunities.length
  const active = mockAlumniOpportunities.filter(o => o.status === 'active').length
  const sponsored = mockAlumniOpportunities.filter(o => o.isSponsored).length
  const remote = mockAlumniOpportunities.filter(o => o.remote).length
  
  return {
    total,
    active,
    sponsored,
    remote
  }
}

export const getPopularTags = () => {
  const allTags = mockAlumniOpportunities.flatMap(opp => opp.tags)
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }))
}
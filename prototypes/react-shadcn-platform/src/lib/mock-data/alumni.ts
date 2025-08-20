export interface AlumniMember {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  graduationYear: number
  degree: string
  major: string
  company: string
  jobTitle: string
  industry: string
  location: string
  bio: string
  skills: string[]
  linkedIn?: string
  twitter?: string
  website?: string
  mentorStatus: 'available' | 'busy' | 'unavailable'
  memberSince: string
  lastActive: string
  achievements?: string[]
}

export const mockAlumniData: AlumniMember[] = [
  {
    id: '1',
    name: 'Arjun Patel',
    email: 'arjun.patel@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2018,
    degree: 'Bachelor of Technology',
    major: 'Computer Science',
    company: 'Tech Innovations Inc.',
    jobTitle: 'Senior Software Engineer',
    industry: 'Technology',
    location: 'San Francisco, CA',
    bio: 'Passionate about building scalable web applications and mentoring junior developers. Active in the tech community.',
    skills: ['React', 'Node.js', 'Python', 'AWS', 'Machine Learning'],
    linkedIn: 'https://linkedin.com/in/arjunpatel',
    twitter: '@arjunpatel',
    website: 'https://arjunpatel.dev',
    mentorStatus: 'available',
    memberSince: '2018-06-15',
    lastActive: '2024-12-18',
    achievements: ['Dean\'s List 2017', 'Best Project Award 2018', 'Published 3 Research Papers']
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2019,
    degree: 'Master of Science',
    major: 'Data Science',
    company: 'DataCorp Analytics',
    jobTitle: 'Lead Data Scientist',
    industry: 'Analytics',
    location: 'New York, NY',
    bio: 'Specializing in predictive analytics and machine learning. Love teaching and sharing knowledge with the community.',
    skills: ['Python', 'R', 'TensorFlow', 'SQL', 'Tableau'],
    linkedIn: 'https://linkedin.com/in/priyasharma',
    mentorStatus: 'available',
    memberSince: '2019-05-20',
    lastActive: '2024-12-19',
    achievements: ['Valedictorian 2019', 'Published in Nature']
  },
  {
    id: '3',
    name: 'Raj Kumar',
    email: 'raj.kumar@example.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2020,
    degree: 'Bachelor of Business',
    major: 'Finance',
    company: 'Global Investments LLC',
    jobTitle: 'Financial Analyst',
    industry: 'Finance',
    location: 'Chicago, IL',
    bio: 'Focused on investment strategies and financial modeling. Interested in fintech innovations.',
    skills: ['Excel', 'Financial Modeling', 'Python', 'Bloomberg Terminal', 'Risk Analysis'],
    linkedIn: 'https://linkedin.com/in/rajkumar',
    mentorStatus: 'busy',
    memberSince: '2020-07-10',
    lastActive: '2024-12-17'
  },
  {
    id: '4',
    name: 'Anita Desai',
    email: 'anita.desai@example.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2017,
    degree: 'PhD',
    major: 'Biomedical Engineering',
    company: 'MedTech Innovations',
    jobTitle: 'Research Director',
    industry: 'Healthcare',
    location: 'Boston, MA',
    bio: 'Leading research in medical device innovation. Passionate about improving healthcare through technology.',
    skills: ['Medical Devices', 'Research', 'Project Management', 'FDA Regulations', 'Clinical Trials'],
    linkedIn: 'https://linkedin.com/in/anitadesai',
    website: 'https://anitadesai-research.com',
    mentorStatus: 'available',
    memberSince: '2017-09-01',
    lastActive: '2024-12-19',
    achievements: ['Patent Holder', 'NIH Grant Recipient', 'TEDx Speaker']
  },
  {
    id: '5',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '+1 (555) 567-8901',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2021,
    degree: 'Bachelor of Arts',
    major: 'Marketing',
    company: 'Creative Agency Co.',
    jobTitle: 'Digital Marketing Manager',
    industry: 'Marketing',
    location: 'Los Angeles, CA',
    bio: 'Digital marketing strategist with focus on social media and content marketing.',
    skills: ['SEO', 'Content Strategy', 'Google Analytics', 'Social Media', 'Adobe Creative Suite'],
    linkedIn: 'https://linkedin.com/in/vikramsingh',
    twitter: '@vikramsingh',
    mentorStatus: 'unavailable',
    memberSince: '2021-06-15',
    lastActive: '2024-12-15'
  },
  {
    id: '6',
    name: 'Meera Reddy',
    email: 'meera.reddy@example.com',
    phone: '+1 (555) 678-9012',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2016,
    degree: 'Master of Engineering',
    major: 'Mechanical Engineering',
    company: 'Aerospace Dynamics',
    jobTitle: 'Principal Engineer',
    industry: 'Aerospace',
    location: 'Seattle, WA',
    bio: 'Working on next-generation aerospace propulsion systems. Mentor for women in STEM.',
    skills: ['CAD', 'FEA', 'Project Management', 'Systems Engineering', 'MATLAB'],
    linkedIn: 'https://linkedin.com/in/meerareddy',
    mentorStatus: 'available',
    memberSince: '2016-08-20',
    lastActive: '2024-12-19',
    achievements: ['NASA Award', 'Women in Engineering Leader']
  },
  {
    id: '7',
    name: 'Amit Gupta',
    email: 'amit.gupta@example.com',
    phone: '+1 (555) 789-0123',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2022,
    degree: 'Bachelor of Science',
    major: 'Environmental Science',
    company: 'Green Earth Solutions',
    jobTitle: 'Sustainability Consultant',
    industry: 'Environmental',
    location: 'Portland, OR',
    bio: 'Dedicated to sustainable business practices and environmental conservation.',
    skills: ['Environmental Assessment', 'Sustainability', 'GIS', 'Data Analysis', 'Policy'],
    linkedIn: 'https://linkedin.com/in/amitgupta',
    mentorStatus: 'available',
    memberSince: '2022-05-10',
    lastActive: '2024-12-18'
  },
  {
    id: '8',
    name: 'Kavita Nair',
    email: 'kavita.nair@example.com',
    phone: '+1 (555) 890-1234',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    graduationYear: 2015,
    degree: 'JD',
    major: 'Law',
    company: 'Nair & Associates',
    jobTitle: 'Partner',
    industry: 'Legal',
    location: 'Washington, DC',
    bio: 'Specializing in intellectual property and technology law. Advocate for startup legal needs.',
    skills: ['IP Law', 'Contract Law', 'Litigation', 'Negotiation', 'Corporate Law'],
    linkedIn: 'https://linkedin.com/in/kavitanair',
    website: 'https://nairassociates.com',
    mentorStatus: 'busy',
    memberSince: '2015-09-15',
    lastActive: '2024-12-16',
    achievements: ['Bar Association Award', 'Pro Bono Champion']
  }
]

export const getAlumniById = (id: string) => 
  mockAlumniData.find(member => member.id === id)

export const filterAlumni = (filters: {
  name?: string
  company?: string
  graduationYear?: number
  industry?: string
  mentorStatus?: string
}) => {
  return mockAlumniData.filter(member => {
    if (filters.name && !member.name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false
    }
    if (filters.company && !member.company.toLowerCase().includes(filters.company.toLowerCase())) {
      return false
    }
    if (filters.graduationYear && member.graduationYear !== filters.graduationYear) {
      return false
    }
    if (filters.industry && member.industry !== filters.industry) {
      return false
    }
    if (filters.mentorStatus && member.mentorStatus !== filters.mentorStatus) {
      return false
    }
    return true
  })
}

export const getAlumniStats = () => {
  const total = mockAlumniData.length
  const verified = mockAlumniData.filter(a => a.achievements && a.achievements.length > 0).length
  const mentors = mockAlumniData.filter(a => a.mentorStatus === 'available').length
  const industries = [...new Set(mockAlumniData.map(a => a.industry))].length
  
  return {
    total,
    verified,
    mentors,
    industries
  }
}
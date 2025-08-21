export interface UserProfile {
  id: string
  userId: string
  name: string
  avatar?: string
  role: 'member' | 'moderator' | 'admin'
  isActive: boolean
  lastUsed: string
  preferences: {
    domains: string[]
    supportMode: 'offer' | 'seek'
    professionalStatus: 'student' | 'professional'
    experienceLevel: string
    skillTags: string[]
  }
}

export interface User {
  id: string
  email: string
  username: string
  registeredAt: string
  lastLogin: string
  profiles: UserProfile[]
}

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'arjun.patel@example.com',
    username: 'arjun_patel',
    registeredAt: '2018-06-15',
    lastLogin: '2024-12-19',
    profiles: [
      {
        id: 'profile-1',
        userId: 'user-1',
        name: 'Arjun Patel',
        // avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', // Removed to show initials
        role: 'member',
        isActive: true,
        lastUsed: '2024-12-19',
        preferences: {
          domains: ['Technology', 'Software Engineering', 'Artificial Intelligence'],
          supportMode: 'offer',
          professionalStatus: 'professional',
          experienceLevel: 'Senior (5+ years)',
          skillTags: ['React', 'Node.js', 'Python', 'Machine Learning', 'AWS']
        }
      }
    ]
  },
  {
    id: 'user-2',
    email: 'priya.sharma@example.com',
    username: 'priya_sharma',
    registeredAt: '2019-05-20',
    lastLogin: '2024-12-19',
    profiles: [
      {
        id: 'profile-2',
        userId: 'user-2',
        name: 'Priya Sharma',
        // avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b593?w=150&h=150&fit=crop&crop=face', // Removed to show initials
        role: 'moderator',
        isActive: true,
        lastUsed: '2024-12-19',
        preferences: {
          domains: ['Data Science', 'Analytics', 'Machine Learning'],
          supportMode: 'offer',
          professionalStatus: 'professional',
          experienceLevel: 'Senior (5+ years)',
          skillTags: ['Python', 'R', 'TensorFlow', 'SQL', 'Statistics']
        }
      }
    ]
  },
  {
    id: 'user-3',
    email: 'admin@gitaalumni.org',
    username: 'admin',
    registeredAt: '2015-01-01',
    lastLogin: '2024-12-19',
    profiles: [
      {
        id: 'profile-3',
        userId: 'user-3',
        name: 'System Admin',
        // avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', // Removed to show initials
        role: 'admin',
        isActive: true,
        lastUsed: '2024-12-19',
        preferences: {
          domains: ['Administration', 'System Management', 'Platform Operations'],
          supportMode: 'offer',
          professionalStatus: 'professional',
          experienceLevel: 'Expert (10+ years)',
          skillTags: ['Platform Management', 'User Support', 'Analytics']
        }
      }
    ]
  },
  {
    id: 'user-4',
    email: 'raj.kumar@example.com',
    username: 'raj_kumar',
    registeredAt: '2020-07-10',
    lastLogin: '2024-12-17',
    profiles: [
      {
        id: 'profile-4a',
        userId: 'user-4',
        name: 'Raj Kumar',
        // avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', // Removed to show initials
        role: 'member',
        isActive: true,
        lastUsed: '2024-12-17',
        preferences: {
          domains: ['Finance', 'Investment', 'Risk Management'],
          supportMode: 'offer',
          professionalStatus: 'professional',
          experienceLevel: 'Mid-level (2-5 years)',
          skillTags: ['Financial Modeling', 'Excel', 'Python', 'Risk Analysis']
        }
      },
      {
        id: 'profile-4b',
        userId: 'user-4',
        name: 'Raj (Student Profile)',
        // avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&sat=-100', // Removed to show initials
        role: 'member',
        isActive: false,
        lastUsed: '2020-12-15',
        preferences: {
          domains: ['Finance', 'Economics', 'Business'],
          supportMode: 'seek',
          professionalStatus: 'student',
          experienceLevel: 'Entry level (0-2 years)',
          skillTags: ['Excel', 'Financial Analysis', 'Economics']
        }
      }
    ]
  }
]

export const domainCategories = {
  'Technology': [
    'Software Engineering',
    'Data Science',
    'Artificial Intelligence',
    'Machine Learning',
    'Web Development',
    'Mobile Development',
    'DevOps',
    'Cybersecurity',
    'Cloud Computing',
    'Database Management'
  ],
  'Healthcare': [
    'Internal Medicine',
    'Surgery',
    'Pediatrics',
    'Cardiology',
    'Neurology',
    'Oncology',
    'Radiology',
    'Nursing',
    'Physical Therapy',
    'Medical Research'
  ],
  'Engineering': [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Aerospace Engineering',
    'Environmental Engineering',
    'Biomedical Engineering',
    'Systems Engineering',
    'Industrial Engineering',
    'Materials Science'
  ],
  'Business & Finance': [
    'Investment Banking',
    'Corporate Finance',
    'Management Consulting',
    'Accounting',
    'Risk Management',
    'Financial Planning',
    'Marketing',
    'Sales',
    'Operations',
    'Strategy'
  ],
  'Arts & Humanities': [
    'Literature',
    'Philosophy',
    'History',
    'Art History',
    'Creative Writing',
    'Journalism',
    'Languages',
    'Theater',
    'Film Studies',
    'Music'
  ]
}

export const getCurrentUser = () => mockUsers[0] // Default to Arjun for demo
export const getUserById = (id: string) => mockUsers.find(user => user.id === id)
export const getProfileById = (profileId: string) => {
  for (const user of mockUsers) {
    const profile = user.profiles.find(p => p.id === profileId)
    if (profile) return profile
  }
  return null
}
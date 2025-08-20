export interface MentorProfile {
  id: string
  alumniId: string
  name: string
  avatar?: string
  title: string
  company: string
  location: string
  expertise: string[]
  mentoringSince: string
  totalMentees: number
  currentMentees: number
  maxMentees: number
  availability: 'available' | 'limited' | 'unavailable'
  preferredTopics: string[]
  communicationModes: ('video' | 'phone' | 'email' | 'in-person')[]
  languages: string[]
  rating: number
  reviews: number
  bio: string
  calendlyLink?: string
  nextAvailableSlot?: string
  responseTime: string // e.g., "within 24 hours"
  mentoringStyle: string
  successStories?: number
}

export interface MentorshipRequest {
  id: string
  mentorId: string
  menteeId: string
  menteeName: string
  menteeEmail: string
  requestDate: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  message: string
  goals: string[]
  expectedDuration: string
  preferredSchedule: string
}

export interface MentorshipSession {
  id: string
  mentorId: string
  menteeId: string
  date: string
  time: string
  duration: string
  type: 'introductory' | 'regular' | 'career-planning' | 'skill-development' | 'mock-interview'
  topic: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  rating?: number
  feedback?: string
}

export interface MentorshipMatch {
  score: number
  mentor: MentorProfile
  matchReasons: string[]
}

export const mockMentors: MentorProfile[] = [
  {
    id: 'mentor-001',
    alumniId: '1',
    name: 'Arjun Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun',
    title: 'Senior Software Engineer',
    company: 'Tech Innovations Inc.',
    location: 'San Francisco, CA',
    expertise: ['Software Development', 'System Design', 'Career Growth', 'Interview Prep'],
    mentoringSince: '2020-01-15',
    totalMentees: 24,
    currentMentees: 3,
    maxMentees: 5,
    availability: 'available',
    preferredTopics: ['Technical Skills', 'Career Transitions', 'Leadership', 'Open Source'],
    communicationModes: ['video', 'email'],
    languages: ['English', 'Hindi'],
    rating: 4.8,
    reviews: 18,
    bio: 'Passionate about helping others grow in their tech careers. Specialized in full-stack development and system architecture.',
    calendlyLink: 'https://calendly.com/arjunpatel',
    nextAvailableSlot: '2025-01-05 10:00 AM',
    responseTime: 'within 24 hours',
    mentoringStyle: 'Structured goal-setting with regular check-ins and practical assignments',
    successStories: 15
  },
  {
    id: 'mentor-002',
    alumniId: '2',
    name: 'Priya Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    title: 'Lead Data Scientist',
    company: 'DataCorp Analytics',
    location: 'New York, NY',
    expertise: ['Data Science', 'Machine Learning', 'Python', 'Career Development'],
    mentoringSince: '2019-06-01',
    totalMentees: 31,
    currentMentees: 4,
    maxMentees: 4,
    availability: 'limited',
    preferredTopics: ['Data Science Career', 'ML Projects', 'Research', 'Women in Tech'],
    communicationModes: ['video', 'phone', 'email'],
    languages: ['English', 'Hindi', 'Spanish'],
    rating: 4.9,
    reviews: 25,
    bio: 'Helping aspiring data scientists navigate their career journey. Special focus on women in STEM.',
    calendlyLink: 'https://calendly.com/priyasharma',
    nextAvailableSlot: '2025-01-08 2:00 PM',
    responseTime: 'within 48 hours',
    mentoringStyle: 'Project-based learning with real-world applications',
    successStories: 22
  },
  {
    id: 'mentor-003',
    alumniId: '4',
    name: 'Anita Desai',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita',
    title: 'Research Director',
    company: 'MedTech Innovations',
    location: 'Boston, MA',
    expertise: ['Biomedical Research', 'Grant Writing', 'Academic Career', 'Innovation'],
    mentoringSince: '2018-03-15',
    totalMentees: 19,
    currentMentees: 2,
    maxMentees: 3,
    availability: 'available',
    preferredTopics: ['Research Career', 'PhD Guidance', 'Medical Innovation', 'Patents'],
    communicationModes: ['video', 'email', 'in-person'],
    languages: ['English'],
    rating: 4.7,
    reviews: 14,
    bio: 'Guiding the next generation of biomedical researchers and innovators.',
    nextAvailableSlot: '2025-01-10 3:00 PM',
    responseTime: 'within 72 hours',
    mentoringStyle: 'Research-focused with emphasis on critical thinking and innovation',
    successStories: 12
  },
  {
    id: 'mentor-004',
    alumniId: '6',
    name: 'Meera Reddy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera',
    title: 'Principal Engineer',
    company: 'Aerospace Dynamics',
    location: 'Seattle, WA',
    expertise: ['Aerospace Engineering', 'Systems Design', 'Project Management', 'Women in Engineering'],
    mentoringSince: '2017-09-01',
    totalMentees: 28,
    currentMentees: 3,
    maxMentees: 4,
    availability: 'available',
    preferredTopics: ['Engineering Career', 'Technical Leadership', 'Work-Life Balance', 'STEM Advocacy'],
    communicationModes: ['video', 'phone'],
    languages: ['English', 'Telugu'],
    rating: 4.8,
    reviews: 21,
    bio: 'Empowering engineers to reach their full potential. Champion for diversity in engineering.',
    calendlyLink: 'https://calendly.com/meerareddy',
    nextAvailableSlot: '2025-01-06 11:00 AM',
    responseTime: 'within 24 hours',
    mentoringStyle: 'Holistic approach covering technical and soft skills development',
    successStories: 20
  },
  {
    id: 'mentor-005',
    alumniId: '7',
    name: 'Amit Gupta',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    title: 'Sustainability Consultant',
    company: 'Green Earth Solutions',
    location: 'Portland, OR',
    expertise: ['Environmental Science', 'Sustainability', 'Green Tech', 'Policy'],
    mentoringSince: '2022-08-01',
    totalMentees: 8,
    currentMentees: 2,
    maxMentees: 4,
    availability: 'available',
    preferredTopics: ['Environmental Careers', 'Sustainability Projects', 'Green Innovation'],
    communicationModes: ['video', 'email'],
    languages: ['English', 'Hindi'],
    rating: 4.6,
    reviews: 6,
    bio: 'Helping build careers in sustainability and environmental conservation.',
    nextAvailableSlot: '2025-01-07 9:00 AM',
    responseTime: 'within 48 hours',
    mentoringStyle: 'Action-oriented with focus on real-world impact',
    successStories: 5
  }
]

export const mockMentorshipRequests: MentorshipRequest[] = [
  {
    id: 'req-001',
    mentorId: 'mentor-001',
    menteeId: 'user-001',
    menteeName: 'John Smith',
    menteeEmail: 'john.smith@email.com',
    requestDate: '2024-12-15',
    status: 'pending',
    message: 'Hi Arjun, I am a recent graduate looking to transition into software development. Would love your guidance on breaking into the tech industry.',
    goals: ['Learn system design', 'Prepare for technical interviews', 'Build portfolio projects'],
    expectedDuration: '6 months',
    preferredSchedule: 'Bi-weekly, weekends preferred'
  },
  {
    id: 'req-002',
    mentorId: 'mentor-002',
    menteeId: 'user-002',
    menteeName: 'Sarah Johnson',
    menteeEmail: 'sarah.j@email.com',
    requestDate: '2024-12-10',
    status: 'accepted',
    message: 'Hello Priya, I am working as a data analyst and want to transition to data science. Need guidance on ML projects.',
    goals: ['Master machine learning', 'Work on real projects', 'Career transition strategy'],
    expectedDuration: '4 months',
    preferredSchedule: 'Weekly, evenings'
  },
  {
    id: 'req-003',
    mentorId: 'mentor-001',
    menteeId: 'user-003',
    menteeName: 'Mike Chen',
    menteeEmail: 'mike.chen@email.com',
    requestDate: '2024-11-20',
    status: 'completed',
    message: 'Need help with interview preparation for senior developer roles.',
    goals: ['System design practice', 'Behavioral interview prep', 'Salary negotiation'],
    expectedDuration: '2 months',
    preferredSchedule: 'Twice a week'
  }
]

export const mockMentorshipSessions: MentorshipSession[] = [
  {
    id: 'session-001',
    mentorId: 'mentor-002',
    menteeId: 'user-002',
    date: '2024-12-20',
    time: '18:00',
    duration: '1 hour',
    type: 'introductory',
    topic: 'Getting to know each other and setting goals',
    status: 'scheduled',
    notes: 'First meeting to discuss career goals and create learning roadmap'
  },
  {
    id: 'session-002',
    mentorId: 'mentor-001',
    menteeId: 'user-003',
    date: '2024-11-25',
    time: '10:00',
    duration: '1.5 hours',
    type: 'mock-interview',
    topic: 'System design interview practice',
    status: 'completed',
    rating: 5,
    feedback: 'Excellent session! Very helpful feedback on my approach to system design problems.'
  },
  {
    id: 'session-003',
    mentorId: 'mentor-004',
    menteeId: 'user-004',
    date: '2025-01-15',
    time: '14:00',
    duration: '45 minutes',
    type: 'career-planning',
    topic: 'Discussing transition to technical leadership',
    status: 'scheduled'
  }
]

// Helper functions
export const findMentorMatches = (preferences: {
  expertise: string[]
  communicationModes?: string[]
  languages?: string[]
}): MentorshipMatch[] => {
  return mockMentors
    .filter(mentor => mentor.availability !== 'unavailable')
    .map(mentor => {
      let score = 0
      const reasons: string[] = []
      
      // Check expertise match
      const expertiseMatch = preferences.expertise.filter(exp => 
        mentor.expertise.includes(exp)
      ).length
      score += expertiseMatch * 30
      if (expertiseMatch > 0) {
        reasons.push(`Matches ${expertiseMatch} expertise areas`)
      }
      
      // Check communication mode match
      if (preferences.communicationModes) {
        const modeMatch = preferences.communicationModes.filter(mode =>
          mentor.communicationModes.includes(mode as any)
        ).length
        score += modeMatch * 10
        if (modeMatch > 0) {
          reasons.push('Compatible communication preferences')
        }
      }
      
      // Check language match
      if (preferences.languages) {
        const langMatch = preferences.languages.filter(lang =>
          mentor.languages.includes(lang)
        ).length
        score += langMatch * 15
        if (langMatch > 0) {
          reasons.push('Common language(s)')
        }
      }
      
      // Bonus for availability
      if (mentor.availability === 'available') {
        score += 20
        reasons.push('Currently available')
      }
      
      // Bonus for high rating
      if (mentor.rating >= 4.5) {
        score += 15
        reasons.push(`Highly rated (${mentor.rating}/5.0)`)
      }
      
      return { score, mentor, matchReasons: reasons }
    })
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
}

export const getMentorById = (id: string) =>
  mockMentors.find(mentor => mentor.id === id)

export const getMentorshipRequestsByMentor = (mentorId: string) =>
  mockMentorshipRequests.filter(req => req.mentorId === mentorId)

export const getMentorshipSessionsByMentor = (mentorId: string) =>
  mockMentorshipSessions.filter(session => session.mentorId === mentorId)

export const getMentorshipSessionsByMentee = (menteeId: string) =>
  mockMentorshipSessions.filter(session => session.menteeId === menteeId)

// Statistics
export const getMentorshipStats = () => {
  const totalMentors = mockMentors.length
  const availableMentors = mockMentors.filter(m => m.availability === 'available').length
  const totalMentees = mockMentors.reduce((sum, m) => sum + m.currentMentees, 0)
  const totalSessions = mockMentorshipSessions.length
  const completedSessions = mockMentorshipSessions.filter(s => s.status === 'completed').length
  const averageRating = mockMentors.reduce((sum, m) => sum + m.rating, 0) / totalMentors
  
  return {
    totalMentors,
    availableMentors,
    totalMentees,
    totalSessions,
    completedSessions,
    averageRating: averageRating.toFixed(1),
    topExpertise: ['Software Development', 'Data Science', 'Career Growth', 'Leadership']
  }
}
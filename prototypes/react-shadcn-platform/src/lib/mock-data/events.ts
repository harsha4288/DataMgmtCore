export interface AlumniEvent {
  id: string
  title: string
  description: string
  type: 'networking' | 'workshop' | 'seminar' | 'social' | 'fundraiser' | 'reunion'
  date: string
  time: string
  duration: string
  location: string
  venue: string
  capacity: number
  registered: number
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  organizer: string
  organizerEmail: string
  speakers?: string[]
  agenda?: string[]
  registrationDeadline: string
  fee?: number
  tags: string[]
  imageUrl?: string
}

export interface EventRegistration {
  eventId: string
  userId: string
  userName: string
  registrationDate: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'attended'
  paymentStatus?: 'paid' | 'pending' | 'refunded'
}

export const mockEventsData: AlumniEvent[] = [
  {
    id: 'evt-001',
    title: 'Annual Alumni Networking Gala',
    description: 'Join fellow alumni for an evening of networking, fine dining, and celebrating our community achievements.',
    type: 'networking',
    date: '2025-01-15',
    time: '18:00',
    duration: '4 hours',
    location: 'Grand Ballroom, Hilton Hotel',
    venue: 'Downtown Convention Center',
    capacity: 200,
    registered: 145,
    status: 'upcoming',
    organizer: 'Alumni Relations Office',
    organizerEmail: 'events@alumni.edu',
    speakers: ['Dr. Sarah Johnson', 'Prof. Michael Chen'],
    agenda: ['Welcome Reception', 'Keynote Address', 'Dinner', 'Awards Ceremony', 'Networking'],
    registrationDeadline: '2025-01-10',
    fee: 75,
    tags: ['networking', 'gala', 'annual-event'],
    imageUrl: 'https://via.placeholder.com/400x200?text=Alumni+Gala'
  },
  {
    id: 'evt-002',
    title: 'Tech Career Workshop: AI & Machine Learning',
    description: 'Hands-on workshop covering the latest trends in AI/ML and career opportunities in the field.',
    type: 'workshop',
    date: '2025-01-08',
    time: '10:00',
    duration: '6 hours',
    location: 'Tech Lab, Building A',
    venue: 'University Campus',
    capacity: 50,
    registered: 48,
    status: 'upcoming',
    organizer: 'Career Services',
    organizerEmail: 'careers@alumni.edu',
    speakers: ['Arjun Patel', 'Priya Sharma'],
    agenda: ['Introduction to AI/ML', 'Hands-on Coding Session', 'Lunch Break', 'Industry Panel', 'Q&A'],
    registrationDeadline: '2025-01-05',
    fee: 25,
    tags: ['workshop', 'technology', 'career', 'ai', 'machine-learning']
  },
  {
    id: 'evt-003',
    title: 'Entrepreneurship Seminar Series',
    description: 'Monthly seminar featuring successful alumni entrepreneurs sharing their journey and insights.',
    type: 'seminar',
    date: '2024-12-20',
    time: '14:00',
    duration: '2 hours',
    location: 'Virtual Event',
    venue: 'Zoom Webinar',
    capacity: 500,
    registered: 287,
    status: 'ongoing',
    organizer: 'Business School Alumni',
    organizerEmail: 'business@alumni.edu',
    speakers: ['Raj Kumar', 'Vikram Singh'],
    agenda: ['Startup Journey', 'Funding Strategies', 'Q&A Session'],
    registrationDeadline: '2024-12-18',
    fee: 0,
    tags: ['entrepreneurship', 'business', 'virtual', 'free']
  },
  {
    id: 'evt-004',
    title: 'Class of 2019 Five-Year Reunion',
    description: 'Celebrate five years since graduation with your classmates! Relive memories and create new ones.',
    type: 'reunion',
    date: '2025-02-22',
    time: '17:00',
    duration: '5 hours',
    location: 'Alumni House',
    venue: 'Main Campus',
    capacity: 150,
    registered: 89,
    status: 'upcoming',
    organizer: 'Class of 2019 Committee',
    organizerEmail: 'class2019@alumni.edu',
    agenda: ['Campus Tour', 'Welcome Reception', 'Dinner', 'Class Photo', 'Dancing'],
    registrationDeadline: '2025-02-15',
    fee: 50,
    tags: ['reunion', 'class-of-2019', 'social']
  },
  {
    id: 'evt-005',
    title: 'Women in STEM Panel Discussion',
    description: 'Inspiring panel discussion with successful women alumni in STEM fields.',
    type: 'seminar',
    date: '2025-01-25',
    time: '16:00',
    duration: '2.5 hours',
    location: 'Auditorium B',
    venue: 'Science Building',
    capacity: 100,
    registered: 76,
    status: 'upcoming',
    organizer: 'Women Alumni Network',
    organizerEmail: 'women@alumni.edu',
    speakers: ['Anita Desai', 'Meera Reddy', 'Priya Sharma'],
    agenda: ['Opening Remarks', 'Panel Discussion', 'Audience Q&A', 'Networking Reception'],
    registrationDeadline: '2025-01-22',
    fee: 10,
    tags: ['women-in-stem', 'panel', 'diversity', 'stem']
  },
  {
    id: 'evt-006',
    title: 'Annual Fundraising Dinner',
    description: 'Support student scholarships and campus development at our annual fundraising event.',
    type: 'fundraiser',
    date: '2025-03-01',
    time: '18:30',
    duration: '3 hours',
    location: 'Crystal Ballroom',
    venue: 'Ritz Carlton',
    capacity: 300,
    registered: 198,
    status: 'upcoming',
    organizer: 'Development Office',
    organizerEmail: 'development@alumni.edu',
    speakers: ['University President', 'Board Chair'],
    agenda: ['Cocktail Hour', 'Dinner', 'Fundraising Appeal', 'Entertainment'],
    registrationDeadline: '2025-02-25',
    fee: 150,
    tags: ['fundraising', 'charity', 'formal', 'annual']
  },
  {
    id: 'evt-007',
    title: 'Healthcare Innovation Summit',
    description: 'Explore the latest innovations in healthcare technology and biomedical research.',
    type: 'seminar',
    date: '2024-11-15',
    time: '09:00',
    duration: '8 hours',
    location: 'Medical School Campus',
    venue: 'Conference Center',
    capacity: 200,
    registered: 200,
    status: 'completed',
    organizer: 'Medical Alumni Association',
    organizerEmail: 'medical@alumni.edu',
    speakers: ['Dr. Anita Desai', 'Dr. James Wilson'],
    agenda: ['Keynote', 'Research Presentations', 'Lunch', 'Breakout Sessions', 'Closing Remarks'],
    registrationDeadline: '2024-11-10',
    fee: 75,
    tags: ['healthcare', 'innovation', 'medical', 'research']
  },
  {
    id: 'evt-008',
    title: 'Summer Picnic & Family Day',
    description: 'Bring your family for a fun day of games, food, and community building.',
    type: 'social',
    date: '2025-06-14',
    time: '11:00',
    duration: '5 hours',
    location: 'University Park',
    venue: 'Main Campus',
    capacity: 400,
    registered: 125,
    status: 'upcoming',
    organizer: 'Alumni Relations',
    organizerEmail: 'alumni@alumni.edu',
    agenda: ['BBQ Lunch', 'Kids Activities', 'Sports Tournament', 'Live Music'],
    registrationDeadline: '2025-06-10',
    fee: 20,
    tags: ['family', 'social', 'outdoor', 'summer']
  }
]

export const mockRegistrations: EventRegistration[] = [
  {
    eventId: 'evt-001',
    userId: '1',
    userName: 'Arjun Patel',
    registrationDate: '2024-12-01',
    status: 'confirmed',
    paymentStatus: 'paid'
  },
  {
    eventId: 'evt-002',
    userId: '2',
    userName: 'Priya Sharma',
    registrationDate: '2024-12-05',
    status: 'confirmed',
    paymentStatus: 'paid'
  },
  {
    eventId: 'evt-001',
    userId: '3',
    userName: 'Raj Kumar',
    registrationDate: '2024-12-10',
    status: 'pending',
    paymentStatus: 'pending'
  }
]

export const getEventById = (id: string) => 
  mockEventsData.find(event => event.id === id)

export const filterEvents = (filters: {
  type?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}) => {
  return mockEventsData.filter(event => {
    if (filters.type && event.type !== filters.type) return false
    if (filters.status && event.status !== filters.status) return false
    if (filters.dateFrom && event.date < filters.dateFrom) return false
    if (filters.dateTo && event.date > filters.dateTo) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return event.title.toLowerCase().includes(searchLower) ||
             event.description.toLowerCase().includes(searchLower) ||
             event.tags.some(tag => tag.toLowerCase().includes(searchLower))
    }
    return true
  })
}

export const getEventRegistrations = (eventId: string) =>
  mockRegistrations.filter(reg => reg.eventId === eventId)

export const getUserRegistrations = (userId: string) =>
  mockRegistrations.filter(reg => reg.userId === userId)
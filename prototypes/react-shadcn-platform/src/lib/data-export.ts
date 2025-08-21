/**
 * Data Export/Import System for Demo Purposes
 * Comprehensive data management for mockup demonstrations
 */

import { mockAlumniData } from '@/lib/mock-data/alumni'
import { showSuccessMessage, showErrorMessage } from './error-handling'

// Export data types
export interface ExportData {
  profiles: any[]
  postings: any[]
  messages: any[]
  searches: any[]
  preferences: any
  analytics: any
  exportedAt: string
  version: string
}

// Export formats
export type ExportFormat = 'json' | 'csv' | 'pdf' | 'xlsx'

/**
 * Generate comprehensive demo data for export
 */
export function generateDemoData(): ExportData {
  return {
    profiles: mockAlumniData.map(member => ({
      id: member.id,
      name: member.name,
      email: `${member.name.toLowerCase().replace(' ', '.')}@alumni.org`,
      jobTitle: member.jobTitle,
      company: member.company,
      location: member.location,
      industry: member.industry,
      graduationYear: member.graduationYear,
      bio: member.bio,
      skills: member.skills,
      mentorStatus: member.mentorStatus,
      verified: Math.random() > 0.3,
      profileViews: Math.floor(Math.random() * 500) + 50,
      connectionsHelped: Math.floor(Math.random() * 100) + 10,
      rating: (Math.random() * 2 + 3).toFixed(1),
      lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    })),
    
    postings: generateMockPostings(),
    messages: generateMockMessages(),
    searches: generateMockSearches(),
    preferences: generateMockPreferences(),
    analytics: generateMockAnalytics(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  }
}

/**
 * Generate mock postings data
 */
function generateMockPostings() {
  const categories = ['help', 'opportunity', 'event', 'general']
  const postings = []

  for (let i = 0; i < 50; i++) {
    postings.push({
      id: `posting_${i + 1}`,
      title: `Sample Posting ${i + 1}`,
      description: `This is a sample posting description for demo purposes. It contains relevant information about the posting.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      author: mockAlumniData[Math.floor(Math.random() * mockAlumniData.length)].name,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      status: Math.random() > 0.8 ? 'closed' : 'active',
      views: Math.floor(Math.random() * 200) + 10,
      responses: Math.floor(Math.random() * 20),
      tags: ['demo', 'sample', 'mock'].slice(0, Math.floor(Math.random() * 3) + 1)
    })
  }

  return postings
}

/**
 * Generate mock messages data
 */
function generateMockMessages() {
  const messages = []

  for (let i = 0; i < 100; i++) {
    messages.push({
      id: `message_${i + 1}`,
      from: mockAlumniData[Math.floor(Math.random() * mockAlumniData.length)].name,
      to: mockAlumniData[Math.floor(Math.random() * mockAlumniData.length)].name,
      subject: `Sample Message Subject ${i + 1}`,
      content: `This is a sample message content for demo purposes.`,
      timestamp: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
      read: Math.random() > 0.3,
      starred: Math.random() > 0.8
    })
  }

  return messages
}

/**
 * Generate mock saved searches
 */
function generateMockSearches() {
  return [
    {
      id: 'search_1',
      name: 'Tech Professionals in Bay Area',
      query: 'software engineer',
      filters: { industry: 'Technology', location: 'San Francisco' },
      createdAt: new Date('2024-01-15'),
      useCount: 15
    },
    {
      id: 'search_2',
      name: 'Recent Graduates',
      query: '',
      filters: { graduationYear: 2023 },
      createdAt: new Date('2024-02-01'),
      useCount: 8
    },
    {
      id: 'search_3',
      name: 'Available Mentors',
      query: 'mentor',
      filters: { mentorStatus: 'available' },
      createdAt: new Date('2024-01-20'),
      useCount: 22
    }
  ]
}

/**
 * Generate mock user preferences
 */
function generateMockPreferences() {
  return {
    notifications: {
      email: true,
      push: true,
      mentions: true,
      messages: true
    },
    privacy: {
      profileVisible: true,
      contactInfoVisible: true,
      showOnlineStatus: true
    },
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York'
  }
}

/**
 * Generate mock analytics data
 */
function generateMockAnalytics() {
  return {
    profileViews: {
      total: 1250,
      thisMonth: 180,
      trend: '+15%'
    },
    connections: {
      total: 45,
      thisMonth: 8,
      trend: '+12%'
    },
    postings: {
      created: 12,
      active: 8,
      closed: 4
    },
    engagement: {
      messagesReceived: 23,
      messagesReplied: 19,
      responseRate: '82%',
      averageResponseTime: '3.2 hours'
    },
    topSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    topIndustries: ['Technology', 'Healthcare', 'Finance'],
    geographicDistribution: {
      'San Francisco': 25,
      'New York': 18,
      'Los Angeles': 12,
      'Chicago': 8,
      'Other': 37
    }
  }
}

/**
 * Export data to different formats
 */
export async function exportData(format: ExportFormat, data?: ExportData): Promise<void> {
  const exportData = data || generateDemoData()

  try {
    switch (format) {
      case 'json':
        await exportToJSON(exportData)
        break
      case 'csv':
        await exportToCSV(exportData)
        break
      case 'pdf':
        await exportToPDF(exportData)
        break
      case 'xlsx':
        await exportToExcel(exportData)
        break
    }
    
    showSuccessMessage(
      'Export Successful',
      `Data has been exported to ${format.toUpperCase()} format.`
    )
  } catch (error) {
    showErrorMessage(
      'Export Failed',
      `Failed to export data to ${format.toUpperCase()} format.`
    )
    console.error('Export error:', error)
  }
}

/**
 * Export to JSON format
 */
async function exportToJSON(data: ExportData): Promise<void> {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  downloadFile(blob, `alumni-data-${new Date().toISOString().split('T')[0]}.json`)
}

/**
 * Export to CSV format (profiles only for simplicity)
 */
async function exportToCSV(data: ExportData): Promise<void> {
  const headers = [
    'ID', 'Name', 'Email', 'Job Title', 'Company', 'Location', 
    'Industry', 'Graduation Year', 'Skills', 'Mentor Status', 'Verified'
  ]
  
  const csvContent = [
    headers.join(','),
    ...data.profiles.map(profile => [
      profile.id,
      `"${profile.name}"`,
      profile.email,
      `"${profile.jobTitle}"`,
      `"${profile.company}"`,
      `"${profile.location}"`,
      profile.industry,
      profile.graduationYear,
      `"${profile.skills.join('; ')}"`,
      profile.mentorStatus,
      profile.verified
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  downloadFile(blob, `alumni-profiles-${new Date().toISOString().split('T')[0]}.csv`)
}

/**
 * Export to PDF format (simplified demo version)
 */
async function exportToPDF(data: ExportData): Promise<void> {
  // For demo purposes, create a simple text-based PDF content
  const pdfContent = `
Alumni Directory Export Report
Generated on: ${new Date().toLocaleDateString()}

=== SUMMARY ===
Total Profiles: ${data.profiles.length}
Total Postings: ${data.postings.length}
Total Messages: ${data.messages.length}

=== TOP PROFILES ===
${data.profiles.slice(0, 10).map((profile, idx) => `
${idx + 1}. ${profile.name}
   ${profile.jobTitle} at ${profile.company}
   Location: ${profile.location}
   Industry: ${profile.industry}
   Graduation Year: ${profile.graduationYear}
   Skills: ${profile.skills.join(', ')}
`).join('\\n')}

=== ANALYTICS ===
Profile Views: ${data.analytics.profileViews.total}
Connections: ${data.analytics.connections.total}
Top Skills: ${data.analytics.topSkills.join(', ')}
Top Industries: ${data.analytics.topIndustries.join(', ')}

This is a demo export. In a production environment, 
this would generate a properly formatted PDF document.
  `
  
  const blob = new Blob([pdfContent], { type: 'text/plain' })
  downloadFile(blob, `alumni-report-${new Date().toISOString().split('T')[0]}.txt`)
}

/**
 * Export to Excel format (simplified demo version)
 */
async function exportToExcel(data: ExportData): Promise<void> {
  // For demo purposes, create a tab-separated values file
  const tsvContent = [
    // Profiles sheet header
    'PROFILES',
    'ID\tName\tEmail\tJob Title\tCompany\tLocation\tIndustry\tGraduation Year\tSkills',
    ...data.profiles.map(profile => [
      profile.id,
      profile.name,
      profile.email,
      profile.jobTitle,
      profile.company,
      profile.location,
      profile.industry,
      profile.graduationYear,
      profile.skills.join('; ')
    ].join('\t')),
    '',
    'ANALYTICS',
    'Metric\tValue',
    `Total Profiles\t${data.profiles.length}`,
    `Total Postings\t${data.postings.length}`,
    `Total Messages\t${data.messages.length}`,
    `Profile Views\t${data.analytics.profileViews.total}`,
    `Connections\t${data.analytics.connections.total}`
  ].join('\n')
  
  const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' })
  downloadFile(blob, `alumni-data-${new Date().toISOString().split('T')[0]}.tsv`)
}

/**
 * Download file helper
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Import data from JSON file
 */
export async function importData(file: File): Promise<ExportData | null> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Validate data structure
    if (!data.profiles || !data.version) {
      throw new Error('Invalid file format')
    }
    
    showSuccessMessage(
      'Import Successful',
      `Imported ${data.profiles.length} profiles and related data.`
    )
    
    return data
  } catch (error) {
    showErrorMessage(
      'Import Failed',
      'Failed to import data. Please check the file format.'
    )
    console.error('Import error:', error)
    return null
  }
}

/**
 * Get export statistics
 */
export function getExportStats(data: ExportData) {
  return {
    totalProfiles: data.profiles.length,
    verifiedProfiles: data.profiles.filter(p => p.verified).length,
    totalPostings: data.postings.length,
    activePostings: data.postings.filter(p => p.status === 'active').length,
    totalMessages: data.messages.length,
    unreadMessages: data.messages.filter(m => !m.read).length,
    savedSearches: data.searches.length,
    exportSize: JSON.stringify(data).length,
    exportDate: data.exportedAt
  }
}


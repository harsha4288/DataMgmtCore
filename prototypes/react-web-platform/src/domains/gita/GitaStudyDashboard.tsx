import { useState } from 'react'
import { DataTable } from '../../components/behaviors/DataTable'
import type { Column, BulkAction } from '../../components/behaviors/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Mail, BookOpen, Download } from 'lucide-react'

// Bhagavad Gita Student Progress Data Structure  
interface GitaStudent extends Record<string, unknown> {
  id: string
  name: string
  email: string
  gurukulam: string
  studyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Scholar'
  overallGrade: number
  letterGrade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  practiceDays: number
  maxPracticeDays: number
  consecutiveDays: number
  
  // Chapter scores (simplified - first 3 chapters for testing)
  ch1_pronunciation: number
  ch1_memorization: number
  ch1_fluency: number
  ch1_chanting: number
  
  ch2_pronunciation: number
  ch2_memorization: number
  ch2_fluency: number
  ch2_chanting: number
  
  ch3_pronunciation: number
  ch3_memorization: number
  ch3_fluency: number
  ch3_chanting: number
  
  versesMemorized: number
  perfectRecitations: number
  tuneAccuracy: number
  teacherComments: string
  status: 'Active' | 'Paused' | 'Completed' | 'Dropped'
}

// Generate sample data (simplified)
const generateGitaStudents = (): GitaStudent[] => {
  const names = [
    'Arjun Sharma', 'Krishna Patel', 'Radha Singh', 'Govind Kumar', 'Rukmini Devi'
  ]
  
  const gurukulams = ['Vrindavan Ashram', 'Haridwar Gurukul', 'Rishikesh Vidyapeeth']
  const levels: GitaStudent['studyLevel'][] = ['Beginner', 'Intermediate', 'Advanced', 'Scholar']
  const statuses: GitaStudent['status'][] = ['Active', 'Paused', 'Completed']
  
  return names.map((name, index) => {
    const level = levels[index % 4]
    const baseScore = level === 'Scholar' ? 85 : level === 'Advanced' ? 70 : level === 'Intermediate' ? 55 : 40
    
    const getRandomScore = () => Math.max(0, Math.min(100, baseScore + Math.random() * 20 - 10))
    
    const overallGrade = Math.round(getRandomScore())
    const letterGrade = overallGrade >= 95 ? 'A+' : overallGrade >= 90 ? 'A' : overallGrade >= 85 ? 'B+' : 
                       overallGrade >= 80 ? 'B' : overallGrade >= 75 ? 'C+' : overallGrade >= 70 ? 'C' : 
                       overallGrade >= 60 ? 'D' : 'F'
    
    return {
      id: `student-${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      gurukulam: gurukulams[index % gurukulams.length],
      studyLevel: level,
      overallGrade,
      letterGrade: letterGrade as GitaStudent['letterGrade'],
      practiceDays: Math.floor(Math.random() * 180) + 50,
      maxPracticeDays: 365,
      consecutiveDays: Math.floor(Math.random() * 30) + 1,
      
      // Chapter scores
      ch1_pronunciation: Math.round(getRandomScore()),
      ch1_memorization: Math.round(getRandomScore()),
      ch1_fluency: Math.round(getRandomScore()),
      ch1_chanting: Math.round(getRandomScore()),
      
      ch2_pronunciation: Math.round(getRandomScore()),
      ch2_memorization: Math.round(getRandomScore()),
      ch2_fluency: Math.round(getRandomScore()),
      ch2_chanting: Math.round(getRandomScore()),
      
      ch3_pronunciation: Math.round(getRandomScore()),
      ch3_memorization: Math.round(getRandomScore()),
      ch3_fluency: Math.round(getRandomScore()),
      ch3_chanting: Math.round(getRandomScore()),
      
      versesMemorized: Math.floor(Math.random() * 100) + 10,
      perfectRecitations: Math.floor(Math.random() * 20) + 1,
      tuneAccuracy: Math.round(getRandomScore()),
      teacherComments: `Good progress in Sanskrit study. ${name} shows dedication.`,
      status: statuses[index % 3] as GitaStudent['status']
    }
  })
}

export function GitaStudyDashboard() {
  const [students] = useState<GitaStudent[]>(generateGitaStudents())
  const [selectedStudents, setSelectedStudents] = useState<GitaStudent[]>([])

  // Helper functions - Updated for inspiration-based colorful grade system
  const getGradeColor = (score: number): 'grade-a' | 'grade-b' | 'grade-c' | 'grade-d' | 'grade-f' => {
    if (score >= 90) return 'grade-a'  // 90+ = A (Green)
    if (score >= 80) return 'grade-b'  // 80-89 = B (Blue)
    if (score >= 70) return 'grade-c'  // 70-79 = C (Yellow)
    if (score >= 60) return 'grade-d'  // 60-69 = D (Orange)
    return 'grade-f'                   // <60 = F (Red)
  }
  
  // Letter grade to Badge variant mapping for consistency
  const getLetterGradeVariant = (letterGrade: string): 'grade-a' | 'grade-b' | 'grade-c' | 'grade-d' | 'grade-f' => {
    const grade = letterGrade.charAt(0).toUpperCase()
    switch (grade) {
      case 'A': return 'grade-a'  // Green
      case 'B': return 'grade-b'  // Blue  
      case 'C': return 'grade-c'  // Yellow
      case 'D': return 'grade-d'  // Orange
      case 'F': return 'grade-f'  // Red
      default: return 'grade-f'
    }
  }

  // Percentage with up arrow like inspiration
  const renderPercentageWithArrow = (value: number) => {
    const improvement = Math.floor(Math.random() * 15) + 1 // Random 1-15% improvement
    return (
      <div className="flex flex-col items-center gap-1">
        <Badge variant={getGradeColor(value)} size="sm">
          {value}%
        </Badge>
        <div className="text-xs text-muted-foreground percentage-indicator">
          {improvement}%
        </div>
      </div>
    )
  }

  const getLevelColor = (level: string): 'grade-a' | 'grade-b' | 'grade-c' | 'grade-d' => {
    switch(level) {
      case 'Scholar': return 'grade-a'      // Green for highest level
      case 'Advanced': return 'grade-b'     // Blue for advanced
      case 'Intermediate': return 'grade-c' // Yellow for intermediate
      default: return 'grade-d'             // Orange for beginner
    }
  }

  // Bulk Actions
  const bulkActions: BulkAction<GitaStudent>[] = [
    {
      id: 'email-progress',
      label: 'Email Progress Report',
      icon: <Mail className="w-4 h-4" />,
      action: (students) => {
        alert(`Progress reports sent to ${students.length} students`)
      }
    },
    {
      id: 'schedule-recitation',
      label: 'Schedule Group Recitation',
      icon: <BookOpen className="w-4 h-4" />,
      action: (students) => {
        alert(`Group recitation scheduled for ${students.length} students`)
      }
    }
  ]

  // Column configuration (simplified for testing)
  const columns: Column<GitaStudent>[] = [
    // Frozen columns
    {
      key: 'name',
      label: 'Student Name',
      align: 'left',
      sortable: true,
      searchable: true,
      width: 180,
      render: (value, student) => (
        <div className="flex flex-col">
          <span className="font-semibold">{value}</span>
          <span className="text-xs text-muted-foreground">{student.gurukulam}</span>
        </div>
      )
    },
    {
      key: 'studyLevel',
      label: 'Level',
      align: 'center',
      sortable: true,
      width: 100,
      render: (value) => (
        <Badge variant={getLevelColor(String(value))} size="sm">
          {value}
        </Badge>
      )
    },
    {
      key: 'overallGrade',
      label: 'Overall Grade',
      align: 'center',
      sortable: true,
      width: 120,
      render: (value, student) => {
        return (
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-bold">{value}%</span>
            <Badge variant={getLetterGradeVariant(student.letterGrade)} size="sm">
              {student.letterGrade}
            </Badge>
          </div>
        )
      }
    },
    {
      key: 'practiceDays',
      label: 'Practice Days',
      align: 'center',
      sortable: true,
      width: 120,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 365
      },
      dynamicBadge: {
        type: 'inventory',
        getValue: (student) => ({ 
          available: student.practiceDays, 
          total: student.maxPracticeDays 
        }),
        showPercentage: true,
        position: 'append'
      }
    },
    
    // Chapter 1 - Multi-level headers
    {
      key: 'ch1_pronunciation',
      label: 'Pronunciation',
      groupHeader: 'Chapter 1 - Arjuna Vishada Yoga',
      align: 'center',
      width: 100,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 100
      },
      render: (value) => renderPercentageWithArrow(Number(value))
    },
    {
      key: 'ch1_memorization',
      label: 'Memorization',
      groupHeader: 'Chapter 1 - Arjuna Vishada Yoga',
      align: 'center',
      width: 100,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 100
      },
      render: (value) => renderPercentageWithArrow(Number(value))
    },
    {
      key: 'ch1_fluency',
      label: 'Fluency',
      groupHeader: 'Chapter 1 - Arjuna Vishada Yoga', 
      align: 'center',
      width: 100,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 100
      },
      render: (value) => renderPercentageWithArrow(Number(value))
    },
    {
      key: 'ch1_chanting',
      label: 'Chanting',
      groupHeader: 'Chapter 1 - Arjuna Vishada Yoga',
      align: 'center', 
      width: 100,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 100
      },
      render: (value) => renderPercentageWithArrow(Number(value))
    },

    // Verses memorized with quantity editing
    {
      key: 'versesMemorized',
      label: 'Verses Memorized',
      align: 'center',
      sortable: true,
      width: 130,
      editable: {
        enabled: true,
        type: 'number',
        min: 0,
        max: 700
      },
      dynamicBadge: {
        type: 'inventory',
        getValue: (student) => ({
          available: student.versesMemorized,
          total: 700
        }),
        showPercentage: true,
        position: 'append'
      }
    },

    // Teacher comments with text editing
    {
      key: 'teacherComments',
      label: 'Teacher Comments',
      align: 'left',
      width: 200,
      editable: {
        enabled: true,
        type: 'text',
        maxLength: 200
      },
      render: (value) => (
        <div className="text-sm text-muted-foreground truncate max-w-[180px]" title={String(value)}>
          {value || 'No comments yet...'}
        </div>
      )
    },

    // Status with select editing
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      sortable: true,
      width: 100,
      editable: {
        enabled: true,
        type: 'select',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Paused', label: 'Paused' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Dropped', label: 'Dropped' }
        ]
      },
      render: (value) => {
        const variant = value === 'Active' ? 'success' : 
                       value === 'Completed' ? 'info' :
                       value === 'Paused' ? 'warning' : 'error'
        return (
          <Badge variant={variant} size="sm">
            {value}
          </Badge>
        )
      }
    }
  ]

  // Handle cell editing
  const handleCellEdit = async (student: GitaStudent, column: Column<GitaStudent>, newValue: string | number) => {
    console.log(`Updating ${student.name}'s ${String(column.key)} to ${newValue}`)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    alert(`Updated ${student.name}'s ${column.label}: ${newValue}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-orange-600" />
            Bhagavad Gita Study Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Track student progress in Sanskrit study, pronunciation, and chanting
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="info" className="px-3 py-1">
            {students.length} Students
          </Badge>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Grade Badge Test - Inspiration-based colorful system */}
      <div className="p-4 bg-card border rounded-lg">
        <h3 className="text-sm font-semibold mb-2">New Colorful Grade System (Inspiration-based)</h3>
        <div className="flex gap-2 mb-2">
          <Badge variant="grade-a" size="sm">A</Badge>
          <Badge variant="grade-b" size="sm">B</Badge>
          <Badge variant="grade-c" size="sm">C</Badge>
          <Badge variant="grade-d" size="sm">D</Badge>
          <Badge variant="grade-f" size="sm">F</Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          A=Green • B=Blue • C=Yellow • D=Orange • F=Red (matching Inspiration1.jpg)
        </div>
      </div>

      <DataTable
        data={students}
        columns={columns}
        loading={false}
        emptyMessage="No students enrolled in Gita study program"
        
        // Enable key features for testing
        pagination={{ 
          enabled: true, 
          pageSize: 5, 
          showPageSizeOptions: true 
        }}
        search={{ 
          enabled: true, 
          placeholder: "Search students..." 
        }}
        export={{ 
          enabled: true, 
          filename: "gita-study-progress" 
        }}
        
        // Column controls
        columnControls={{
          resizable: true,
          reorderable: true
        }}
        
        // Selection and bulk actions
        selection={{
          enabled: true,
          bulkActions: bulkActions
        }}
        onSelectionChange={setSelectedStudents}
        
        // Inline editing
        onCellEdit={handleCellEdit}
        
        // Frozen columns
        frozenColumns={[0, 1]} // Name and Level
        frozenHeader={true}
        maxHeight="60vh"
        
        // Responsive design
        responsive={{
          enabled: true,
          hideColumnsOnMobile: ['teacherComments'],
          compactOnMobile: true
        }}
        
        onRowClick={(student) => {
          alert(`Viewing ${student.name}\nLevel: ${student.studyLevel}\nGrade: ${student.overallGrade}%`)
        }}
      />
      
      {selectedStudents.length > 0 && (
        <div className="p-4 bg-table-container-elevated rounded-xl shadow-table-elevated border border-table">
          <p className="text-sm text-foreground">
            <strong>{selectedStudents.length}</strong> students selected for bulk actions.
          </p>
        </div>
      )}
    </div>
  )
}
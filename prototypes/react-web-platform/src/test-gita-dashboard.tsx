import React from 'react'
import { GitaStudyDashboard } from './domains/gita/GitaStudyDashboard'
import './index.css'

export function TestGitaDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GitaStudyDashboard />
    </div>
  )
}

export default TestGitaDashboard

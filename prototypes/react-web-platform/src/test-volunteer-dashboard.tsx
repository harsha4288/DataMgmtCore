import React from 'react'
import { VolunteerDashboard } from './domains/volunteers/VolunteerDashboard'
import './index.css'

export function TestVolunteerDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <VolunteerDashboard />
    </div>
  )
}

export default TestVolunteerDashboard

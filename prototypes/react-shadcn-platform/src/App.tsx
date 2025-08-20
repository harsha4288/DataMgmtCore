import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/lib/theme/provider'
import { Toaster } from '@/components/ui/toaster'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { GitBranch } from 'lucide-react'

// Import Phase 1 App
import Phase1App from './Phase1App'

// Import Phase 2 Pages
import LoginPage from './pages/login'
import ProfileSelectionPage from './pages/profile-selection'
import MemberDashboard from './pages/member-dashboard'
import AlumniDirectory from './pages/alumni-directory'
import CreatePostingPage from './pages/create-posting'
import BrowsePostingsPage from './pages/browse-postings'
import PreferencesPage from './pages/preferences'
import ChatPage from './pages/chat'
import ModerationDashboard from './pages/moderation-dashboard'
import AnalyticsDashboard from './pages/analytics-dashboard'

// Auth Guard Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('authenticated') === 'true'
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Phase Selection Component
function PhaseSelection() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <GitBranch className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">React + shadcn/ui Platform</h1>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Phase Selection Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Choose Development Phase</h2>
            <p className="text-muted-foreground text-lg mb-12">
              Select which phase of the platform you'd like to explore
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Phase 1 Card */}
              <div className="group cursor-pointer" onClick={() => window.location.href = '/phase1'}>
                <div className="border rounded-lg p-8 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                  <div className="mb-4">
                    <Badge variant="outline" className="mb-2">Phase 1</Badge>
                    <h3 className="text-2xl font-bold mb-2">Foundation & Components</h3>
                    <p className="text-muted-foreground">
                      Theme system, shadcn/ui components, TanStack tables, and development workflow
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Theme System (4 themes)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Advanced TanStack Tables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Component Showcase</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Claude Code Integration</span>
                    </div>
                  </div>

                  <Button className="w-full mt-6 group-hover:bg-primary/90">
                    Explore Phase 1
                  </Button>
                </div>
              </div>

              {/* Phase 2 Card */}
              <div className="group cursor-pointer" onClick={() => window.location.href = '/login'}>
                <div className="border rounded-lg p-8 hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
                  <div className="mb-4">
                    <Badge className="mb-2">Phase 2 - Current</Badge>
                    <h3 className="text-2xl font-bold mb-2">Gita Alumni Connect</h3>
                    <p className="text-muted-foreground">
                      Complete alumni platform with authentication, dashboards, and content management
                    </p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Multi-Profile Authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Role-Based Dashboards</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Content Management System</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Alumni Directory & Networking</span>
                    </div>
                  </div>

                  <Button className="w-full mt-6 group-hover:bg-primary/90">
                    Start Phase 2 Demo
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                Phase 2 is currently under development. All features are functional demos with mock data.
              </p>
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}

// Main App Component with Routing
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root - Phase Selection */}
        <Route path="/" element={<PhaseSelection />} />
        
        {/* Phase 1 Routes */}
        <Route path="/phase1" element={<Phase1App />} />
        
        {/* Phase 2 Routes */}
        <Route path="/login" element={
          <ThemeProvider>
            <LoginPage />
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/profile-selection" element={
          <ThemeProvider>
            <ProtectedRoute>
              <ProfileSelectionPage />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/member-dashboard" element={
          <ThemeProvider>
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/alumni-directory" element={
          <ThemeProvider>
            <ProtectedRoute>
              <AlumniDirectory />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/create-posting" element={
          <ThemeProvider>
            <ProtectedRoute>
              <CreatePostingPage />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        {/* Placeholder routes for future development */}
        <Route path="/moderator-dashboard" element={
          <ThemeProvider>
            <ProtectedRoute>
              <ModerationDashboard />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/admin-dashboard" element={
          <ThemeProvider>
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/browse-postings" element={
          <ThemeProvider>
            <ProtectedRoute>
              <BrowsePostingsPage />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/preferences" element={
          <ThemeProvider>
            <ProtectedRoute>
              <PreferencesPage />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        <Route path="/chat" element={
          <ThemeProvider>
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
            <Toaster />
          </ThemeProvider>
        } />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
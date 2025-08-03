import { useState } from 'react'
import { ThemeProvider } from './lib/theme/provider'
import { useTheme } from './lib/theme/provider'
import { StockDashboard } from './domains/stocks'
import { NewsDashboard } from './domains/news'
import { VolunteerDashboard } from './domains/volunteers'
import { GitaStudyDashboard } from './domains/gita'

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme, platform } = useTheme()

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex flex-col">
        <span className="text-sm font-medium">Theme System Demo</span>
        <span className="text-xs text-muted-foreground">
          Current: {theme} ({resolvedTheme}) on {platform}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className={`px-3 py-1 text-xs rounded ${
            theme === 'light' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Light
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`px-3 py-1 text-xs rounded ${
            theme === 'dark' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Dark
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`px-3 py-1 text-xs rounded ${
            theme === 'system' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          System
        </button>
      </div>
    </div>
  )
}

function EntityEngineDemo() {
  const [entityCount, setEntityCount] = useState(0)
  
  const handleCreateEntity = () => {
    // Demo: This would use the entity engine
    setEntityCount(count => count + 1)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex flex-col">
        <span className="text-sm font-medium">Entity Engine Demo</span>
        <span className="text-xs text-muted-foreground">
          Registered entities: {entityCount}
        </span>
      </div>
      <button
        onClick={handleCreateEntity}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
      >
        Register Sample Entity
      </button>
    </div>
  )
}


function AppContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8 space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            React Native-Like Data Platform
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A powerful, configuration-driven data management platform built with React 18, 
            TypeScript, and modern performance optimizations for native-like experiences.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          <ThemeToggle />
          <EntityEngineDemo />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Bhagavad Gita Study Management System 🕉️</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive testing of ALL DataTable and UnifiedInlineEditor features through Sanskrit study tracking
            </p>
            <GitaStudyDashboard />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Volunteer T-shirt Management (SGS Patterns)</h2>
            <VolunteerDashboard />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Stock Market Dashboard</h2>
            <StockDashboard />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Breaking News Dashboard</h2>
            <NewsDashboard />
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Features Demonstrated</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-card text-card-foreground rounded-lg border">
              <h3 className="font-semibold mb-2">🎨 Advanced Theme System</h3>
              <p className="text-sm text-muted-foreground">
                Design tokens with platform-specific adaptations, automatic light/dark mode, 
                and CSS custom properties.
              </p>
            </div>
            <div className="p-4 bg-card text-card-foreground rounded-lg border">
              <h3 className="font-semibold mb-2">🏗️ Entity Engine</h3>
              <p className="text-sm text-muted-foreground">
                Configuration-driven entity management with validation, relationships, 
                and business rules.
              </p>
            </div>
            <div className="p-4 bg-card text-card-foreground rounded-lg border">
              <h3 className="font-semibold mb-2">📊 SGS-Inspired Enterprise DataTable</h3>
              <p className="text-sm text-muted-foreground">
                Multi-level headers, inline quantity editors, visual status indicators, and bulk operations - demonstrated across Volunteer, Stock, and News domains.
              </p>
            </div>
            <div className="p-4 bg-card text-card-foreground rounded-lg border">
              <h3 className="font-semibold mb-2">📱 Platform Detection</h3>
              <p className="text-sm text-muted-foreground">
                Automatic mobile/tablet/desktop detection with adaptive UI components.
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center text-sm text-muted-foreground">
          <p>Built with React 18, TypeScript, Tailwind CSS, and Vite</p>
          <p className="mt-2">🚀 Ready for production-scale data management applications</p>
        </footer>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
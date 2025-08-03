import { ThemeProvider } from './lib/theme/provider'
import { useTheme } from './lib/theme/provider'
import { StockDashboard } from './domains/stocks'
import { NewsDashboard } from './domains/news'
import { VolunteerDashboard } from './domains/volunteers'
import { GitaStudyDashboard } from './domains/gita'
<<<<<<< HEAD
import { ErrorBoundary } from './components/ErrorBoundary'
=======
import { PWAStatus } from './components/behaviors/PWAStatus'
>>>>>>> 8e77fbd (Phase 5.1 PWA setup)

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
      </div>
    </div>
  )
}

function AppContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8 space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            React Data Platform - Debug Mode
          </h1>
          <p className="text-muted-foreground">Testing basic functionality</p>
        </header>

        <div className="grid gap-6">
          <ThemeToggle />
<<<<<<< HEAD
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
            <p className="text-sm text-muted-foreground">
              Basic app structure is working. Testing Stock Dashboard...
            </p>
          </div>
          
=======
          <EntityEngineDemo />
          <PWAStatus />
        </div>

        <div className="space-y-8">
>>>>>>> 8e77fbd (Phase 5.1 PWA setup)
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🕉️ Bhagavad Gita Study Management</h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive testing of ALL DataTable and UnifiedInlineEditor features through Sanskrit study tracking
            </p>
            <ErrorBoundary name="GitaStudyDashboard">
              <GitaStudyDashboard />
            </ErrorBoundary>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Stock Market Dashboard</h2>
            <ErrorBoundary name="StockDashboard">
              <StockDashboard />
            </ErrorBoundary>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Breaking News Dashboard</h2>
            <ErrorBoundary name="NewsDashboard">
              <NewsDashboard />
            </ErrorBoundary>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Volunteer T-shirt Management</h2>
            <ErrorBoundary name="VolunteerDashboard">
              <VolunteerDashboard />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
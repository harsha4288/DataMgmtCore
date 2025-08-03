import { ThemeProvider } from './lib/theme/provider'
import { useTheme } from './lib/theme/provider'
import { StockDashboard } from './domains/stocks'
import { NewsDashboard } from './domains/news'
import { VolunteerDashboard } from './domains/volunteers'
import { GitaStudyDashboard } from './domains/gita'
import { SimpleVirtualTest } from './domains/test/SimpleVirtualTest'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PWAStatus } from './components/behaviors/PWAStatus'
import { PWADebugTracker } from './components/debug/PWADebugTracker'
import { OfflineBanner, OfflineIndicator } from './components/behaviors/OfflineBanner'

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
          <PWAStatus />
          <div className="p-4 bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-lg">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-200">🔴 CACHE TEST - If you see this, the changes are working!</h3>
            <p className="text-red-700 dark:text-red-300">This should appear immediately if caching issues are resolved.</p>
          </div>
        </div>

        <div className="space-y-8">
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
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">🧪 Virtual Scrolling Test - Simple Demo</h2>
            <p className="text-sm text-muted-foreground">
              Testing VirtualizedDataTableOptimized with simple data (no API dependencies)
            </p>
            <ErrorBoundary name="SimpleVirtualTest">
              <SimpleVirtualTest />
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
      <OfflineBanner />
      <AppContent />
      <OfflineIndicator />
      <PWADebugTracker />
    </ThemeProvider>
  )
}
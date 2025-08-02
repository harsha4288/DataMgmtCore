import { ThemeProvider } from './lib/theme/provider'
import { useTheme } from './lib/theme/provider'

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
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Debug Info</h2>
            <p className="text-sm text-muted-foreground">
              If you can see this, the basic app structure is working.
            </p>
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
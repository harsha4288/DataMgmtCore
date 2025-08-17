import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeProvider } from '@/lib/theme/provider'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ThemedButton, ThemedCard, ThemedCardContent, ThemedCardDescription, ThemedCardHeader, ThemedCardTitle } from '@/components/theme'
import { useTheme } from '@/lib/theme/hooks'
import './App.css'

function AppContent() {
  const [count, setCount] = useState(0)
  const { currentTheme, theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
        
        <h1 className="text-4xl font-bold text-center mb-8">
          React + shadcn/ui Platform
        </h1>

        {/* Visual Theme Test */}
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Theme Visual Test</h2>

          {/* Large visual indicator */}
          <div className="mb-4 p-6 rounded-lg border-2 transition-all duration-300" style={{
            backgroundColor: theme.colors.bgPrimary,
            borderColor: theme.colors.borderColor,
            color: theme.colors.textPrimary
          }}>
            <div className="text-2xl font-bold mb-2">Current Theme: {theme.displayName}</div>
            <div className="text-lg">Background: {theme.colors.bgPrimary}</div>
            <div className="text-lg">Text: {theme.colors.textPrimary}</div>
            <div className="text-lg">Accent: {theme.colors.accentColor}</div>
            <div className="mt-2 text-sm opacity-75">
              This box uses inline styles and should change immediately when themes switch
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-background border rounded">
              <div className="font-medium">Background</div>
              <div className="text-muted-foreground">bg-background</div>
            </div>
            <div className="p-3 bg-card border rounded">
              <div className="font-medium">Card</div>
              <div className="text-muted-foreground">bg-card</div>
            </div>
            <div className="p-3 bg-muted border rounded">
              <div className="font-medium">Muted</div>
              <div className="text-muted-foreground">bg-muted</div>
            </div>
            <div className="p-3 bg-accent border rounded">
              <div className="font-medium">Accent</div>
              <div className="text-accent-foreground">bg-accent</div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Original Card */}
          <Card>
            <CardHeader>
              <CardTitle>Original shadcn/ui Components</CardTitle>
              <CardDescription>
                These are the standard shadcn/ui components without theme integration
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => setCount((count) => count + 1)}
                className="mb-4"
              >
                Count is {count}
              </Button>
              <p className="text-sm text-muted-foreground">
                Edit <code className="bg-muted px-1 rounded">src/App.tsx</code> and save to test HMR
              </p>
            </CardContent>
          </Card>
          
          {/* Themed Card */}
          <ThemedCard>
            <ThemedCardHeader>
              <ThemedCardTitle>Themed Components</ThemedCardTitle>
              <ThemedCardDescription>
                These components are wrapped with theme-aware styling
              </ThemedCardDescription>
            </ThemedCardHeader>
            <ThemedCardContent className="text-center">
              <ThemedButton
                onClick={() => setCount((count) => count + 1)}
                className="mb-4"
              >
                Themed Count is {count}
              </ThemedButton>
              <p className="text-sm text-muted-foreground">
                This card and button adapt to the current theme
              </p>
            </ThemedCardContent>
          </ThemedCard>
          
          {/* Theme Information */}
          <Card>
            <CardHeader>
              <CardTitle>Theme System Status</CardTitle>
              <CardDescription>
                Task 1.2 - Theme System Implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Available Themes:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Default - Professional light theme</li>
                    <li>• Dark - Professional dark theme</li>
                    <li>• Gita - Spiritual/meditation theme</li>
                    <li>• Professional - Corporate/enterprise theme</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Features:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• CSS variable injection</li>
                    <li>• Theme persistence (localStorage)</li>
                    <li>• System preference detection</li>
                    <li>• Performance monitoring</li>
                    <li>• Component wrappers</li>
                  </ul>
                </div>
              </div>

              {/* Debug Information */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Theme Switching Fixed! ✅</h4>
                <div className="text-sm space-y-1 mb-3">
                  <div>Current Theme: <code className="bg-background px-1 rounded">{currentTheme}</code></div>
                  <div>Theme Name: <code className="bg-background px-1 rounded">{theme.displayName}</code></div>
                  <div>Primary BG: <code className="bg-background px-1 rounded">{theme.colors.bgPrimary}</code></div>
                  <div>Primary Text: <code className="bg-background px-1 rounded">{theme.colors.textPrimary}</code></div>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  <strong>Fix Applied:</strong> Removed static .dark CSS class that was overriding dynamic CSS variables
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => {
                      const root = document.documentElement;
                      const bgVar = getComputedStyle(root).getPropertyValue('--background').trim();
                      const fgVar = getComputedStyle(root).getPropertyValue('--foreground').trim();
                      const bgPrimary = getComputedStyle(root).getPropertyValue('--bg-primary').trim();
                      const cardVar = getComputedStyle(root).getPropertyValue('--card').trim();
                      console.log('Current CSS Variables:', {
                        '--background': bgVar,
                        '--foreground': fgVar,
                        '--bg-primary': bgPrimary,
                        '--card': cardVar,
                        currentTheme,
                        themeColors: theme.colors
                      });
                      alert(`Theme: ${currentTheme}\n--background: ${bgVar}\n--bg-primary: ${bgPrimary}`);
                    }}
                    size="sm"
                  >
                    Check Variables
                  </Button>

                  <Button
                    onClick={() => {
                      // Force a theme switch to test
                      const testTheme = currentTheme === 'default' ? 'dark' : 'default';
                      console.log(`Force switching from ${currentTheme} to ${testTheme}`);
                      setTheme(testTheme);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Test Switch
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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

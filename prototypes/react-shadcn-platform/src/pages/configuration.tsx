// React import removed - not needed with JSX transform
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { ConfigurationHub } from '@/components/configuration/ConfigurationHub';

export default function ConfigurationPage() {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Configuration Management</h1>
                  <p className="text-sm text-muted-foreground">Task 5.8.2 - Universal Configuration System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Status: <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <ConfigurationHub />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Universal Configuration Management System - Phase 5.8.2
            </div>
            <div>
              Designed for user-agnostic project management
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
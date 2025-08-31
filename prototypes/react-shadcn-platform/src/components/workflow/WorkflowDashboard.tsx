/**
 * Unified Workflow Dashboard - Phase 5.8.3.1
 * PRIMARY Navigation Hub using Tree Architecture
 * 
 * Key Navigation Principles:
 * - Tree IS the navigation: Single source of truth for project structure
 * - Progressive disclosure: Context reveals details on demand
 * - No external tabs/navigation needed within workflow context
 * - Contextual actions available inline within tree nodes
 * - Theme-aware design leveraging shadcn/ui components
 * 
 * This dashboard is designed to be self-contained and replace
 * traditional tab-based navigation with tree-based hierarchy
 */

import React from 'react';
import { VSCodeLayout } from './workspace/VSCodeLayout';
import { TreeDataProvider } from './workspace/TreeDataProvider';
import { useProjectTreeData } from '@/hooks/useProjectTreeData';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';


const WorkflowDashboard: React.FC = () => {
  const { projectData, isLoading, error, refetch } = useProjectTreeData();

  if (isLoading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading project data from GraphQL...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">GraphQL Connection Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          {projectData && (
            <p className="text-sm text-muted-foreground">
              Showing fallback data below
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No project data available</p>
      </div>
    );
  }

  return (
    <TreeDataProvider projectData={projectData}>
      {/* VS Code-style 3-panel layout interface */}
      <div className="h-screen bg-background">
        <VSCodeLayout 
          entities={[projectData]}
          className="h-full"
        />
      </div>
    </TreeDataProvider>
  );
};

export default WorkflowDashboard;
/**
 * Unified Workspace - Single container replacing fragmented tab system
 * Provides seamless task management with contextual panels and navigation
 */

import React, { useState, useCallback } from 'react';
import { NavigationSidebar } from './NavigationSidebar';
import { MainContentArea } from './MainContentArea';
import { ContextualPanel } from './ContextualPanel';

export type WorkspaceView = 
  | 'overview' 
  | 'my-tasks' 
  | 'all-tasks' 
  | 'issues' 
  | 'documentation' 
  | 'quality' 
  | 'reports';

export interface SelectedTask {
  id: string;
  title: string;
  status: string;
  assignee?: string;
  priority?: string;
  labels?: string[];
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

export interface WorkspaceState {
  currentView: WorkspaceView;
  selectedTask: SelectedTask | null;
  isPanelOpen: boolean;
  panelContent: 'status' | 'issue' | 'document' | 'collaboration' | null;
}

export const UnifiedWorkspace: React.FC = () => {
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    currentView: 'overview',
    selectedTask: null,
    isPanelOpen: false,
    panelContent: null
  });

  const handleNavigationChange = useCallback((view: WorkspaceView) => {
    setWorkspaceState(prev => ({
      ...prev,
      currentView: view,
      // Close panel when switching main views
      isPanelOpen: false,
      panelContent: null
    }));
  }, []);

  const handleTaskSelect = useCallback((task: SelectedTask) => {
    setWorkspaceState(prev => ({
      ...prev,
      selectedTask: task,
      // Auto-open contextual panel with task details
      isPanelOpen: true,
      panelContent: 'status'
    }));
  }, []);

  const handlePanelToggle = useCallback((content: WorkspaceState['panelContent']) => {
    setWorkspaceState(prev => ({
      ...prev,
      isPanelOpen: prev.panelContent === content ? !prev.isPanelOpen : true,
      panelContent: content
    }));
  }, []);

  const handlePanelClose = useCallback(() => {
    setWorkspaceState(prev => ({
      ...prev,
      isPanelOpen: false,
      panelContent: null
    }));
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Fixed Navigation Sidebar */}
      <div className="w-64 border-r bg-card">
        <NavigationSidebar
          currentView={workspaceState.currentView}
          onNavigationChange={handleNavigationChange}
          selectedTask={workspaceState.selectedTask}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${
        workspaceState.isPanelOpen ? 'mr-80' : 'mr-0'
      }`}>
        <MainContentArea
          currentView={workspaceState.currentView}
          selectedTask={workspaceState.selectedTask}
          onTaskSelect={handleTaskSelect}
          onPanelToggle={handlePanelToggle}
        />
      </div>

      {/* Contextual Panel (Slide-in from right) */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-card border-l z-50 transform transition-transform duration-300 ${
        workspaceState.isPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <ContextualPanel
          isOpen={workspaceState.isPanelOpen}
          content={workspaceState.panelContent}
          selectedTask={workspaceState.selectedTask}
          onClose={handlePanelClose}
          onContentChange={handlePanelToggle}
        />
      </div>

      {/* Overlay when panel is open (mobile/tablet) */}
      {workspaceState.isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={handlePanelClose}
        />
      )}
    </div>
  );
};
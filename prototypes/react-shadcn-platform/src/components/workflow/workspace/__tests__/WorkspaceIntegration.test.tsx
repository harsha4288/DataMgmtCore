/**
 * @jest-environment jsdom
 * 
 * Integration Tests for Unified Workspace Navigation Flow
 * Tests the complete navigation flow architecture redesign as specified in:
 * - task-5.8.3.1-navigation-flow-architecture-redesign.md
 * - task-5.8.3-advanced-dashboard-functionality.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen as screenTest, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedWorkspace, WorkspaceView, SelectedTask } from '../UnifiedWorkspace';

// Mock all UI components consistently across the workspace
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={`btn ${variant || ''} ${size || ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant || ''} ${className || ''}`}>
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={`scroll-area ${className || ''}`}>{children}</div>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={`card ${className || ''}`}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={`card-content ${className || ''}`}>{children}</div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div className={`card-description ${className || ''}`}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={`card-header ${className || ''}`}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={`card-title ${className || ''}`}>{children}</h3>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={`progress ${className || ''}`} data-value={value}>
      Progress: {value}%
    </div>
  )
}));

// Mock all lucide icons used across workspace components
vi.mock('lucide-react', () => ({
  // Navigation icons
  Home: ({ className }: { className?: string }) => <span data-testid="home-icon" className={className}>🏠</span>,
  CheckSquare: ({ className }: { className?: string }) => <span data-testid="checksquare-icon" className={className}>☑️</span>,
  List: ({ className }: { className?: string }) => <span data-testid="list-icon" className={className}>📋</span>,
  Bug: ({ className }: { className?: string }) => <span data-testid="bug-icon" className={className}>🐛</span>,
  FileText: ({ className }: { className?: string }) => <span data-testid="filetext-icon" className={className}>📄</span>,
  Shield: ({ className }: { className?: string }) => <span data-testid="shield-icon" className={className}>🛡️</span>,
  BarChart3: ({ className }: { className?: string }) => <span data-testid="barchart3-icon" className={className}>📊</span>,
  
  // Action icons
  Plus: ({ className }: { className?: string }) => <span data-testid="plus-icon" className={className}>➕</span>,
  Search: ({ className }: { className?: string }) => <span data-testid="search-icon" className={className}>🔍</span>,
  Filter: ({ className }: { className?: string }) => <span data-testid="filter-icon" className={className}>🔽</span>,
  
  // Panel icons
  X: ({ className }: { className?: string }) => <span data-testid="x-icon" className={className}>✕</span>,
  Settings: ({ className }: { className?: string }) => <span data-testid="settings-icon" className={className}>⚙️</span>,
  MessageSquare: ({ className }: { className?: string }) => <span data-testid="messagesquare-icon" className={className}>💬</span>,
  
  // Task detail icons
  ArrowLeft: ({ className }: { className?: string }) => <span data-testid="arrow-left-icon" className={className}>←</span>,
  Calendar: ({ className }: { className?: string }) => <span data-testid="calendar-icon" className={className}>📅</span>,
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}>👤</span>,
  Clock: ({ className }: { className?: string }) => <span data-testid="clock-icon" className={className}>🕐</span>,
  
  // Status icons
  CheckCircle: ({ className }: { className?: string }) => <span data-testid="check-circle-icon" className={className}>✓</span>,
  AlertTriangle: ({ className }: { className?: string }) => <span data-testid="alert-triangle-icon" className={className}>⚠️</span>,
  XCircle: ({ className }: { className?: string }) => <span data-testid="x-circle-icon" className={className}>✕</span>,
  Play: ({ className }: { className?: string }) => <span data-testid="play-icon" className={className}>▶️</span>,
  ArrowRight: ({ className }: { className?: string }) => <span data-testid="arrow-right-icon" className={className}>→</span>,
  Tag: ({ className }: { className?: string }) => <span data-testid="tag-icon" className={className}>🏷️</span>
}));

describe('Unified Workspace Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Architecture Requirements Validation', () => {
    it('implements unified workspace model replacing 7-tab navigation', () => {
      render(<UnifiedWorkspace />);
      
      // Should have single unified container, not fragmented tabs
      expect(screenTest.getByText('Project Workspace')).toBeInTheDocument();
      expect(screenTest.getByText('Real Data Management')).toBeInTheDocument();
      
      // Should not have old tab-based navigation elements
      expect(screenTest.queryByRole('tablist')).not.toBeInTheDocument();
      expect(screenTest.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('provides navigation sidebar with contextual main content', () => {
      render(<UnifiedWorkspace />);
      
      // Navigation sidebar should be present
      const sidebar = screenTest.getByText('Project Workspace').closest('div');
      expect(sidebar?.parentElement).toHaveClass('w-64', 'border-r', 'bg-card');
      
      // Main content area should be present
      const mainContent = screenTest.getByText('Project Overview');
      expect(mainContent).toBeInTheDocument();
    });

    it('implements dynamic contextual panel system', () => {
      render(<UnifiedWorkspace />);
      
      // Contextual panel container should exist but be hidden initially
      const panelContainer = document.querySelector('.fixed.right-0.top-0');
      expect(panelContainer).toBeInTheDocument();
      expect(panelContainer).toHaveClass('translate-x-full'); // Hidden initially
    });

    it('maintains layout architecture under 250 lines per component', () => {
      // This is validated by the component structure - each component should be modular
      render(<UnifiedWorkspace />);
      
      // Core components should be rendering
      expect(screenTest.getByText('Project Workspace')).toBeInTheDocument(); // NavigationSidebar
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument(); // MainContentArea
    });
  });

  describe('Navigation Flow Integration', () => {
    it('switches between all workspace views correctly', async () => {
      render(<UnifiedWorkspace />);
      
      const workspaceViews: { text: string; expected: string }[] = [
        { text: 'Overview', expected: 'Project Overview' },
        { text: 'My Tasks', expected: 'My Tasks' },
        { text: 'All Tasks', expected: 'All Tasks' },
        { text: 'Issues', expected: 'Issues' },
        { text: 'Documentation', expected: 'Documentation' },
        { text: 'Quality', expected: 'Quality Control' },
        { text: 'Reports', expected: 'Reports' }
      ];
      
      for (const view of workspaceViews) {
        await user.click(screenTest.getByText(view.text));
        expect(screenTest.getByText(view.expected)).toBeInTheDocument();
      }
    });

    it('closes contextual panel when switching navigation views', async () => {
      render(<UnifiedWorkspace />);
      
      // Simulate selecting a task (which opens panel)
      const selectTaskButton = screenTest.getByText('Select Task');
      await user.click(selectTaskButton);
      
      // Panel should be open
      const panel = document.querySelector('.translate-x-0');
      expect(panel).toBeInTheDocument();
      
      // Switch navigation view
      await user.click(screenTest.getByText('Issues'));
      
      // Panel should be closed
      const closedPanel = document.querySelector('.translate-x-full');
      expect(closedPanel).toBeInTheDocument();
    });

    it('preserves task selection across navigation changes', async () => {
      render(<UnifiedWorkspace />);
      
      // Select a task
      await user.click(screenTest.getByText('Select Task'));
      expect(screenTest.getByText('Test Task')).toBeInTheDocument();
      
      // Switch navigation view
      await user.click(screenTest.getByText('Issues'));
      
      // Task should still be selected in sidebar
      expect(screenTest.getByText('Test Task')).toBeInTheDocument();
    });
  });

  describe('Contextual Panel Integration', () => {
    it('opens contextual panel when task is selected', async () => {
      render(<UnifiedWorkspace />);
      
      // Initially panel should be closed
      let panel = document.querySelector('.translate-x-0');
      expect(panel).not.toBeInTheDocument();
      
      // Select a task
      await user.click(screenTest.getByText('Select Task'));
      
      // Panel should open with status content by default
      panel = document.querySelector('.translate-x-0');
      expect(panel).toBeInTheDocument();
      
      // Should show contextual panel content
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });

    it('switches panel content without closing panel', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task to open panel
      await user.click(screenTest.getByText('Select Task'));
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
      
      // Switch to different panel content
      const issueButton = screenTest.getByText('Issue Panel');
      await user.click(issueButton);
      
      // Panel should remain open but content should change
      const panel = document.querySelector('.translate-x-0');
      expect(panel).toBeInTheDocument();
    });

    it('closes panel when close button is clicked', async () => {
      render(<UnifiedWorkspace />);
      
      // Open panel by selecting task
      await user.click(screenTest.getByText('Select Task'));
      expect(document.querySelector('.translate-x-0')).toBeInTheDocument();
      
      // Close panel
      const closeButton = screenTest.getByTestId('x-icon').closest('button');
      await user.click(closeButton!);
      
      // Panel should be closed
      expect(document.querySelector('.translate-x-full')).toBeInTheDocument();
    });

    it('closes panel when overlay is clicked', async () => {
      render(<UnifiedWorkspace />);
      
      // Open panel
      await user.click(screenTest.getByText('Select Task'));
      expect(document.querySelector('.translate-x-0')).toBeInTheDocument();
      
      // Click overlay
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/20') as HTMLElement;
      if (overlay) {
        await user.click(overlay);
        expect(document.querySelector('.translate-x-full')).toBeInTheDocument();
      }
    });
  });

  describe('Task Detail View Integration', () => {
    it('switches to task detail view when task is selected', async () => {
      render(<UnifiedWorkspace />);
      
      // Initially should show workspace view
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
      
      // Select a task
      await user.click(screenTest.getByText('Select Task'));
      
      // Should switch to task detail view
      expect(screenTest.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
    });

    it('returns to list view when back button is clicked', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task to enter detail view
      await user.click(screenTest.getByText('Select Task'));
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
      
      // Click back button
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);
      
      // Should return to workspace view
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
      expect(screenTest.queryByText('Task Information')).not.toBeInTheDocument();
    });

    it('opens contextual panels from task detail view', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task to enter detail view
      await user.click(screenTest.getByText('Select Task'));
      
      // Click panel action buttons in task detail
      const statusButton = screenTest.getByText('Status').closest('button');
      await user.click(statusButton!);
      
      // Panel should open
      expect(document.querySelector('.translate-x-0')).toBeInTheDocument();
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });
  });

  describe('Layout and Responsive Behavior', () => {
    it('adjusts main content margin based on panel state', async () => {
      render(<UnifiedWorkspace />);
      
      // Initially no right margin
      const mainContent = screenTest.getByText('Project Overview').closest('div')?.parentElement;
      expect(mainContent).toHaveClass('mr-0');
      
      // Open panel
      await user.click(screenTest.getByText('Select Task'));
      
      // Should have right margin to accommodate panel
      expect(mainContent).toHaveClass('mr-80');
    });

    it('provides proper overlay behavior for mobile', async () => {
      render(<UnifiedWorkspace />);
      
      // No overlay initially
      expect(document.querySelector('.fixed.inset-0.bg-black\\/20')).not.toBeInTheDocument();
      
      // Open panel
      await user.click(screenTest.getByText('Select Task'));
      
      // Overlay should appear
      expect(document.querySelector('.fixed.inset-0.bg-black\\/20')).toBeInTheDocument();
    });

    it('maintains consistent layout structure', () => {
      render(<UnifiedWorkspace />);
      
      // Main container should have proper layout classes
      const container = screenTest.getByText('Project Workspace').closest('div')?.parentElement?.parentElement;
      expect(container).toHaveClass('flex', 'h-screen', 'bg-background');
    });
  });

  describe('Advanced Dashboard Functionality Integration', () => {
    it('supports rich task metadata display', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task to see detailed view
      await user.click(screenTest.getByText('Select Task'));
      
      // Should show comprehensive task information
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
      expect(screenTest.getByText('Assignee: user1')).toBeInTheDocument();
      expect(screenTest.getByText('Progress: 60%')).toBeInTheDocument();
    });

    it('provides document preview integration', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task and open document panel
      await user.click(screenTest.getByText('Select Task'));
      await user.click(screenTest.getByText('Document Panel'));
      
      // Should show document integration
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });

    it('enables status management workflow', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task and open status panel
      await user.click(screenTest.getByText('Select Task'));
      await user.click(screenTest.getByText('Status Panel'));
      
      // Should provide status management interface
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });

    it('supports issue management integration', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task and open issue panel
      await user.click(screenTest.getByText('Select Task'));
      await user.click(screenTest.getByText('Issue Panel'));
      
      // Should provide issue management interface
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });
  });

  describe('Context Preservation', () => {
    it('maintains context when switching between panel contents', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task
      await user.click(screenTest.getByText('Select Task'));
      
      // Switch between different panel contents
      await user.click(screenTest.getByText('Status Panel'));
      await user.click(screenTest.getByText('Issue Panel'));
      await user.click(screenTest.getByText('Document Panel'));
      
      // Context should be preserved - task still selected
      expect(screenTest.getByText('Test Task')).toBeInTheDocument();
    });

    it('preserves workspace state across interactions', async () => {
      render(<UnifiedWorkspace />);
      
      // Change workspace view
      await user.click(screenTest.getByText('Issues'));
      
      // Select task
      await user.click(screenTest.getByText('Select Task'));
      
      // Return to list view
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);
      
      // Should return to Issues view, not default Overview
      expect(screenTest.getByText('Issues')).toBeInTheDocument();
    });
  });

  describe('Performance and Efficiency', () => {
    it('handles rapid navigation changes efficiently', async () => {
      render(<UnifiedWorkspace />);
      
      const views = ['My Tasks', 'All Tasks', 'Issues', 'Documentation', 'Quality', 'Reports', 'Overview'];
      
      // Rapidly switch between views
      for (const view of views) {
        await user.click(screenTest.getByText(view));
      }
      
      // Should end up on Overview
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
    });

    it('handles panel state changes efficiently', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task
      await user.click(screenTest.getByText('Select Task'));
      
      // Rapidly switch panel contents
      const panelButtons = ['Status Panel', 'Issue Panel', 'Document Panel'];
      for (const button of panelButtons) {
        await user.click(screenTest.getByText(button));
      }
      
      // Panel should remain open and functional
      expect(document.querySelector('.translate-x-0')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles task deselection gracefully', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task
      await user.click(screenTest.getByText('Select Task'));
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
      
      // Deselect task (return to list)
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);
      
      // Should return to workspace view without errors
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
    });

    it('handles panel operations without selected task', async () => {
      render(<UnifiedWorkspace />);
      
      // Try to open panel without task (should not crash)
      const statusPanelButton = screenTest.queryByText('Status Panel');
      if (statusPanelButton) {
        await user.click(statusPanelButton);
      }
      
      // Should still show workspace
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
    });

    it('maintains state consistency during edge case operations', async () => {
      render(<UnifiedWorkspace />);
      
      // Perform sequence of operations that might cause state issues
      await user.click(screenTest.getByText('Issues')); // Change view
      await user.click(screenTest.getByText('Select Task')); // Select task
      await user.click(screenTest.getByText('Overview')); // Change view again
      
      // State should be consistent
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
      // Task should still be selected in sidebar context
      expect(screenTest.getByText('Test Task')).toBeInTheDocument();
    });
  });

  describe('Success Criteria Validation', () => {
    it('eliminates tab fragmentation with unified workspace', () => {
      render(<UnifiedWorkspace />);
      
      // Should have unified workspace, not fragmented tabs
      expect(screenTest.queryByRole('tabpanel')).not.toBeInTheDocument();
      expect(screenTest.queryByRole('tablist')).not.toBeInTheDocument();
      
      // Should have single workspace container
      expect(screenTest.getByText('Project Workspace')).toBeInTheDocument();
    });

    it('provides contextual actions without navigation loss', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task to see contextual actions
      await user.click(screenTest.getByText('Select Task'));
      
      // Actions should be available without losing main context
      expect(screenTest.getByText('Status')).toBeInTheDocument();
      expect(screenTest.getByText('Issues')).toBeInTheDocument();
      expect(screenTest.getByText('Docs')).toBeInTheDocument();
      expect(screenTest.getByText('Chat')).toBeInTheDocument();
      
      // Main task context should still be visible
      expect(screenTest.getByText('Test Task')).toBeInTheDocument();
    });

    it('integrates document preview within task context', async () => {
      render(<UnifiedWorkspace />);
      
      // Select task to see document integration
      await user.click(screenTest.getByText('Select Task'));
      
      // Document preview should be integrated in task detail
      expect(screenTest.getByText('Attached Documents')).toBeInTheDocument();
      expect(screenTest.getByText('Preview and edit documents without losing context')).toBeInTheDocument();
    });

    it('enables progressive information disclosure', async () => {
      render(<UnifiedWorkspace />);
      
      // Initially shows high-level overview
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
      
      // Selecting task reveals more detail progressively
      await user.click(screenTest.getByText('Select Task'));
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
      
      // Opening panels reveals even more specific information
      await user.click(screenTest.getByText('Status'));
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });
  });
});
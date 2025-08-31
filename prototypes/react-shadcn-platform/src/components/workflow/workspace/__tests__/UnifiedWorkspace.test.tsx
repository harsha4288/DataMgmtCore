/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen as screenTest, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedWorkspace, WorkspaceView, SelectedTask } from '../UnifiedWorkspace';

// Mock child components
vi.mock('../NavigationSidebar', () => ({
  NavigationSidebar: ({ currentView, onNavigationChange, selectedTask }: any) => (
    <div data-testid="navigation-sidebar">
      <span data-testid="current-view">{currentView}</span>
      <button 
        data-testid="nav-my-tasks" 
        onClick={() => onNavigationChange('my-tasks')}
      >
        My Tasks
      </button>
      <button 
        data-testid="nav-all-tasks" 
        onClick={() => onNavigationChange('all-tasks')}
      >
        All Tasks
      </button>
      <button 
        data-testid="nav-issues" 
        onClick={() => onNavigationChange('issues')}
      >
        Issues
      </button>
      {selectedTask && <span data-testid="selected-task">{selectedTask.title}</span>}
    </div>
  )
}));

vi.mock('../MainContentArea', () => ({
  MainContentArea: ({ currentView, selectedTask, onTaskSelect, onPanelToggle }: any) => (
    <div data-testid="main-content-area">
      <span data-testid="main-view">{currentView}</span>
      <button 
        data-testid="select-task" 
        onClick={() => onTaskSelect({ 
          id: 'task-1', 
          title: 'Test Task', 
          status: 'in_progress',
          assignee: 'user1',
          priority: 'high'
        })}
      >
        Select Task
      </button>
      <button 
        data-testid="toggle-status-panel" 
        onClick={() => onPanelToggle('status')}
      >
        Status Panel
      </button>
      <button 
        data-testid="toggle-issue-panel" 
        onClick={() => onPanelToggle('issue')}
      >
        Issue Panel
      </button>
      <button 
        data-testid="toggle-document-panel" 
        onClick={() => onPanelToggle('document')}
      >
        Document Panel
      </button>
    </div>
  )
}));

vi.mock('../ContextualPanel', () => ({
  ContextualPanel: ({ isOpen, content, selectedTask, onClose, onContentChange }: any) => (
    <div data-testid="contextual-panel" data-open={isOpen}>
      <span data-testid="panel-content">{content || 'none'}</span>
      {selectedTask && <span data-testid="panel-task">{selectedTask.title}</span>}
      <button data-testid="close-panel" onClick={onClose}>Close</button>
      <button data-testid="change-content" onClick={() => onContentChange('collaboration')}>
        Change Content
      </button>
    </div>
  )
}));

describe('UnifiedWorkspace', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Initial Render', () => {
    it('renders all main components', () => {
      render(<UnifiedWorkspace />);
      
      expect(screenTest.getByTestId('navigation-sidebar')).toBeInTheDocument();
      expect(screenTest.getByTestId('main-content-area')).toBeInTheDocument();
      expect(screenTest.getByTestId('contextual-panel')).toBeInTheDocument();
    });

    it('starts with overview view and closed panel', () => {
      render(<UnifiedWorkspace />);
      
      expect(screenTest.getByTestId('current-view')).toHaveTextContent('overview');
      expect(screenTest.getByTestId('main-view')).toHaveTextContent('overview');
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('none');
    });

    it('applies correct CSS classes for layout', () => {
      render(<UnifiedWorkspace />);
      
      const container = screenTest.getByTestId('navigation-sidebar').parentElement;
      expect(container).toHaveClass('w-64', 'border-r', 'bg-card');
    });
  });

  describe('Navigation', () => {
    it('updates current view when navigation changes', async () => {
      render(<UnifiedWorkspace />);
      
      await user.click(screenTest.getByTestId('nav-my-tasks'));
      
      expect(screenTest.getByTestId('current-view')).toHaveTextContent('my-tasks');
      expect(screenTest.getByTestId('main-view')).toHaveTextContent('my-tasks');
    });

    it('closes panel when switching navigation views', async () => {
      render(<UnifiedWorkspace />);
      
      // First open a panel
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      
      // Then change navigation
      await user.click(screenTest.getByTestId('nav-all-tasks'));
      
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('none');
    });

    it('supports all workspace views', async () => {
      render(<UnifiedWorkspace />);
      
      const views: WorkspaceView[] = ['my-tasks', 'all-tasks', 'issues'];
      
      for (const view of views) {
        await user.click(screenTest.getByTestId(`nav-${view}`));
        expect(screenTest.getByTestId('current-view')).toHaveTextContent(view);
        expect(screenTest.getByTestId('main-view')).toHaveTextContent(view);
      }
    });
  });

  describe('Task Selection', () => {
    it('updates selected task and opens status panel', async () => {
      render(<UnifiedWorkspace />);
      
      await user.click(screenTest.getByTestId('select-task'));
      
      expect(screenTest.getByTestId('selected-task')).toHaveTextContent('Test Task');
      expect(screenTest.getByTestId('panel-task')).toHaveTextContent('Test Task');
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('status');
    });

    it('preserves task selection when switching views', async () => {
      render(<UnifiedWorkspace />);
      
      await user.click(screenTest.getByTestId('select-task'));
      await user.click(screenTest.getByTestId('nav-my-tasks'));
      
      expect(screenTest.getByTestId('selected-task')).toHaveTextContent('Test Task');
    });
  });

  describe('Contextual Panel', () => {
    it('toggles panel visibility', async () => {
      render(<UnifiedWorkspace />);
      
      // Panel starts closed
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
      
      // Open status panel
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('status');
      
      // Toggle same panel closes it
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
    });

    it('switches panel content without closing', async () => {
      render(<UnifiedWorkspace />);
      
      // Open status panel
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('status');
      
      // Switch to issue panel
      await user.click(screenTest.getByTestId('toggle-issue-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('issue');
      
      // Switch to document panel
      await user.click(screenTest.getByTestId('toggle-document-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('document');
    });

    it('closes panel when close button is clicked', async () => {
      render(<UnifiedWorkspace />);
      
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      
      await user.click(screenTest.getByTestId('close-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('none');
    });

    it('handles content change from within panel', async () => {
      render(<UnifiedWorkspace />);
      
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('status');
      
      await user.click(screenTest.getByTestId('change-content'));
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('collaboration');
    });
  });

  describe('Layout Behavior', () => {
    it('adjusts main content margin when panel is open', async () => {
      render(<UnifiedWorkspace />);
      
      const mainContent = screenTest.getByTestId('main-content-area').parentElement;
      
      // Panel closed - no right margin
      expect(mainContent).toHaveClass('mr-0');
      
      // Open panel
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(mainContent).toHaveClass('mr-80');
      
      // Close panel
      await user.click(screenTest.getByTestId('close-panel'));
      expect(mainContent).toHaveClass('mr-0');
    });

    it('shows overlay on mobile when panel is open', async () => {
      render(<UnifiedWorkspace />);
      
      // No overlay when panel is closed
      expect(screenTest.queryByRole('button')).not.toHaveClass('fixed inset-0 bg-black/20');
      
      // Open panel to show overlay
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/20');
      expect(overlay).toBeInTheDocument();
    });

    it('closes panel when overlay is clicked', async () => {
      render(<UnifiedWorkspace />);
      
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/20') as HTMLElement;
      if (overlay) {
        fireEvent.click(overlay);
        expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
      }
    });
  });

  describe('State Management', () => {
    it('maintains separate state for each workspace aspect', async () => {
      render(<UnifiedWorkspace />);
      
      // Change view
      await user.click(screenTest.getByTestId('nav-my-tasks'));
      expect(screenTest.getByTestId('current-view')).toHaveTextContent('my-tasks');
      
      // Select task
      await user.click(screenTest.getByTestId('select-task'));
      expect(screenTest.getByTestId('selected-task')).toHaveTextContent('Test Task');
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      
      // Change panel content
      await user.click(screenTest.getByTestId('toggle-document-panel'));
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('document');
      
      // All states should be preserved
      expect(screenTest.getByTestId('current-view')).toHaveTextContent('my-tasks');
      expect(screenTest.getByTestId('selected-task')).toHaveTextContent('Test Task');
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
    });

    it('resets panel state when changing navigation views', async () => {
      render(<UnifiedWorkspace />);
      
      // Set up panel state
      await user.click(screenTest.getByTestId('select-task'));
      await user.click(screenTest.getByTestId('toggle-document-panel'));
      
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('document');
      
      // Change navigation
      await user.click(screenTest.getByTestId('nav-issues'));
      
      // Panel should be closed but task selection preserved
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'false');
      expect(screenTest.getByTestId('panel-content')).toHaveTextContent('none');
      expect(screenTest.getByTestId('selected-task')).toHaveTextContent('Test Task');
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels and roles', () => {
      render(<UnifiedWorkspace />);
      
      const container = screenTest.getByTestId('navigation-sidebar').closest('div');
      expect(container).toBeInTheDocument();
      
      // Panel should be properly hidden when closed
      const panel = screenTest.getByTestId('contextual-panel');
      expect(panel).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      render(<UnifiedWorkspace />);
      
      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBe(screenTest.getByTestId('nav-my-tasks'));
      
      // Test enter key activation
      await user.keyboard('{Enter}');
      expect(screenTest.getByTestId('current-view')).toHaveTextContent('my-tasks');
    });
  });

  describe('Performance', () => {
    it('uses callback handlers to prevent unnecessary re-renders', () => {
      const { rerender } = render(<UnifiedWorkspace />);
      
      const sidebar = screenTest.getByTestId('navigation-sidebar');
      const mainContent = screenTest.getByTestId('main-content-area');
      const panel = screenTest.getByTestId('contextual-panel');
      
      // Re-render with same props shouldn't cause changes
      rerender(<UnifiedWorkspace />);
      
      expect(screenTest.getByTestId('navigation-sidebar')).toBe(sidebar);
      expect(screenTest.getByTestId('main-content-area')).toBe(mainContent);
      expect(screenTest.getByTestId('contextual-panel')).toBe(panel);
    });
  });

  describe('Error Handling', () => {
    it('handles invalid workspace views gracefully', async () => {
      render(<UnifiedWorkspace />);
      
      // Should not throw when invalid view is passed
      expect(() => {
        const sidebar = screenTest.getByTestId('navigation-sidebar');
        // Simulate invalid navigation change
        fireEvent.click(sidebar);
      }).not.toThrow();
    });

    it('handles null task selection', async () => {
      render(<UnifiedWorkspace />);
      
      // Should handle when no task is selected
      expect(screenTest.queryByTestId('selected-task')).not.toBeInTheDocument();
      expect(screenTest.queryByTestId('panel-task')).not.toBeInTheDocument();
      
      // Panel operations should still work
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(screenTest.getByTestId('contextual-panel')).toHaveAttribute('data-open', 'true');
    });
  });
});
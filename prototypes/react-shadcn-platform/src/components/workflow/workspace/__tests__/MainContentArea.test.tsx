/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MainContentArea } from '../MainContentArea';
import { WorkspaceView, SelectedTask } from '../UnifiedWorkspace';

// Mock TaskDetailView component
vi.mock('../task/TaskDetailView', () => ({
  TaskDetailView: ({ task, onPanelToggle, onBackToList }: any) => (
    <div data-testid="task-detail-view">
      <h1 data-testid="task-title">{task.title}</h1>
      <span data-testid="task-status">{task.status}</span>
      <button data-testid="back-to-list" onClick={onBackToList}>
        Back to List
      </button>
      <button data-testid="toggle-status-panel" onClick={() => onPanelToggle('status')}>
        Status Panel
      </button>
      <button data-testid="toggle-issue-panel" onClick={() => onPanelToggle('issue')}>
        Issue Panel
      </button>
      <button data-testid="toggle-document-panel" onClick={() => onPanelToggle('document')}>
        Document Panel
      </button>
      <button data-testid="toggle-collaboration-panel" onClick={() => onPanelToggle('collaboration')}>
        Collaboration Panel
      </button>
    </div>
  )
}));

describe('MainContentArea', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnTaskSelect = vi.fn();
  const mockOnPanelToggle = vi.fn();

  const defaultProps = {
    currentView: 'overview' as WorkspaceView,
    selectedTask: null,
    onTaskSelect: mockOnTaskSelect,
    onPanelToggle: mockOnPanelToggle
  };

  const mockSelectedTask: SelectedTask = {
    id: 'task-1',
    title: 'Test Task',
    status: 'in_progress',
    assignee: 'user1',
    priority: 'high',
    labels: ['frontend', 'bug'],
    documents: [
      { id: 'doc-1', name: 'requirements.md', type: 'markdown', url: '/docs/req.md' }
    ]
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Task Detail View Mode', () => {
    it('renders TaskDetailView when task is selected', () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByTestId('task-detail-view')).toBeInTheDocument();
      expect(screenTest.getByTestId('task-title')).toHaveTextContent('Test Task');
      expect(screenTest.getByTestId('task-status')).toHaveTextContent('in_progress');
    });

    it('passes correct props to TaskDetailView', () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByTestId('task-detail-view')).toBeInTheDocument();
      expect(screenTest.getByTestId('back-to-list')).toBeInTheDocument();
      expect(screenTest.getByTestId('toggle-status-panel')).toBeInTheDocument();
    });

    it('handles back to list action', async () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      await user.click(screenTest.getByTestId('back-to-list'));
      expect(mockOnTaskSelect).toHaveBeenCalledWith(null);
    });

    it('handles panel toggle actions from TaskDetailView', async () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      await user.click(screenTest.getByTestId('toggle-status-panel'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('status');
      
      await user.click(screenTest.getByTestId('toggle-issue-panel'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('issue');
      
      await user.click(screenTest.getByTestId('toggle-document-panel'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('document');
      
      await user.click(screenTest.getByTestId('toggle-collaboration-panel'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('collaboration');
    });

    it('does not render workspace views when task is selected', () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screenTest.queryByText('My Tasks')).not.toBeInTheDocument();
    });
  });

  describe('Workspace View Modes', () => {
    describe('Overview View', () => {
      it('renders overview content correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="overview" />);
        
        expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
        expect(screenTest.getByText('Overview dashboard implementation pending')).toBeInTheDocument();
      });

      it('uses correct heading structure', () => {
        render(<MainContentArea {...defaultProps} currentView="overview" />);
        
        const heading = screenTest.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Project Overview');
        expect(heading).toHaveClass('text-2xl', 'font-bold', 'mb-4');
      });
    });

    describe('Tasks Views', () => {
      it('renders My Tasks view correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="my-tasks" />);
        
        expect(screenTest.getByText('My Tasks')).toBeInTheDocument();
        expect(screenTest.getByText('Task list view implementation pending')).toBeInTheDocument();
      });

      it('renders All Tasks view correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="all-tasks" />);
        
        expect(screenTest.getByText('All Tasks')).toBeInTheDocument();
        expect(screenTest.getByText('Task list view implementation pending')).toBeInTheDocument();
      });

      it('differentiates between My Tasks and All Tasks headings', () => {
        const { rerender } = render(<MainContentArea {...defaultProps} currentView="my-tasks" />);
        
        expect(screenTest.getByRole('heading', { level: 1 })).toHaveTextContent('My Tasks');
        
        rerender(<MainContentArea {...defaultProps} currentView="all-tasks" />);
        
        expect(screenTest.getByRole('heading', { level: 1 })).toHaveTextContent('All Tasks');
      });
    });

    describe('Issues View', () => {
      it('renders issues view correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="issues" />);
        
        expect(screenTest.getByText('Issues')).toBeInTheDocument();
        expect(screenTest.getByText('Issues view implementation pending')).toBeInTheDocument();
      });
    });

    describe('Documentation View', () => {
      it('renders documentation view correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="documentation" />);
        
        expect(screenTest.getByText('Documentation')).toBeInTheDocument();
        expect(screenTest.getByText('Documentation view implementation pending')).toBeInTheDocument();
      });
    });

    describe('Quality View', () => {
      it('renders quality view correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="quality" />);
        
        expect(screenTest.getByText('Quality Control')).toBeInTheDocument();
        expect(screenTest.getByText('Quality view implementation pending')).toBeInTheDocument();
      });
    });

    describe('Reports View', () => {
      it('renders reports view correctly', () => {
        render(<MainContentArea {...defaultProps} currentView="reports" />);
        
        expect(screenTest.getByText('Reports')).toBeInTheDocument();
        expect(screenTest.getByText('Reports view implementation pending')).toBeInTheDocument();
      });
    });

    describe('Default View', () => {
      it('renders default welcome view for unknown view types', () => {
        render(<MainContentArea {...defaultProps} currentView={'unknown' as WorkspaceView} />);
        
        expect(screenTest.getByText('Welcome')).toBeInTheDocument();
        expect(screenTest.getByText('Select a navigation item to begin')).toBeInTheDocument();
      });

      it('handles undefined currentView', () => {
        render(<MainContentArea {...defaultProps} currentView={undefined as any} />);
        
        expect(screenTest.getByText('Welcome')).toBeInTheDocument();
        expect(screenTest.getByText('Select a navigation item to begin')).toBeInTheDocument();
      });
    });
  });

  describe('View Switching', () => {
    it('switches between different views correctly', () => {
      const { rerender } = render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
      
      rerender(<MainContentArea {...defaultProps} currentView="my-tasks" />);
      
      expect(screenTest.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screenTest.getByText('My Tasks')).toBeInTheDocument();
      
      rerender(<MainContentArea {...defaultProps} currentView="issues" />);
      
      expect(screenTest.queryByText('My Tasks')).not.toBeInTheDocument();
      expect(screenTest.getByText('Issues')).toBeInTheDocument();
    });

    it('maintains consistent layout when switching views', () => {
      const { rerender } = render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      let container = screenTest.getByText('Project Overview').closest('div');
      expect(container).toHaveClass('p-6');
      
      rerender(<MainContentArea {...defaultProps} currentView="my-tasks" />);
      
      container = screenTest.getByText('My Tasks').closest('div');
      expect(container).toHaveClass('p-6');
    });

    it('handles rapid view switching', () => {
      const views: WorkspaceView[] = ['overview', 'my-tasks', 'all-tasks', 'issues', 'documentation', 'quality', 'reports'];
      const { rerender } = render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      views.forEach(view => {
        rerender(<MainContentArea {...defaultProps} currentView={view} />);
        expect(screenTest.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });
  });

  describe('Task Selection Integration', () => {
    it('prioritizes task detail view over workspace views', () => {
      render(
        <MainContentArea 
          {...defaultProps} 
          currentView="overview" 
          selectedTask={mockSelectedTask} 
        />
      );
      
      expect(screenTest.getByTestId('task-detail-view')).toBeInTheDocument();
      expect(screenTest.queryByText('Project Overview')).not.toBeInTheDocument();
    });

    it('returns to workspace view when task is deselected', () => {
      const { rerender } = render(
        <MainContentArea 
          {...defaultProps} 
          currentView="overview" 
          selectedTask={mockSelectedTask} 
        />
      );
      
      expect(screenTest.getByTestId('task-detail-view')).toBeInTheDocument();
      
      rerender(<MainContentArea {...defaultProps} currentView="overview" selectedTask={null} />);
      
      expect(screenTest.queryByTestId('task-detail-view')).not.toBeInTheDocument();
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
    });

    it('preserves currentView when task is selected', () => {
      const { rerender } = render(<MainContentArea {...defaultProps} currentView="my-tasks" />);
      
      expect(screenTest.getByText('My Tasks')).toBeInTheDocument();
      
      rerender(
        <MainContentArea 
          {...defaultProps} 
          currentView="my-tasks" 
          selectedTask={mockSelectedTask} 
        />
      );
      
      expect(screenTest.getByTestId('task-detail-view')).toBeInTheDocument();
      
      rerender(<MainContentArea {...defaultProps} currentView="my-tasks" selectedTask={null} />);
      
      expect(screenTest.getByText('My Tasks')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct container styling', () => {
      render(<MainContentArea {...defaultProps} />);
      
      const container = screenTest.getByText('Project Overview').closest('div')?.parentElement;
      expect(container).toHaveClass('h-full', 'bg-background');
    });

    it('applies consistent content styling across views', () => {
      const views: WorkspaceView[] = ['overview', 'my-tasks', 'issues', 'documentation', 'quality', 'reports'];
      
      views.forEach(view => {
        const { rerender } = render(<MainContentArea {...defaultProps} currentView={view} />);
        
        const contentContainer = screenTest.getByRole('heading', { level: 1 }).closest('div');
        expect(contentContainer).toHaveClass('p-6');
        
        const heading = screenTest.getByRole('heading', { level: 1 });
        expect(heading).toHaveClass('text-2xl', 'font-bold', 'mb-4');
        
        rerender(<MainContentArea {...defaultProps} currentView="overview" />);
      });
    });

    it('applies muted foreground to placeholder content', () => {
      render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      const placeholder = screenTest.getByText('Overview dashboard implementation pending');
      expect(placeholder).toHaveClass('text-muted-foreground');
    });
  });

  describe('Component Integration', () => {
    it('integrates properly with TaskDetailView component', () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByTestId('task-detail-view')).toBeInTheDocument();
      expect(screenTest.getByTestId('task-title')).toHaveTextContent('Test Task');
      expect(screenTest.getByTestId('task-status')).toHaveTextContent('in_progress');
    });

    it('passes all required props to TaskDetailView', () => {
      render(
        <MainContentArea {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      // Verify all expected interaction buttons are present
      expect(screenTest.getByTestId('back-to-list')).toBeInTheDocument();
      expect(screenTest.getByTestId('toggle-status-panel')).toBeInTheDocument();
      expect(screenTest.getByTestId('toggle-issue-panel')).toBeInTheDocument();
      expect(screenTest.getByTestId('toggle-document-panel')).toBeInTheDocument();
      expect(screenTest.getByTestId('toggle-collaboration-panel')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles null props gracefully', () => {
      expect(() => render(
        <MainContentArea 
          currentView={null as any}
          selectedTask={null}
          onTaskSelect={mockOnTaskSelect}
          onPanelToggle={mockOnPanelToggle}
        />
      )).not.toThrow();
    });

    it('handles invalid task data', () => {
      const invalidTask = {
        id: '',
        title: null,
        status: undefined
      } as any;
      
      expect(() => render(
        <MainContentArea {...defaultProps} selectedTask={invalidTask} />
      )).not.toThrow();
    });

    it('handles missing callback functions', () => {
      expect(() => render(
        <MainContentArea 
          currentView="overview"
          selectedTask={null}
          onTaskSelect={undefined as any}
          onPanelToggle={undefined as any}
        />
      )).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<MainContentArea {...defaultProps} />);
      
      const initialHeading = screenTest.getByRole('heading', { level: 1 });
      
      // Re-render with same props
      rerender(<MainContentArea {...defaultProps} />);
      
      const afterRerender = screenTest.getByRole('heading', { level: 1 });
      expect(afterRerender).toBe(initialHeading);
    });

    it('efficiently handles view transitions', () => {
      const { rerender } = render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      expect(screenTest.getByText('Project Overview')).toBeInTheDocument();
      
      // Single rerender should switch view
      rerender(<MainContentArea {...defaultProps} currentView="my-tasks" />);
      
      expect(screenTest.queryByText('Project Overview')).not.toBeInTheDocument();
      expect(screenTest.getByText('My Tasks')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper heading hierarchy', () => {
      render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      const heading = screenTest.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Project Overview');
    });

    it('maintains semantic structure across views', () => {
      const views: WorkspaceView[] = ['overview', 'my-tasks', 'issues', 'documentation', 'quality', 'reports'];
      
      views.forEach(view => {
        const { rerender } = render(<MainContentArea {...defaultProps} currentView={view} />);
        
        const heading = screenTest.getByRole('heading', { level: 1 });
        expect(heading).toBeInTheDocument();
        
        rerender(<MainContentArea {...defaultProps} currentView="overview" />);
      });
    });

    it('provides appropriate text contrast', () => {
      render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      const heading = screenTest.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-2xl', 'font-bold');
      
      const description = screenTest.getByText('Overview dashboard implementation pending');
      expect(description).toHaveClass('text-muted-foreground');
    });
  });

  describe('Future Extensibility', () => {
    it('provides structure for future view implementations', () => {
      // The component should be ready to accept new view components
      render(<MainContentArea {...defaultProps} currentView="overview" />);
      
      // Each view has a consistent structure that can be replaced with actual components
      const contentContainer = screenTest.getByRole('heading', { level: 1 }).closest('div');
      expect(contentContainer).toHaveClass('p-6');
    });

    it('maintains switch statement structure for easy extension', () => {
      // Test that all current views are handled
      const views: WorkspaceView[] = ['overview', 'my-tasks', 'all-tasks', 'issues', 'documentation', 'quality', 'reports'];
      
      views.forEach(view => {
        const { rerender } = render(<MainContentArea {...defaultProps} currentView={view} />);
        
        // Each view should render something
        expect(screenTest.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        rerender(<MainContentArea {...defaultProps} currentView="overview" />);
      });
    });
  });
});
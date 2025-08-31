/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigationSidebar } from '../NavigationSidebar';
import { WorkspaceView, SelectedTask } from '../UnifiedWorkspace';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, size, ...props }: any) => (
    <button
      onClick={onClick}
      className={`btn ${variant} ${className}`}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant} ${className}`}>
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={`scroll-area ${className}`}>{children}</div>
  )
}));

// Mock lucide icons
vi.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => <span data-testid="home-icon" className={className}>🏠</span>,
  CheckSquare: ({ className }: { className?: string }) => <span data-testid="checksquare-icon" className={className}>☑️</span>,
  List: ({ className }: { className?: string }) => <span data-testid="list-icon" className={className}>📋</span>,
  Bug: ({ className }: { className?: string }) => <span data-testid="bug-icon" className={className}>🐛</span>,
  FileText: ({ className }: { className?: string }) => <span data-testid="filetext-icon" className={className}>📄</span>,
  Shield: ({ className }: { className?: string }) => <span data-testid="shield-icon" className={className}>🛡️</span>,
  BarChart3: ({ className }: { className?: string }) => <span data-testid="barchart3-icon" className={className}>📊</span>,
  Plus: ({ className }: { className?: string }) => <span data-testid="plus-icon" className={className}>➕</span>,
  Search: ({ className }: { className?: string }) => <span data-testid="search-icon" className={className}>🔍</span>,
  Filter: ({ className }: { className?: string }) => <span data-testid="filter-icon" className={className}>🔽</span>
}));

describe('NavigationSidebar', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnNavigationChange = vi.fn();

  const defaultProps = {
    currentView: 'overview' as WorkspaceView,
    onNavigationChange: mockOnNavigationChange,
    selectedTask: null
  };

  const mockSelectedTask: SelectedTask = {
    id: 'task-1',
    title: 'Test Task with Long Title That Should Be Truncated',
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

  describe('Initial Render', () => {
    it('renders header with project information', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      expect(screenTest.getByText('Project Workspace')).toBeInTheDocument();
      expect(screenTest.getByText('Real Data Management')).toBeInTheDocument();
    });

    it('renders all navigation items with correct icons and labels', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      expect(screenTest.getByText('Overview')).toBeInTheDocument();
      expect(screenTest.getByText('My Tasks')).toBeInTheDocument();
      expect(screenTest.getByText('All Tasks')).toBeInTheDocument();
      expect(screenTest.getByText('Issues')).toBeInTheDocument();
      expect(screenTest.getByText('Documentation')).toBeInTheDocument();
      expect(screenTest.getByText('Quality')).toBeInTheDocument();
      expect(screenTest.getByText('Reports')).toBeInTheDocument();
      
      expect(screenTest.getByTestId('home-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('checksquare-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('list-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('bug-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('filetext-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('shield-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('barchart3-icon')).toBeInTheDocument();
    });

    it('renders navigation item badges', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      // Check for badges on items that should have them
      const badges = screenTest.getAllByText('3'); // My Tasks badge
      expect(badges.length).toBeGreaterThan(0);
      
      expect(screenTest.getByText('12')).toBeInTheDocument(); // All Tasks badge
      expect(screenTest.getByText('5')).toBeInTheDocument(); // Issues badge
    });

    it('renders quick action buttons', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      expect(screenTest.getByText('New Task')).toBeInTheDocument();
      expect(screenTest.getByText('Search')).toBeInTheDocument();
      expect(screenTest.getByText('Filter')).toBeInTheDocument();
      
      expect(screenTest.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('search-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('filter-icon')).toBeInTheDocument();
    });

    it('renders footer with timestamp', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      expect(screenTest.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('includes separators for visual organization', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const separators = screenTest.getAllByTestId('separator');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Behavior', () => {
    it('highlights current view correctly', () => {
      render(<NavigationSidebar {...defaultProps} currentView="my-tasks" />);
      
      const myTasksButton = screenTest.getByText('My Tasks').closest('button');
      expect(myTasksButton).toHaveClass('secondary');
      
      const overviewButton = screenTest.getByText('Overview').closest('button');
      expect(overviewButton).toHaveClass('ghost');
    });

    it('calls onNavigationChange when navigation items are clicked', async () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      await user.click(screenTest.getByText('My Tasks'));
      expect(mockOnNavigationChange).toHaveBeenCalledWith('my-tasks');
      
      await user.click(screenTest.getByText('All Tasks'));
      expect(mockOnNavigationChange).toHaveBeenCalledWith('all-tasks');
      
      await user.click(screenTest.getByText('Issues'));
      expect(mockOnNavigationChange).toHaveBeenCalledWith('issues');
    });

    it('handles navigation for all workspace views', async () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const views: { text: string; id: WorkspaceView }[] = [
        { text: 'Overview', id: 'overview' },
        { text: 'My Tasks', id: 'my-tasks' },
        { text: 'All Tasks', id: 'all-tasks' },
        { text: 'Issues', id: 'issues' },
        { text: 'Documentation', id: 'documentation' },
        { text: 'Quality', id: 'quality' },
        { text: 'Reports', id: 'reports' }
      ];
      
      for (const view of views) {
        await user.click(screenTest.getByText(view.text));
        expect(mockOnNavigationChange).toHaveBeenCalledWith(view.id);
      }
      
      expect(mockOnNavigationChange).toHaveBeenCalledTimes(views.length);
    });

    it('updates active state when currentView prop changes', () => {
      const { rerender } = render(<NavigationSidebar {...defaultProps} />);
      
      let overviewButton = screenTest.getByText('Overview').closest('button');
      expect(overviewButton).toHaveClass('secondary');
      
      rerender(<NavigationSidebar {...defaultProps} currentView="issues" />);
      
      overviewButton = screenTest.getByText('Overview').closest('button');
      const issuesButton = screenTest.getByText('Issues').closest('button');
      
      expect(overviewButton).toHaveClass('ghost');
      expect(issuesButton).toHaveClass('secondary');
    });
  });

  describe('Badge Behavior', () => {
    it('shows correct badge variants for active and inactive items', () => {
      render(<NavigationSidebar {...defaultProps} currentView="my-tasks" />);
      
      const myTasksBadge = screenTest.getByText('3');
      const allTasksBadge = screenTest.getByText('12');
      
      expect(myTasksBadge).toHaveClass('default'); // Active item badge
      expect(allTasksBadge).toHaveClass('secondary'); // Inactive item badge
    });

    it('does not show badges for items without badge data', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      // Overview, Documentation, Quality, Reports should not have badges
      const overviewButton = screenTest.getByText('Overview').closest('button');
      const documentationButton = screenTest.getByText('Documentation').closest('button');
      
      expect(overviewButton?.querySelector('.badge')).toBeNull();
      expect(documentationButton?.querySelector('.badge')).toBeNull();
    });
  });

  describe('Selected Task Context', () => {
    it('does not show task context when no task is selected', () => {
      render(<NavigationSidebar {...defaultProps} selectedTask={null} />);
      
      expect(screenTest.queryByText('Selected Task')).not.toBeInTheDocument();
    });

    it('shows selected task information when task is provided', () => {
      render(<NavigationSidebar {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Selected Task')).toBeInTheDocument();
      expect(screenTest.getByText('Test Task with Long Title That Should Be Truncated')).toBeInTheDocument();
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
      expect(screenTest.getByText('high')).toBeInTheDocument();
    });

    it('handles task without priority gracefully', () => {
      const taskWithoutPriority = { ...mockSelectedTask, priority: undefined };
      render(<NavigationSidebar {...defaultProps} selectedTask={taskWithoutPriority} />);
      
      expect(screenTest.getByText('Selected Task')).toBeInTheDocument();
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
      expect(screenTest.queryByText('high')).not.toBeInTheDocument();
    });

    it('applies correct badge variant for high priority tasks', () => {
      render(<NavigationSidebar {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const priorityBadge = screenTest.getByText('high');
      expect(priorityBadge).toHaveClass('destructive');
    });

    it('applies correct badge variant for non-high priority tasks', () => {
      const mediumPriorityTask = { ...mockSelectedTask, priority: 'medium' };
      render(<NavigationSidebar {...defaultProps} selectedTask={mediumPriorityTask} />);
      
      const priorityBadge = screenTest.getByText('medium');
      expect(priorityBadge).toHaveClass('secondary');
    });

    it('truncates long task titles with line-clamp', () => {
      render(<NavigationSidebar {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const taskTitle = screenTest.getByText('Test Task with Long Title That Should Be Truncated');
      expect(taskTitle).toHaveClass('line-clamp-2');
    });
  });

  describe('Quick Actions', () => {
    it('renders quick action buttons with correct styling', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const newTaskButton = screenTest.getByText('New Task').closest('button');
      const searchButton = screenTest.getByText('Search').closest('button');
      const filterButton = screenTest.getByText('Filter').closest('button');
      
      expect(newTaskButton).toHaveClass('w-full', 'justify-start');
      expect(newTaskButton).toHaveAttribute('data-size', 'sm');
      
      expect(searchButton).toHaveClass('outline', 'flex-1');
      expect(filterButton).toHaveClass('outline', 'flex-1');
    });

    it('groups search and filter buttons correctly', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const searchButton = screenTest.getByText('Search').closest('button');
      const filterButton = screenTest.getByText('Filter').closest('button');
      
      // Both should be in the same parent container
      expect(searchButton?.parentElement).toBe(filterButton?.parentElement);
      expect(searchButton?.parentElement).toHaveClass('flex', 'gap-1');
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct layout classes to main container', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const container = screenTest.getByText('Project Workspace').closest('div');
      expect(container?.parentElement).toHaveClass('h-full', 'flex', 'flex-col');
    });

    it('applies correct styling to header section', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const header = screenTest.getByText('Project Workspace').closest('div');
      expect(header).toHaveClass('p-4', 'border-b');
    });

    it('applies correct styling to quick actions section', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const quickActionsContainer = screenTest.getByText('New Task').closest('div')?.parentElement;
      expect(quickActionsContainer).toHaveClass('p-4', 'space-y-2');
    });

    it('applies correct styling to navigation items container', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const scrollArea = screenTest.getByText('Overview').closest('.scroll-area');
      expect(scrollArea).toHaveClass('flex-1', 'p-2');
    });

    it('applies muted background to selected task context', () => {
      render(<NavigationSidebar {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const taskContext = screenTest.getByText('Selected Task').closest('div');
      expect(taskContext).toHaveClass('p-3', 'bg-muted/30');
    });
  });

  describe('Accessibility', () => {
    it('provides semantic structure with proper headings', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const heading = screenTest.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Project Workspace');
    });

    it('provides proper button roles for navigation items', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const navigationButtons = screenTest.getAllByRole('button');
      expect(navigationButtons.length).toBeGreaterThan(0);
      
      // Check that main navigation items are buttons
      expect(screenTest.getByRole('button', { name: /Overview/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /My Tasks/ })).toBeInTheDocument();
    });

    it('maintains keyboard navigation order', async () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      // Test tab navigation through buttons
      const firstButton = screenTest.getByText('New Task').closest('button');
      firstButton?.focus();
      expect(document.activeElement).toBe(firstButton);
      
      await user.tab();
      expect(document.activeElement).toBe(screenTest.getByText('Search').closest('button'));
    });

    it('provides proper text contrast for different states', () => {
      render(<NavigationSidebar {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const selectedTaskLabel = screenTest.getByText('Selected Task');
      expect(selectedTaskLabel).toHaveClass('text-muted-foreground');
      
      const taskTitle = screenTest.getByText('Test Task with Long Title That Should Be Truncated');
      expect(taskTitle).toHaveClass('font-medium');
    });
  });

  describe('Responsive Design', () => {
    it('maintains fixed width navigation structure', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      // The component should maintain its structure regardless of content
      const container = screenTest.getByText('Project Workspace').closest('div')?.parentElement;
      expect(container).toHaveClass('h-full', 'flex', 'flex-col');
    });

    it('handles overflow with scroll area', () => {
      render(<NavigationSidebar {...defaultProps} />);
      
      const scrollArea = screenTest.getByText('Overview').closest('.scroll-area');
      expect(scrollArea).toHaveClass('flex-1');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders on prop changes', () => {
      const { rerender } = render(<NavigationSidebar {...defaultProps} />);
      
      const navButton = screenTest.getByText('Overview').closest('button');
      const initialElement = navButton;
      
      // Re-render with same props
      rerender(<NavigationSidebar {...defaultProps} />);
      
      const afterRerender = screenTest.getByText('Overview').closest('button');
      expect(afterRerender).toBe(initialElement);
    });

    it('efficiently handles currentView changes', () => {
      const { rerender } = render(<NavigationSidebar {...defaultProps} />);
      
      expect(screenTest.getByText('Overview').closest('button')).toHaveClass('secondary');
      
      rerender(<NavigationSidebar {...defaultProps} currentView="my-tasks" />);
      
      expect(screenTest.getByText('Overview').closest('button')).toHaveClass('ghost');
      expect(screenTest.getByText('My Tasks').closest('button')).toHaveClass('secondary');
    });
  });

  describe('Error Handling', () => {
    it('handles undefined currentView gracefully', () => {
      const propsWithUndefinedView = {
        ...defaultProps,
        currentView: undefined as any
      };
      
      expect(() => render(<NavigationSidebar {...propsWithUndefinedView} />))
        .not.toThrow();
    });

    it('handles malformed selectedTask data', () => {
      const malformedTask = {
        id: 'task-1',
        title: '',
        status: null,
        priority: undefined
      } as any;
      
      expect(() => render(<NavigationSidebar {...defaultProps} selectedTask={malformedTask} />))
        .not.toThrow();
    });
  });
});
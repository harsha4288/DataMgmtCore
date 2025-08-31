/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDetailView } from '../TaskDetailView';
import { SelectedTask } from '../../workspace/UnifiedWorkspace';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={`btn ${variant} ${size} ${className}`}
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

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={`card ${className}`}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={`card-content ${className}`}>{children}</div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div className={`card-description ${className}`}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={`card-header ${className}`}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={`card-title ${className}`}>{children}</h3>
  )
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={`scroll-area ${className}`}>{children}</div>
  )
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={`progress ${className}`} data-value={value}>
      Progress: {value}%
    </div>
  )
}));

// Mock lucide icons
vi.mock('lucide-react', () => ({
  ArrowLeft: ({ className }: { className?: string }) => <span data-testid="arrow-left-icon" className={className}>←</span>,
  Calendar: ({ className }: { className?: string }) => <span data-testid="calendar-icon" className={className}>📅</span>,
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}>👤</span>,
  FileText: ({ className }: { className?: string }) => <span data-testid="filetext-icon" className={className}>📄</span>,
  MessageSquare: ({ className }: { className?: string }) => <span data-testid="messagesquare-icon" className={className}>💬</span>,
  Settings: ({ className }: { className?: string }) => <span data-testid="settings-icon" className={className}>⚙️</span>,
  Bug: ({ className }: { className?: string }) => <span data-testid="bug-icon" className={className}>🐛</span>,
  CheckSquare: ({ className }: { className?: string }) => <span data-testid="checksquare-icon" className={className}>☑️</span>,
  Clock: ({ className }: { className?: string }) => <span data-testid="clock-icon" className={className}>🕐</span>
}));

describe('TaskDetailView', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnPanelToggle = vi.fn();
  const mockOnBackToList = vi.fn();

  const defaultProps = {
    task: {} as SelectedTask,
    onPanelToggle: mockOnPanelToggle,
    onBackToList: mockOnBackToList
  };

  const mockTask: SelectedTask = {
    id: 'task-1',
    title: 'Complete Feature Implementation',
    status: 'in_progress',
    assignee: 'john.doe',
    priority: 'high',
    labels: ['frontend', 'urgent', 'api'],
    documents: [
      { id: 'doc-1', name: 'requirements.md', type: 'markdown', url: '/docs/req.md' },
      { id: 'doc-2', name: 'design-specs.figma', type: 'design', url: '/design/specs.figma' },
      { id: 'doc-3', name: 'api-documentation.json', type: 'api', url: '/api/docs.json' }
    ]
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Header Section', () => {
    it('renders task title and metadata', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Complete Feature Implementation')).toBeInTheDocument();
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
      expect(screenTest.getByText('high')).toBeInTheDocument();
    });

    it('renders all task labels', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('frontend')).toBeInTheDocument();
      expect(screenTest.getByText('urgent')).toBeInTheDocument();
      expect(screenTest.getByText('api')).toBeInTheDocument();
    });

    it('handles task without priority', () => {
      const taskWithoutPriority = { ...mockTask, priority: undefined };
      render(<TaskDetailView {...defaultProps} task={taskWithoutPriority} />);
      
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
      expect(screenTest.queryByText('high')).not.toBeInTheDocument();
    });

    it('handles task without labels', () => {
      const taskWithoutLabels = { ...mockTask, labels: undefined };
      render(<TaskDetailView {...defaultProps} task={taskWithoutLabels} />);
      
      expect(screenTest.getByText('Complete Feature Implementation')).toBeInTheDocument();
      expect(screenTest.queryByText('frontend')).not.toBeInTheDocument();
    });

    it('applies correct badge variants for priority', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const priorityBadge = screenTest.getByText('high');
      expect(priorityBadge).toHaveClass('destructive');
    });

    it('applies secondary variant for non-high priority', () => {
      const mediumPriorityTask = { ...mockTask, priority: 'medium' };
      render(<TaskDetailView {...defaultProps} task={mediumPriorityTask} />);
      
      const priorityBadge = screenTest.getByText('medium');
      expect(priorityBadge).toHaveClass('secondary');
    });

    it('renders back button with correct styling', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      expect(backButton).toHaveClass('ghost');
      expect(screenTest.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('calls onBackToList when back button is clicked', async () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);
      
      expect(mockOnBackToList).toHaveBeenCalledTimes(1);
    });
  });

  describe('Action Buttons', () => {
    it('renders all action buttons with icons', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Status')).toBeInTheDocument();
      expect(screenTest.getByText('Issues')).toBeInTheDocument();
      expect(screenTest.getByText('Docs')).toBeInTheDocument();
      expect(screenTest.getByText('Chat')).toBeInTheDocument();
      
      expect(screenTest.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('bug-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('filetext-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('messagesquare-icon')).toBeInTheDocument();
    });

    it('calls onPanelToggle with correct content when buttons are clicked', async () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      await user.click(screenTest.getByText('Status'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('status');
      
      await user.click(screenTest.getByText('Issues'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('issue');
      
      await user.click(screenTest.getByText('Docs'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('document');
      
      await user.click(screenTest.getByText('Chat'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('collaboration');
    });

    it('applies correct styling to action buttons', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const statusButton = screenTest.getByText('Status').closest('button');
      expect(statusButton).toHaveClass('outline');
    });
  });

  describe('Task Information Card', () => {
    it('displays task metadata correctly', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
      expect(screenTest.getByText('Assignee: john.doe')).toBeInTheDocument();
      expect(screenTest.getByText('Due: Not set')).toBeInTheDocument();
      expect(screenTest.getByText('Created: 2 days ago')).toBeInTheDocument();
      expect(screenTest.getByText('Progress: 60%')).toBeInTheDocument();
    });

    it('handles unassigned tasks', () => {
      const unassignedTask = { ...mockTask, assignee: undefined };
      render(<TaskDetailView {...defaultProps} task={unassignedTask} />);
      
      expect(screenTest.getByText('Assignee: Unassigned')).toBeInTheDocument();
    });

    it('displays progress bar with correct value', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const progressBar = screenTest.getByText('Progress: 60%');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('data-value', '60');
    });

    it('displays correct icons for metadata items', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getAllByTestId('user-icon')).toHaveLength(1);
      expect(screenTest.getAllByTestId('calendar-icon')).toHaveLength(1);
      expect(screenTest.getAllByTestId('clock-icon')).toHaveLength(1);
      expect(screenTest.getAllByTestId('checksquare-icon')).toHaveLength(1);
    });
  });

  describe('Document Preview Section', () => {
    it('renders document section when documents exist', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Attached Documents')).toBeInTheDocument();
      expect(screenTest.getByText('Preview and edit documents without losing context')).toBeInTheDocument();
    });

    it('displays all attached documents', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('requirements.md')).toBeInTheDocument();
      expect(screenTest.getByText('design-specs.figma')).toBeInTheDocument();
      expect(screenTest.getByText('api-documentation.json')).toBeInTheDocument();
      
      expect(screenTest.getByText('markdown')).toBeInTheDocument();
      expect(screenTest.getByText('design')).toBeInTheDocument();
      expect(screenTest.getByText('api')).toBeInTheDocument();
    });

    it('renders preview buttons for each document', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const previewButtons = screenTest.getAllByText('Preview');
      expect(previewButtons).toHaveLength(3);
    });

    it('does not render document section when no documents exist', () => {
      const taskWithoutDocs = { ...mockTask, documents: [] };
      render(<TaskDetailView {...defaultProps} task={taskWithoutDocs} />);
      
      expect(screenTest.queryByText('Attached Documents')).not.toBeInTheDocument();
    });

    it('does not render document section when documents is undefined', () => {
      const taskWithUndefinedDocs = { ...mockTask, documents: undefined };
      render(<TaskDetailView {...defaultProps} task={taskWithUndefinedDocs} />);
      
      expect(screenTest.queryByText('Attached Documents')).not.toBeInTheDocument();
    });

    it('applies hover styling to document items', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const docItem = screenTest.getByText('requirements.md').closest('div');
      expect(docItem).toHaveClass('hover:bg-accent/50');
    });

    it('displays correct file icons for documents', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      // Should have FileText icons for each document plus action buttons
      const fileIcons = screenTest.getAllByTestId('filetext-icon');
      expect(fileIcons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Related Issues Section', () => {
    it('renders related issues card', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Related Issues')).toBeInTheDocument();
      expect(screenTest.getByText('Issues linked to this task')).toBeInTheDocument();
    });

    it('displays no issues message by default', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('No related issues found')).toBeInTheDocument();
    });

    it('renders create issue button', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Create Related Issue')).toBeInTheDocument();
      expect(screenTest.getAllByTestId('bug-icon')).toHaveLength(2); // One in header, one in create button
    });

    it('applies correct styling to create issue button', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const createIssueButton = screenTest.getByText('Create Related Issue').closest('button');
      expect(createIssueButton).toHaveClass('outline', 'w-full');
    });
  });

  describe('Activity Timeline Section', () => {
    it('renders activity timeline card', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Activity Timeline')).toBeInTheDocument();
    });

    it('displays timeline activities', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Task created')).toBeInTheDocument();
      expect(screenTest.getByText('Status updated to In Progress')).toBeInTheDocument();
      expect(screenTest.getByText('2 days ago')).toBeInTheDocument();
      expect(screenTest.getByText('1 day ago')).toBeInTheDocument();
    });

    it('displays timeline indicators with correct styling', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      // Check for timeline dots
      const container = screenTest.getByText('Task created').closest('div')?.parentElement;
      expect(container?.previousElementSibling).toHaveClass('w-2', 'h-2', 'rounded-full');
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct main container styling', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const container = screenTest.getByText('Complete Feature Implementation').closest('div')?.parentElement?.parentElement;
      expect(container).toHaveClass('h-full', 'flex', 'flex-col');
    });

    it('applies correct header styling', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const header = screenTest.getByText('Complete Feature Implementation').closest('div')?.parentElement;
      expect(header).toHaveClass('flex', 'items-center', 'gap-4', 'p-6', 'border-b', 'bg-card');
    });

    it('applies scroll area to content section', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const scrollArea = screenTest.getByText('Task Information').closest('.scroll-area');
      expect(scrollArea).toHaveClass('flex-1', 'p-6');
    });

    it('centers content with max width', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const contentContainer = screenTest.getByText('Task Information').closest('div')?.parentElement;
      expect(contentContainer).toHaveClass('max-w-4xl', 'mx-auto', 'space-y-6');
    });
  });

  describe('Responsive Design', () => {
    it('maintains proper layout structure', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      // Header should be flexible
      const headerContent = screenTest.getByText('Complete Feature Implementation').closest('div');
      expect(headerContent).toHaveClass('flex-1');
    });

    it('handles long task titles gracefully', () => {
      const longTitleTask = { 
        ...mockTask, 
        title: 'This is a very long task title that should be handled properly without breaking the layout or causing overflow issues in the header section'
      };
      render(<TaskDetailView {...defaultProps} task={longTitleTask} />);
      
      const titleElement = screenTest.getByText(longTitleTask.title);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('text-xl', 'font-semibold');
    });

    it('uses grid layout for metadata display', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const metadataContainer = screenTest.getByText('Assignee: john.doe').closest('div')?.parentElement;
      expect(metadataContainer).toHaveClass('grid', 'grid-cols-2', 'gap-4');
    });
  });

  describe('Accessibility', () => {
    it('provides proper heading hierarchy', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const mainHeading = screenTest.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Complete Feature Implementation');
      
      const sectionHeadings = screenTest.getAllByRole('heading', { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('provides semantic button roles', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByRole('button', { name: /Status/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Issues/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Docs/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Chat/ })).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      backButton?.focus();
      expect(document.activeElement).toBe(backButton);
      
      await user.tab();
      const statusButton = screenTest.getByText('Status').closest('button');
      expect(document.activeElement).toBe(statusButton);
    });

    it('provides appropriate text contrast', () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      // Check muted text elements
      const mutedText = screenTest.getByText('Issues linked to this task');
      expect(mutedText).toHaveClass('card-description');
      
      const timeStamp = screenTest.getByText('2 days ago');
      expect(timeStamp).toHaveClass('text-muted-foreground');
    });
  });

  describe('Error Handling', () => {
    it('handles empty task object gracefully', () => {
      const emptyTask = {} as SelectedTask;
      
      expect(() => render(
        <TaskDetailView {...defaultProps} task={emptyTask} />
      )).not.toThrow();
    });

    it('handles task with null values', () => {
      const nullTask = {
        id: 'task-1',
        title: 'Test Task',
        status: null,
        assignee: null,
        priority: null,
        labels: null,
        documents: null
      } as any;
      
      expect(() => render(
        <TaskDetailView {...defaultProps} task={nullTask} />
      )).not.toThrow();
    });

    it('handles missing callback functions', () => {
      expect(() => render(
        <TaskDetailView
          task={mockTask}
          onPanelToggle={undefined as any}
          onBackToList={undefined as any}
        />
      )).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      const initialTitle = screenTest.getByText('Complete Feature Implementation');
      
      rerender(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Complete Feature Implementation')).toBe(initialTitle);
    });

    it('handles large document lists efficiently', () => {
      const taskWithManyDocs = {
        ...mockTask,
        documents: Array.from({ length: 20 }, (_, i) => ({
          id: `doc-${i}`,
          name: `document-${i}.md`,
          type: 'markdown',
          url: `/docs/doc-${i}.md`
        }))
      };
      
      expect(() => render(
        <TaskDetailView {...defaultProps} task={taskWithManyDocs} />
      )).not.toThrow();
      
      // Should render all documents
      expect(screenTest.getAllByText('Preview')).toHaveLength(20);
    });
  });

  describe('Integration', () => {
    it('integrates properly with parent callbacks', async () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      // Test back navigation
      const backButton = screenTest.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);
      expect(mockOnBackToList).toHaveBeenCalled();
      
      // Test panel toggles
      await user.click(screenTest.getByText('Status'));
      expect(mockOnPanelToggle).toHaveBeenCalledWith('status');
    });

    it('maintains consistent state across interactions', async () => {
      render(<TaskDetailView {...defaultProps} task={mockTask} />);
      
      // Multiple interactions should not affect display
      await user.click(screenTest.getByText('Status'));
      await user.click(screenTest.getByText('Issues'));
      await user.click(screenTest.getByText('Docs'));
      
      expect(screenTest.getByText('Complete Feature Implementation')).toBeInTheDocument();
      expect(screenTest.getByText('Task Information')).toBeInTheDocument();
    });
  });
});
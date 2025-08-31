/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContextualPanel } from '../ContextualPanel';
import { SelectedTask } from '../UnifiedWorkspace';

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

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={`scroll-area ${className}`}>{children}</div>
  )
}));

// Mock lucide icons
vi.mock('lucide-react', () => ({
  X: ({ className }: { className?: string }) => <span data-testid="x-icon" className={className}>✕</span>,
  Settings: ({ className }: { className?: string }) => <span data-testid="settings-icon" className={className}>⚙️</span>,
  Bug: ({ className }: { className?: string }) => <span data-testid="bug-icon" className={className}>🐛</span>,
  FileText: ({ className }: { className?: string }) => <span data-testid="filetext-icon" className={className}>📄</span>,
  MessageSquare: ({ className }: { className?: string }) => <span data-testid="messagesquare-icon" className={className}>💬</span>,
  CheckSquare: ({ className }: { className?: string }) => <span data-testid="checksquare-icon" className={className}>☑️</span>,
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}>👤</span>,
  Calendar: ({ className }: { className?: string }) => <span data-testid="calendar-icon" className={className}>📅</span>,
  Tag: ({ className }: { className?: string }) => <span data-testid="tag-icon" className={className}>🏷️</span>
}));

describe('ContextualPanel', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = vi.fn();
  const mockOnContentChange = vi.fn();

  const defaultProps = {
    isOpen: true,
    content: 'status' as const,
    selectedTask: null,
    onClose: mockOnClose,
    onContentChange: mockOnContentChange
  };

  const mockSelectedTask: SelectedTask = {
    id: 'task-1',
    title: 'Test Task Title',
    status: 'in_progress',
    assignee: 'user1',
    priority: 'high',
    labels: ['frontend', 'bug'],
    documents: [
      { id: 'doc-1', name: 'requirements.md', type: 'markdown', url: '/docs/req.md' },
      { id: 'doc-2', name: 'design.figma', type: 'design', url: '/design/ui.figma' }
    ]
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Panel Visibility', () => {
    it('renders when isOpen is true and selectedTask exists', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
      expect(screenTest.getByText('Test Task Title')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ContextualPanel {...defaultProps} isOpen={false} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.queryByText('Task Actions')).not.toBeInTheDocument();
    });

    it('does not render when selectedTask is null', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={null} />);
      
      expect(screenTest.queryByText('Task Actions')).not.toBeInTheDocument();
    });

    it('does not render when both isOpen is false and selectedTask is null', () => {
      render(<ContextualPanel {...defaultProps} isOpen={false} selectedTask={null} />);
      
      expect(screenTest.queryByText('Task Actions')).not.toBeInTheDocument();
    });
  });

  describe('Panel Header', () => {
    it('renders panel header with title and close button', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
      expect(screenTest.getByTestId('x-icon')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', async () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const closeButton = screenTest.getByTestId('x-icon').closest('button');
      await user.click(closeButton!);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('applies correct styling to header', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const header = screenTest.getByText('Task Actions').closest('div');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'p-4', 'border-b');
    });
  });

  describe('Task Summary', () => {
    it('displays task title and status', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Test Task Title')).toBeInTheDocument();
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
    });

    it('displays priority badge when priority exists', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('high')).toBeInTheDocument();
    });

    it('handles tasks without priority', () => {
      const taskWithoutPriority = { ...mockSelectedTask, priority: undefined };
      render(<ContextualPanel {...defaultProps} selectedTask={taskWithoutPriority} />);
      
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
      expect(screenTest.queryByText('high')).not.toBeInTheDocument();
    });

    it('applies correct styling to task summary', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const summary = screenTest.getByText('Test Task Title').closest('div');
      expect(summary).toHaveClass('p-4', 'bg-muted/30', 'border-b');
    });

    it('applies correct badge variants for priority', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const priorityBadge = screenTest.getByText('high');
      expect(priorityBadge).toHaveClass('destructive');
    });

    it('applies secondary variant for non-high priority', () => {
      const mediumPriorityTask = { ...mockSelectedTask, priority: 'medium' };
      render(<ContextualPanel {...defaultProps} selectedTask={mediumPriorityTask} />);
      
      const priorityBadge = screenTest.getByText('medium');
      expect(priorityBadge).toHaveClass('secondary');
    });
  });

  describe('Panel Tabs', () => {
    it('renders all panel tabs with icons', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Status')).toBeInTheDocument();
      expect(screenTest.getByText('Issues')).toBeInTheDocument();
      expect(screenTest.getByText('Docs')).toBeInTheDocument();
      expect(screenTest.getByText('Chat')).toBeInTheDocument();
      
      expect(screenTest.getByTestId('settings-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('bug-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('filetext-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('messagesquare-icon')).toBeInTheDocument();
    });

    it('highlights active tab correctly', () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      const statusTab = screenTest.getByText('Status').closest('button');
      const issuesTab = screenTest.getByText('Issues').closest('button');
      
      expect(statusTab).toHaveClass('secondary');
      expect(issuesTab).toHaveClass('ghost');
    });

    it('calls onContentChange when tabs are clicked', async () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      await user.click(screenTest.getByText('Issues'));
      expect(mockOnContentChange).toHaveBeenCalledWith('issue');
      
      await user.click(screenTest.getByText('Docs'));
      expect(mockOnContentChange).toHaveBeenCalledWith('document');
      
      await user.click(screenTest.getByText('Chat'));
      expect(mockOnContentChange).toHaveBeenCalledWith('collaboration');
    });

    it('applies correct styling to tab container', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const tabContainer = screenTest.getByText('Status').closest('button')?.parentElement;
      expect(tabContainer).toHaveClass('flex', 'border-b');
    });

    it('applies flex-1 to tabs for equal distribution', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const statusTab = screenTest.getByText('Status').closest('button');
      expect(statusTab).toHaveClass('flex-1', 'rounded-none');
    });
  });

  describe('Status Panel Content', () => {
    it('displays task status and quick actions', () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Task Status')).toBeInTheDocument();
      expect(screenTest.getByText('in_progress')).toBeInTheDocument();
      expect(screenTest.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('renders all quick action buttons', () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Mark Complete')).toBeInTheDocument();
      expect(screenTest.getByText('Reassign')).toBeInTheDocument();
      expect(screenTest.getByText('Set Deadline')).toBeInTheDocument();
      expect(screenTest.getByText('Add Labels')).toBeInTheDocument();
    });

    it('displays correct icons for quick actions', () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByTestId('checksquare-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('user-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screenTest.getByTestId('tag-icon')).toBeInTheDocument();
    });

    it('applies correct styling to quick action buttons', () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      const markCompleteButton = screenTest.getByText('Mark Complete').closest('button');
      expect(markCompleteButton).toHaveClass('outline', 'w-full', 'justify-start');
    });
  });

  describe('Issue Panel Content', () => {
    it('displays related issues section', () => {
      render(<ContextualPanel {...defaultProps} content="issue" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Related Issues')).toBeInTheDocument();
      expect(screenTest.getByText('No issues found')).toBeInTheDocument();
    });

    it('renders create new issue button', () => {
      render(<ContextualPanel {...defaultProps} content="issue" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Create New Issue')).toBeInTheDocument();
      expect(screenTest.getByTestId('bug-icon')).toBeInTheDocument();
    });

    it('applies correct styling to create issue button', () => {
      render(<ContextualPanel {...defaultProps} content="issue" selectedTask={mockSelectedTask} />);
      
      const createIssueButton = screenTest.getByText('Create New Issue').closest('button');
      expect(createIssueButton).toHaveClass('outline', 'w-full');
    });
  });

  describe('Document Panel Content', () => {
    it('displays attached documents when they exist', () => {
      render(<ContextualPanel {...defaultProps} content="document" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Attached Documents')).toBeInTheDocument();
      expect(screenTest.getByText('requirements.md')).toBeInTheDocument();
      expect(screenTest.getByText('design.figma')).toBeInTheDocument();
      expect(screenTest.getByText('markdown')).toBeInTheDocument();
      expect(screenTest.getByText('design')).toBeInTheDocument();
    });

    it('displays no documents message when no documents exist', () => {
      const taskWithoutDocs = { ...mockSelectedTask, documents: [] };
      render(<ContextualPanel {...defaultProps} content="document" selectedTask={taskWithoutDocs} />);
      
      expect(screenTest.getByText('No documents attached')).toBeInTheDocument();
    });

    it('handles undefined documents array', () => {
      const taskWithUndefinedDocs = { ...mockSelectedTask, documents: undefined };
      render(<ContextualPanel {...defaultProps} content="document" selectedTask={taskWithUndefinedDocs} />);
      
      expect(screenTest.getByText('No documents attached')).toBeInTheDocument();
    });

    it('renders attach document button', () => {
      render(<ContextualPanel {...defaultProps} content="document" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Attach Document')).toBeInTheDocument();
      expect(screenTest.getByTestId('filetext-icon')).toBeInTheDocument();
    });

    it('applies correct styling to document items', () => {
      render(<ContextualPanel {...defaultProps} content="document" selectedTask={mockSelectedTask} />);
      
      const docItem = screenTest.getByText('requirements.md').closest('div');
      expect(docItem).toHaveClass('p-2', 'border', 'rounded', 'text-sm');
    });
  });

  describe('Collaboration Panel Content', () => {
    it('displays comments section', () => {
      render(<ContextualPanel {...defaultProps} content="collaboration" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Comments')).toBeInTheDocument();
      expect(screenTest.getByText('No comments yet')).toBeInTheDocument();
    });

    it('renders add comment button', () => {
      render(<ContextualPanel {...defaultProps} content="collaboration" selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Add Comment')).toBeInTheDocument();
      expect(screenTest.getByTestId('messagesquare-icon')).toBeInTheDocument();
    });
  });

  describe('Default Panel Content', () => {
    it('displays default message when content is null', () => {
      render(<ContextualPanel {...defaultProps} content={null} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Select a tab above to begin')).toBeInTheDocument();
    });

    it('displays default message for unknown content types', () => {
      render(<ContextualPanel {...defaultProps} content={'unknown' as any} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByText('Select a tab above to begin')).toBeInTheDocument();
    });

    it('applies correct styling to default message', () => {
      render(<ContextualPanel {...defaultProps} content={null} selectedTask={mockSelectedTask} />);
      
      const defaultMessage = screenTest.getByText('Select a tab above to begin').closest('div');
      expect(defaultMessage).toHaveClass('text-center', 'py-8');
    });
  });

  describe('Content Switching', () => {
    it('switches between different content types correctly', () => {
      const { rerender } = render(
        <ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByText('Task Status')).toBeInTheDocument();
      expect(screenTest.queryByText('Related Issues')).not.toBeInTheDocument();
      
      rerender(
        <ContextualPanel {...defaultProps} content="issue" selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.queryByText('Task Status')).not.toBeInTheDocument();
      expect(screenTest.getByText('Related Issues')).toBeInTheDocument();
    });

    it('maintains tab highlighting when content changes', () => {
      const { rerender } = render(
        <ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByText('Status').closest('button')).toHaveClass('secondary');
      
      rerender(
        <ContextualPanel {...defaultProps} content="issue" selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByText('Status').closest('button')).toHaveClass('ghost');
      expect(screenTest.getByText('Issues').closest('button')).toHaveClass('secondary');
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct main container styling', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const container = screenTest.getByText('Task Actions').closest('div')?.parentElement;
      expect(container).toHaveClass('h-full', 'flex', 'flex-col', 'bg-card');
    });

    it('applies scroll area to content section', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const contentArea = screenTest.getByText('Task Status').closest('.scroll-area');
      expect(contentArea).toHaveClass('flex-1', 'p-4');
    });

    it('maintains consistent spacing in content sections', () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      const statusSection = screenTest.getByText('Task Status').closest('div')?.parentElement;
      expect(statusSection).toHaveClass('space-y-4');
    });
  });

  describe('Accessibility', () => {
    it('provides proper heading hierarchy', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByRole('heading', { level: 2 })).toHaveTextContent('Task Actions');
      expect(screenTest.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('provides semantic button roles for tabs', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      expect(screenTest.getByRole('button', { name: /Status/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Issues/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Docs/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Chat/ })).toBeInTheDocument();
    });

    it('provides proper close button accessibility', () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const closeButton = screenTest.getByTestId('x-icon').closest('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      const statusTab = screenTest.getByText('Status').closest('button');
      statusTab?.focus();
      expect(document.activeElement).toBe(statusTab);
      
      await user.tab();
      const issuesTab = screenTest.getByText('Issues').closest('button');
      expect(document.activeElement).toBe(issuesTab);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed selectedTask data', () => {
      const malformedTask = {
        id: 'task-1',
        title: '',
        status: null,
        documents: null
      } as any;
      
      expect(() => render(
        <ContextualPanel {...defaultProps} selectedTask={malformedTask} />
      )).not.toThrow();
    });

    it('handles undefined callback functions', () => {
      expect(() => render(
        <ContextualPanel 
          isOpen={true}
          content="status"
          selectedTask={mockSelectedTask}
          onClose={undefined as any}
          onContentChange={undefined as any}
        />
      )).not.toThrow();
    });

    it('handles empty documents array', () => {
      const taskWithEmptyDocs = { ...mockSelectedTask, documents: [] };
      render(<ContextualPanel {...defaultProps} content="document" selectedTask={taskWithEmptyDocs} />);
      
      expect(screenTest.getByText('No documents attached')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const { rerender } = render(
        <ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      const initialHeader = screenTest.getByText('Task Actions');
      
      rerender(
        <ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByText('Task Actions')).toBe(initialHeader);
    });

    it('efficiently handles content switching', () => {
      const { rerender } = render(
        <ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.getByText('Task Status')).toBeInTheDocument();
      
      rerender(
        <ContextualPanel {...defaultProps} content="issue" selectedTask={mockSelectedTask} />
      );
      
      expect(screenTest.queryByText('Task Status')).not.toBeInTheDocument();
      expect(screenTest.getByText('Related Issues')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('integrates properly with parent component callbacks', async () => {
      render(<ContextualPanel {...defaultProps} selectedTask={mockSelectedTask} />);
      
      // Test tab switching
      await user.click(screenTest.getByText('Issues'));
      expect(mockOnContentChange).toHaveBeenCalledWith('issue');
      
      // Test panel closing
      const closeButton = screenTest.getByTestId('x-icon').closest('button');
      await user.click(closeButton!);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('maintains state consistency across tab switches', async () => {
      render(<ContextualPanel {...defaultProps} content="status" selectedTask={mockSelectedTask} />);
      
      // Initial state
      expect(screenTest.getByText('Status').closest('button')).toHaveClass('secondary');
      expect(screenTest.getByText('Task Status')).toBeInTheDocument();
      
      // Switch tab via callback
      await user.click(screenTest.getByText('Docs'));
      expect(mockOnContentChange).toHaveBeenCalledWith('document');
    });
  });
});
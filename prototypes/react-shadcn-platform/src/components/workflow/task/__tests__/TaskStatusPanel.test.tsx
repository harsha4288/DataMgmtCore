/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskStatusPanel, TaskStatus } from '../TaskStatusPanel';
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

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-container" data-value={value}>
      <button 
        data-testid="select-trigger" 
        onClick={() => onValueChange && onValueChange('approved')}
      >
        {value}
      </button>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value, ...props }: any) => (
    <div data-testid="select-item" data-value={value} {...props}>{children}</div>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div data-testid="select-trigger" className={className}>{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value">Select Value</span>
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

// Mock lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle: ({ className }: { className?: string }) => <span data-testid="check-circle-icon" className={className}>✓</span>,
  Clock: ({ className }: { className?: string }) => <span data-testid="clock-icon" className={className}>🕐</span>,
  AlertTriangle: ({ className }: { className?: string }) => <span data-testid="alert-triangle-icon" className={className}>⚠️</span>,
  XCircle: ({ className }: { className?: string }) => <span data-testid="x-circle-icon" className={className}>✕</span>,
  Play: ({ className }: { className?: string }) => <span data-testid="play-icon" className={className}>▶️</span>,
  User: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}>👤</span>,
  Calendar: ({ className }: { className?: string }) => <span data-testid="calendar-icon" className={className}>📅</span>,
  ArrowRight: ({ className }: { className?: string }) => <span data-testid="arrow-right-icon" className={className}>→</span>
}));

describe('TaskStatusPanel', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnStatusUpdate = vi.fn();

  const defaultProps = {
    task: {} as SelectedTask,
    onStatusUpdate: mockOnStatusUpdate
  };

  const mockTask: SelectedTask = {
    id: 'task-1',
    title: 'Test Task',
    status: 'in_progress',
    assignee: 'john.doe',
    priority: 'high',
    labels: ['frontend']
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders current status display', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Current Status')).toBeInTheDocument();
      expect(screenTest.getByText('in progress')).toBeInTheDocument();
      expect(screenTest.getByText('Updated 2h ago')).toBeInTheDocument();
    });

    it('displays correct icon for current status', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('applies correct styling to status display', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const statusBadge = screenTest.getByText('in progress');
      expect(statusBadge).toHaveClass('badge', 'outline', 'capitalize');
    });

    it('renders quick transitions section for valid statuses', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Quick Transitions')).toBeInTheDocument();
      expect(screenTest.getByText('Available status changes')).toBeInTheDocument();
    });

    it('renders manual override section', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Manual Override')).toBeInTheDocument();
      expect(screenTest.getByText('Set any status directly')).toBeInTheDocument();
    });

    it('renders task actions section', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
      expect(screenTest.getByText('Reassign Task')).toBeInTheDocument();
      expect(screenTest.getByText('Set Due Date')).toBeInTheDocument();
    });
  });

  describe('Status Configuration', () => {
    it('displays correct icon for pending status', () => {
      const pendingTask = { ...mockTask, status: 'pending' };
      render(<TaskStatusPanel {...defaultProps} task={pendingTask} />);
      
      expect(screenTest.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('displays correct icon for completed status', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(<TaskStatusPanel {...defaultProps} task={completedTask} />);
      
      expect(screenTest.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('displays correct icon for blocked status', () => {
      const blockedTask = { ...mockTask, status: 'blocked' };
      render(<TaskStatusPanel {...defaultProps} task={blockedTask} />);
      
      expect(screenTest.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('handles unknown status gracefully', () => {
      const unknownStatusTask = { ...mockTask, status: 'unknown_status' as any };
      render(<TaskStatusPanel {...defaultProps} task={unknownStatusTask} />);
      
      // Should default to clock icon
      expect(screenTest.getByTestId('clock-icon')).toBeInTheDocument();
    });
  });

  describe('Status Transitions', () => {
    it('displays correct transitions for pending status', () => {
      const pendingTask = { ...mockTask, status: 'pending' };
      render(<TaskStatusPanel {...defaultProps} task={pendingTask} />);
      
      expect(screenTest.getByText('in progress')).toBeInTheDocument();
      expect(screenTest.getByText('blocked')).toBeInTheDocument();
    });

    it('displays correct transitions for in_progress status', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('ready for review')).toBeInTheDocument();
      expect(screenTest.getByText('blocked')).toBeInTheDocument();
      expect(screenTest.getByText('pending')).toBeInTheDocument();
    });

    it('displays no transitions for completed status', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(<TaskStatusPanel {...defaultProps} task={completedTask} />);
      
      expect(screenTest.queryByText('Quick Transitions')).not.toBeInTheDocument();
    });

    it('calls onStatusUpdate when transition button is clicked', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const readyForReviewButton = screenTest.getByText('ready for review').closest('button');
      await user.click(readyForReviewButton!);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.READY_FOR_REVIEW);
    });

    it('updates internal state when status changes', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const blockedButton = screenTest.getByText('blocked').closest('button');
      await user.click(blockedButton!);
      
      // Check if the display updates (though we can't easily test state directly)
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.BLOCKED);
    });
  });

  describe('Quick Transition Buttons', () => {
    it('renders transition buttons with correct icons', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      // Should have arrow right icons for transitions
      const arrowIcons = screenTest.getAllByTestId('arrow-right-icon');
      expect(arrowIcons.length).toBeGreaterThan(0);
    });

    it('applies correct styling to transition buttons', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const transitionButton = screenTest.getByText('ready for review').closest('button');
      expect(transitionButton).toHaveClass('outline', 'w-full', 'justify-start');
    });

    it('displays status names in correct format', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      // Status names should be capitalized and underscores replaced with spaces
      expect(screenTest.getByText('ready for review')).toBeInTheDocument();
      expect(screenTest.getByText('in progress')).toBeInTheDocument();
    });

    it('includes status icons in transition buttons', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      // Should have various status icons based on available transitions
      expect(screenTest.getAllByTestId('alert-triangle-icon')).toHaveLength(1); // ready_for_review
      expect(screenTest.getAllByTestId('x-circle-icon')).toHaveLength(1); // blocked
      expect(screenTest.getAllByTestId('clock-icon')).toHaveLength(2); // pending (one in current status, one in transitions)
    });
  });

  describe('Manual Override Selector', () => {
    it('renders select component with current value', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const selectContainer = screenTest.getByTestId('select-container');
      expect(selectContainer).toHaveAttribute('data-value', 'in_progress');
    });

    it('triggers status change when select value changes', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const selectTrigger = screenTest.getByTestId('select-trigger');
      await user.click(selectTrigger);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledWith('approved');
    });

    it('applies correct styling to select trigger', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const selectTrigger = screenTest.getByTestId('select-trigger');
      expect(selectTrigger).toHaveClass('h-8');
    });

    it('renders all status options in select', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      // Should render select items for all status values
      const selectItems = screenTest.getAllByTestId('select-item');
      expect(selectItems.length).toBe(Object.values(TaskStatus).length);
    });
  });

  describe('Task Actions', () => {
    it('renders reassign task button', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Reassign Task')).toBeInTheDocument();
      expect(screenTest.getAllByTestId('user-icon')).toHaveLength(2); // One in status icon, one in reassign button
    });

    it('renders set due date button', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Set Due Date')).toBeInTheDocument();
      expect(screenTest.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('applies correct styling to action buttons', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const reassignButton = screenTest.getByText('Reassign Task').closest('button');
      const dueDateButton = screenTest.getByText('Set Due Date').closest('button');
      
      expect(reassignButton).toHaveClass('outline', 'w-full', 'justify-start', 'h-8');
      expect(dueDateButton).toHaveClass('outline', 'w-full', 'justify-start', 'h-8');
    });
  });

  describe('Status Workflow Logic', () => {
    it('prevents invalid transitions', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(<TaskStatusPanel {...defaultProps} task={completedTask} />);
      
      // Completed tasks should have no quick transitions
      expect(screenTest.queryByText('Quick Transitions')).not.toBeInTheDocument();
    });

    it('allows all transitions through manual override', () => {
      const completedTask = { ...mockTask, status: 'completed' };
      render(<TaskStatusPanel {...defaultProps} task={completedTask} />);
      
      // Manual override should still be available
      expect(screenTest.getByText('Manual Override')).toBeInTheDocument();
      expect(screenTest.getByTestId('select-container')).toBeInTheDocument();
    });

    it('shows appropriate transitions for blocked status', () => {
      const blockedTask = { ...mockTask, status: 'blocked' };
      render(<TaskStatusPanel {...defaultProps} task={blockedTask} />);
      
      expect(screenTest.getByText('pending')).toBeInTheDocument();
      expect(screenTest.getByText('in progress')).toBeInTheDocument();
    });

    it('shows appropriate transitions for review status', () => {
      const reviewTask = { ...mockTask, status: 'in_review' };
      render(<TaskStatusPanel {...defaultProps} task={reviewTask} />);
      
      expect(screenTest.getByText('approved')).toBeInTheDocument();
      expect(screenTest.getByText('in progress')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('applies status-specific background colors', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      // Should have background color class for in_progress status
      const statusDisplay = screenTest.getByText('in progress').closest('div')?.parentElement;
      expect(statusDisplay).toHaveClass('bg-blue-500/10');
    });

    it('applies status-specific text colors to icons', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const statusIcon = screenTest.getByTestId('play-icon');
      expect(statusIcon).toHaveClass('text-blue-500');
    });

    it('applies consistent card styling', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const cards = screenTest.getAllByRole('generic').filter(el => el.className.includes('card'));
      expect(cards.length).toBeGreaterThan(0);
    });

    it('maintains consistent spacing', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const container = screenTest.getByText('Current Status').closest('div')?.parentElement;
      expect(container).toHaveClass('space-y-4');
    });
  });

  describe('Error Handling', () => {
    it('handles task with undefined status', () => {
      const taskWithUndefinedStatus = { ...mockTask, status: undefined as any };
      
      expect(() => render(
        <TaskStatusPanel {...defaultProps} task={taskWithUndefinedStatus} />
      )).not.toThrow();
    });

    it('handles missing onStatusUpdate callback', () => {
      expect(() => render(
        <TaskStatusPanel task={mockTask} />
      )).not.toThrow();
    });

    it('handles empty task object', () => {
      const emptyTask = {} as SelectedTask;
      
      expect(() => render(
        <TaskStatusPanel {...defaultProps} task={emptyTask} />
      )).not.toThrow();
    });

    it('gracefully handles invalid status values', () => {
      const invalidStatusTask = { ...mockTask, status: 'invalid_status' as any };
      render(<TaskStatusPanel {...defaultProps} task={invalidStatusTask} />);
      
      // Should still render basic structure
      expect(screenTest.getByText('Current Status')).toBeInTheDocument();
      expect(screenTest.getByText('Manual Override')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper heading hierarchy', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const headings = screenTest.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
      
      expect(screenTest.getByText('Current Status')).toBeInTheDocument();
      expect(screenTest.getByText('Quick Transitions')).toBeInTheDocument();
    });

    it('provides semantic button roles', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const buttons = screenTest.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Should have transition buttons and action buttons
      expect(screenTest.getByRole('button', { name: /ready for review/ })).toBeInTheDocument();
      expect(screenTest.getByRole('button', { name: /Reassign Task/ })).toBeInTheDocument();
    });

    it('provides appropriate text sizing for readability', () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const descriptions = screenTest.getAllByText(/Available status changes|Set any status directly/);
      descriptions.forEach(desc => {
        expect(desc).toHaveClass('text-xs');
      });
    });

    it('maintains keyboard navigation order', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const buttons = screenTest.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // First button should be focusable
      const firstButton = buttons[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const initialStatusDisplay = screenTest.getByText('Current Status');
      
      rerender(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('Current Status')).toBe(initialStatusDisplay);
    });

    it('efficiently handles status updates', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const transitionButton = screenTest.getByText('ready for review').closest('button');
      await user.click(transitionButton!);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledTimes(1);
    });

    it('handles multiple rapid status changes', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const buttons = screenTest.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('ready for review') || 
        btn.textContent?.includes('blocked')
      );
      
      for (const button of buttons.slice(0, 2)) {
        await user.click(button);
      }
      
      expect(mockOnStatusUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration', () => {
    it('integrates properly with parent component callbacks', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      const transitionButton = screenTest.getByText('ready for review').closest('button');
      await user.click(transitionButton!);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.READY_FOR_REVIEW);
    });

    it('maintains state consistency across multiple interactions', async () => {
      render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      // Click multiple transitions
      const blockedButton = screenTest.getByText('blocked').closest('button');
      await user.click(blockedButton!);
      
      const reviewButton = screenTest.getByText('ready for review').closest('button');
      await user.click(reviewButton!);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledTimes(2);
      expect(mockOnStatusUpdate).toHaveBeenLastCalledWith(TaskStatus.READY_FOR_REVIEW);
    });

    it('handles external status prop changes', () => {
      const { rerender } = render(<TaskStatusPanel {...defaultProps} task={mockTask} />);
      
      expect(screenTest.getByText('in progress')).toBeInTheDocument();
      
      const updatedTask = { ...mockTask, status: 'completed' };
      rerender(<TaskStatusPanel {...defaultProps} task={updatedTask} />);
      
      expect(screenTest.getByText('completed')).toBeInTheDocument();
    });
  });
});
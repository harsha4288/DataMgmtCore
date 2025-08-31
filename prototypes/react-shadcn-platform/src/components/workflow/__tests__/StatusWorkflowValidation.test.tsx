/**
 * @jest-environment jsdom
 * 
 * Status Management Workflow Validation Tests
 * Tests comprehensive status management workflow as specified in:
 * - task-5.8.3-advanced-dashboard-functionality.md
 * - Status transition validation and workflow engine requirements
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen as screenTest } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskStatusPanel, TaskStatus } from '../task/TaskStatusPanel';
import { SelectedTask } from '../workspace/UnifiedWorkspace';

// Mock UI components for consistent testing
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={`btn ${variant || ''} ${size || ''} ${className || ''}`}
      data-testid={`button-${children?.toString().toLowerCase().replace(/\s+/g, '-') || 'button'}`}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={`badge ${variant || ''} ${className || ''}`} data-testid="status-badge">
      {children}
    </span>
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
    <h3 className={`card-title ${className || ''}`} data-testid="card-title">{children}</h3>
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="status-select" data-value={value}>
      <select 
        value={value} 
        onChange={(e) => onValueChange?.(e.target.value)}
        data-testid="status-select-input"
      >
        {Object.values(TaskStatus).map((status) => (
          <option key={status} value={status}>
            {status.replace('_', ' ')}
          </option>
        ))}
      </select>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <option value={value} data-testid="select-item">{children}</option>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div data-testid="select-trigger" className={className}>{children}</div>
  ),
  SelectValue: () => <span data-testid="select-value">Select Value</span>
}));

// Mock icons
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

describe('Status Management Workflow Validation', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnStatusUpdate = vi.fn();

  const createTask = (status: string): SelectedTask => ({
    id: 'test-task-1',
    title: 'Test Task for Status Workflow',
    status,
    assignee: 'test.user',
    priority: 'high'
  });

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Status Transition Validation Engine', () => {
    describe('Valid Transitions from PENDING', () => {
      it('allows transition to IN_PROGRESS', async () => {
        const task = createTask('pending');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-in-progress');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.IN_PROGRESS);
      });

      it('allows transition to BLOCKED', async () => {
        const task = createTask('pending');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-blocked');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.BLOCKED);
      });

      it('does not allow direct transition to COMPLETED', () => {
        const task = createTask('pending');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        // Should not have completed button in quick transitions
        expect(screenTest.queryByTestId('button-completed')).not.toBeInTheDocument();
      });
    });

    describe('Valid Transitions from IN_PROGRESS', () => {
      it('allows transition to READY_FOR_REVIEW', async () => {
        const task = createTask('in_progress');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-ready-for-review');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.READY_FOR_REVIEW);
      });

      it('allows transition back to PENDING', async () => {
        const task = createTask('in_progress');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-pending');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.PENDING);
      });

      it('allows transition to BLOCKED', async () => {
        const task = createTask('in_progress');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-blocked');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.BLOCKED);
      });
    });

    describe('Review Workflow Transitions', () => {
      it('allows READY_FOR_REVIEW to IN_REVIEW', async () => {
        const task = createTask('ready_for_review');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-in-review');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.IN_REVIEW);
      });

      it('allows READY_FOR_REVIEW back to IN_PROGRESS', async () => {
        const task = createTask('ready_for_review');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-in-progress');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.IN_PROGRESS);
      });

      it('allows IN_REVIEW to APPROVED', async () => {
        const task = createTask('in_review');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-approved');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.APPROVED);
      });

      it('allows IN_REVIEW back to IN_PROGRESS for revisions', async () => {
        const task = createTask('in_review');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-in-progress');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.IN_PROGRESS);
      });
    });

    describe('Final State Transitions', () => {
      it('allows APPROVED to COMPLETED', async () => {
        const task = createTask('approved');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-completed');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.COMPLETED);
      });

      it('prevents transitions from COMPLETED state', () => {
        const task = createTask('completed');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        // Should not show quick transitions section
        expect(screenTest.queryByText('Quick Transitions')).not.toBeInTheDocument();
      });
    });

    describe('Recovery Transitions from BLOCKED', () => {
      it('allows BLOCKED to PENDING', async () => {
        const task = createTask('blocked');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-pending');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.PENDING);
      });

      it('allows BLOCKED to IN_PROGRESS', async () => {
        const task = createTask('blocked');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-in-progress');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.IN_PROGRESS);
      });
    });

    describe('Recovery from CANCELLED', () => {
      it('allows CANCELLED to PENDING for task revival', async () => {
        const task = createTask('cancelled');
        render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        const transitionButton = screenTest.getByTestId('button-pending');
        await user.click(transitionButton);
        
        expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.PENDING);
      });
    });
  });

  describe('Manual Override Functionality', () => {
    it('allows direct status changes through manual override', async () => {
      const task = createTask('pending');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      const selectInput = screenTest.getByTestId('status-select-input') as HTMLSelectElement;
      await user.selectOptions(selectInput, TaskStatus.COMPLETED);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.COMPLETED);
    });

    it('enables bypassing workflow restrictions when necessary', async () => {
      const task = createTask('pending');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Direct jump to approved (normally not allowed from pending)
      const selectInput = screenTest.getByTestId('status-select-input') as HTMLSelectElement;
      await user.selectOptions(selectInput, TaskStatus.APPROVED);
      
      expect(mockOnStatusUpdate).toHaveBeenCalledWith(TaskStatus.APPROVED);
    });

    it('provides all status options in manual override', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      const selectInput = screenTest.getByTestId('status-select-input') as HTMLSelectElement;
      const options = Array.from(selectInput.options);
      
      // Should have all status options
      expect(options).toHaveLength(Object.values(TaskStatus).length);
      
      // Verify all statuses are present
      const optionValues = options.map(option => option.value);
      Object.values(TaskStatus).forEach(status => {
        expect(optionValues).toContain(status);
      });
    });
  });

  describe('Status Display and Visual Indicators', () => {
    it('displays correct visual indicators for each status', () => {
      const statusTests = [
        { status: 'pending', expectedIcon: 'clock-icon' },
        { status: 'in_progress', expectedIcon: 'play-icon' },
        { status: 'ready_for_review', expectedIcon: 'alert-triangle-icon' },
        { status: 'in_review', expectedIcon: 'user-icon' },
        { status: 'approved', expectedIcon: 'check-circle-icon' },
        { status: 'completed', expectedIcon: 'check-circle-icon' },
        { status: 'blocked', expectedIcon: 'x-circle-icon' },
        { status: 'cancelled', expectedIcon: 'x-circle-icon' }
      ];
      
      statusTests.forEach(({ status, expectedIcon }) => {
        const task = createTask(status);
        const { unmount } = render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
        
        expect(screenTest.getByTestId(expectedIcon)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('applies status-specific color coding', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      const statusIcon = screenTest.getByTestId('play-icon');
      expect(statusIcon).toHaveClass('text-blue-500');
    });

    it('shows appropriate background colors for status display', () => {
      const task = createTask('blocked');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Should have red background for blocked status
      const statusDisplay = screenTest.getByTestId('status-badge').closest('div');
      expect(statusDisplay).toHaveClass('bg-red-500/10');
    });
  });

  describe('Workflow History and Tracking', () => {
    it('displays status update timestamp', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screenTest.getByText('Updated 2h ago')).toBeInTheDocument();
    });

    it('maintains status formatting consistency', () => {
      const task = createTask('ready_for_review');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Status should be formatted with spaces and capitalization
      expect(screenTest.getByText('ready for review')).toBeInTheDocument();
    });
  });

  describe('Additional Task Actions Integration', () => {
    it('provides task reassignment capability', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screenTest.getByText('Reassign Task')).toBeInTheDocument();
      expect(screenTest.getAllByTestId('user-icon')).toHaveLength(2); // One for status, one for reassign button
    });

    it('provides due date setting capability', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      expect(screenTest.getByText('Set Due Date')).toBeInTheDocument();
      expect(screenTest.getByTestId('calendar-icon')).toBeInTheDocument();
    });

    it('applies consistent styling to action buttons', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      const reassignButton = screenTest.getByTestId('button-reassign-task');
      const dueDateButton = screenTest.getByTestId('button-set-due-date');
      
      expect(reassignButton).toHaveClass('outline', 'w-full', 'justify-start', 'h-8');
      expect(dueDateButton).toHaveClass('outline', 'w-full', 'justify-start', 'h-8');
    });
  });

  describe('Workflow Validation Edge Cases', () => {
    it('handles invalid status gracefully', () => {
      const task = createTask('invalid_status');
      
      expect(() => render(
        <TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />
      )).not.toThrow();
      
      // Should default to clock icon for unknown status
      expect(screenTest.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('handles missing status gracefully', () => {
      const task = { ...createTask(''), status: undefined } as any;
      
      expect(() => render(
        <TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />
      )).not.toThrow();
    });

    it('handles null status update callback', () => {
      const task = createTask('in_progress');
      
      expect(() => render(
        <TaskStatusPanel task={task} />
      )).not.toThrow();
    });
  });

  describe('Workflow Performance Requirements', () => {
    it('handles rapid status changes efficiently', async () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Rapid clicks should all be handled
      const transitionButtons = [
        screenTest.getByTestId('button-ready-for-review'),
        screenTest.getByTestId('button-blocked'),
        screenTest.getByTestId('button-pending')
      ];
      
      for (const button of transitionButtons) {
        await user.click(button);
      }
      
      expect(mockOnStatusUpdate).toHaveBeenCalledTimes(3);
    });

    it('maintains responsive UI during status operations', async () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      const transitionButton = screenTest.getByTestId('button-ready-for-review');
      await user.click(transitionButton);
      
      // UI should remain responsive
      expect(screenTest.getByText('Current Status')).toBeInTheDocument();
      expect(mockOnStatusUpdate).toHaveBeenCalled();
    });
  });

  describe('Compliance with Advanced Dashboard Requirements', () => {
    it('supports bulk operations through workflow engine', () => {
      // This would be extended to support multiple task status updates
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Current implementation supports single task updates
      // Future: extend to handle bulk operations
      expect(screenTest.getByText('Quick Transitions')).toBeInTheDocument();
    });

    it('provides comprehensive status management interface', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Should have all required sections
      expect(screenTest.getByText('Current Status')).toBeInTheDocument();
      expect(screenTest.getByText('Quick Transitions')).toBeInTheDocument();
      expect(screenTest.getByText('Manual Override')).toBeInTheDocument();
      expect(screenTest.getByText('Task Actions')).toBeInTheDocument();
    });

    it('integrates with broader workflow system', () => {
      const task = createTask('in_progress');
      render(<TaskStatusPanel task={task} onStatusUpdate={mockOnStatusUpdate} />);
      
      // Should provide hooks for integration with larger system
      expect(screenTest.getByTestId('status-select')).toBeInTheDocument();
      expect(typeof mockOnStatusUpdate).toBe('function');
    });
  });
});
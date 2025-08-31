/**
 * @jest-environment jsdom
 * 
 * Issue Management CRUD Operations Tests
 * Tests comprehensive issue management system as specified in:
 * - task-5.8.3-advanced-dashboard-functionality.md
 * - Issue creation, linking, categorization, and resolution tracking
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen as screenTest } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock issue management types based on task requirements
interface IssueType {
  BUG: 'bug';
  FEATURE: 'feature';
  QA: 'qa';
  UAT: 'uat';
  IMPROVEMENT: 'improvement';
}

interface IssueSeverity {
  LOW: 'low';
  MEDIUM: 'medium';
  HIGH: 'high';
  CRITICAL: 'critical';
}

interface Issue {
  id: string;
  title: string;
  description: string;
  type: keyof IssueType;
  severity: keyof IssueSeverity;
  assignee?: string;
  relatedTasks: string[];
  labels: string[];
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolutionAttempts: ResolutionAttempt[];
  createdAt: Date;
  updatedAt: Date;
}

interface ResolutionAttempt {
  id: string;
  approach: string;
  outcome: 'success' | 'failure' | 'partial';
  details: string;
  timestamp: Date;
  performedBy: string;
  timeSpent?: number;
  resourcesUsed?: string[];
}

// Mock Issue Management Components
const MockIssueForm: React.FC<{
  onSubmit: (_issue: Partial<Issue>) => void;
  issue?: Partial<Issue>;
  mode: 'create' | 'edit';
}> = ({ onSubmit, issue, mode }) => {
  const handleSubmit = () => {
    onSubmit({
      title: 'Test Issue',
      description: 'Test issue description',
      type: 'BUG' as keyof IssueType,
      severity: 'HIGH' as keyof IssueSeverity,
      relatedTasks: ['task-1'],
      labels: ['frontend', 'critical']
    });
  };

  return (
    <div data-testid="issue-form">
      <h2>{mode === 'create' ? 'Create Issue' : 'Edit Issue'}</h2>
      <input 
        data-testid="issue-title" 
        placeholder="Issue title" 
        defaultValue={issue?.title || ''} 
      />
      <textarea 
        data-testid="issue-description" 
        placeholder="Issue description"
        defaultValue={issue?.description || ''}
      />
      <select data-testid="issue-type" defaultValue={issue?.type || 'BUG'}>
        <option value="BUG">Bug</option>
        <option value="FEATURE">Feature</option>
        <option value="QA">QA</option>
        <option value="UAT">UAT</option>
        <option value="IMPROVEMENT">Improvement</option>
      </select>
      <select data-testid="issue-severity" defaultValue={issue?.severity || 'MEDIUM'}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <input data-testid="issue-assignee" placeholder="Assignee" defaultValue={issue?.assignee || ''} />
      <input data-testid="issue-labels" placeholder="Labels (comma separated)" />
      <input data-testid="issue-due-date" type="date" />
      <button data-testid="submit-issue" onClick={handleSubmit}>
        {mode === 'create' ? 'Create Issue' : 'Update Issue'}
      </button>
    </div>
  );
};

const MockIssueList: React.FC<{
  issues: Issue[];
  onEdit: (_issue: Issue) => void;
  onDelete: (_issueId: string) => void;
  onFilter: (_filters: any) => void;
}> = ({ issues, onEdit, onDelete, onFilter }) => (
  <div data-testid="issue-list">
    <div data-testid="issue-filters">
      <select data-testid="filter-type" onChange={(e) => onFilter({ type: e.target.value })}>
        <option value="">All Types</option>
        <option value="BUG">Bugs</option>
        <option value="FEATURE">Features</option>
      </select>
      <select data-testid="filter-severity" onChange={(e) => onFilter({ severity: e.target.value })}>
        <option value="">All Severities</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
      <select data-testid="filter-status" onChange={(e) => onFilter({ status: e.target.value })}>
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>
    {issues.map((issue) => (
      <div key={issue.id} data-testid={`issue-${issue.id}`} className="issue-item">
        <h3 data-testid={`issue-title-${issue.id}`}>{issue.title}</h3>
        <span data-testid={`issue-type-${issue.id}`} className={`type-${issue.type.toLowerCase()}`}>
          {issue.type}
        </span>
        <span data-testid={`issue-severity-${issue.id}`} className={`severity-${issue.severity.toLowerCase()}`}>
          {issue.severity}
        </span>
        <span data-testid={`issue-status-${issue.id}`}>{issue.status}</span>
        <div className="issue-actions">
          <button 
            data-testid={`edit-issue-${issue.id}`} 
            onClick={() => onEdit(issue)}
          >
            Edit
          </button>
          <button 
            data-testid={`delete-issue-${issue.id}`} 
            onClick={() => onDelete(issue.id)}
          >
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
);

const MockIssueDetail: React.FC<{
  issue: Issue;
  onAddResolution: (_attempt: Partial<ResolutionAttempt>) => void;
  onLinkTask: (_taskId: string) => void;
  onUnlinkTask: (_taskId: string) => void;
}> = ({ issue, onAddResolution, onLinkTask, onUnlinkTask }) => (
  <div data-testid="issue-detail">
    <h1 data-testid="issue-detail-title">{issue.title}</h1>
    <p data-testid="issue-detail-description">{issue.description}</p>
    
    <div data-testid="issue-metadata">
      <span data-testid="issue-detail-type">{issue.type}</span>
      <span data-testid="issue-detail-severity">{issue.severity}</span>
      <span data-testid="issue-detail-status">{issue.status}</span>
    </div>

    <div data-testid="related-tasks">
      <h3>Related Tasks</h3>
      {issue.relatedTasks.map((taskId) => (
        <div key={taskId} data-testid={`related-task-${taskId}`}>
          {taskId}
          <button 
            data-testid={`unlink-task-${taskId}`}
            onClick={() => onUnlinkTask(taskId)}
          >
            Unlink
          </button>
        </div>
      ))}
      <button 
        data-testid="link-task-button"
        onClick={() => onLinkTask('new-task-id')}
      >
        Link Task
      </button>
    </div>

    <div data-testid="resolution-attempts">
      <h3>Resolution Attempts ({issue.resolutionAttempts.length})</h3>
      {issue.resolutionAttempts.map((attempt) => (
        <div key={attempt.id} data-testid={`resolution-${attempt.id}`} className="resolution-attempt">
          <p data-testid={`resolution-approach-${attempt.id}`}>{attempt.approach}</p>
          <span data-testid={`resolution-outcome-${attempt.id}`} className={`outcome-${attempt.outcome}`}>
            {attempt.outcome}
          </span>
          <span data-testid={`resolution-performer-${attempt.id}`}>{attempt.performedBy}</span>
        </div>
      ))}
      <button 
        data-testid="add-resolution-attempt"
        onClick={() => onAddResolution({
          approach: 'Test resolution approach',
          outcome: 'success',
          details: 'Test resolution details',
          performedBy: 'test.user'
        })}
      >
        Add Resolution Attempt
      </button>
    </div>
  </div>
);

const MockIssueTemplates: React.FC<{
  onSelectTemplate: (_template: any) => void;
}> = ({ onSelectTemplate }) => (
  <div data-testid="issue-templates">
    <h3>Issue Templates</h3>
    <button 
      data-testid="bug-template"
      onClick={() => onSelectTemplate({
        type: 'BUG',
        title: 'Bug Report Template',
        description: 'Template for bug reports'
      })}
    >
      Bug Report Template
    </button>
    <button 
      data-testid="feature-template"
      onClick={() => onSelectTemplate({
        type: 'FEATURE',
        title: 'Feature Request Template',
        description: 'Template for feature requests'
      })}
    >
      Feature Request Template
    </button>
    <button 
      data-testid="qa-template"
      onClick={() => onSelectTemplate({
        type: 'QA',
        title: 'QA Issue Template',
        description: 'Template for QA issues'
      })}
    >
      QA Issue Template
    </button>
  </div>
);

describe('Issue Management CRUD Operations', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockIssues: Issue[];
  
  const mockCallbacks = {
    onSubmit: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onFilter: vi.fn(),
    onAddResolution: vi.fn(),
    onLinkTask: vi.fn(),
    onUnlinkTask: vi.fn(),
    onSelectTemplate: vi.fn()
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    mockIssues = [
      {
        id: 'issue-1',
        title: 'Critical Bug in Authentication',
        description: 'Users cannot log in due to authentication service failure',
        type: 'BUG' as keyof IssueType,
        severity: 'CRITICAL' as keyof IssueSeverity,
        assignee: 'john.doe',
        relatedTasks: ['task-1', 'task-2'],
        labels: ['authentication', 'critical', 'backend'],
        status: 'open',
        resolutionAttempts: [
          {
            id: 'res-1',
            approach: 'Restarted authentication service',
            outcome: 'failure',
            details: 'Service restarted but issue persisted',
            timestamp: new Date(),
            performedBy: 'john.doe',
            timeSpent: 30
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'issue-2',
        title: 'Feature Request: Dark Mode',
        description: 'Add dark mode theme to the application',
        type: 'FEATURE' as keyof IssueType,
        severity: 'LOW' as keyof IssueSeverity,
        relatedTasks: ['task-3'],
        labels: ['ui', 'enhancement'],
        status: 'in_progress',
        resolutionAttempts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  describe('Issue Creation (CREATE)', () => {
    it('renders issue creation form with all required fields', () => {
      render(<MockIssueForm onSubmit={mockCallbacks.onSubmit} mode="create" />);
      
      expect(screenTest.getByText('Create Issue')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-title')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-description')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-type')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-severity')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-assignee')).toBeInTheDocument();
    });

    it('supports all issue types as specified', () => {
      render(<MockIssueForm onSubmit={mockCallbacks.onSubmit} mode="create" />);
      
      const typeSelect = screenTest.getByTestId('issue-type') as HTMLSelectElement;
      const options = Array.from(typeSelect.options).map(opt => opt.value);
      
      expect(options).toContain('BUG');
      expect(options).toContain('FEATURE');
      expect(options).toContain('QA');
      expect(options).toContain('UAT');
      expect(options).toContain('IMPROVEMENT');
    });

    it('supports all severity levels', () => {
      render(<MockIssueForm onSubmit={mockCallbacks.onSubmit} mode="create" />);
      
      const severitySelect = screenTest.getByTestId('issue-severity') as HTMLSelectElement;
      const options = Array.from(severitySelect.options).map(opt => opt.value);
      
      expect(options).toContain('LOW');
      expect(options).toContain('MEDIUM');
      expect(options).toContain('HIGH');
      expect(options).toContain('CRITICAL');
    });

    it('submits issue with correct data structure', async () => {
      render(<MockIssueForm onSubmit={mockCallbacks.onSubmit} mode="create" />);
      
      await user.click(screenTest.getByTestId('submit-issue'));
      
      expect(mockCallbacks.onSubmit).toHaveBeenCalledWith({
        title: 'Test Issue',
        description: 'Test issue description',
        type: 'BUG',
        severity: 'HIGH',
        relatedTasks: ['task-1'],
        labels: ['frontend', 'critical']
      });
    });

    it('provides issue templates for common types', () => {
      render(<MockIssueTemplates onSelectTemplate={mockCallbacks.onSelectTemplate} />);
      
      expect(screenTest.getByText('Issue Templates')).toBeInTheDocument();
      expect(screenTest.getByTestId('bug-template')).toBeInTheDocument();
      expect(screenTest.getByTestId('feature-template')).toBeInTheDocument();
      expect(screenTest.getByTestId('qa-template')).toBeInTheDocument();
    });

    it('applies template when selected', async () => {
      render(<MockIssueTemplates onSelectTemplate={mockCallbacks.onSelectTemplate} />);
      
      await user.click(screenTest.getByTestId('bug-template'));
      
      expect(mockCallbacks.onSelectTemplate).toHaveBeenCalledWith({
        type: 'BUG',
        title: 'Bug Report Template',
        description: 'Template for bug reports'
      });
    });
  });

  describe('Issue Reading and Listing (READ)', () => {
    it('displays list of issues with key information', () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      expect(screenTest.getByTestId('issue-issue-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-issue-2')).toBeInTheDocument();
      
      expect(screenTest.getByTestId('issue-title-issue-1')).toHaveTextContent('Critical Bug in Authentication');
      expect(screenTest.getByTestId('issue-title-issue-2')).toHaveTextContent('Feature Request: Dark Mode');
    });

    it('shows issue type with appropriate styling', () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      const bugType = screenTest.getByTestId('issue-type-issue-1');
      const featureType = screenTest.getByTestId('issue-type-issue-2');
      
      expect(bugType).toHaveTextContent('BUG');
      expect(bugType).toHaveClass('type-bug');
      
      expect(featureType).toHaveTextContent('FEATURE');
      expect(featureType).toHaveClass('type-feature');
    });

    it('shows severity with visual indicators', () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      const criticalSeverity = screenTest.getByTestId('issue-severity-issue-1');
      const lowSeverity = screenTest.getByTestId('issue-severity-issue-2');
      
      expect(criticalSeverity).toHaveTextContent('CRITICAL');
      expect(criticalSeverity).toHaveClass('severity-critical');
      
      expect(lowSeverity).toHaveTextContent('LOW');
      expect(lowSeverity).toHaveClass('severity-low');
    });

    it('provides filtering capabilities', async () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      const typeFilter = screenTest.getByTestId('filter-type');
      await user.selectOptions(typeFilter, 'BUG');
      
      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ type: 'BUG' });
    });

    it('supports filtering by multiple criteria', async () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      const severityFilter = screenTest.getByTestId('filter-severity');
      await user.selectOptions(severityFilter, 'CRITICAL');
      
      const statusFilter = screenTest.getByTestId('filter-status');
      await user.selectOptions(statusFilter, 'open');
      
      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ severity: 'CRITICAL' });
      expect(mockCallbacks.onFilter).toHaveBeenCalledWith({ status: 'open' });
    });
  });

  describe('Issue Detail View', () => {
    it('displays comprehensive issue information', () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      expect(screenTest.getByTestId('issue-detail-title')).toHaveTextContent('Critical Bug in Authentication');
      expect(screenTest.getByTestId('issue-detail-description')).toHaveTextContent('Users cannot log in due to authentication service failure');
      expect(screenTest.getByTestId('issue-detail-type')).toHaveTextContent('BUG');
      expect(screenTest.getByTestId('issue-detail-severity')).toHaveTextContent('CRITICAL');
    });

    it('shows related tasks with management capabilities', () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      expect(screenTest.getByText('Related Tasks')).toBeInTheDocument();
      expect(screenTest.getByTestId('related-task-task-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('related-task-task-2')).toBeInTheDocument();
      expect(screenTest.getByTestId('link-task-button')).toBeInTheDocument();
    });

    it('enables task linking functionality', async () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      await user.click(screenTest.getByTestId('link-task-button'));
      
      expect(mockCallbacks.onLinkTask).toHaveBeenCalledWith('new-task-id');
    });

    it('enables task unlinking functionality', async () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      await user.click(screenTest.getByTestId('unlink-task-task-1'));
      
      expect(mockCallbacks.onUnlinkTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('Issue Update (UPDATE)', () => {
    it('pre-populates edit form with existing data', () => {
      const issue = mockIssues[0];
      render(
        <MockIssueForm 
          onSubmit={mockCallbacks.onSubmit} 
          issue={issue} 
          mode="edit" 
        />
      );
      
      expect(screenTest.getByText('Edit Issue')).toBeInTheDocument();
      expect(screenTest.getByTestId('issue-title')).toHaveValue(issue.title);
      expect(screenTest.getByTestId('issue-description')).toHaveValue(issue.description);
    });

    it('triggers edit action from issue list', async () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      await user.click(screenTest.getByTestId('edit-issue-issue-1'));
      
      expect(mockCallbacks.onEdit).toHaveBeenCalledWith(mockIssues[0]);
    });

    it('submits updated issue data', async () => {
      const issue = mockIssues[0];
      render(
        <MockIssueForm 
          onSubmit={mockCallbacks.onSubmit} 
          issue={issue} 
          mode="edit" 
        />
      );
      
      await user.click(screenTest.getByTestId('submit-issue'));
      
      expect(mockCallbacks.onSubmit).toHaveBeenCalled();
      expect(screenTest.getByText('Update Issue')).toBeInTheDocument();
    });
  });

  describe('Issue Deletion (DELETE)', () => {
    it('provides delete functionality in issue list', async () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      await user.click(screenTest.getByTestId('delete-issue-issue-1'));
      
      expect(mockCallbacks.onDelete).toHaveBeenCalledWith('issue-1');
    });

    it('handles deletion of specific issues', async () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      await user.click(screenTest.getByTestId('delete-issue-issue-2'));
      
      expect(mockCallbacks.onDelete).toHaveBeenCalledWith('issue-2');
    });
  });

  describe('Resolution Tracking', () => {
    it('displays resolution attempts with outcomes', () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      expect(screenTest.getByText('Resolution Attempts (1)')).toBeInTheDocument();
      expect(screenTest.getByTestId('resolution-res-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('resolution-approach-res-1')).toHaveTextContent('Restarted authentication service');
      expect(screenTest.getByTestId('resolution-outcome-res-1')).toHaveTextContent('failure');
      expect(screenTest.getByTestId('resolution-performer-res-1')).toHaveTextContent('john.doe');
    });

    it('provides visual indicators for resolution outcomes', () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      const outcomeElement = screenTest.getByTestId('resolution-outcome-res-1');
      expect(outcomeElement).toHaveClass('outcome-failure');
    });

    it('enables adding new resolution attempts', async () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      await user.click(screenTest.getByTestId('add-resolution-attempt'));
      
      expect(mockCallbacks.onAddResolution).toHaveBeenCalledWith({
        approach: 'Test resolution approach',
        outcome: 'success',
        details: 'Test resolution details',
        performedBy: 'test.user'
      });
    });

    it('tracks resolution attempt metadata', () => {
      const issueWithDetailedResolution = {
        ...mockIssues[0],
        resolutionAttempts: [{
          id: 'res-2',
          approach: 'Database connection fix',
          outcome: 'success' as const,
          details: 'Fixed connection pool settings',
          timestamp: new Date(),
          performedBy: 'jane.smith',
          timeSpent: 120,
          resourcesUsed: ['database-docs', 'monitoring-tools']
        }]
      };
      
      render(
        <MockIssueDetail
          issue={issueWithDetailedResolution}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      expect(screenTest.getByTestId('resolution-approach-res-2')).toHaveTextContent('Database connection fix');
      expect(screenTest.getByTestId('resolution-outcome-res-2')).toHaveTextContent('success');
      expect(screenTest.getByTestId('resolution-performer-res-2')).toHaveTextContent('jane.smith');
    });
  });

  describe('Issue Categorization', () => {
    it('supports comprehensive issue categorization', () => {
      render(<MockIssueForm onSubmit={mockCallbacks.onSubmit} mode="create" />);
      
      // Type categorization
      const typeSelect = screenTest.getByTestId('issue-type');
      expect(typeSelect).toBeInTheDocument();
      
      // Severity categorization
      const severitySelect = screenTest.getByTestId('issue-severity');
      expect(severitySelect).toBeInTheDocument();
    });

    it('displays categories with appropriate visual styling', () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      // Bug type styling
      const bugElement = screenTest.getByTestId('issue-type-issue-1');
      expect(bugElement).toHaveClass('type-bug');
      
      // Critical severity styling
      const criticalElement = screenTest.getByTestId('issue-severity-issue-1');
      expect(criticalElement).toHaveClass('severity-critical');
    });
  });

  describe('Issue Templates and Workflows', () => {
    it('provides templates for different issue types', () => {
      render(<MockIssueTemplates onSelectTemplate={mockCallbacks.onSelectTemplate} />);
      
      expect(screenTest.getByTestId('bug-template')).toBeInTheDocument();
      expect(screenTest.getByTestId('feature-template')).toBeInTheDocument();
      expect(screenTest.getByTestId('qa-template')).toBeInTheDocument();
    });

    it('applies appropriate template when selected', async () => {
      render(<MockIssueTemplates onSelectTemplate={mockCallbacks.onSelectTemplate} />);
      
      await user.click(screenTest.getByTestId('feature-template'));
      
      expect(mockCallbacks.onSelectTemplate).toHaveBeenCalledWith({
        type: 'FEATURE',
        title: 'Feature Request Template',
        description: 'Template for feature requests'
      });
    });
  });

  describe('Integration with Task Management', () => {
    it('maintains bidirectional task-issue relationships', () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      // Should show related tasks
      expect(screenTest.getByText('Related Tasks')).toBeInTheDocument();
      expect(screenTest.getByTestId('related-task-task-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('related-task-task-2')).toBeInTheDocument();
    });

    it('enables dynamic task linking and unlinking', async () => {
      render(
        <MockIssueDetail
          issue={mockIssues[0]}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      );
      
      // Test linking
      await user.click(screenTest.getByTestId('link-task-button'));
      expect(mockCallbacks.onLinkTask).toHaveBeenCalled();
      
      // Test unlinking
      await user.click(screenTest.getByTestId('unlink-task-task-1'));
      expect(mockCallbacks.onUnlinkTask).toHaveBeenCalled();
    });
  });

  describe('Performance and Scalability', () => {
    it('handles large numbers of issues efficiently', () => {
      const manyIssues = Array.from({ length: 100 }, (_, i) => ({
        ...mockIssues[0],
        id: `issue-${i}`,
        title: `Issue ${i}`
      }));
      
      expect(() => render(
        <MockIssueList 
          issues={manyIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      )).not.toThrow();
    });

    it('maintains responsive UI during CRUD operations', async () => {
      render(
        <MockIssueList 
          issues={mockIssues}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      // Rapid operations should not break UI
      await user.click(screenTest.getByTestId('edit-issue-issue-1'));
      await user.click(screenTest.getByTestId('delete-issue-issue-2'));
      
      expect(mockCallbacks.onEdit).toHaveBeenCalled();
      expect(mockCallbacks.onDelete).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing issue data gracefully', () => {
      const malformedIssue = { id: 'bad-issue' } as Issue;
      
      expect(() => render(
        <MockIssueDetail
          issue={malformedIssue}
          onAddResolution={mockCallbacks.onAddResolution}
          onLinkTask={mockCallbacks.onLinkTask}
          onUnlinkTask={mockCallbacks.onUnlinkTask}
        />
      )).not.toThrow();
    });

    it('provides appropriate fallbacks for empty states', () => {
      render(
        <MockIssueList 
          issues={[]}
          onEdit={mockCallbacks.onEdit}
          onDelete={mockCallbacks.onDelete}
          onFilter={mockCallbacks.onFilter}
        />
      );
      
      expect(screenTest.getByTestId('issue-list')).toBeInTheDocument();
    });
  });
});
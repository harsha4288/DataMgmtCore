/**
 * TreeNode Component Unit Tests
 * Testing critical navigation functionality for Phase 5.8.3.1
 */

import React from 'react';
import { render, screen as testingScreen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreeNode } from '../TreeNode';
import type { ProjectEntity } from '../ExpandableProjectTree';

// Mock ProjectEntity for testing
const mockEntity: ProjectEntity = {
  id: 'task-1',
  type: 'task',
  title: 'Test Task',
  description: 'Test task description',
  status: 'in_progress',
  progress: 30,
  priority: 'high',
  documentsCount: 2,
  issuesCount: 1,
  reviewsCount: 0,
  commentsCount: 3,
  documents: [],
  issues: [],
  reviews: [],
  comments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  assignee: 'Test User',
  dueDate: new Date(Date.now() + 86400000), // Tomorrow
  children: [
    {
      id: 'subtask-1',
      type: 'subtask',
      title: 'Test Subtask',
      description: 'Test subtask description',
      status: 'pending',
      progress: 0,
      priority: 'medium',
      documentsCount: 0,
      issuesCount: 0,
      reviewsCount: 0,
      commentsCount: 0,
      documents: [],
      issues: [],
      reviews: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]
};

const mockProps = {
  entity: mockEntity,
  level: 0,
  isExpanded: false,
  isSelected: false,
  onToggleExpansion: vi.fn(),
  onEntitySelect: vi.fn(),
  onEntityUpdate: vi.fn(),
  expansionState: {},
  breadcrumbPath: []
};

describe('TreeNode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tree node with correct title and status', () => {
    render(<TreeNode {...mockProps} />);
    
    expect(testingScreen.getByText('Test Task')).toBeInTheDocument();
    expect(testingScreen.getByText('→')).toBeInTheDocument(); // in_progress status symbol
    expect(testingScreen.getByText('[30%]')).toBeInTheDocument();
  });

  it('shows expansion button when node has children', () => {
    render(<TreeNode {...mockProps} />);
    
    const expandButton = testingScreen.getByRole('button');
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveTextContent('▶'); // Collapsed state
  });

  it('calls onToggleExpansion when expansion button is clicked', () => {
    render(<TreeNode {...mockProps} />);
    
    const expandButton = testingScreen.getByRole('button');
    fireEvent.click(expandButton);
    
    expect(mockProps.onToggleExpansion).toHaveBeenCalledWith('task-1');
  });

  it('renders expanded children when isExpanded is true', () => {
    render(<TreeNode {...mockProps} isExpanded={true} />);
    
    expect(testingScreen.getByText('Test Subtask')).toBeInTheDocument();
  });

  it('shows detail panel when node is clicked', () => {
    render(<TreeNode {...mockProps} />);
    
    const nodeElement = testingScreen.getByText('Test Task').closest('div');
    fireEvent.click(nodeElement!);
    
    expect(mockProps.onEntitySelect).toHaveBeenCalledWith(mockEntity);
  });

  it('renders breadcrumb when breadcrumbPath is provided', () => {
    const breadcrumbPath = [
      { ...mockEntity, id: 'parent-1', title: 'Parent Task' }
    ];
    
    render(<TreeNode {...mockProps} breadcrumbPath={breadcrumbPath} isExpanded={false} />);
    
    // Click to show detail panel first
    const nodeElement = testingScreen.getByText('Test Task').closest('div');
    fireEvent.click(nodeElement!);
    
    // Check if breadcrumb is rendered (it should show in detail panel)
    expect(testingScreen.getByText('Parent Task')).toBeInTheDocument();
    expect(testingScreen.getByText('Test Task')).toBeInTheDocument();
  });

  it('displays correct status symbols', () => {
    const completedEntity = { ...mockEntity, status: 'completed' as const };
    render(<TreeNode {...mockProps} entity={completedEntity} />);
    expect(testingScreen.getByText('✓')).toBeInTheDocument();

    const pendingEntity = { ...mockEntity, status: 'pending' as const };
    render(<TreeNode {...mockProps} entity={pendingEntity} />);
    expect(testingScreen.getByText('○')).toBeInTheDocument();
  });

  it('shows assignee and due date when available', () => {
    render(<TreeNode {...mockProps} />);
    
    expect(testingScreen.getByText(/Test User/)).toBeInTheDocument();
    expect(testingScreen.getByText(/Due:/)).toBeInTheDocument();
  });

  it('handles node without children correctly', () => {
    const nodeWithoutChildren = { ...mockEntity, children: undefined };
    render(<TreeNode {...mockProps} entity={nodeWithoutChildren} />);
    
    // Should not show expansion button
    const buttons = testingScreen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  it('applies correct indentation based on level', () => {
    render(<TreeNode {...mockProps} level={2} />);
    
    const nodeElement = testingScreen.getByText('Test Task').closest('div')?.parentElement;
    expect(nodeElement).toHaveStyle({ paddingLeft: '40px' }); // 2 * 16px + 8px
  });

  it('shows selected state styling when isSelected is true', () => {
    render(<TreeNode {...mockProps} isSelected={true} />);
    
    const nodeElement = testingScreen.getByText('Test Task').closest('div');
    expect(nodeElement).toHaveClass('bg-muted');
  });

  it('renders contextual actions when entity has resources', () => {
    render(<TreeNode {...mockProps} />);
    
    // Click to show detail panel
    const nodeElement = testingScreen.getByText('Test Task').closest('div');
    fireEvent.click(nodeElement!);
    
    // Should show document and issue buttons
    expect(testingScreen.getByText('Documents (2)')).toBeInTheDocument();
    expect(testingScreen.getByText('Issues (1)')).toBeInTheDocument();
  });
});
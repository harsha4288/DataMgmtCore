/**
 * InlineIssueManager Component Unit Tests
 * Testing issue management functionality for Phase 1.2
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InlineIssueManager } from '../InlineIssueManager';

const mockProps = {
  entityId: 'task-1',
  entityType: 'task' as const,
};

describe('InlineIssueManager', () => {
  it('renders issue manager with correct title and count', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    expect(screen.getByText(/Issues \(2\)/)).toBeInTheDocument();
    expect(screen.getByTestId('inline-issue-manager')).toBeInTheDocument();
  });

  it('shows New Issue button (not Create Document)', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    // Should show "New Issue" button
    expect(screen.getByTestId('create-issue-button')).toBeInTheDocument();
    expect(screen.getByText('New Issue')).toBeInTheDocument();
    
    // Should NOT show "Create Document" button
    expect(screen.queryByText('Create Document')).not.toBeInTheDocument();
  });

  it('displays mock issues with correct information', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    expect(screen.getByText('Navigation component not responding')).toBeInTheDocument();
    expect(screen.getByText('Performance optimization needed')).toBeInTheDocument();
  });

  it('shows status and priority badges', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('open')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('filters issues by status', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    // Open filter dropdown
    const filterTrigger = screen.getByRole('combobox');
    fireEvent.click(filterTrigger);
    
    // Select "Open" filter
    const openOption = screen.getByText('Open');
    fireEvent.click(openOption);
    
    // Should only show open issues
    expect(screen.getByText('Navigation component not responding')).toBeInTheDocument();
    expect(screen.queryByText('Performance optimization needed')).not.toBeInTheDocument();
  });

  it('displays assignee information', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
  });

  it('shows issue descriptions', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    expect(screen.getByText(/The navigation component fails to respond/)).toBeInTheDocument();
    expect(screen.getByText(/Page load time exceeds acceptable thresholds/)).toBeInTheDocument();
  });

  it('displays last updated dates', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    // Check for date displays (dates will be formatted)
    const dateElements = screen.getAllByText(new RegExp(new Date().toLocaleDateString()));
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('shows Create First Issue button when no issues match filter', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    // Filter to show only resolved issues (none exist)
    const filterTrigger = screen.getByRole('combobox');
    fireEvent.click(filterTrigger);
    
    const resolvedOption = screen.getByText('Resolved');
    fireEvent.click(resolvedOption);
    
    // Should show empty state
    expect(screen.getByText('No issues found')).toBeInTheDocument();
    expect(screen.getByText('Create First Issue')).toBeInTheDocument();
  });

  it('handles different entity types', () => {
    render(<InlineIssueManager {...mockProps} entityType="phase" />);
    
    // Component should render without errors
    expect(screen.getByTestId('inline-issue-manager')).toBeInTheDocument();
  });

  it('applies correct priority colors', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    // High priority should have destructive variant
    const highPriorityBadge = screen.getByText('high');
    expect(highPriorityBadge.closest('.badge')).toHaveClass('badge--destructive');
    
    // Medium priority should have secondary variant
    const mediumPriorityBadge = screen.getByText('medium');
    expect(mediumPriorityBadge.closest('.badge')).toHaveClass('badge--secondary');
  });

  it('applies correct status colors', () => {
    render(<InlineIssueManager {...mockProps} />);
    
    // Open status should have destructive variant
    const openStatusBadge = screen.getByText('open');
    expect(openStatusBadge.closest('.badge')).toHaveClass('badge--destructive');
    
    // In progress status should have default variant
    const inProgressBadge = screen.getByText('in progress');
    expect(inProgressBadge.closest('.badge')).toHaveClass('badge--default');
  });
});
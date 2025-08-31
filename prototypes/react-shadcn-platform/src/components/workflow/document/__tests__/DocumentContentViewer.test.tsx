/**
 * DocumentContentViewer Component Unit Tests
 * Testing document viewing functionality for Phase 2.1
 */

import React from 'react';
import { render, screen as testingScreen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DocumentContentViewer } from '../DocumentContentViewer';

const mockProps = {
  entityId: 'task-1',
  entityType: 'task' as const,
  onEdit: vi.fn(),
  onDownload: vi.fn(),
};

describe('DocumentContentViewer', () => {
  it('renders document content viewer with title', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    expect(testingScreen.getByText('Document Content')).toBeInTheDocument();
    expect(testingScreen.getByTestId('document-content-viewer')).toBeInTheDocument();
  });

  it('renders mock document when documents are available', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    expect(testingScreen.getByText('task Documentation')).toBeInTheDocument();
  });

  it('shows document selection and content', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    // Click on document to select it
    const documentItem = testingScreen.getByText('task Documentation');
    fireEvent.click(documentItem.closest('div')!);
    
    // Check if content is displayed
    expect(testingScreen.getByText('Task Overview')).toBeInTheDocument();
    expect(testingScreen.getByText('Edit')).toBeInTheDocument();
    expect(testingScreen.getByText('Export')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    // Select document first
    const documentItem = testingScreen.getByText('task Documentation');
    fireEvent.click(documentItem.closest('div')!);
    
    // Click edit button
    const editButton = testingScreen.getByText('Edit');
    fireEvent.click(editButton);
    
    expect(mockProps.onEdit).toHaveBeenCalledWith(expect.stringContaining('doc-task-1-1'));
  });

  it('calls onDownload when export button is clicked', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    // Select document first
    const documentItem = testingScreen.getByText('task Documentation');
    fireEvent.click(documentItem.closest('div')!);
    
    // Click export button
    const exportButton = testingScreen.getByText('Export');
    fireEvent.click(exportButton);
    
    expect(mockProps.onDownload).toHaveBeenCalledWith(expect.stringContaining('doc-task-1-1'));
  });

  it('renders status badge correctly', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    expect(testingScreen.getByText('draft')).toBeInTheDocument();
  });

  it('displays author and last modified date', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    expect(testingScreen.getByText('Development Team')).toBeInTheDocument();
    expect(testingScreen.getByText(new Date().toLocaleDateString())).toBeInTheDocument();
  });

  it('renders markdown content correctly', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    // Select document first
    const documentItem = testingScreen.getByText('task Documentation');
    fireEvent.click(documentItem.closest('div')!);
    
    // Check markdown rendering
    expect(testingScreen.getByText('Task Overview')).toBeInTheDocument();
    expect(testingScreen.getByText('Objective')).toBeInTheDocument();
    expect(testingScreen.getByText('Implementation Details')).toBeInTheDocument();
  });

  it('shows entity information in footer', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    // Select document first
    const documentItem = testingScreen.getByText('task Documentation');
    fireEvent.click(documentItem.closest('div')!);
    
    expect(testingScreen.getByText('Entity: task (task-1)')).toBeInTheDocument();
    expect(testingScreen.getByText('Status: draft')).toBeInTheDocument();
  });

  it('handles different entity types', () => {
    render(<DocumentContentViewer {...mockProps} entityType="phase" />);
    
    expect(testingScreen.getByText('phase Documentation')).toBeInTheDocument();
  });

  it('shows correct document structure with scrollable content', () => {
    render(<DocumentContentViewer {...mockProps} />);
    
    // Select document first
    const documentItem = testingScreen.getByText('task Documentation');
    fireEvent.click(documentItem.closest('div')!);
    
    // Check if ScrollArea is present
    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    expect(scrollArea).toBeInTheDocument();
  });
});
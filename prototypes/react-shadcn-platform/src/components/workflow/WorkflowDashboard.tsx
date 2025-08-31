/**
 * Unified Workflow Dashboard - Phase 5.8.3.1
 * PRIMARY Navigation Hub using Tree Architecture
 * 
 * Key Navigation Principles:
 * - Tree IS the navigation: Single source of truth for project structure
 * - Progressive disclosure: Context reveals details on demand
 * - No external tabs/navigation needed within workflow context
 * - Contextual actions available inline within tree nodes
 * - Theme-aware design leveraging shadcn/ui components
 * 
 * This dashboard is designed to be self-contained and replace
 * traditional tab-based navigation with tree-based hierarchy
 */

import React from 'react';
import { VSCodeLayout } from './workspace/VSCodeLayout';
import { TreeDataProvider } from './workspace/TreeDataProvider';

// Mock project data - will be replaced with GraphQL
const mockProjectData = {
  id: 'sgs-root',
  type: 'project' as const,
  title: 'SGS Data Management Core',
  status: 'in_progress' as const,
  progress: 55,
  priority: 'high' as const,
  documentsCount: 24,
  issuesCount: 8,
  reviewsCount: 12,
  commentsCount: 45,
  documents: [],
  issues: [],
  reviews: [],
  comments: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  children: [
    {
      id: 'phase-5',
      type: 'phase' as const,
      title: 'Phase 5: Universal Project Management',
      status: 'in_progress' as const,
      progress: 70,
      priority: 'high' as const,
      documentsCount: 18,
      issuesCount: 5,
      reviewsCount: 8,
      commentsCount: 32,
      documents: [],
      issues: [],
      reviews: [],
      comments: [],
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date(),
      children: [
        {
          id: 'task-5.8.1',
          type: 'task' as const,
          title: 'Task 5.8.1: Foundation Infrastructure',
          status: 'completed' as const,
          progress: 100,
          priority: 'high' as const,
          documentsCount: 6,
          issuesCount: 0,
          reviewsCount: 3,
          commentsCount: 12,
          documents: [],
          issues: [],
          reviews: [],
          comments: [],
          createdAt: new Date('2024-11-01'),
          updatedAt: new Date('2024-11-15'),
        },
        {
          id: 'task-5.8.3',
          type: 'task' as const,
          title: 'Task 5.8.3: Advanced Dashboard',
          status: 'in_progress' as const,
          progress: 30,
          priority: 'critical' as const,
          assignee: 'Development Team',
          dueDate: new Date('2024-12-31'),
          documentsCount: 8,
          issuesCount: 3,
          reviewsCount: 4,
          commentsCount: 15,
          documents: [],
          issues: [],
          reviews: [],
          comments: [],
          createdAt: new Date('2024-11-20'),
          updatedAt: new Date(),
          children: [
            {
              id: 'subtask-5.8.3.1',
              type: 'subtask' as const,
              title: 'Subtask 5.8.3.1: Navigation Redesign',
              status: 'in_progress' as const,
              progress: 40,
              priority: 'critical' as const,
              assignee: 'Development Team',
              documentsCount: 4,
              issuesCount: 2,
              reviewsCount: 1,
              commentsCount: 8,
              documents: [],
              issues: [],
              reviews: [],
              comments: [],
              createdAt: new Date('2024-12-01'),
              updatedAt: new Date(),
            },
            {
              id: 'subtask-5.8.3.2',
              type: 'subtask' as const,
              title: 'Subtask 5.8.3.2: Status Management',
              status: 'pending' as const,
              progress: 0,
              priority: 'high' as const,
              documentsCount: 2,
              issuesCount: 1,
              reviewsCount: 0,
              commentsCount: 3,
              documents: [],
              issues: [],
              reviews: [],
              comments: [],
              createdAt: new Date('2024-12-01'),
              updatedAt: new Date(),
            },
          ],
        },
        {
          id: 'task-5.8.4',
          type: 'task' as const,
          title: 'Task 5.8.4: Entity Interconnection',
          status: 'pending' as const,
          progress: 0,
          priority: 'medium' as const,
          documentsCount: 4,
          issuesCount: 2,
          reviewsCount: 1,
          commentsCount: 5,
          documents: [],
          issues: [],
          reviews: [],
          comments: [],
          createdAt: new Date('2024-11-20'),
          updatedAt: new Date(),
        },
      ],
    },
    {
      id: 'phase-6',
      type: 'phase' as const,
      title: 'Phase 6: Production Deployment',
      status: 'pending' as const,
      progress: 0,
      priority: 'medium' as const,
      documentsCount: 6,
      issuesCount: 3,
      reviewsCount: 4,
      commentsCount: 13,
      documents: [],
      issues: [],
      reviews: [],
      comments: [],
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date(),
    },
  ],
};

const WorkflowDashboard: React.FC = () => {

  return (
    <TreeDataProvider initialData={mockProjectData}>
      {/* VS Code-style 3-panel layout interface */}
      <div className="h-screen bg-background">
        <VSCodeLayout 
          entities={[mockProjectData]}
          className="h-full"
        />
      </div>
    </TreeDataProvider>
  );
};

export default WorkflowDashboard;
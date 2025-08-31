/**
 * Main Content Area - Dynamic content rendering based on navigation
 * Keeps routing logic under 100 lines per standards
 */

import React from 'react';
import { WorkspaceView, SelectedTask } from './UnifiedWorkspace';
import { TaskDetailView } from '../task/TaskDetailView';
import { ExpandableProjectTree, ProjectEntity } from './ExpandableProjectTree';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

// Import view components (to be created)
// import { TaskListView } from './views/TaskListView';
// import { IssuesView } from './views/IssuesView';
// import { DocumentationView } from './views/DocumentationView';
// import { QualityView } from './views/QualityView';
// import { ReportsView } from './views/ReportsView';

interface MainContentAreaProps {
  currentView: WorkspaceView;
  selectedTask: SelectedTask | null;
  onTaskSelect: (_task: SelectedTask) => void;
  onPanelToggle: (_content: 'status' | 'issue' | 'document' | 'collaboration') => void;
}

// Mock project data for the expandable tree
const mockProjectData: ProjectEntity = {
  id: 'sgsdatamgmtcore-prototype',
  type: 'phase',
  title: 'SGS Data Management Core - React Platform',
  description: 'Modern unified interface replacing fragmented tab system',
  status: 'in_progress',
  progress: 75,
  priority: 'high',
  assignee: 'Development Team',
  dueDate: new Date('2024-12-31'),
  documentsCount: 12,
  issuesCount: 4,
  reviewsCount: 3,
  commentsCount: 8,
  documents: [
    { id: 'doc1', name: 'Architecture.md', type: 'markdown', lastModified: new Date(), size: 1024 },
    { id: 'doc2', name: 'API_Spec.json', type: 'json', lastModified: new Date(), size: 2048 }
  ],
  issues: [
    { id: 'issue1', title: 'Avatar rendering', type: 'bug', severity: 'medium', status: 'resolved', resolutionAttempts: 2 }
  ],
  reviews: [
    { id: 'review1', type: 'approval', status: 'approved', reviewer: 'Team Lead', createdAt: new Date() }
  ],
  comments: [
    { id: 'comment1', author: 'Developer', content: 'Phase 5.8.3 in progress', createdAt: new Date(), replies: 0 }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  recentActivity: 'Navigation flow architecture redesign',
  lastActivityAt: new Date(),
  children: [
    {
      id: 'phase-5',
      type: 'phase',
      title: 'Phase 5: Advanced Workflow & UI Enhancement',
      description: 'Enhanced workflow management with modern UI components',
      status: 'in_progress',
      progress: 80,
      priority: 'high',
      documentsCount: 8,
      issuesCount: 2,
      reviewsCount: 1,
      commentsCount: 5,
      documents: [],
      issues: [],
      reviews: [],
      comments: [],
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date(),
      children: [
        {
          id: 'task-5-8-3-1',
          type: 'task',
          title: 'Task 5.8.3.1: Navigation Flow Architecture Redesign',
          description: 'Replace fragmented tab system with unified workspace',
          status: 'in_progress',
          progress: 85,
          priority: 'high',
          assignee: 'You',
          dueDate: new Date('2024-12-20'),
          documentsCount: 3,
          issuesCount: 1,
          reviewsCount: 0,
          commentsCount: 2,
          documents: [],
          issues: [],
          reviews: [],
          comments: [],
          createdAt: new Date('2024-12-15'),
          updatedAt: new Date(),
          recentActivity: 'Implementing expandable tree structure',
          children: [
            {
              id: 'subtask-tree-impl',
              type: 'subtask',
              title: 'Implement Master Expandable Project Tree',
              description: 'Create hierarchical tree interface for project navigation',
              status: 'in_progress',
              progress: 90,
              priority: 'high',
              documentsCount: 2,
              issuesCount: 0,
              reviewsCount: 0,
              commentsCount: 1,
              documents: [],
              issues: [],
              reviews: [],
              comments: [],
              createdAt: new Date('2024-12-16'),
              updatedAt: new Date(),
              children: [
                {
                  id: 'sub-subtask-components',
                  type: 'sub-subtask',
                  title: 'Create Tree Node Components',
                  status: 'completed',
                  progress: 100,
                  priority: 'medium',
                  documentsCount: 1,
                  issuesCount: 0,
                  reviewsCount: 1,
                  commentsCount: 0,
                  documents: [],
                  issues: [],
                  reviews: [],
                  comments: [],
                  createdAt: new Date('2024-12-16'),
                  updatedAt: new Date()
                },
                {
                  id: 'sub-subtask-integration',
                  type: 'sub-subtask',
                  title: 'Integrate Tree with Workspace',
                  status: 'in_progress',
                  progress: 75,
                  priority: 'high',
                  documentsCount: 0,
                  issuesCount: 0,
                  reviewsCount: 0,
                  commentsCount: 1,
                  documents: [],
                  issues: [],
                  reviews: [],
                  comments: [],
                  createdAt: new Date('2024-12-17'),
                  updatedAt: new Date()
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const MainContentArea: React.FC<MainContentAreaProps> = ({
  currentView,
  selectedTask,
  onTaskSelect,
  onPanelToggle
}) => {
  // If a task is selected, show task detail view
  if (selectedTask) {
    return (
      <TaskDetailView
        task={selectedTask}
        onPanelToggle={onPanelToggle}
        onBackToList={() => onTaskSelect(null as any)}
      />
    );
  }

  // Render different views based on navigation selection
  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="h-full">
            <ExpandableProjectTree
              projectData={mockProjectData}
              onEntitySelect={(entity) => {
                // Convert ProjectEntity to SelectedTask for compatibility
                onTaskSelect({
                  id: entity.id,
                  title: entity.title,
                  status: entity.status,
                  assignee: entity.assignee,
                  priority: entity.priority,
                  labels: [entity.type]
                });
              }}
              onEntityUpdate={(entityId, updates) => {
                console.log('Entity update:', entityId, updates);
              }}
            />
          </div>
        );
      
      case 'my-tasks':
      case 'all-tasks':
        const mockTasks = [
          {
            id: '1',
            title: 'Navigation Flow Architecture Redesign',
            status: 'in_progress',
            priority: 'high',
            assignee: 'You',
            labels: ['frontend', 'ux']
          },
          {
            id: '2', 
            title: 'Avatar Component Text Rendering Fix',
            status: 'completed',
            priority: 'medium',
            assignee: 'You',
            labels: ['ui', 'bug-fix']
          },
          {
            id: '3',
            title: 'GraphQL API Integration Testing',
            status: 'pending',
            priority: 'high',
            assignee: currentView === 'my-tasks' ? 'You' : 'Team Member',
            labels: ['backend', 'api']
          }
        ];

        const filteredTasks = currentView === 'my-tasks' 
          ? mockTasks.filter(task => task.assignee === 'You')
          : mockTasks;

        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {currentView === 'my-tasks' ? 'My Tasks' : 'All Tasks'}
                </h1>
                <p className="text-muted-foreground">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} total
                </p>
              </div>
              <Button onClick={() => onPanelToggle('status')}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-card border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onTaskSelect({
                    id: task.id,
                    title: task.title,
                    status: task.status,
                    assignee: task.assignee,
                    priority: task.priority,
                    labels: task.labels
                  })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm mb-2">{task.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={
                            task.status === 'completed' ? 'default' :
                            task.status === 'in_progress' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                        {task.labels?.map(label => (
                          <Badge key={label} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {task.assignee}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'issues':
        const mockIssues = [
          {
            id: '1',
            title: 'Avatar component not rendering text properly',
            status: 'resolved',
            severity: 'medium',
            reportedBy: 'Test Suite'
          },
          {
            id: '2', 
            title: 'Undefined property access in TaskStatusPanel',
            status: 'resolved',
            severity: 'high',
            reportedBy: 'Runtime Error'
          },
          {
            id: '3',
            title: 'Missing component implementations causing test failures',
            status: 'open',
            severity: 'high',
            reportedBy: 'CI/CD Pipeline'
          },
          {
            id: '4',
            title: 'Tab navigation breaks user workflow',
            status: 'in_progress',
            severity: 'medium',
            reportedBy: 'UX Review'
          }
        ];

        return (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Issues</h1>
                <p className="text-muted-foreground">
                  {mockIssues.length} issues tracked
                </p>
              </div>
              <Button onClick={() => onPanelToggle('issue')}>
                <Plus className="h-4 w-4 mr-2" />
                New Issue
              </Button>
            </div>

            {/* Issue List */}
            <div className="space-y-3">
              {mockIssues.map((issue) => (
                <div key={issue.id} className="bg-card border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-sm">{issue.title}</h3>
                    <Badge 
                      variant={
                        issue.status === 'resolved' ? 'default' :
                        issue.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={issue.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {issue.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Reported by {issue.reportedBy}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'documentation':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Documentation</h1>
            <div className="text-muted-foreground">
              Documentation view implementation pending
            </div>
          </div>
        );
      
      case 'quality':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Quality Control</h1>
            <div className="text-muted-foreground">
              Quality view implementation pending
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Reports</h1>
            <div className="text-muted-foreground">
              Reports view implementation pending
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Welcome</h1>
            <div className="text-muted-foreground">
              Select a navigation item to begin
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full bg-background">
      {renderView()}
    </div>
  );
};
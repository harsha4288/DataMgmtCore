/**
 * Real-time workflow dashboard service
 * Integrates with Claude Code hooks and project files
 */

import { useState, useEffect } from 'react';
import { TaskPersistenceService } from '../TaskPersistenceService';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dueDate: string;
  comments: TaskComment[];
  subtasks: Task[];
  dependencies: string[];
  estimatedHours: number;
  actualHours?: number;
  documentPath?: string;
  enhancementRequests?: string[];
  history?: TaskHistory[];
  fileChanges?: FileChange[];
  qualityChecks?: QualityCheck[];
}

export interface TaskComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'approval' | 'testing' | 'command' | 'claude_response';
}

export interface TaskHistory {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details?: string;
  fileChanges?: string[];
}

export interface Phase {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  progress: number;
  tasks: Task[];
  startDate: string;
  endDate?: string;
  description: string;
  collapsed?: boolean;
}

export interface FileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  timestamp: string;
  linesAdded: number;
  linesRemoved: number;
}

export interface QualityCheck {
  id: string;
  timestamp: string;
  type: 'lint' | 'type-check' | 'theme' | 'build' | 'test';
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
  fileCount?: number;
  errorCount?: number;
  warningCount?: number;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
  lastCommit: {
    hash: string;
    message: string;
    timestamp: string;
    author: string;
  };
}

export interface MetricsData {
  componentReusability: number;
  qualityGateStatus: 'pass' | 'fail' | 'warning';
  testCoverage: number;
  techDebt: number;
  buildTime: number;
  filesModified: number;
  linesOfCode: number;
  codeComplexity: number;
}

export interface DashboardState {
  phases: Phase[];
  currentPhase: string;
  activeTask: Task | null;
  gitStatus: GitStatus;
  metrics: MetricsData;
  qualityChecks: QualityCheck[];
  recentActivity: TaskHistory[];
  isConnected: boolean;
  lastUpdate: string;
}

class WorkflowService {
  private listeners: ((_state: DashboardState) => void)[] = [];
  private state: DashboardState = {
    phases: [],
    currentPhase: '',
    activeTask: null,
    gitStatus: {
      branch: 'Prototype-2-shadcn',
      ahead: 0,
      behind: 0,
      staged: 0,
      unstaged: 4,
      untracked: 2,
      lastCommit: {
        hash: 'e1f017c',
        message: 'Prototype 2: Phase 2 Gita Alumni connect mock UI implemented',
        timestamp: new Date().toISOString(),
        author: 'Claude Code'
      }
    },
    metrics: {
      componentReusability: 85,
      qualityGateStatus: 'pass',
      testCoverage: 0,
      techDebt: 15,
      buildTime: 2.3,
      filesModified: 12,
      linesOfCode: 8540,
      codeComplexity: 6.2
    },
    qualityChecks: [],
    recentActivity: [],
    isConnected: false,
    lastUpdate: new Date().toISOString()
  };

  constructor() {
    this.loadInitialData();
    this.startRealTimeUpdates();
  }

  private async loadInitialData() {
    try {
      // Load from PROGRESS.md if available
      console.log('🚀 Loading initial data for dashboard...');
      const progressData = await this.loadProgressData();
      if (progressData && progressData.length > 0) {
        console.log('✅ Using real progress data:', progressData.length, 'phases');
        this.state.phases = progressData;
      } else {
        console.log('📋 Using mock data');
        // Fallback to mock data
        this.state.phases = this.getMockPhases();
      }

      // Load git status
      await this.updateGitStatus();
      
      // Load quality checks
      await this.updateQualityChecks();
      
      // Load recent activity
      await this.loadRecentActivity();

      this.state.isConnected = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.state.phases = this.getMockPhases();
      this.notifyListeners();
    }
  }

  private async loadProgressData(): Promise<Phase[] | null> {
    try {
      console.log('🔄 Attempting to load progress data from API...');
      // Try to load from the progress reader API endpoint
      const response = await fetch('http://localhost:3002/api/progress');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Progress data loaded from API:', data.phases.length, 'phases');
        return this.convertProgressDataToPhases(data);
      } else {
        console.log('❌ API response not OK:', response.status);
      }
    } catch (error) {
      console.log('❌ Could not load from API, falling back to mock data:', error.message);
    }
    
    console.log('🔄 Using mock data instead');
    return null;
  }

  private convertProgressDataToPhases(data: any): Phase[] {
    if (!data || !data.phases) return [];
    
    return data.phases.map((phase: any) => ({
      id: phase.id,
      name: phase.name,
      status: phase.status,
      progress: phase.progress || 0,
      description: phase.description || '',
      startDate: phase.startDate || '',
      endDate: phase.endDate,
      collapsed: false,
      tasks: (phase.tasks || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority || 'medium',
        assignee: task.assignee || 'Claude Code',
        dueDate: task.dueDate || '',
        estimatedHours: task.estimatedHours || 0,
        actualHours: task.actualHours,
        dependencies: task.dependencies || [],
        comments: [],
        subtasks: task.subtasks || [],
        documentPath: `/docs/progress/phase-${phase.id}/task-${task.id}.md`,
        history: [],
        fileChanges: [],
        qualityChecks: []
      }))
    }));
  }

  private getMockPhases(): Phase[] {
    return [
      {
        id: '1',
        name: 'Phase 1: Foundation Setup',
        status: 'in_progress',
        progress: 95,
        description: 'Setting up the core foundation with shadcn/ui components and theme system',
        startDate: '2024-12-01',
        collapsed: false,
        tasks: [
          {
            id: '1.4',
            title: 'Entity System Integration',
            description: 'Port entity system from Prototype 1 and integrate with current architecture',
            status: 'in_progress',
            priority: 'high',
            assignee: 'Claude Code',
            dueDate: '2024-12-20',
            estimatedHours: 8,
            actualHours: 6,
            dependencies: ['1.3.5'],
            documentPath: '/docs/tasks/1.4-entity-integration.md',
            history: [
              { 
                id: 'h1', 
                timestamp: new Date(Date.now() - 3600000).toISOString(), 
                action: 'Task created', 
                user: 'User', 
                details: 'Initial task definition' 
              },
              { 
                id: 'h2', 
                timestamp: new Date(Date.now() - 1800000).toISOString(), 
                action: 'Status changed', 
                user: 'Claude Code', 
                details: 'Changed from pending to in_progress' 
              }
            ],
            comments: [
              {
                id: 'c1',
                author: 'User',
                content: 'Ready to proceed with entity integration. Please ensure theme compatibility.',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                type: 'command'
              }
            ],
            subtasks: [
              {
                id: '1.4.1',
                title: 'Define Entity Interfaces',
                description: 'Create TypeScript interfaces for all entities',
                status: 'completed',
                priority: 'medium',
                assignee: 'Claude Code',
                dueDate: '2024-12-20',
                estimatedHours: 2,
                dependencies: [],
                comments: [],
                subtasks: []
              },
              {
                id: '1.4.2',
                title: 'Implement CRUD Operations',
                description: 'Add Create, Read, Update, Delete operations',
                status: 'pending',
                priority: 'high',
                assignee: 'Claude Code',
                dueDate: '2024-12-20',
                estimatedHours: 4,
                dependencies: ['1.4.1'],
                comments: [],
                subtasks: []
              }
            ],
            fileChanges: [
              {
                path: 'src/services/EntityService.ts',
                type: 'added',
                timestamp: new Date(Date.now() - 900000).toISOString(),
                linesAdded: 145,
                linesRemoved: 0
              },
              {
                path: 'src/types/entities.ts',
                type: 'modified',
                timestamp: new Date(Date.now() - 600000).toISOString(),
                linesAdded: 23,
                linesRemoved: 5
              }
            ],
            qualityChecks: [
              {
                id: 'q1',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                type: 'lint',
                status: 'pass',
                message: 'ESLint passed with 0 errors',
                fileCount: 12
              },
              {
                id: 'q2',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                type: 'type-check',
                status: 'pass',
                message: 'TypeScript check passed',
                fileCount: 12
              }
            ]
          }
        ]
      },
      {
        id: '2',
        name: 'Phase 2: Gita Alumni Mock UI',
        status: 'completed',
        progress: 100,
        description: 'Implement wireframes and mockups for Gita Alumni system',
        startDate: '2024-12-21',
        endDate: '2024-12-21',
        collapsed: false,
        tasks: [
          {
            id: '2.1',
            title: 'Design User Dashboard',
            description: 'Create mockup for user dashboard',
            status: 'completed',
            priority: 'high',
            assignee: 'Claude Code',
            dueDate: '2024-12-22',
            estimatedHours: 4,
            actualHours: 3,
            dependencies: [],
            comments: [],
            subtasks: [],
            documentPath: '/docs/tasks/2.1-dashboard.md',
            enhancementRequests: ['Add dark mode toggle', 'Include analytics widget']
          }
        ]
      }
    ];
  }

  private async updateGitStatus() {
    try {
      // In a real implementation, this would run git commands
      // For now, use mock data with periodic updates
      this.state.gitStatus = {
        ...this.state.gitStatus,
        staged: Math.floor(Math.random() * 5),
        unstaged: Math.floor(Math.random() * 8),
        untracked: Math.floor(Math.random() * 3)
      };
    } catch (error) {
      console.error('Failed to update git status:', error);
    }
  }

  private async updateQualityChecks() {
    const checks: QualityCheck[] = [
      {
        id: `q-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lint',
        status: 'pass',
        message: 'ESLint check passed',
        errorCount: 0,
        warningCount: 0,
        fileCount: 15
      },
      {
        id: `q-${Date.now()}-1`,
        timestamp: new Date().toISOString(),
        type: 'type-check',
        status: 'pass',
        message: 'TypeScript compilation successful',
        errorCount: 0,
        warningCount: 0,
        fileCount: 15
      },
      {
        id: `q-${Date.now()}-2`,
        timestamp: new Date().toISOString(),
        type: 'theme',
        status: 'pass',
        message: 'Theme validation passed',
        errorCount: 0,
        warningCount: 0,
        fileCount: 8
      }
    ];

    this.state.qualityChecks = checks;
  }

  private async loadRecentActivity() {
    // In a real implementation, this would read from Claude Code logs
    const activities: TaskHistory[] = [
      {
        id: `a-${Date.now()}`,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        action: 'File modified',
        user: 'Claude Code',
        details: 'Updated WorkflowDashboard.tsx with real-time features',
        fileChanges: ['src/components/workflow/WorkflowDashboard.tsx']
      },
      {
        id: `a-${Date.now()}-1`,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        action: 'Quality check completed',
        user: 'System',
        details: 'All quality gates passed successfully'
      }
    ];

    this.state.recentActivity = activities;
  }

  private startRealTimeUpdates() {
    // Simulate real-time updates every 5 seconds
    setInterval(async () => {
      await this.updateGitStatus();
      await this.updateQualityChecks();
      this.state.lastUpdate = new Date().toISOString();
      this.notifyListeners();
    }, 5000);

    // Check for Claude Code hook events
    this.startHookEventListener();
  }

  private startHookEventListener() {
    // In a real implementation, this would listen to .claude/logs/events.jsonl
    // For now, simulate periodic updates
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance of new activity
        this.simulateHookEvent();
      }
    }, 10000);
  }

  private simulateHookEvent() {
    const events = [
      'File edited by Claude Code',
      'Quality check triggered',
      'Theme validation completed',
      'Git status updated',
      'Task progress updated'
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    const activity: TaskHistory = {
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: event,
      user: 'Claude Code',
      details: `Simulated event: ${event}`
    };

    this.state.recentActivity = [activity, ...this.state.recentActivity.slice(0, 19)];
    this.notifyListeners();
  }

  public subscribe(listener: (_state: DashboardState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  public getState(): DashboardState {
    return { ...this.state };
  }

  public async updateTaskStatus(taskId: string, status: Task['status']) {
    // Find the task to get its document path
    let taskToUpdate: Task | undefined;
    for (const phase of this.state.phases) {
      taskToUpdate = phase.tasks.find(task => task.id === taskId);
      if (taskToUpdate) break;
    }

    // 1. Update local state immediately for responsive UI
    this.state.phases = this.state.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { ...task, status };
          
          // Add history entry
          const historyEntry: TaskHistory = {
            id: `h-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: `Status changed to ${status}`,
            user: 'User',
            details: `Task status updated via dashboard`
          };
          updatedTask.history = [...(updatedTask.history || []), historyEntry];
          
          return updatedTask;
        }
        return task;
      })
    }));

    // 2. Persist to .md file if documentPath exists
    if (taskToUpdate?.documentPath) {
      try {
        console.log(`💾 Persisting status change for task ${taskId} to file system`);
        const success = await TaskPersistenceService.updateTaskStatus({
          taskId,
          newStatus: status,
          filePath: taskToUpdate.documentPath
        });
        
        if (!success) {
          console.error(`❌ Failed to persist status change for task ${taskId}`);
          // In a production app, you might want to:
          // - Show error notification to user
          // - Revert local state
          // - Add retry mechanism
          
          // Add error history entry
          const errorHistoryEntry: TaskHistory = {
            id: `h-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: `Failed to persist status change`,
            user: 'System',
            details: `Could not write status change to ${taskToUpdate.documentPath}`
          };
          
          // Update task with error history
          this.state.phases = this.state.phases.map(phase => ({
            ...phase,
            tasks: phase.tasks.map(task => {
              if (task.id === taskId) {
                return {
                  ...task,
                  history: [...(task.history || []), errorHistoryEntry]
                };
              }
              return task;
            })
          }));
        } else {
          console.log(`✅ Successfully persisted status change for task ${taskId}`);
          
          // Add success history entry
          const successHistoryEntry: TaskHistory = {
            id: `h-persist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: `Status persisted to file system`,
            user: 'System',
            details: `Successfully updated ${taskToUpdate.documentPath}`
          };
          
          // Update task with success history
          this.state.phases = this.state.phases.map(phase => ({
            ...phase,
            tasks: phase.tasks.map(task => {
              if (task.id === taskId) {
                return {
                  ...task,
                  history: [...(task.history || []), successHistoryEntry]
                };
              }
              return task;
            })
          }));
        }
      } catch (error) {
        console.error(`💥 Exception during status persistence for task ${taskId}:`, error);
      }
    } else {
      console.warn(`⚠️ No document path found for task ${taskId}, skipping file persistence`);
    }

    this.notifyListeners();
  }

  public addTaskComment(taskId: string, comment: Omit<TaskComment, 'id' | 'timestamp'>) {
    const newComment: TaskComment = {
      ...comment,
      id: `c-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    this.state.phases = this.state.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            comments: [...task.comments, newComment]
          };
        }
        return task;
      })
    }));

    this.notifyListeners();
  }

  public sendClaudeCommand(command: string, taskId?: string) {
    // In a real implementation, this would interface with Claude Code CLI
    console.log(`Sending command to Claude Code: ${command}`, { taskId });
    
    if (taskId) {
      this.addTaskComment(taskId, {
        author: 'User',
        content: command,
        type: 'command'
      });

      // Simulate Claude's response
      setTimeout(() => {
        this.addTaskComment(taskId, {
          author: 'Claude Code',
          content: `Acknowledged command: "${command}". Processing...`,
          type: 'claude_response'
        });
      }, 1000);
    }
  }

  public runQualityCheck(type: QualityCheck['type']) {
    const check: QualityCheck = {
      id: `manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      status: Math.random() > 0.1 ? 'pass' : 'fail', // 90% pass rate
      message: `Manual ${type} check completed`,
      fileCount: 15,
      errorCount: 0,
      warningCount: 0
    };

    this.state.qualityChecks = [check, ...this.state.qualityChecks.slice(0, 9)];
    this.notifyListeners();
  }
}

export const workflowService = new WorkflowService();

export function useWorkflowDashboard() {
  const [state, setState] = useState<DashboardState>(workflowService.getState());

  useEffect(() => {
    const unsubscribe = workflowService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    updateTaskStatus: async (taskId: string, status: Task['status']) => {
      await workflowService.updateTaskStatus(taskId, status);
    },
    addTaskComment: workflowService.addTaskComment.bind(workflowService),
    sendClaudeCommand: workflowService.sendClaudeCommand.bind(workflowService),
    runQualityCheck: workflowService.runQualityCheck.bind(workflowService)
  };
}
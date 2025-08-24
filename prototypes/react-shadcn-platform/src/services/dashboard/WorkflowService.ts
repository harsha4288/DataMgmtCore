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
  type: 'lint' | 'type-check' | 'theme' | 'build' | 'test' | 'docs';
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
  fileCount?: number;
  errorCount?: number;
  warningCount?: number;
}

export interface DocumentationHealth {
  totalErrors: number;
  totalWarnings: number;
  sizeViolations: number;
  templateViolations: number;
  brokenLinks: number;
  lastValidation: string;
  status: 'healthy' | 'issues' | 'critical';
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
      branch: 'Unknown',
      ahead: 0,
      behind: 0,
      staged: 0,
      unstaged: 0,
      untracked: 0,
      lastCommit: {
        hash: 'Unknown',
        message: 'Loading...',
        timestamp: new Date().toISOString(),
        author: 'Unknown'
      }
    },
    metrics: {
      componentReusability: 0,
      qualityGateStatus: 'warning',
      testCoverage: 0,
      techDebt: 0,
      buildTime: 0,
      filesModified: 0,
      linesOfCode: 0,
      codeComplexity: 0
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
      console.log('🚀 Loading initial data for dashboard...');
      
      // Try to load real project data
      const progressData = await this.loadProgressData();
      if (progressData && progressData.length > 0) {
        console.log('✅ Using real progress data:', progressData.length, 'phases');
        this.state.phases = progressData;
        this.state.isConnected = true;
      } else {
        console.log('📋 No real data available - showing empty state');
        this.state.phases = [];
        this.state.isConnected = false;
      }

      // Try to load real git status
      await this.updateGitStatus();
      
      // Load quality checks only if connected
      if (this.state.isConnected) {
        await this.updateQualityChecks();
        await this.loadRecentActivity();
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.state.phases = [];
      this.state.isConnected = false;
      this.notifyListeners();
    }
  }

  private async loadProgressData(): Promise<Phase[] | null> {
    try {
      console.log('🔄 Attempting to load progress data from API...');
      const response = await fetch('http://localhost:3002/api/progress');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Progress data loaded from API:', data.phases?.length || 0, 'phases');
        return this.convertProgressDataToPhases(data);
      } else {
        console.log('❌ API response not OK:', response.status);
      }
    } catch (error) {
      console.log('❌ Could not load from API:', error.message);
    }
    
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


  private async updateGitStatus() {
    try {
      // Try to get real git status from API
      const response = await fetch('http://localhost:3002/api/git-status');
      if (response.ok) {
        const gitData = await response.json();
        this.state.gitStatus = gitData;
        console.log('✅ Git status loaded from API');
      } else {
        console.log('⚠️ Git API not available, using default values');
      }
    } catch (error) {
      console.log('⚠️ Could not fetch git status:', error.message);
    }
  }

  private async updateQualityChecks() {
    try {
      // Only load quality checks if we're connected to real services
      if (!this.state.isConnected) {
        this.state.qualityChecks = [{
          id: `offline-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'lint',
          status: 'warning',
          message: 'Quality check services offline. Run manual checks: npm run lint, npm run type-check',
          errorCount: 0,
          warningCount: 1,
          fileCount: 0
        }];
        return;
      }

      // Try to get real quality check results from API
      const response = await fetch('http://localhost:3002/api/quality-checks');
      if (response.ok) {
        const checks = await response.json();
        this.state.qualityChecks = checks;
        console.log('✅ Quality checks loaded from API');
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.log('⚠️ Could not load quality checks:', error.message);
      this.state.qualityChecks = [{
        id: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lint',
        status: 'warning',
        message: 'Could not fetch quality check results. Use manual commands.',
        errorCount: 0,
        warningCount: 1,
        fileCount: 0,
        details: 'Run: npm run lint && npm run type-check && npm run validate:theme'
      }];
    }
  }


  private async loadRecentActivity() {
    try {
      // Try to get real activity from API or git logs
      const response = await fetch('http://localhost:3002/api/recent-activity');
      if (response.ok) {
        const activities = await response.json();
        this.state.recentActivity = activities;
        console.log('✅ Recent activity loaded from API');
      } else {
        console.log('⚠️ Activity API not available');
        this.state.recentActivity = [];
      }
    } catch (error) {
      console.log('⚠️ Could not load recent activity:', error.message);
      this.state.recentActivity = [];
    }
  }

  private startRealTimeUpdates() {
    // Only start real-time updates if connected
    if (!this.state.isConnected) {
      console.log('⚠️ Skipping real-time updates - not connected to services');
      return;
    }

    // Update every 30 seconds (less frequent to avoid spam)
    setInterval(async () => {
      await this.updateGitStatus();
      await this.updateQualityChecks();
      this.state.lastUpdate = new Date().toISOString();
      this.notifyListeners();
    }, 30000);
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
    console.log(`Command logged: ${command}`, { taskId });
    
    if (taskId) {
      this.addTaskComment(taskId, {
        author: 'User',
        content: command,
        type: 'command'
      });
    }
    
    // In a real implementation, this would interface with Claude Code CLI
    // For now, just log the command
  }

  public async runQualityCheck(type: QualityCheck['type']) {
    // Add a "running" check immediately for UI feedback
    const runningCheck: QualityCheck = {
      id: `running-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      status: 'warning',
      message: `Running ${type} check...`,
      fileCount: 0,
      errorCount: 0,
      warningCount: 0
    };

    this.state.qualityChecks = [runningCheck, ...this.state.qualityChecks.slice(0, 9)];
    this.notifyListeners();

    try {
      // Run actual validation commands based on type
      const result = await this.executeQualityCheck(type);
      
      // Replace the running check with actual results
      const completedCheck: QualityCheck = {
        id: `manual-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        status: result.status,
        message: result.message,
        fileCount: result.fileCount || 0,
        errorCount: result.errorCount || 0,
        warningCount: result.warningCount || 0,
        details: result.details
      };

      this.state.qualityChecks = [completedCheck, ...this.state.qualityChecks.slice(1, 10)];
      this.notifyListeners();
    } catch (error) {
      // Handle error case
      const errorCheck: QualityCheck = {
        id: `error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type,
        status: 'fail',
        message: `${type} check failed: ${error}`,
        fileCount: 0,
        errorCount: 1,
        warningCount: 0,
        details: `Error executing ${type} validation`
      };

      this.state.qualityChecks = [errorCheck, ...this.state.qualityChecks.slice(1, 10)];
      this.notifyListeners();
    }
  }

  private async executeQualityCheck(type: QualityCheck['type']): Promise<{
    status: QualityCheck['status'];
    message: string;
    fileCount?: number;
    errorCount?: number;
    warningCount?: number;
    details?: string;
  }> {
    try {
      // Make API call to execute the actual quality check
      const response = await fetch('http://localhost:3002/api/run-quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });

      if (response.ok) {
        const result = await response.json();
        return result;
      } else {
        throw new Error(`API returned ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not execute ${type} check:`, error.message);
      return {
        status: 'fail',
        message: `${type} check failed - service unavailable`,
        errorCount: 1,
        warningCount: 0,
        details: `Could not execute ${type} validation. Run manually: npm run ${type === 'type-check' ? 'type-check' : type}`
      };
    }
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
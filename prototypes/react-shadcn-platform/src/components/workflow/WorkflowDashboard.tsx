/**
 * Real-time Workflow Dashboard
 * Integrates with Claude Code hooks and provides live task tracking
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  MessageSquare, 
  GitBranch, 
  AlertCircle,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronRight,
  Pause,
  Eye,
  History as HistoryIcon,
  Plus,
  Navigation,
  FileEdit,
  Activity,
  Wifi,
  WifiOff,
  Timer
} from 'lucide-react';
import { useWorkflowDashboard } from '@/services/dashboard/WorkflowService';
import type { Task } from '@/services/dashboard/WorkflowService';
import QualityReportPanel from './QualityReportPanel';
import ClaudeInterface from './ClaudeInterface';

const WorkflowDashboard: React.FC = () => {
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('1');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [taskDocumentContent, setTaskDocumentContent] = useState<string>('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [showQualityPanel, setShowQualityPanel] = useState(false);
  
  // Use real-time dashboard service
  const {
    phases,
    activeTask,
    gitStatus,
    metrics,
    qualityChecks,
    recentActivity,
    isConnected,
    lastUpdate,
    updateTaskStatus,
    addTaskComment,
    sendClaudeCommand,
    runQualityCheck
  } = useWorkflowDashboard();
  
  // Local state for UI
  const [localActiveTask, setLocalActiveTask] = useState<Task | null>(activeTask);
  
  // Use local active task or service active task
  const currentActiveTask = localActiveTask || activeTask;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'on_hold':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const switchToTask = (phaseId: string, taskId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    const task = phase?.tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedPhaseId(phaseId);
      setLocalActiveTask(task);
    }
  };

  const togglePhaseCollapse = (phaseId: string) => {
    // In real implementation, this would update via service
    console.log('Toggle phase collapse:', phaseId);
  };

  const changeTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    // Update local active task first for immediate UI feedback
    if (currentActiveTask?.id === taskId) {
      setLocalActiveTask({ ...currentActiveTask, status: newStatus });
    }
    
    // Then persist the change
    await updateTaskStatus(taskId, newStatus);
  };

  const viewTaskDocument = (task: Task) => {
    if (task.documentPath) {
      setTaskDocumentContent(`# ${task.title}\n\n${task.description}\n\n## Implementation Details\n[Task documentation would be loaded from: ${task.documentPath}]`);
      setShowDocumentViewer(true);
    }
  };

  const handleApproval = (taskId: string, approved: boolean) => {
    addTaskComment(taskId, {
      author: 'User',
      content: approved ? 'Task approved for commit' : 'Needs revision before commit',
      type: 'approval'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const currentPhaseProgress = phases.find(p => p.id === selectedPhaseId)?.progress || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              Real-time Workflow Dashboard
            </h1>
            <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
              React + shadcn/ui Platform - Claude Code Integration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              {gitStatus.branch}
            </Badge>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="flex items-center gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Badge variant="secondary">Phase 1 - {Math.round(currentPhaseProgress)}%</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Project Overview */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'board' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('board')}
                >
                  Board View
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List View
                </Button>
                <Button
                  variant={showCompletedTasks ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showCompletedTasks ? 'Hide' : 'Show'} Completed
                </Button>
                <Button
                  variant={showQualityPanel ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowQualityPanel(!showQualityPanel)}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Quality Panel
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm">Active Phase:</label>
                <select 
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                  style={{ 
                    borderColor: 'hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))'
                  }}
                >
                  {phases.map(phase => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Tabs defaultValue="phases" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="phases">Phases</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="quality">Quality</TabsTrigger>
                <TabsTrigger value="git">Git Status</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="phases" className="space-y-4">
                {phases.map((phase) => (
                  <Card key={phase.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-6 w-6"
                            onClick={() => togglePhaseCollapse(phase.id)}
                          >
                            {phase.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(phase.status)}
                            {phase.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                            {phase.progress}%
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{phase.description}</CardDescription>
                    </CardHeader>
                    {!phase.collapsed && (
                    <CardContent>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        {phase.tasks
                          .filter(task => showCompletedTasks || task.status !== 'completed')
                          .map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                            onClick={() => setLocalActiveTask(task)}
                            style={{ 
                              borderColor: 'hsl(var(--border))', 
                              backgroundColor: currentActiveTask?.id === task.id ? 'hsl(var(--muted))' : 'transparent' 
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(task.status)}
                              <div className="flex-1">
                                <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                  {task.title}
                                </p>
                                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {task.description}
                                </p>
                                {task.enhancementRequests && task.enhancementRequests.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Plus className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs text-blue-500">{task.enhancementRequests.length} enhancements</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {task.documentPath && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewTaskDocument(task);
                                  }}
                                >
                                  <FileText className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  switchToTask(phase.id, task.id);
                                }}
                              >
                                <Navigation className="h-3 w-3" />
                              </Button>
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              {task.comments.length > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {task.comments.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Component Reusability</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.componentReusability}%</div>
                      <p className="text-xs text-muted-foreground">Target: &gt;85%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Quality Gates</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {metrics.qualityGateStatus === 'pass' ? 'Passing' : 'Failed'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last update: {new Date(lastUpdate).toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Build Time</CardTitle>
                      <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.buildTime}s</div>
                      <p className="text-xs text-muted-foreground">Lines: {metrics.linesOfCode.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Git Status</CardTitle>
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{gitStatus.unstaged + gitStatus.staged}</div>
                      <p className="text-xs text-muted-foreground">
                        {gitStatus.staged} staged, {gitStatus.unstaged} unstaged
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="quality" className="space-y-4">
                <QualityReportPanel
                  qualityChecks={qualityChecks}
                  metrics={metrics}
                  onRunCheck={runQualityCheck}
                  isConnected={isConnected}
                />
              </TabsContent>
              
              <TabsContent value="git" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Git Repository Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium">Current Branch:</span>
                        <p className="text-lg font-mono">{gitStatus.branch}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Last Commit:</span>
                        <p className="text-sm font-mono">{gitStatus.lastCommit.hash}</p>
                        <p className="text-xs text-muted-foreground">{gitStatus.lastCommit.message}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{gitStatus.staged}</div>
                            <p className="text-xs text-muted-foreground">Staged</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{gitStatus.unstaged}</div>
                            <p className="text-xs text-muted-foreground">Unstaged</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{gitStatus.untracked}</div>
                            <p className="text-xs text-muted-foreground">Untracked</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HistoryIcon className="h-5 w-5" />
                      Recent Activity & Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {recentActivity.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <HistoryIcon className="h-4 w-4 mt-1 text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{entry.action}</span>
                                <span className="text-xs text-muted-foreground">
                                  by {entry.user} • {new Date(entry.timestamp).toLocaleString()}
                                </span>
                              </div>
                              {entry.details && (
                                <p className="text-sm text-muted-foreground">{entry.details}</p>
                              )}
                              {entry.fileChanges && entry.fileChanges.length > 0 && (
                                <div className="text-xs mt-1">
                                  Files: {entry.fileChanges.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Task Details & Claude Interface */}
          <div className="space-y-6">
            {currentActiveTask ? (
              <>
                {/* Active Task Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(currentActiveTask.status)}
                      {currentActiveTask.title}
                    </CardTitle>
                    <CardDescription>{currentActiveTask.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Priority</span>
                        <Badge variant={getPriorityColor(currentActiveTask.priority)}>
                          {currentActiveTask.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <select
                          value={currentActiveTask.status}
                          onChange={async (e) => await changeTaskStatus(currentActiveTask.id, e.target.value as Task['status'])}
                          className="px-2 py-1 text-xs border rounded"
                          style={{ 
                            borderColor: 'hsl(var(--border))',
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Estimated</span>
                        <span className="text-sm">{currentActiveTask.estimatedHours}h</span>
                      </div>
                      {currentActiveTask.actualHours && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Actual</span>
                          <span className="text-sm">{currentActiveTask.actualHours}h</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-2 pt-4">
                      <div className="text-sm font-medium">Quick Actions:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleApproval(currentActiveTask.id, true)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve & Commit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproval(currentActiveTask.id, false)}
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Revision
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => changeTaskStatus(currentActiveTask.id, 'on_hold')}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Put On Hold
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => sendClaudeCommand('Continue with ' + currentActiveTask.title, currentActiveTask.id)}
                        >
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Continue Task
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subtasks */}
                {currentActiveTask.subtasks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Subtasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {currentActiveTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3 p-2 border rounded">
                          {getStatusIcon(subtask.status)}
                          <span className="flex-1 text-sm">{subtask.title}</span>
                          <Badge variant="outline" size="sm">
                            {subtask.estimatedHours}h
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Claude Code Interface */}
                <ClaudeInterface
                  taskId={currentActiveTask.id}
                  onCommandSent={sendClaudeCommand}
                  comments={currentActiveTask.comments}
                  isConnected={isConnected}
                />
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a task to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Viewer Modal */}
            {showDocumentViewer && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <Card className="w-3/4 max-w-4xl h-3/4 flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileEdit className="h-5 w-5" />
                      Task Documentation
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDocumentViewer(false)}
                    >
                      ✕
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {taskDocumentContent}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
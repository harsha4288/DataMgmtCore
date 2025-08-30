/**
 * Status Workflow Panel - Interactive status management with workflow validation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  Ban,
  RotateCcw,
  User,
  Calendar,
  Activity,
  AlertCircle,
  ArrowRight,
  CheckSquare
} from 'lucide-react';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  READY_FOR_REVIEW = 'ready_for_review',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled'
}

export enum UserType {
  DEVELOPER = 'developer',
  PROJECT_MANAGER = 'project_manager',
  QA_TESTER = 'qa_tester',
  REVIEWER = 'reviewer',
  AI_AGENT = 'ai_agent'
}

interface StatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  userTypes: UserType[];
  requiresApproval: boolean;
  conditions: string[];
}

interface TaskItem {
  id: string;
  name: string;
  status: TaskStatus;
  progress: number;
  assignee?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'task' | 'subtask';
  parentId?: string;
}

interface StatusChangeRequest {
  taskId: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  reason: string;
  requiresApproval: boolean;
}

const StatusWorkflow: StatusTransition[] = [
  // Pending transitions
  { from: TaskStatus.PENDING, to: TaskStatus.IN_PROGRESS, userTypes: [UserType.DEVELOPER, UserType.AI_AGENT], requiresApproval: false, conditions: [] },
  { from: TaskStatus.PENDING, to: TaskStatus.BLOCKED, userTypes: [UserType.DEVELOPER, UserType.PROJECT_MANAGER], requiresApproval: false, conditions: [] },
  { from: TaskStatus.PENDING, to: TaskStatus.CANCELLED, userTypes: [UserType.PROJECT_MANAGER], requiresApproval: true, conditions: ['Manager approval required'] },

  // In Progress transitions
  { from: TaskStatus.IN_PROGRESS, to: TaskStatus.READY_FOR_REVIEW, userTypes: [UserType.DEVELOPER, UserType.AI_AGENT], requiresApproval: false, conditions: ['Task must be 90% complete'] },
  { from: TaskStatus.IN_PROGRESS, to: TaskStatus.BLOCKED, userTypes: [UserType.DEVELOPER, UserType.AI_AGENT], requiresApproval: false, conditions: [] },
  { from: TaskStatus.IN_PROGRESS, to: TaskStatus.PENDING, userTypes: [UserType.DEVELOPER, UserType.PROJECT_MANAGER], requiresApproval: false, conditions: [] },

  // Ready for Review transitions
  { from: TaskStatus.READY_FOR_REVIEW, to: TaskStatus.IN_REVIEW, userTypes: [UserType.REVIEWER, UserType.PROJECT_MANAGER], requiresApproval: false, conditions: [] },
  { from: TaskStatus.READY_FOR_REVIEW, to: TaskStatus.IN_PROGRESS, userTypes: [UserType.DEVELOPER], requiresApproval: false, conditions: [] },

  // In Review transitions
  { from: TaskStatus.IN_REVIEW, to: TaskStatus.APPROVED, userTypes: [UserType.REVIEWER, UserType.PROJECT_MANAGER], requiresApproval: false, conditions: ['Review passed'] },
  { from: TaskStatus.IN_REVIEW, to: TaskStatus.IN_PROGRESS, userTypes: [UserType.REVIEWER], requiresApproval: false, conditions: ['Requires changes'] },

  // Approved transitions
  { from: TaskStatus.APPROVED, to: TaskStatus.COMPLETED, userTypes: [UserType.PROJECT_MANAGER, UserType.REVIEWER], requiresApproval: false, conditions: [] },

  // Blocked transitions
  { from: TaskStatus.BLOCKED, to: TaskStatus.PENDING, userTypes: [UserType.PROJECT_MANAGER, UserType.DEVELOPER], requiresApproval: false, conditions: ['Blocker resolved'] },
  { from: TaskStatus.BLOCKED, to: TaskStatus.IN_PROGRESS, userTypes: [UserType.DEVELOPER, UserType.AI_AGENT], requiresApproval: false, conditions: ['Blocker resolved'] },

  // Completed transitions (generally final)
  { from: TaskStatus.COMPLETED, to: TaskStatus.IN_PROGRESS, userTypes: [UserType.PROJECT_MANAGER], requiresApproval: true, conditions: ['Reopen justification required'] }
];

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.PENDING: return <Clock className="h-4 w-4 text-gray-400" />;
    case TaskStatus.IN_PROGRESS: return <Play className="h-4 w-4 text-blue-500" />;
    case TaskStatus.READY_FOR_REVIEW: return <CheckSquare className="h-4 w-4 text-orange-500" />;
    case TaskStatus.IN_REVIEW: return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case TaskStatus.APPROVED: return <CheckCircle className="h-4 w-4 text-green-500" />;
    case TaskStatus.COMPLETED: return <CheckCircle className="h-4 w-4 text-green-600" />;
    case TaskStatus.BLOCKED: return <XCircle className="h-4 w-4 text-red-500" />;
    case TaskStatus.CANCELLED: return <Ban className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.PENDING: return 'secondary';
    case TaskStatus.IN_PROGRESS: return 'default';
    case TaskStatus.READY_FOR_REVIEW: return 'secondary';
    case TaskStatus.IN_REVIEW: return 'secondary';
    case TaskStatus.APPROVED: return 'default';
    case TaskStatus.COMPLETED: return 'default';
    case TaskStatus.BLOCKED: return 'destructive';
    case TaskStatus.CANCELLED: return 'secondary';
    default: return 'secondary';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'secondary';
  }
};

interface StatusWorkflowPanelProps {
  tasks?: TaskItem[];
  currentUser?: UserType;
  onStatusChange?: (request: StatusChangeRequest) => void;
}

export const StatusWorkflowPanel: React.FC<StatusWorkflowPanelProps> = ({
  tasks = [],
  currentUser = UserType.DEVELOPER,
  onStatusChange
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkStatusChange, setBulkStatusChange] = useState<TaskStatus | ''>('');
  const [statusChangeDialog, setStatusChangeDialog] = useState<{
    open: boolean;
    task: TaskItem | null;
    targetStatus: TaskStatus | null;
  }>({ open: false, task: null, targetStatus: null });

  // Mock data if no tasks provided
  const mockTasks: TaskItem[] = [
    {
      id: 'task-1',
      name: 'Setup project infrastructure',
      status: TaskStatus.COMPLETED,
      progress: 100,
      assignee: 'Claude AI',
      priority: 'high',
      type: 'task'
    },
    {
      id: 'task-2',
      name: 'Implement authentication system',
      status: TaskStatus.IN_PROGRESS,
      progress: 75,
      assignee: 'Developer',
      priority: 'critical',
      type: 'task'
    },
    {
      id: 'subtask-2-1',
      name: 'Create login form',
      status: TaskStatus.COMPLETED,
      progress: 100,
      assignee: 'Developer',
      priority: 'high',
      type: 'subtask',
      parentId: 'task-2'
    },
    {
      id: 'subtask-2-2',
      name: 'Implement JWT validation',
      status: TaskStatus.READY_FOR_REVIEW,
      progress: 90,
      assignee: 'Developer',
      priority: 'critical',
      type: 'subtask',
      parentId: 'task-2'
    },
    {
      id: 'task-3',
      name: 'Create dashboard components',
      status: TaskStatus.BLOCKED,
      progress: 25,
      assignee: 'Claude AI',
      priority: 'medium',
      type: 'task'
    }
  ];

  const displayTasks = tasks.length > 0 ? tasks : mockTasks;

  const getValidTransitions = (currentStatus: TaskStatus): TaskStatus[] => {
    return StatusWorkflow
      .filter(transition => 
        transition.from === currentStatus && 
        transition.userTypes.includes(currentUser)
      )
      .map(transition => transition.to);
  };

  const getTransitionInfo = (from: TaskStatus, to: TaskStatus): StatusTransition | null => {
    return StatusWorkflow.find(t => t.from === from && t.to === to) || null;
  };

  const handleStatusChange = (task: TaskItem, newStatus: TaskStatus) => {
    const transition = getTransitionInfo(task.status, newStatus);
    if (!transition) return;

    if (transition.requiresApproval || transition.conditions.length > 0) {
      setStatusChangeDialog({
        open: true,
        task,
        targetStatus: newStatus
      });
    } else {
      // Direct status change
      if (onStatusChange) {
        onStatusChange({
          taskId: task.id,
          fromStatus: task.status,
          toStatus: newStatus,
          reason: 'Direct transition',
          requiresApproval: false
        });
      }
    }
  };

  const handleBulkStatusChange = () => {
    if (!bulkStatusChange || selectedTasks.size === 0) return;

    selectedTasks.forEach(taskId => {
      const task = displayTasks.find(t => t.id === taskId);
      if (task && getValidTransitions(task.status).includes(bulkStatusChange as TaskStatus)) {
        handleStatusChange(task, bulkStatusChange as TaskStatus);
      }
    });

    setSelectedTasks(new Set());
    setBulkStatusChange('');
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const renderStatusButtons = (task: TaskItem) => {
    const validTransitions = getValidTransitions(task.status);
    
    return (
      <div className="flex flex-wrap gap-1">
        {validTransitions.map(status => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange(task, status)}
            className="text-xs"
          >
            {getStatusIcon(status)}
            <span className="ml-1">{status.replace('_', ' ')}</span>
          </Button>
        ))}
      </div>
    );
  };

  const renderTask = (task: TaskItem) => {
    const isSelected = selectedTasks.has(task.id);
    const isSubtask = task.type === 'subtask';

    return (
      <Card key={task.id} className={`${isSelected ? 'ring-2 ring-primary' : ''} ${isSubtask ? 'ml-6' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleTaskSelection(task.id)}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <span className={`font-medium ${isSubtask ? 'text-sm' : ''}`}>
                    {task.name}
                  </span>
                  <Badge variant={getStatusColor(task.status)} className="text-xs">
                    {task.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
                
                {task.assignee && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {task.assignee}
                  </div>
                )}
                
                <Progress value={task.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Progress: {task.progress}%
                </div>
                
                <div className="mt-3">
                  {renderStatusButtons(task)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Task Status Management
            <Badge variant="outline">
              {displayTasks.length} tasks
            </Badge>
          </CardTitle>
          <CardDescription>
            Interactive status management with workflow validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current User & Bulk Actions */}
          <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <User className="h-3 w-3 mr-1" />
                {currentUser.replace('_', ' ')}
              </Badge>
              {selectedTasks.size > 0 && (
                <Badge>
                  {selectedTasks.size} selected
                </Badge>
              )}
            </div>
            
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-2">
                <Select value={bulkStatusChange} onValueChange={setBulkStatusChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Bulk status change..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TaskStatus).map(status => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          {status.replace('_', ' ')}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleBulkStatusChange}
                  disabled={!bulkStatusChange}
                  size="sm"
                >
                  Apply to Selected
                </Button>
              </div>
            )}
          </div>

          {/* Tasks List */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {displayTasks.map(task => renderTask(task))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Status Change Confirmation Dialog */}
      <Dialog 
        open={statusChangeDialog.open} 
        onOpenChange={(open) => setStatusChangeDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Confirm Status Change
            </DialogTitle>
            <DialogDescription>
              Review the status change requirements before proceeding
            </DialogDescription>
          </DialogHeader>
          
          {statusChangeDialog.task && statusChangeDialog.targetStatus && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{statusChangeDialog.task.name}</div>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon(statusChangeDialog.task.status)}
                  <span className="text-sm">{statusChangeDialog.task.status.replace('_', ' ')}</span>
                  <ArrowRight className="h-4 w-4" />
                  {getStatusIcon(statusChangeDialog.targetStatus)}
                  <span className="text-sm">{statusChangeDialog.targetStatus.replace('_', ' ')}</span>
                </div>
              </div>

              {(() => {
                const transition = getTransitionInfo(statusChangeDialog.task.status, statusChangeDialog.targetStatus);
                if (transition) {
                  return (
                    <div className="space-y-2">
                      {transition.requiresApproval && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            This status change requires approval from a manager or reviewer.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {transition.conditions.length > 0 && (
                        <div>
                          <div className="font-medium text-sm mb-2">Conditions:</div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {transition.conditions.map((condition, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckSquare className="h-3 w-3" />
                                {condition}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStatusChangeDialog(prev => ({ ...prev, open: false }))}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (onStatusChange && statusChangeDialog.task && statusChangeDialog.targetStatus) {
                      const transition = getTransitionInfo(statusChangeDialog.task.status, statusChangeDialog.targetStatus);
                      onStatusChange({
                        taskId: statusChangeDialog.task.id,
                        fromStatus: statusChangeDialog.task.status,
                        toStatus: statusChangeDialog.targetStatus,
                        reason: 'User initiated status change',
                        requiresApproval: transition?.requiresApproval || false
                      });
                    }
                    setStatusChangeDialog({ open: false, task: null, targetStatus: null });
                  }}
                >
                  Confirm Change
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
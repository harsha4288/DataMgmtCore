/**
 * Status History Panel - Track status changes with timeline
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  History,
  Clock,
  User,
  ArrowRight,
  CheckCircle,
  Play,
  XCircle,
  Ban,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { TaskStatus } from './StatusWorkflowPanel';

interface StatusChange {
  id: string;
  taskId: string;
  taskName: string;
  fromStatus: TaskStatus;
  toStatus: TaskStatus;
  changedBy: string;
  changedAt: Date;
  reason?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

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

interface StatusHistoryPanelProps {
  statusChanges?: StatusChange[];
  taskId?: string;
}

export const StatusHistoryPanel: React.FC<StatusHistoryPanelProps> = ({
  statusChanges = [],
  taskId
}) => {
  // Mock data for demonstration
  const mockStatusChanges: StatusChange[] = [
    {
      id: 'change-1',
      taskId: 'task-2',
      taskName: 'Implement authentication system',
      fromStatus: TaskStatus.READY_FOR_REVIEW,
      toStatus: TaskStatus.IN_PROGRESS,
      changedBy: 'Developer',
      changedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      reason: 'Found issues during review, needs additional work'
    },
    {
      id: 'change-2',
      taskId: 'task-2',
      taskName: 'Implement authentication system',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.READY_FOR_REVIEW,
      changedBy: 'Claude AI',
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      reason: 'Completed JWT implementation and testing'
    },
    {
      id: 'change-3',
      taskId: 'subtask-2-1',
      taskName: 'Create login form',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.COMPLETED,
      changedBy: 'Developer',
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      reason: 'Login form completed with validation',
      approved: true,
      approvedBy: 'Project Manager',
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
    },
    {
      id: 'change-4',
      taskId: 'task-3',
      taskName: 'Create dashboard components',
      fromStatus: TaskStatus.IN_PROGRESS,
      toStatus: TaskStatus.BLOCKED,
      changedBy: 'Claude AI',
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      reason: 'Blocked by missing API endpoints'
    },
    {
      id: 'change-5',
      taskId: 'task-1',
      taskName: 'Setup project infrastructure',
      fromStatus: TaskStatus.APPROVED,
      toStatus: TaskStatus.COMPLETED,
      changedBy: 'Project Manager',
      changedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      reason: 'All infrastructure requirements met',
      approved: true,
      approvedBy: 'Tech Lead',
      approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 23) // 23 hours ago
    }
  ];

  const displayChanges = statusChanges.length > 0 ? statusChanges : mockStatusChanges;
  const filteredChanges = taskId 
    ? displayChanges.filter(change => change.taskId === taskId)
    : displayChanges;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} minutes ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} hours ago`;
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))} days ago`;
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderStatusChange = (change: StatusChange, index: number) => {
    const isLast = index === filteredChanges.length - 1;

    return (
      <div key={change.id} className="relative">
        {/* Timeline line */}
        {!isLast && (
          <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
        )}
        
        <div className="flex gap-4 p-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getUserInitials(change.changedBy)}
              </AvatarFallback>
            </Avatar>
            {change.approved && (
              <CheckCircle className="absolute -bottom-1 -right-1 h-4 w-4 text-green-500 bg-background rounded-full" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{change.changedBy}</span>
              <span className="text-sm text-muted-foreground">changed status</span>
              <div className="flex items-center gap-1">
                <Badge variant={getStatusColor(change.fromStatus)} className="text-xs">
                  {getStatusIcon(change.fromStatus)}
                  <span className="ml-1">{change.fromStatus.replace('_', ' ')}</span>
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge variant={getStatusColor(change.toStatus)} className="text-xs">
                  {getStatusIcon(change.toStatus)}
                  <span className="ml-1">{change.toStatus.replace('_', ' ')}</span>
                </Badge>
              </div>
            </div>

            <div className="text-sm font-medium">{change.taskName}</div>

            {change.reason && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {change.reason}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(change.changedAt)}
              </div>
              
              {change.approved && change.approvedBy && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Approved by {change.approvedBy}</span>
                  {change.approvedAt && (
                    <span>({formatTimeAgo(change.approvedAt)})</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {!isLast && <Separator />}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Status Change History
          <Badge variant="outline">
            {filteredChanges.length} changes
          </Badge>
        </CardTitle>
        <CardDescription>
          Timeline of all status changes and approvals
          {taskId && ` for task ${taskId}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filteredChanges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>No status changes recorded yet</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-0">
              {filteredChanges
                .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
                .map((change, index) => renderStatusChange(change, index))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
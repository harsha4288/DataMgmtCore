/**
 * Task Status Panel - Enhanced status management within contextual panel
 * Extracted from StatusWorkflowPanel.tsx for modular architecture
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Play, 
  User,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { SelectedTask } from '../workspace/UnifiedWorkspace';

/* eslint-disable no-unused-vars */
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
/* eslint-enable no-unused-vars */

interface TaskStatusPanelProps {
  task: SelectedTask;
  onStatusUpdate?: (_status: TaskStatus) => void;
}

const statusConfig = {
  [TaskStatus.PENDING]: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  [TaskStatus.IN_PROGRESS]: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  [TaskStatus.READY_FOR_REVIEW]: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  [TaskStatus.IN_REVIEW]: { icon: User, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  [TaskStatus.APPROVED]: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  [TaskStatus.COMPLETED]: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-600/10' },
  [TaskStatus.BLOCKED]: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  [TaskStatus.CANCELLED]: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' }
};

export const TaskStatusPanel: React.FC<TaskStatusPanelProps> = ({
  task,
  onStatusUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(task.status as TaskStatus);
  
  const currentConfig = statusConfig[selectedStatus];
  const Icon = currentConfig?.icon || Clock;

  const handleStatusChange = (newStatus: TaskStatus) => {
    setSelectedStatus(newStatus);
    onStatusUpdate?.(newStatus);
  };

  const getNextStates = (currentStatus: TaskStatus): TaskStatus[] => {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.READY_FOR_REVIEW, TaskStatus.BLOCKED, TaskStatus.PENDING],
      [TaskStatus.READY_FOR_REVIEW]: [TaskStatus.IN_REVIEW, TaskStatus.IN_PROGRESS],
      [TaskStatus.IN_REVIEW]: [TaskStatus.APPROVED, TaskStatus.IN_PROGRESS],
      [TaskStatus.APPROVED]: [TaskStatus.COMPLETED],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.BLOCKED]: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
      [TaskStatus.CANCELLED]: [TaskStatus.PENDING]
    };
    
    return transitions[currentStatus] || [];
  };

  const nextStates = getNextStates(selectedStatus);

  return (
    <div className="space-y-4">
      {/* Current Status Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className={`h-4 w-4 ${currentConfig?.color}`} />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-3 rounded-lg ${currentConfig?.bg}`}>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="capitalize">
                {selectedStatus ? selectedStatus.replace('_', ' ') : 'Unknown'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Updated 2h ago
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Change Actions */}
      {nextStates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick Transitions</CardTitle>
            <CardDescription className="text-xs">
              Available status changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextStates.map((status) => {
              const config = statusConfig[status];
              const StatusIcon = config.icon;
              
              return (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => handleStatusChange(status)}
                >
                  <ArrowRight className="h-3 w-3 mr-2 text-muted-foreground" />
                  <StatusIcon className={`h-3 w-3 mr-2 ${config.color}`} />
                  <span className="capitalize text-xs">
                    {status.replace('_', ' ')}
                  </span>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Manual Status Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Manual Override</CardTitle>
          <CardDescription className="text-xs">
            Set any status directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(TaskStatus).map((status) => {
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                
                return (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-3 w-3 ${config.color}`} />
                      <span className="capitalize text-xs">
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Task Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start h-8">
            <User className="h-3 w-3 mr-2" />
            <span className="text-xs">Reassign Task</span>
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start h-8">
            <Calendar className="h-3 w-3 mr-2" />
            <span className="text-xs">Set Due Date</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
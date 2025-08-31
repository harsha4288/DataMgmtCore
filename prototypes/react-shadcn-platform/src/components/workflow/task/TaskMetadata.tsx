/**
 * TaskMetadata - Metadata display for task detail view
 * Part of the unified workspace model (Task 5.8.3.1)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';

interface TaskMetadataProps {
  task?: {
    id?: string;
    assignee?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    createdAt?: Date | string;
    updatedAt?: Date | string;
    labels?: string[];
  };
  className?: string;
}

export const TaskMetadata: React.FC<TaskMetadataProps> = ({
  task,
  className = ''
}) => {
  if (!task) {
    return (
      <div data-testid="task-metadata" className={`space-y-2 ${className}`}>
        <p className="text-muted-foreground text-sm">No task metadata available</p>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div data-testid="task-metadata" className={`space-y-3 ${className}`}>
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Task Metadata</h4>
        
        <div className="space-y-2 text-sm">
          {task.assignee && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assignee:</span>
              <span>{task.assignee}</span>
            </div>
          )}
          
          {task.priority && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Priority:</span>
              <Badge variant={getPriorityColor(task.priority)} className="capitalize">
                {task.priority}
              </Badge>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(task.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>
            <span>{formatDate(task.updatedAt)}</span>
          </div>
          
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-muted-foreground text-sm">Labels:</span>
              {task.labels.map((label, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskMetadata;
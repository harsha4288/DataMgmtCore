/**
 * TreeStatusManagement - Status workflow management within tree nodes
 * Part of Phase 2 Advanced Feature Integration (Task 5.8.3.1)
 * Provides interactive status controls, workflow validation, and bulk operations
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Users,
  Calendar,
  History,
  Settings
} from 'lucide-react';

type TaskStatus = 'pending' | 'in_progress' | 'review' | 'approved' | 'completed' | 'blocked' | 'cancelled';

interface StatusTransition {
  from: TaskStatus;
  to: TaskStatus;
  allowed: boolean;
  reason?: string;
  requiresApproval?: boolean;
}

interface StatusHistoryEntry {
  id: string;
  status: TaskStatus;
  timestamp: string;
  user: string;
  comment?: string;
  duration?: number;
}

interface TreeStatusManagementProps {
  entityId: string;
  entityType: 'task' | 'phase' | 'issue';
  currentStatus: TaskStatus;
  statusHistory?: StatusHistoryEntry[];
  onStatusChange?: (newStatus: TaskStatus, comment?: string) => void;
  onBulkStatusChange?: (entityIds: string[], newStatus: TaskStatus) => void;
  userRole?: 'developer' | 'pm' | 'qa' | 'admin';
  className?: string;
}

export const TreeStatusManagement: React.FC<TreeStatusManagementProps> = ({
  entityId,
  entityType,
  currentStatus,
  statusHistory = [],
  onStatusChange,
  onBulkStatusChange,
  userRole = 'developer',
  className = ''
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(currentStatus);
  const [comment, setComment] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [showWorkflowValidation, setShowWorkflowValidation] = useState(false);

  // Mock status history if none provided
  const mockHistory: StatusHistoryEntry[] = statusHistory.length > 0 ? statusHistory : [
    {
      id: '1',
      status: 'pending',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      user: 'Project Manager',
      comment: 'Task created and ready for assignment'
    },
    {
      id: '2',
      status: 'in_progress',
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      user: 'Developer',
      comment: 'Started implementation',
      duration: 86400000
    },
    {
      id: '3',
      status: currentStatus,
      timestamp: new Date().toISOString(),
      user: 'Current User',
      comment: 'Current status'
    }
  ];

  // Status workflow validation rules
  const getValidTransitions = (from: TaskStatus, role: string): StatusTransition[] => {
    const baseTransitions: StatusTransition[] = [
      { from: 'pending', to: 'in_progress', allowed: true },
      { from: 'pending', to: 'cancelled', allowed: role === 'pm' || role === 'admin' },
      { from: 'in_progress', to: 'review', allowed: true },
      { from: 'in_progress', to: 'blocked', allowed: true },
      { from: 'in_progress', to: 'cancelled', allowed: role === 'pm' || role === 'admin' },
      { from: 'review', to: 'approved', allowed: role === 'pm' || role === 'qa' || role === 'admin' },
      { from: 'review', to: 'in_progress', allowed: true, reason: 'Changes requested' },
      { from: 'approved', to: 'completed', allowed: role === 'pm' || role === 'admin' },
      { from: 'blocked', to: 'in_progress', allowed: true, reason: 'Blocker resolved' },
      { from: 'completed', to: 'review', allowed: role === 'pm' || role === 'admin', reason: 'Reopening for changes' }
    ];

    return baseTransitions.filter(t => t.from === from);
  };

  const validTransitions = getValidTransitions(currentStatus, userRole);
  const allowedStatuses = validTransitions.filter(t => t.allowed).map(t => t.to);

  const handleStatusChange = () => {
    if (onStatusChange && selectedStatus !== currentStatus) {
      onStatusChange(selectedStatus, comment);
    }
  };

  const handleBulkStatusChange = () => {
    if (onBulkStatusChange && selectedEntities.length > 0) {
      onBulkStatusChange(selectedEntities, selectedStatus);
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'in_progress': return <Play className="h-3 w-3" />;
      case 'review': return <AlertTriangle className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'blocked': return <XCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'outline';
      case 'in_progress': return 'default';
      case 'review': return 'secondary';
      case 'approved': return 'default';
      case 'completed': return 'default';
      case 'blocked': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diffDays = Math.floor((endTime - startTime) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Same day';
  };

  return (
    <div data-testid="tree-status-management" className={`w-full ${className}`}>
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                {getStatusIcon(currentStatus)}
                Current Status: {currentStatus.replace('_', ' ').toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(currentStatus)}>
                    {currentStatus.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Since {new Date(mockHistory[mockHistory.length - 1].timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Change Status</label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedStatuses.map((status) => (
                        <SelectItem key={status} value={status} className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            {status.replace('_', ' ')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStatus !== currentStatus && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comment (Optional)</label>
                    <textarea
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder="Add a comment about this status change..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleStatusChange} className="w-full">
                      Update Status to {selectedStatus.replace('_', ' ')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Workflow Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2">
                  {validTransitions.map((transition, index) => (
                    <Alert key={index} className={transition.allowed ? '' : 'border-destructive'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>
                          {transition.from} → {transition.to}
                        </span>
                        <Badge variant={transition.allowed ? 'default' : 'destructive'}>
                          {transition.allowed ? 'Allowed' : 'Blocked'}
                        </Badge>
                      </AlertDescription>
                      {transition.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transition.reason}
                        </p>
                      )}
                    </Alert>
                  ))}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Your role: <Badge variant="outline">{userRole}</Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Status History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {mockHistory.map((entry, index) => (
                    <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(entry.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getStatusColor(entry.status)} className="text-xs">
                            {entry.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{entry.user}</p>
                        {entry.comment && (
                          <p className="text-sm text-muted-foreground">{entry.comment}</p>
                        )}
                        {index > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {calculateDuration(mockHistory[index - 1].timestamp, entry.timestamp)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Bulk Status Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Select multiple entities to perform bulk status changes.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Entities ({selectedEntities.length})</label>
                  <div className="space-y-1">
                    {['entity-1', 'entity-2', 'entity-3'].map((id) => (
                      <div key={id} className="flex items-center space-x-2">
                        <Checkbox
                          id={id}
                          checked={selectedEntities.includes(id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEntities([...selectedEntities, id]);
                            } else {
                              setSelectedEntities(selectedEntities.filter(e => e !== id));
                            }
                          }}
                        />
                        <label htmlFor={id} className="text-sm">
                          Related {entityType} {id}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedEntities.length > 0 && (
                  <div className="space-y-2">
                    <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status for bulk change" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleBulkStatusChange} className="w-full">
                      Update {selectedEntities.length} entities to {selectedStatus.replace('_', ' ')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreeStatusManagement;
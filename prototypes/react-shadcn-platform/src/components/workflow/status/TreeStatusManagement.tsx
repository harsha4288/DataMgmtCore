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
    <div data-testid="tree-status-management" className={`w-full max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header with Entity Context */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2 capitalize">
          {entityType} Status Management
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Entity ID: {entityId}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            {getStatusIcon(currentStatus)}
            <span className="capitalize">{currentStatus.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="status" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Status
          </TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Workflow
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            History
          </TabsTrigger>
          <TabsTrigger value="bulk" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Bulk Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(currentStatus)}
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusColor(currentStatus)} className="text-sm px-3 py-1">
                    {currentStatus.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Active since {new Date(mockHistory[mockHistory.length - 1].timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Status Statistics */}
                <div className="bg-muted/20 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Status Duration</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <div className="font-medium">
                        {new Date(mockHistory[mockHistory.length - 1].timestamp).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="font-medium">
                        {Math.ceil((Date.now() - new Date(mockHistory[mockHistory.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Change Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Change Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select New Status</label>
                  <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {allowedStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className="capitalize">{status.replace('_', ' ')}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStatus !== currentStatus && (
                  <div className="space-y-4 p-4 bg-accent/10 rounded-lg border">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Comment (Optional)</label>
                      <textarea
                        className="w-full p-3 border rounded-md text-sm resize-none"
                        placeholder="Add a comment about this status change..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleStatusChange} className="w-full h-11">
                      Update Status to "{selectedStatus.replace('_', ' ')}"
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="mt-6">
          <div className="space-y-6">
            {/* Role Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Workflow Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Your role:</span>
                  <Badge variant="secondary" className="px-3 py-1 text-sm font-medium capitalize">
                    {userRole}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Status Transitions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Status Transitions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {validTransitions.map((transition, index) => (
                    <Alert key={index} className={`${transition.allowed ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'} p-4`}>
                      <AlertTriangle className={`h-4 w-4 ${transition.allowed ? 'text-green-600' : 'text-red-600'}`} />
                      <AlertDescription>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            {transition.from.replace('_', ' ')} → {transition.to.replace('_', ' ')}
                          </span>
                          <Badge variant={transition.allowed ? 'default' : 'destructive'} className="text-xs">
                            {transition.allowed ? 'Allowed' : 'Blocked'}
                          </Badge>
                        </div>
                        {transition.reason && (
                          <p className="text-xs text-muted-foreground">
                            {transition.reason}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Status History Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockHistory.map((entry, index) => (
                  <div key={entry.id} className="relative">
                    {/* Timeline line */}
                    {index < mockHistory.length - 1 && (
                      <div className="absolute left-6 top-12 w-px h-16 bg-border" />
                    )}
                    
                    <div className="flex gap-4">
                      {/* Status indicator */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-background bg-card flex items-center justify-center shadow-sm">
                        {getStatusIcon(entry.status)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(entry.status)} className="text-xs px-2 py-1">
                                {entry.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm font-medium">{entry.user}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          
                          {entry.comment && (
                            <p className="text-sm text-muted-foreground mb-2">{entry.comment}</p>
                          )}
                          
                          {index > 0 && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>
                                Duration in previous status: {calculateDuration(mockHistory[index - 1].timestamp, entry.timestamp)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bulk Status Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Select multiple related entities to perform bulk status changes. This action will affect all selected items.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entity Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Entities ({selectedEntities.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['entity-1', 'entity-2', 'entity-3'].map((id) => (
                      <div key={id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
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
                          className="h-4 w-4"
                        />
                        <label htmlFor={id} className="flex-1 text-sm font-medium cursor-pointer">
                          Related {entityType} {id}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {currentStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Action */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Status Change</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEntities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Select entities to enable bulk operations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-accent/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Selected:</p>
                        <p className="font-medium">{selectedEntities.length} entities</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Status</label>
                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TaskStatus)}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select status for bulk change" />
                          </SelectTrigger>
                          <SelectContent>
                            {allowedStatuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(status)}
                                  <span className="capitalize">{status.replace('_', ' ')}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button onClick={handleBulkStatusChange} className="w-full h-11" size="lg">
                        Update {selectedEntities.length} entities to "{selectedStatus.replace('_', ' ')}"
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreeStatusManagement;
/**
 * Issue Detail - Full issue view with resolution history
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Edit3,
  Save,
  X,
  Clock,
  User,
  Calendar,
  Tag,
  Link2,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Issue, IssueType, IssueSeverity, IssueStatus, ResolutionAttempt } from './IssueManagementPanel';

interface IssueDetailProps {
  issue: Issue;
  onUpdate: (updates: Partial<Issue>) => void;
  onClose: () => void;
}

export const IssueDetail: React.FC<IssueDetailProps> = ({
  issue,
  onUpdate,
  onClose
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: issue.title,
    description: issue.description,
    type: issue.type,
    severity: issue.severity,
    status: issue.status,
    assignee: issue.assignee || ''
  });
  const [newAttempt, setNewAttempt] = useState({
    approach: '',
    details: '',
    timeSpent: 0
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} minutes ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} hours ago`;
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))} days ago`;
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failure': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'default';
      case 'failure': return 'destructive';
      case 'partial': return 'secondary';
      default: return 'outline';
    }
  };

  const handleSave = () => {
    onUpdate({
      ...editForm,
      updatedAt: new Date()
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      title: issue.title,
      description: issue.description,
      type: issue.type,
      severity: issue.severity,
      status: issue.status,
      assignee: issue.assignee || ''
    });
    setIsEditing(false);
  };

  const handleAddResolutionAttempt = () => {
    if (!newAttempt.approach.trim()) {
      alert('Approach is required');
      return;
    }

    const attempt: ResolutionAttempt = {
      id: `attempt-${Date.now()}`,
      approach: newAttempt.approach,
      outcome: 'partial', // Default, can be updated later
      details: newAttempt.details,
      timestamp: new Date(),
      performedBy: 'Current User',
      timeSpent: newAttempt.timeSpent || undefined
    };

    onUpdate({
      resolutionAttempts: [...issue.resolutionAttempts, attempt],
      updatedAt: new Date()
    });

    setNewAttempt({ approach: '', details: '', timeSpent: 0 });
  };

  const updateResolutionOutcome = (attemptId: string, outcome: 'success' | 'failure' | 'partial') => {
    const updatedAttempts = issue.resolutionAttempts.map(attempt =>
      attempt.id === attemptId ? { ...attempt, outcome } : attempt
    );

    onUpdate({
      resolutionAttempts: updatedAttempts,
      updatedAt: new Date()
    });
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              className="text-lg font-semibold"
            />
          ) : (
            <h2 className="text-lg font-semibold">{issue.title}</h2>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">#{issue.id}</Badge>
            <Badge variant={issue.type === IssueType.BUG ? 'destructive' : 'default'}>
              {issue.type}
            </Badge>
            <Badge variant={issue.severity === IssueSeverity.CRITICAL ? 'destructive' : 'secondary'}>
              {issue.severity}
            </Badge>
            {isEditing ? (
              <Select
                value={editForm.status}
                onValueChange={(value: IssueStatus) => setEditForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(IssueStatus).map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={issue.status === IssueStatus.RESOLVED ? 'default' : 'secondary'}>
                {issue.status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel} size="sm">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Assignee:</span>
            {isEditing ? (
              <Input
                value={editForm.assignee}
                onChange={(e) => setEditForm(prev => ({ ...prev, assignee: e.target.value }))}
                placeholder="Unassigned"
                className="h-6"
              />
            ) : (
              <span>{issue.assignee || 'Unassigned'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Reporter:</span>
            <span>{issue.reporter}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{formatTimeAgo(issue.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Updated:</span>
            <span>{formatTimeAgo(issue.updatedAt)}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="resolution">Resolution</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            {isEditing ? (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            ) : (
              <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                {issue.description || 'No description provided'}
              </div>
            )}
          </div>

          {issue.labels.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {issue.labels.map(label => (
                  <Badge key={label} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(issue.estimatedHours || issue.actualHours) && (
            <div>
              <h4 className="font-medium mb-2">Time Tracking</h4>
              <div className="grid grid-cols-2 gap-4">
                {issue.estimatedHours && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Estimated: </span>
                    <span>{issue.estimatedHours}h</span>
                  </div>
                )}
                {issue.actualHours && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Actual: </span>
                    <span>{issue.actualHours}h</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Resolution Tab */}
        <TabsContent value="resolution" className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Resolution Attempts</h4>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {issue.resolutionAttempts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <p>No resolution attempts recorded yet</p>
                  </div>
                ) : (
                  issue.resolutionAttempts
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((attempt, index) => (
                      <div key={attempt.id} className="border rounded p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getUserInitials(attempt.performedBy)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{attempt.performedBy}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(attempt.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getOutcomeColor(attempt.outcome)}>
                              {getOutcomeIcon(attempt.outcome)}
                              <span className="ml-1">{attempt.outcome}</span>
                            </Badge>
                            <Select
                              value={attempt.outcome}
                              onValueChange={(value: any) => updateResolutionOutcome(attempt.id, value)}
                            >
                              <SelectTrigger className="h-6 w-20 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="partial">Partial</SelectItem>
                                <SelectItem value="failure">Failure</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium">Approach: </span>
                            <span className="text-sm">{attempt.approach}</span>
                          </div>
                          {attempt.details && (
                            <div className="bg-muted p-2 rounded text-sm">
                              {attempt.details}
                            </div>
                          )}
                          {attempt.timeSpent && (
                            <div className="text-xs text-muted-foreground">
                              Time spent: {attempt.timeSpent} hours
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Add New Attempt */}
          <div>
            <h4 className="font-medium mb-3">Add Resolution Attempt</h4>
            <div className="space-y-3">
              <Input
                placeholder="Approach (e.g., 'Check database connections')"
                value={newAttempt.approach}
                onChange={(e) => setNewAttempt(prev => ({ ...prev, approach: e.target.value }))}
              />
              <Textarea
                placeholder="Details of what you did..."
                value={newAttempt.details}
                onChange={(e) => setNewAttempt(prev => ({ ...prev, details: e.target.value }))}
                rows={3}
              />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Time spent:</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0"
                    value={newAttempt.timeSpent}
                    onChange={(e) => setNewAttempt(prev => ({ 
                      ...prev, 
                      timeSpent: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
                <Button onClick={handleAddResolutionAttempt} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attempt
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value="links" className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Related Tasks</h4>
            {issue.relatedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No related tasks</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {issue.relatedTasks.map(task => (
                  <Badge key={task} variant="outline">
                    <Link2 className="h-3 w-3 mr-1" />
                    {task}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Linked Issues</h4>
            {issue.linkedIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No linked issues</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {issue.linkedIssues.map(linkedIssue => (
                  <Badge key={linkedIssue} variant="outline">
                    <Link2 className="h-3 w-3 mr-1" />
                    {linkedIssue}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4" />
            <p>Issue history tracking will be implemented here</p>
            <p className="text-sm">Status changes, updates, and comments</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
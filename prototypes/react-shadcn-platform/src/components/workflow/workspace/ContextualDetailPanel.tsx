import React, { useState } from 'react';
import { ProjectEntity } from './ExpandableProjectTree';
import { InlineDocumentManager } from '../document/InlineDocumentManager';
import { InlineIssueManager } from '../issue/InlineIssueManager';
import { TreeStatusManagement } from '../status/TreeStatusManagement';
import { TreeReviewSystem } from '../review/TreeReviewSystem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X, FileText, Bug, Settings, MessageSquare, Clock, User, Calendar } from 'lucide-react';

export interface ContextualDetailPanelProps {
  entity: ProjectEntity;
  onEntityUpdate: (entityId: string, updates: Partial<ProjectEntity>) => void;
  onClose: () => void;
}

export const ContextualDetailPanel: React.FC<ContextualDetailPanelProps> = ({
  entity,
  onEntityUpdate,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusUpdate = (newStatus: ProjectEntity['status']) => {
    onEntityUpdate(entity.id, { status: newStatus });
  };

  const handleAssigneeUpdate = (assignee: string) => {
    onEntityUpdate(entity.id, { assignee });
  };

  const handlePriorityUpdate = (priority: ProjectEntity['priority']) => {
    onEntityUpdate(entity.id, { priority });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: ProjectEntity['status']) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      blocked: 'destructive',
      pending: 'outline',
      ready_for_review: 'secondary',
      in_review: 'secondary',
      approved: 'default'
    } as const;
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ProjectEntity['priority']) => {
    const colors = {
      critical: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    
    return (
      <Badge className={`capitalize ${colors[priority]}`}>
        {priority}
      </Badge>
    );
  };

  return (
    <Card className="w-full bg-hsl(var(--card)) border border-hsl(var(--border))">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          {entity.type === 'phase' && '📁'}
          {entity.type === 'task' && '📋'}
          {entity.type === 'subtask' && '🔧'}
          {entity.type === 'sub-subtask' && '📝'}
          {entity.type === 'issue' && '🐛'}
          {entity.type === 'document' && '📄'}
          {' '}{entity.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-1" />
              Docs ({entity.documentsCount})
            </TabsTrigger>
            <TabsTrigger value="issues">
              <Bug className="w-4 h-4 mr-1" />
              Issues ({entity.issuesCount})
            </TabsTrigger>
            <TabsTrigger value="status">
              <Settings className="w-4 h-4 mr-1" />
              Status
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <MessageSquare className="w-4 h-4 mr-1" />
              Reviews ({entity.reviewsCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Metadata Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-hsl(var(--muted-foreground))">Status:</span>
                  {getStatusBadge(entity.status)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-hsl(var(--muted-foreground))">Priority:</span>
                  {getPriorityBadge(entity.priority)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-hsl(var(--muted-foreground))">Progress:</span>
                  <Badge variant="outline">{entity.progress}%</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {entity.assignee && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-hsl(var(--muted-foreground))" />
                    <span className="text-sm">{entity.assignee}</span>
                  </div>
                )}
                {entity.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-hsl(var(--muted-foreground))" />
                    <span className="text-sm">{formatDate(entity.dueDate)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-hsl(var(--muted-foreground))" />
                  <span className="text-sm">Updated {formatDate(entity.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {entity.description && (
              <div>
                <h4 className="font-medium text-hsl(var(--foreground)) mb-2">Description</h4>
                <p className="text-sm text-hsl(var(--muted-foreground)) bg-hsl(var(--muted)) p-3 rounded">
                  {entity.description}
                </p>
              </div>
            )}

            {/* Recent Activity */}
            {entity.recentActivity && (
              <div>
                <h4 className="font-medium text-hsl(var(--foreground)) mb-2">Recent Activity</h4>
                <div className="bg-hsl(var(--muted)) p-3 rounded">
                  <p className="text-sm text-hsl(var(--foreground))">
                    💬 {entity.recentActivity}
                  </p>
                  {entity.lastActivityAt && (
                    <p className="text-xs text-hsl(var(--muted-foreground)) mt-1">
                      {formatDate(entity.lastActivityAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-hsl(var(--muted)) rounded">
                <div className="font-semibold text-hsl(var(--foreground))">{entity.documentsCount}</div>
                <div className="text-xs text-hsl(var(--muted-foreground))">Documents</div>
              </div>
              <div className="text-center p-3 bg-hsl(var(--muted)) rounded">
                <div className="font-semibold text-red-600">{entity.issuesCount}</div>
                <div className="text-xs text-hsl(var(--muted-foreground))">Issues</div>
              </div>
              <div className="text-center p-3 bg-hsl(var(--muted)) rounded">
                <div className="font-semibold text-hsl(var(--foreground))">{entity.commentsCount}</div>
                <div className="text-xs text-hsl(var(--muted-foreground))">Comments</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 className="font-medium text-hsl(var(--foreground)) mb-3">🚀 Quick Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  📝 Edit Description
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  👥 Assign User
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  📅 Set Due Date
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  🏷️ Add Labels
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  📤 Export Data
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <InlineDocumentManager
              entity={entity}
              onEntityUpdate={onEntityUpdate}
            />
          </TabsContent>

          <TabsContent value="issues" className="mt-4">
            <InlineIssueManager
              entity={entity}
              onEntityUpdate={onEntityUpdate}
            />
          </TabsContent>

          <TabsContent value="status" className="mt-4">
            <TreeStatusManagement
              entity={entity}
              onStatusUpdate={handleStatusUpdate}
              onAssigneeUpdate={handleAssigneeUpdate}
              onPriorityUpdate={handlePriorityUpdate}
            />
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <TreeReviewSystem
              entity={entity}
              onEntityUpdate={onEntityUpdate}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContextualDetailPanel;
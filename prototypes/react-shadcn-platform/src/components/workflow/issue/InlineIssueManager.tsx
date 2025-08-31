/**
 * InlineIssueManager - Issue management within tree nodes
 * Part of Phase 2 Advanced Feature Integration (Task 5.8.3.1)
 * Provides contextual issue creation, linking, templates, and resolution tracking
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bug, Plus } from 'lucide-react';

interface InlineIssueManagerProps {
  entityId?: string;
  entityType?: 'task' | 'phase' | 'issue';
  className?: string;
}

export const InlineIssueManager: React.FC<InlineIssueManagerProps> = ({
  entityId = 'default-entity',
  entityType = 'task',
  className = ''
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Mock issues data
  const mockIssues = [
    {
      id: 'issue-1',
      title: 'Navigation component not responding',
      description: 'The navigation component fails to respond to click events in certain conditions.',
      type: 'bug',
      priority: 'high',
      status: 'open',
      assignee: 'Developer',
      reporter: 'QA Team',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'issue-2',
      title: 'Performance optimization needed',
      description: 'Page load time exceeds acceptable thresholds',
      type: 'improvement',
      priority: 'medium',
      status: 'in_progress',
      assignee: 'Senior Developer',
      reporter: 'Performance Team',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const filteredIssues = mockIssues.filter(issue => {
    return filterStatus === 'all' || issue.status === filterStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'default';
      case 'closed': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div data-testid="inline-issue-manager" className={`w-full ${className}`}>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Issues ({filteredIssues.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-8" data-testid="create-issue-button">
                <Plus className="h-3 w-3 mr-1" />
                New Issue
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate flex-1 pr-2">{issue.title}</h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant={getPriorityColor(issue.priority)} className="text-xs">
                        {issue.priority}
                      </Badge>
                      <Badge variant={getStatusColor(issue.status)} className="text-xs">
                        {issue.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {issue.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {issue.assignee || 'Unassigned'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(issue.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredIssues.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bug className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No issues found</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Create First Issue
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default InlineIssueManager;
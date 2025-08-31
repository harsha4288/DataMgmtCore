/**
 * IssuePanel - Issue management panel for unified workspace
 * Part of the unified workspace model (Task 5.8.3.1)
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Bug, AlertTriangle, CheckCircle } from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'qa' | 'uat' | 'improvement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee?: string;
}

interface IssuePanelProps {
  issues?: Issue[];
  taskId?: string;
  onCreateIssue?: () => void;
  onIssueSelect?: (issue: Issue) => void;
  className?: string;
}

export const IssuePanel: React.FC<IssuePanelProps> = ({
  issues = [],
  taskId,
  onCreateIssue,
  onIssueSelect,
  className = ''
}) => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'bug': return Bug;
      case 'feature': return Plus;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'open': return 'text-orange-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-muted-foreground';
    }
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue.id);
    onIssueSelect?.(issue);
  };

  return (
    <div data-testid="issue-panel" className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Issues</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={onCreateIssue}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New Issue
        </Button>
      </div>

      <div className="space-y-2">
        {issues.length === 0 ? (
          <Card className="p-4">
            <p className="text-muted-foreground text-sm text-center">
              No issues found for this task
            </p>
          </Card>
        ) : (
          issues.map((issue) => {
            const Icon = getIssueIcon(issue.type);
            const isSelected = selectedIssue === issue.id;
            
            return (
              <Card
                key={issue.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleIssueClick(issue)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 ${getStatusColor(issue.status)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate">{issue.title}</p>
                        <Badge
                          variant={getSeverityColor(issue.severity)}
                          className="text-xs capitalize"
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{issue.type}</span>
                        <span>•</span>
                        <span className={`capitalize ${getStatusColor(issue.status)}`}>
                          {issue.status.replace('_', ' ')}
                        </span>
                        {issue.assignee && (
                          <>
                            <span>•</span>
                            <span>{issue.assignee}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {issues.length > 3 && (
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
          View All Issues ({issues.length})
        </Button>
      )}
    </div>
  );
};

export default IssuePanel;
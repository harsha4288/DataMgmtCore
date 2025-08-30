import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle,
  Clock,
  Users,
  Target
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'improvement' | 'qa' | 'uat';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  created_date: string;
  resolved_date?: string;
  related_tasks: string[];
  resolution_attempts: Array<{
    id: string;
    approach: string;
    outcome: string;
  }>;
}

interface IssuesTabProps {
  issues: Issue[];
}

export function IssuesTab({ issues }: IssuesTabProps) {
  const getSeverityBadge = (severity: Issue['severity']) => {
    const variants = {
      critical: 'destructive' as const,
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    return <Badge variant={variants[severity]}>{severity}</Badge>;
  };

  const getTypeBadge = (type: Issue['type']) => {
    const colors = {
      bug: 'bg-red-100 text-red-800',
      feature: 'bg-blue-100 text-blue-800',
      improvement: 'bg-green-100 text-green-800',
      qa: 'bg-yellow-100 text-yellow-800',
      uat: 'bg-purple-100 text-purple-800'
    };
    return <Badge className={colors[type]}>{type}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {issues.filter(i => i.status === 'open').length}
              </div>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {issues.filter(i => i.status === 'in_progress').length}
              </div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {issues.filter(i => i.status === 'resolved').length}
              </div>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {issues.filter(i => i.severity === 'critical' || i.severity === 'high').length}
              </div>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {issues.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No issues found! The system is running smoothly.
              </AlertDescription>
            </Alert>
          ) : (
            issues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{issue.title}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(issue.severity)}
                      {getTypeBadge(issue.type)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {issue.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created: {new Date(issue.created_date).toLocaleDateString()}
                    </span>
                    {issue.related_tasks.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {issue.related_tasks.length} related tasks
                      </span>
                    )}
                    {issue.resolution_attempts.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {issue.resolution_attempts.length} attempts
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
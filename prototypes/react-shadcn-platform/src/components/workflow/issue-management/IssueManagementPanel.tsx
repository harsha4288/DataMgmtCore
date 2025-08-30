/**
 * Issue Management Panel - Complete CRUD operations for issue tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bug,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Link2,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar,
  Tag,
  FileText,
  Star
} from 'lucide-react';
import { IssueForm } from './IssueForm';
import { IssueDetail } from './IssueDetail';
import { IssueLinking } from './IssueLinking';

export enum IssueType {
  BUG = 'bug',
  FEATURE = 'feature',
  QA = 'qa',
  UAT = 'uat',
  IMPROVEMENT = 'improvement',
  TASK = 'task'
}

export enum IssueSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  READY_FOR_REVIEW = 'ready_for_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REOPENED = 'reopened'
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  assignee?: string;
  reporter: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  labels: string[];
  relatedTasks: string[];
  linkedIssues: string[];
  resolutionAttempts: ResolutionAttempt[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface ResolutionAttempt {
  id: string;
  approach: string;
  outcome: 'success' | 'failure' | 'partial';
  details: string;
  timestamp: Date;
  performedBy: string;
  timeSpent?: number;
  resourcesUsed?: string[];
}

const getIssueTypeIcon = (type: IssueType) => {
  switch (type) {
    case IssueType.BUG: return <Bug className="h-4 w-4" />;
    case IssueType.FEATURE: return <Star className="h-4 w-4" />;
    case IssueType.QA: return <CheckCircle className="h-4 w-4" />;
    case IssueType.UAT: return <User className="h-4 w-4" />;
    case IssueType.IMPROVEMENT: return <AlertTriangle className="h-4 w-4" />;
    case IssueType.TASK: return <FileText className="h-4 w-4" />;
  }
};

const getIssueTypeColor = (type: IssueType) => {
  switch (type) {
    case IssueType.BUG: return 'destructive';
    case IssueType.FEATURE: return 'default';
    case IssueType.QA: return 'secondary';
    case IssueType.UAT: return 'outline';
    case IssueType.IMPROVEMENT: return 'secondary';
    case IssueType.TASK: return 'outline';
    default: return 'secondary';
  }
};

const getSeverityColor = (severity: IssueSeverity) => {
  switch (severity) {
    case IssueSeverity.CRITICAL: return 'destructive';
    case IssueSeverity.HIGH: return 'destructive';
    case IssueSeverity.MEDIUM: return 'secondary';
    case IssueSeverity.LOW: return 'outline';
    default: return 'secondary';
  }
};

const getStatusColor = (status: IssueStatus) => {
  switch (status) {
    case IssueStatus.OPEN: return 'secondary';
    case IssueStatus.IN_PROGRESS: return 'default';
    case IssueStatus.READY_FOR_REVIEW: return 'secondary';
    case IssueStatus.RESOLVED: return 'default';
    case IssueStatus.CLOSED: return 'outline';
    case IssueStatus.REOPENED: return 'destructive';
    default: return 'secondary';
  }
};

interface IssueManagementPanelProps {
  issues?: Issue[];
  onIssueCreate?: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onIssueUpdate?: (issueId: string, updates: Partial<Issue>) => void;
  onIssueDelete?: (issueId: string) => void;
}

export const IssueManagementPanel: React.FC<IssueManagementPanelProps> = ({
  issues = [],
  onIssueCreate,
  onIssueUpdate,
  onIssueDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<IssueType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | 'all'>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLinkingDialog, setShowLinkingDialog] = useState(false);

  // Mock data for demonstration
  const mockIssues: Issue[] = [
    {
      id: 'issue-1',
      title: 'Authentication redirect not working in production',
      description: 'After successful login, users are not being redirected to the dashboard. This only happens in production environment.',
      type: IssueType.BUG,
      severity: IssueSeverity.HIGH,
      status: IssueStatus.IN_PROGRESS,
      assignee: 'Developer Team',
      reporter: 'QA Tester',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
      labels: ['authentication', 'production', 'urgent'],
      relatedTasks: ['task-2'],
      linkedIssues: [],
      resolutionAttempts: [
        {
          id: 'attempt-1',
          approach: 'Check environment configuration',
          outcome: 'partial',
          details: 'Found environment variables mismatch, partially fixed',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          performedBy: 'Claude AI',
          timeSpent: 1.5,
          resourcesUsed: ['Environment config', 'Production logs']
        }
      ],
      estimatedHours: 4,
      actualHours: 2
    },
    {
      id: 'issue-2',
      title: 'Add dark mode toggle to user preferences',
      description: 'Users have requested the ability to switch between light and dark themes. This should be persistent across sessions.',
      type: IssueType.FEATURE,
      severity: IssueSeverity.MEDIUM,
      status: IssueStatus.OPEN,
      reporter: 'Product Manager',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      labels: ['ui', 'user-experience', 'theme'],
      relatedTasks: [],
      linkedIssues: [],
      resolutionAttempts: [],
      estimatedHours: 6
    },
    {
      id: 'issue-3',
      title: 'Database connection timeout in production',
      description: 'Random database connection timeouts occurring during peak hours. Affects user experience significantly.',
      type: IssueType.BUG,
      severity: IssueSeverity.CRITICAL,
      status: IssueStatus.RESOLVED,
      assignee: 'Database Team',
      reporter: 'System Monitoring',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      labels: ['database', 'performance', 'critical'],
      relatedTasks: ['task-1'],
      linkedIssues: [],
      resolutionAttempts: [
        {
          id: 'attempt-2',
          approach: 'Optimize database queries and increase connection pool',
          outcome: 'success',
          details: 'Increased connection pool size and optimized slow queries',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
          performedBy: 'Database Team',
          timeSpent: 8,
          resourcesUsed: ['Database logs', 'Performance monitoring', 'Connection pool settings']
        }
      ],
      estimatedHours: 8,
      actualHours: 8
    }
  ];

  const displayIssues = issues.length > 0 ? issues : mockIssues;

  const filteredIssues = displayIssues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || issue.type === filterType;
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;

    return matchesSearch && matchesType && matchesStatus && matchesSeverity;
  });

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} minutes ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} hours ago`;
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))} days ago`;
  };

  const handleCreateIssue = (issueData: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (onIssueCreate) {
      onIssueCreate(issueData);
    }
    setShowCreateDialog(false);
  };

  const handleUpdateIssue = (issueId: string, updates: Partial<Issue>) => {
    if (onIssueUpdate) {
      onIssueUpdate(issueId, updates);
    }
  };

  const handleDeleteIssue = (issueId: string) => {
    if (confirm('Are you sure you want to delete this issue?')) {
      if (onIssueDelete) {
        onIssueDelete(issueId);
      }
    }
  };

  const renderIssueCard = (issue: Issue) => {
    return (
      <Card key={issue.id} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {getIssueTypeIcon(issue.type)}
                <span className="font-medium">{issue.title}</span>
                <Badge variant={getIssueTypeColor(issue.type)} className="text-xs">
                  {issue.type}
                </Badge>
                <Badge variant={getSeverityColor(issue.severity)} className="text-xs">
                  {issue.severity}
                </Badge>
                <Badge variant={getStatusColor(issue.status)} className="text-xs">
                  {issue.status.replace('_', ' ')}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {issue.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {issue.assignee || 'Unassigned'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(issue.updatedAt)}
                </div>
                {issue.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due {formatTimeAgo(issue.dueDate)}
                  </div>
                )}
              </div>

              {issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {issue.labels.map(label => (
                    <Badge key={label} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIssue(issue)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteIssue(issue.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Issue Management
            <Badge variant="outline">
              {filteredIssues.length} of {displayIssues.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Create, track, and manage project issues with resolution tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(IssueType).map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getIssueTypeIcon(type)}
                        {type}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(IssueStatus).map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={(value: any) => setFilterSeverity(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  {Object.values(IssueSeverity).map(severity => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowLinkingDialog(true)}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Link Issues
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Issue
              </Button>
            </div>
          </div>

          {/* Issues List */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bug className="h-12 w-12 mx-auto mb-4" />
                  <p>No issues found matching your criteria</p>
                </div>
              ) : (
                filteredIssues
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .map(issue => renderIssueCard(issue))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Issue Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Report a bug, request a feature, or create a task
            </DialogDescription>
          </DialogHeader>
          <IssueForm
            onSubmit={handleCreateIssue}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Issue Detail Dialog */}
      {selectedIssue && (
        <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <IssueDetail
              issue={selectedIssue}
              onUpdate={(updates) => {
                handleUpdateIssue(selectedIssue.id, updates);
                setSelectedIssue({ ...selectedIssue, ...updates });
              }}
              onClose={() => setSelectedIssue(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Issue Linking Dialog */}
      <Dialog open={showLinkingDialog} onOpenChange={setShowLinkingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Link Issues</DialogTitle>
            <DialogDescription>
              Create relationships between related issues
            </DialogDescription>
          </DialogHeader>
          <IssueLinking
            issues={displayIssues}
            onLink={(sourceId, targetId, linkType) => {
              console.log('Linking issues:', sourceId, targetId, linkType);
              setShowLinkingDialog(false);
            }}
            onCancel={() => setShowLinkingDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
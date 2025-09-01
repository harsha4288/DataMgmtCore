/**
 * Task Detail View - Comprehensive task display with document preview
 * Central view for all task-related information and actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  FileText, 
  MessageSquare, 
  Settings,
  Bug,
  CheckSquare,
  Clock,
  GitBranch,
  ArrowRight,
  Target
} from 'lucide-react';
import { SelectedTask } from '../workspace/UnifiedWorkspace';

interface TaskDetailViewProps {
  task: SelectedTask;
  onPanelToggle: (_content: 'status' | 'issue' | 'document' | 'collaboration') => void;
  onBackToList: () => void;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  onPanelToggle,
  onBackToList
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={onBackToList}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1">
          <h1 className="text-xl font-semibold mb-1">{task.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{task.status}</Badge>
            {task.priority && (
              <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'}>
                {task.priority}
              </Badge>
            )}
            {task.labels?.map((label) => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPanelToggle('status')}>
            <Settings className="h-4 w-4 mr-1" />
            Status
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPanelToggle('issue')}>
            <Bug className="h-4 w-4 mr-1" />
            Issues
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPanelToggle('document')}>
            <FileText className="h-4 w-4 mr-1" />
            Docs
          </Button>
          <Button variant="outline" size="sm" onClick={() => onPanelToggle('collaboration')}>
            <MessageSquare className="h-4 w-4 mr-1" />
            Chat
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Task Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Assignee: {task.assignee || 'Unassigned'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Due: Not set</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created: 2 days ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Progress: 60%</span>
                </div>
              </div>
              <Progress value={60} className="h-2" />
            </CardContent>
          </Card>

          {/* Document Preview Section */}
          {task.documents && task.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attached Documents</CardTitle>
                <CardDescription>
                  Preview and edit documents without losing context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.documents.map((doc) => (
                    <div key={doc.id} className="p-3 border rounded-lg hover:bg-accent/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">{doc.type}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entity Relationships */}
          {task.relationships && task.relationships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Entity Relationships
                </CardTitle>
                <CardDescription>
                  Connected entities and their relationships to this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.relationships.map((relationship) => (
                    <div key={relationship.id} className="p-3 border rounded-lg hover:bg-accent/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-primary">{relationship.sourceEntityId}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-secondary-foreground">{relationship.targetEntityId}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {relationship.relationshipType}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Strength:</span>
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ width: `${relationship.strength * 100}%` }}
                            />
                          </div>
                          <span>{Math.round(relationship.strength * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Impact:</span>
                          <div className="flex-1 bg-muted rounded-full h-1.5">
                            <div 
                              className="bg-destructive h-1.5 rounded-full" 
                              style={{ width: `${relationship.impactScore * 100}%` }}
                            />
                          </div>
                          <span>{Math.round(relationship.impactScore * 100)}%</span>
                        </div>
                      </div>

                      {relationship.notes && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Notes:</span> {relationship.notes}
                        </div>
                      )}

                      {relationship.tags && relationship.tags.length > 0 && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {relationship.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Related Issues</CardTitle>
              <CardDescription>
                Issues linked to this task
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-4">
                No related issues found
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Bug className="h-4 w-4 mr-2" />
                Create Related Issue
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Task created</div>
                    <div className="text-xs text-muted-foreground">2 days ago</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Status updated to In Progress</div>
                    <div className="text-xs text-muted-foreground">1 day ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
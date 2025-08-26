/**
 * Documentation Manager Component
 * Main interface for the configuration-driven documentation system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, FolderOpen, AlertTriangle, BarChart3 } from 'lucide-react';
import { DynamicForm } from './DynamicForm';
import { DocumentationViewer } from './DocumentationViewer';
import { SchemaGenerator } from '@/lib/documentation-system/schemas';
import { FormSchema, QueryResult } from '@/lib/documentation-system/types';

interface DocumentationManagerProps {
  className?: string;
}

export function DocumentationManager({ className }: DocumentationManagerProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<FormSchema | null>(null);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    loadProjectStats();
    loadRecentItems();
  }, []);

  const loadProjectStats = async () => {
    try {
      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetProjectStats {
              getProjectStats {
                total_phases
                total_tasks
                total_issues
                completed_tasks
                in_progress_tasks
                blocked_tasks
                completion_percentage
              }
            }
          `
        })
      });

      const result = await response.json();
      if (result.data?.getProjectStats) {
        setProjectStats(result.data.getProjectStats);
      }
    } catch (error) {
      console.error('Error loading project stats:', error);
    }
  };

  const loadRecentItems = async () => {
    try {
      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetRecentItems {
              getAllTasks {
                id
                name
                status
                progress
                phase_id
                updated_at
              }
              getAllIssues {
                id
                title
                type
                status
                severity
                created_date
              }
            }
          `
        })
      });

      const result = await response.json();
      if (result.data) {
        // Combine and sort by most recent
        const allItems = [
          ...result.data.getAllTasks.map((task: any) => ({
            ...task,
            type: 'task',
            displayName: task.name,
            lastModified: task.updated_at
          })),
          ...result.data.getAllIssues.map((issue: any) => ({
            ...issue,
            type: 'issue',
            displayName: issue.title,
            lastModified: issue.created_date
          }))
        ];

        const sorted = allItems
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
          .slice(0, 10);

        setRecentItems(sorted);
      }
    } catch (error) {
      console.error('Error loading recent items:', error);
    }
  };

  const handleCreateNew = (schemaId: string) => {
    const schema = SchemaGenerator.getSchemaById(schemaId);
    if (schema) {
      setSelectedSchema(schema);
      setShowCreateForm(true);
    }
  };

  const handleFormSubmit = async (data: any, markdown: string): Promise<QueryResult<any>> => {
    try {
      let mutation = '';
      let variables = {};

      switch (selectedSchema?.id) {
        case 'task-creation':
          mutation = `
            mutation CreateTask($input: TaskInput!) {
              createTask(input: $input) {
                success
                error
                task {
                  id
                  name
                  status
                }
                markdown
              }
            }
          `;
          variables = { input: data };
          break;

        case 'phase-creation':
          mutation = `
            mutation CreatePhase($input: PhaseInput!) {
              createPhase(input: $input) {
                success
                error
                phase {
                  id
                  name
                  status
                }
                markdown
              }
            }
          `;
          variables = { input: data };
          break;

        case 'issue-creation':
          mutation = `
            mutation CreateIssue($input: IssueInput!) {
              createIssue(input: $input) {
                success
                error
                issue {
                  id
                  title
                  status
                }
                markdown
              }
            }
          `;
          variables = { input: data };
          break;

        default:
          return {
            data: null,
            success: false,
            error: 'Unknown schema type',
            timestamp: new Date().toISOString()
          };
      }

      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables })
      });

      const result = await response.json();
      
      if (result.errors) {
        return {
          data: null,
          success: false,
          error: result.errors[0].message,
          timestamp: new Date().toISOString()
        };
      }

      const mutationResult = Object.values(result.data)[0] as any;
      
      if (mutationResult.success) {
        setShowCreateForm(false);
        setSelectedSchema(null);
        loadProjectStats();
        loadRecentItems();
      }

      return {
        data: mutationResult.task || mutationResult.phase || mutationResult.issue,
        success: mutationResult.success,
        error: mutationResult.error,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Submission failed',
        timestamp: new Date().toISOString()
      };
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setSelectedSchema(null);
  };

  if (showCreateForm && selectedSchema) {
    return (
      <div className={className}>
        <DynamicForm
          schema={selectedSchema}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {projectStats && (
              <>
                <StatCard
                  title="Total Tasks"
                  value={projectStats.total_tasks}
                  subtitle={`${projectStats.completed_tasks} completed`}
                  icon={<FileText className="h-4 w-4" />}
                />
                <StatCard
                  title="Total Phases"
                  value={projectStats.total_phases}
                  subtitle={`${projectStats.completion_percentage.toFixed(1)}% complete`}
                  icon={<FolderOpen className="h-4 w-4" />}
                />
                <StatCard
                  title="Active Issues"
                  value={projectStats.total_issues}
                  subtitle={`${projectStats.blocked_tasks} blocked`}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  variant="destructive"
                />
                <StatCard
                  title="In Progress"
                  value={projectStats.in_progress_tasks}
                  subtitle="Active work items"
                  icon={<BarChart3 className="h-4 w-4" />}
                  variant="default"
                />
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest tasks and issues in the documentation system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Badge variant={item.type === 'task' ? 'secondary' : 'outline'}>
                        {item.type}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.displayName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.type === 'task' ? `${item.phase_id} • ${item.progress}%` : `${item.severity} severity`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(item.status || item.type)}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
                {recentItems.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No recent activity found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <DocumentationViewer type="task" />
        </TabsContent>

        <TabsContent value="phases">
          <DocumentationViewer type="phase" />
        </TabsContent>

        <TabsContent value="issues">
          <DocumentationViewer type="issue" />
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CreateOptionCard
              title="New Task"
              description="Create a new project task with subtasks and metadata"
              icon={<FileText className="h-6 w-6" />}
              onClick={() => handleCreateNew('task-creation')}
            />
            <CreateOptionCard
              title="New Phase"
              description="Create a new project phase to organize tasks"
              icon={<FolderOpen className="h-6 w-6" />}
              onClick={() => handleCreateNew('phase-creation')}
            />
            <CreateOptionCard
              title="New Issue"
              description="Track QA/UAT issues with resolution attempts"
              icon={<AlertTriangle className="h-6 w-6" />}
              onClick={() => handleCreateNew('issue-creation')}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Supporting components
function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default' 
}: { 
  title: string; 
  value: number; 
  subtitle: string; 
  icon: React.ReactNode; 
  variant?: 'default' | 'destructive'; 
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${variant === 'destructive' ? 'text-destructive' : ''}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-2 rounded-md ${
            variant === 'destructive' 
              ? 'bg-destructive/10 text-destructive' 
              : 'bg-primary/10 text-primary'
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateOptionCard({ 
  title, 
  description, 
  icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  onClick: () => void; 
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'resolved':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'blocked':
    case 'open':
      return 'destructive';
    default:
      return 'outline';
  }
}
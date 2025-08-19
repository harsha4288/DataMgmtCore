import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Circle, 
 
  PlayCircle, 
  MessageSquare, 
  GitBranch, 
  Terminal,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dueDate: string;
  comments: TaskComment[];
  subtasks: Task[];
  dependencies: string[];
  estimatedHours: number;
  actualHours?: number;
}

interface TaskComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'approval' | 'testing' | 'command';
}

interface Phase {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  tasks: Task[];
  startDate: string;
  endDate?: string;
  description: string;
}

const WorkflowDashboard: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: '1',
      name: 'Phase 1: Foundation Setup',
      status: 'in_progress',
      progress: 95,
      description: 'Setting up the core foundation with shadcn/ui components and theme system',
      startDate: '2024-12-01',
      tasks: [
        {
          id: '1.4',
          title: 'Entity System Integration',
          description: 'Port entity system from Prototype 1 and integrate with current architecture',
          status: 'in_progress',
          priority: 'high',
          assignee: 'Claude Code',
          dueDate: '2024-12-20',
          estimatedHours: 8,
          actualHours: 6,
          dependencies: ['1.3.5'],
          comments: [
            {
              id: 'c1',
              author: 'User',
              content: 'Ready to proceed with entity integration. Please ensure theme compatibility.',
              timestamp: '2024-12-19T10:00:00Z',
              type: 'command'
            }
          ],
          subtasks: [
            {
              id: '1.4.1',
              title: 'Define Entity Interfaces',
              description: 'Create TypeScript interfaces for all entities',
              status: 'completed',
              priority: 'medium',
              assignee: 'Claude Code',
              dueDate: '2024-12-20',
              estimatedHours: 2,
              dependencies: [],
              comments: [],
              subtasks: []
            },
            {
              id: '1.4.2',
              title: 'Implement CRUD Operations',
              description: 'Add Create, Read, Update, Delete operations',
              status: 'pending',
              priority: 'high',
              assignee: 'Claude Code',
              dueDate: '2024-12-20',
              estimatedHours: 4,
              dependencies: ['1.4.1'],
              comments: [],
              subtasks: []
            }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Phase 2: Gita Alumni Mock UI',
      status: 'pending',
      progress: 0,
      description: 'Implement wireframes and mockups for Gita Alumni system',
      startDate: '2024-12-21',
      tasks: []
    }
  ]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commandInput, setCommandInput] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleApproval = (taskId: string, approved: boolean) => {
    const comment: TaskComment = {
      id: Date.now().toString(),
      author: 'User',
      content: approved ? 'Task approved for commit' : 'Needs revision before commit',
      timestamp: new Date().toISOString(),
      type: 'approval'
    };

    setPhases(phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => 
        task.id === taskId 
          ? { ...task, comments: [...task.comments, comment] }
          : task
      )
    })));
  };

  const sendCommand = () => {
    if (!commandInput.trim() || !activeTask) return;

    const command: TaskComment = {
      id: Date.now().toString(),
      author: 'User',
      content: commandInput,
      timestamp: new Date().toISOString(),
      type: 'command'
    };

    setPhases(phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => 
        task.id === activeTask.id 
          ? { ...task, comments: [...task.comments, command] }
          : task
      )
    })));

    setCommandInput('');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
              Development Workflow Dashboard
            </h1>
            <p className="text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
              React + shadcn/ui Platform - Claude Code Integration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              Prototype-2-shadcn
            </Badge>
            <Badge variant="secondary">Phase 1 - 95%</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Project Overview */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="phases" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="phases">Phases</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="git">Git Status</TabsTrigger>
              </TabsList>

              <TabsContent value="phases" className="space-y-4">
                {phases.map((phase) => (
                  <Card key={phase.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(phase.status)}
                          {phase.name}
                        </CardTitle>
                        <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                          {phase.progress}%
                        </Badge>
                      </div>
                      <CardDescription>{phase.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        {phase.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            onClick={() => setActiveTask(task)}
                            style={{ borderColor: 'hsl(var(--border))', backgroundColor: activeTask?.id === task.id ? 'hsl(var(--muted))' : 'transparent' }}
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(task.status)}
                              <div>
                                <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>
                                  {task.title}
                                </p>
                                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                                  {task.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              {task.comments.length > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  {task.comments.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Component Reusability</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">85%</div>
                      <p className="text-xs text-muted-foreground">Target: &gt;85%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Quality Gates</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">Passing</div>
                      <p className="text-xs text-muted-foreground">0 errors, 0 warnings</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Task Details & Commands */}
          <div className="space-y-6">
            {activeTask ? (
              <>
                {/* Active Task Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(activeTask.status)}
                      {activeTask.title}
                    </CardTitle>
                    <CardDescription>{activeTask.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      <Badge variant={getPriorityColor(activeTask.priority)}>
                        {activeTask.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estimated</span>
                      <span className="text-sm">{activeTask.estimatedHours}h</span>
                    </div>
                    {activeTask.actualHours && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Actual</span>
                        <span className="text-sm">{activeTask.actualHours}h</span>
                      </div>
                    )}
                    
                    {/* Approval Buttons */}
                    {activeTask.status === 'in_progress' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleApproval(activeTask.id, true)}
                        >
                          Approve & Commit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleApproval(activeTask.id, false)}
                        >
                          Needs Revision
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Subtasks */}
                {activeTask.subtasks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Subtasks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {activeTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3 p-2 border rounded">
                          {getStatusIcon(subtask.status)}
                          <span className="flex-1 text-sm">{subtask.title}</span>
                          <Badge variant="outline" size="sm">
                            {subtask.estimatedHours}h
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Comments & Communications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Comments & Communications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 pr-4">
                      <div className="space-y-3">
                        {activeTask.comments.map((comment) => (
                          <div key={comment.id} className="border-l-2 pl-4 border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <Badge variant="outline" size="sm">
                                {comment.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <Separator className="my-4" />
                    
                    {/* Command Interface */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Terminal className="h-4 w-4 mt-3 text-muted-foreground" />
                        <div className="flex-1">
                          <Input
                            placeholder="Send command to Claude Code..."
                            value={commandInput}
                            onChange={(e) => setCommandInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendCommand()}
                          />
                        </div>
                        <Button onClick={sendCommand} size="sm">
                          Send
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add testing notes or comments..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button variant="outline" size="sm">
                          Comment
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a task to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDashboard;
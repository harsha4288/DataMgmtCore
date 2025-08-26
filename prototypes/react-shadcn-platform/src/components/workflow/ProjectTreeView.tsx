/**
 * Real Project Tree View - connects to GraphQL API (port 3004)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle,
  Clock, 
  AlertTriangle,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Target,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Task {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'on_hold';
  progress: number;
  description?: string;
  metadata?: {
    status: string;
    priority: string;
    assignee?: string;
  };
  subtasks?: Array<{
    id: string;
    name: string;
    completed: boolean;
  }>;
}

interface Phase {
  id: string;
  name: string;
  status: 'completed' | 'active' | 'pending' | 'on_hold';
  progress: number;
  tasks: Task[];
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'active':
    case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
    case 'on_hold': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  }
};

const graphqlQuery = async (query: string) => {
  try {
    const response = await fetch('http://localhost:3004/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) throw new Error(`API unavailable (${response.status})`);
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('GraphQL query failed:', error);
    return null;
  }
};

export const ProjectTreeView: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline'>('offline');

  const loadProjectData = async () => {
    setLoading(true);
    
    const data = await graphqlQuery(`
      query GetAllPhases {
        getAllPhases {
          id name status progress
          tasks { 
            id name status progress description 
            metadata { status priority assignee }
            subtasks { id name completed }
          }
        }
      }
    `);
    
    if (data?.getAllPhases) {
      setPhases(data.getAllPhases);
      setApiStatus('online');
    } else {
      setApiStatus('offline');
      setPhases([]);
    }
    
    setLoading(false);
  };

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  useEffect(() => {
    loadProjectData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Project Data...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (apiStatus === 'offline') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-red-500" />
            GraphQL API Offline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              GraphQL API (port 3004) is not running. Start it with: <code>npm run graphql:server</code>
            </AlertDescription>
          </Alert>
          <Button onClick={loadProjectData} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Project Phases & Tasks
          <Badge variant="outline" className="ml-2">
            <Database className="h-3 w-3 mr-1" />
            Live Data
          </Badge>
        </CardTitle>
        <CardDescription>
          Real project data from GraphQL API
        </CardDescription>
      </CardHeader>
      <CardContent>
        {phases.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No project data available from GraphQL API.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {phases.map((phase) => (
              <div key={phase.id} className="border rounded-lg">
                <div
                  className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => togglePhase(phase.id)}
                >
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedPhases.has(phase.id) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />
                    }
                  </Button>
                  <StatusIcon status={phase.status} />
                  <div className="flex-1">
                    <div className="font-medium">{phase.name}</div>
                    <Progress value={phase.progress} className="h-2 mt-1" />
                  </div>
                  <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                    {phase.progress}%
                  </Badge>
                </div>
                
                {expandedPhases.has(phase.id) && (
                  <div className="border-t p-3 pt-2">
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm pl-6">
                          <StatusIcon status={task.status} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start text-left h-6 px-2"
                            onClick={() => setSelectedTask(task)}
                          >
                            {task.name}
                          </Button>
                          <Badge variant="outline" className="text-xs">
                            {task.progress}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Task Documentation Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StatusIcon status={selectedTask?.status || 'pending'} />
              {selectedTask?.name}
            </DialogTitle>
            <DialogDescription>
              Task ID: {selectedTask?.id} | Progress: {selectedTask?.progress}%
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              {selectedTask.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {selectedTask.description}
                  </p>
                </div>
              )}
              
              {selectedTask.metadata && (
                <div>
                  <h4 className="font-medium mb-2">Metadata</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex gap-2">
                      <span className="font-medium">Status:</span>
                      <span>{selectedTask.metadata.status}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium">Priority:</span>
                      <Badge variant="outline" size="sm">
                        {selectedTask.metadata.priority}
                      </Badge>
                    </div>
                    {selectedTask.metadata.assignee && (
                      <div className="flex gap-2 col-span-2">
                        <span className="font-medium">Assignee:</span>
                        <span>{selectedTask.metadata.assignee}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Subtasks ({selectedTask.subtasks.length})</h4>
                  <div className="space-y-1">
                    {selectedTask.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle className={`h-3 w-3 ${subtask.completed ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                          {subtask.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Click outside to close • Task documentation from GraphQL API
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
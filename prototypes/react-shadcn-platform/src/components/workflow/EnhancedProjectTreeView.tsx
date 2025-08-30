/**
 * Enhanced Project Tree View - Uses structured document viewer instead of basic popups
 * Replaces basic Dialog with comprehensive DocumentViewer
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ChevronRight,
  FileText,
  BookOpen
} from 'lucide-react';
import { DocumentViewer } from './documentation-system/DocumentViewer';

interface Task {
  id: string;
  name: string;
  status: 'completed' | 'in_progress' | 'pending' | 'on_hold';
  progress: number;
  description?: string;
  documentation?: string;
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
  documentation?: string;
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

// Enhanced mock data with documentation content
const enhanceMockData = (phases: Phase[]): Phase[] => {
  return phases.map(phase => ({
    ...phase,
    documentation: `# ${phase.name}

## Overview
This phase focuses on ${phase.name.toLowerCase()} with a current progress of ${phase.progress}%.

## Status: ${phase.status}

### Key Objectives
- Complete all assigned tasks
- Maintain quality standards
- Meet project deadlines

### Current Progress
${phase.progress}% completion rate

### Tasks Overview
This phase contains ${phase.tasks.length} tasks with various priorities and completion states.

## Implementation Notes
${phase.status === 'completed' ? 
  'This phase has been successfully completed with all objectives met.' : 
  'This phase is currently under development with ongoing tasks.'
}

### Next Steps
- Monitor task progress
- Address any blockers
- Ensure quality standards are met
`,
    tasks: phase.tasks.map(task => ({
      ...task,
      documentation: `# ${task.name}

## Task Overview
**Status:** ${task.status}  
**Progress:** ${task.progress}%  
**Priority:** ${task.metadata?.priority || 'Medium'}

## Description
${task.description || 'No description available for this task.'}

## Implementation Details

### Requirements
- Complete the assigned objectives
- Follow established coding standards
- Ensure proper testing coverage

### Progress Tracking
Current completion: ${task.progress}%

${task.subtasks && task.subtasks.length > 0 ? `
### Subtasks
${task.subtasks.map(subtask => 
  `- [${subtask.completed ? 'x' : ' '}] ${subtask.name}`
).join('\n')}
` : ''}

## Metadata
${task.metadata ? Object.entries(task.metadata).map(([key, value]) => 
  `**${key}:** ${value}`
).join('\n') : 'No additional metadata available.'}

## Notes
This task is part of the overall project workflow and contributes to the completion of the parent phase.

${task.status === 'completed' ? 
  '✅ This task has been successfully completed.' : 
  '🔄 This task is currently in progress or pending.'
}
`
    }))
  }));
};

export const EnhancedProjectTreeView: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<{
    type: 'task' | 'phase';
    data: Task | Phase;
  } | null>(null);
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
      const enhancedPhases = enhanceMockData(data.getAllPhases);
      setPhases(enhancedPhases);
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

  const openDocumentViewer = (type: 'task' | 'phase', item: Task | Phase) => {
    setSelectedItem({ type, data: item });
  };

  const closeDocumentViewer = () => {
    setSelectedItem(null);
  };

  const saveDocument = (content: string) => {
    if (selectedItem) {
      // In a real implementation, this would save to the backend
      console.log('Saving document:', {
        type: selectedItem.type,
        id: selectedItem.data.id,
        content
      });
      
      // Update local state
      if (selectedItem.type === 'phase') {
        setPhases(prev => prev.map(phase => 
          phase.id === selectedItem.data.id 
            ? { ...phase, documentation: content }
            : phase
        ));
      } else {
        setPhases(prev => prev.map(phase => ({
          ...phase,
          tasks: phase.tasks.map(task => 
            task.id === selectedItem.data.id
              ? { ...task, documentation: content }
              : task
          )
        })));
      }
    }
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

  // Full-screen document viewer
  if (selectedItem) {
    const { type, data } = selectedItem;
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <DocumentViewer
          documentId={data.id}
          initialContent={(data as any).documentation || '# No documentation available'}
          title={data.name}
          type={type === 'task' ? 'task' : 'phase'}
          onClose={closeDocumentViewer}
          onSave={saveDocument}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Enhanced Project Management
          <Badge variant="outline" className="ml-2">
            <Database className="h-3 w-3 mr-1" />
            Live Data + Rich Docs
          </Badge>
        </CardTitle>
        <CardDescription>
          Interactive project data with structured documentation system
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDocumentViewer('phase', phase);
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    View Docs
                  </Button>
                </div>
                
                {expandedPhases.has(phase.id) && (
                  <div className="border-t p-3 pt-2">
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm pl-6">
                          <StatusIcon status={task.status} />
                          <div className="flex-1">
                            <span className="font-medium">{task.name}</span>
                            {task.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {task.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {task.progress}%
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDocumentViewer('task', task)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Docs
                          </Button>
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
    </Card>
  );
};
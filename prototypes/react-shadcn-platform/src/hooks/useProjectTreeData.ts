import { useState, useEffect, useCallback } from 'react';
import { ProjectEntity } from '@/components/workflow/workspace/ExpandableProjectTree';
import { getGraphQLEndpoint } from '@/lib/config';

interface GraphQLPhase {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  tasks: GraphQLTask[];
}

interface GraphQLTask {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  subtasks: GraphQLSubtask[];
}

interface GraphQLSubtask {
  id: string;
  name: string;
  completed: boolean;
}

export interface UseProjectTreeDataResult {
  projectData: ProjectEntity | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const PHASES_QUERY = `
  query GetAllPhasesWithTasks {
    getAllPhases {
      id
      name
      description
      status
      progress
      tasks {
        id
        name
        description
        status
        progress
        subtasks {
          id
          name
          completed
        }
      }
    }
  }
`;

// Map GraphQL status to ProjectEntity status
const mapStatus = (status: string): ProjectEntity['status'] => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'in_progress';
    case 'pending':
      return 'pending';
    case 'blocked':
      return 'blocked';
    case 'cancelled':
      return 'cancelled';
    case 'ready_for_review':
      return 'ready_for_review';
    case 'in_review':
      return 'in_review';
    case 'approved':
      return 'approved';
    default:
      return 'pending';
  }
};

// Transform GraphQL data to ProjectEntity format
const transformGraphQLToProjectEntity = (phases: GraphQLPhase[]): ProjectEntity => {
  const now = new Date();
  
  // Root project entity
  const rootProject: ProjectEntity = {
    id: 'sgsdatamgmtcore-prototype',
    type: 'project',
    title: 'SGS Data Management Core',
    description: 'Modern unified interface platform with GraphQL backend',
    status: phases.length > 0 ? mapStatus(phases[0].status) : 'in_progress',
    progress: Math.round(phases.reduce((acc, phase) => acc + phase.progress, 0) / phases.length) || 0,
    priority: 'high',
    assignee: 'Development Team',
    dueDate: new Date('2024-12-31'),
    documentsCount: 0,
    issuesCount: 0,
    reviewsCount: 0,
    commentsCount: 0,
    documents: [],
    issues: [],
    reviews: [],
    comments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: now,
    recentActivity: 'Real-time GraphQL data integration',
    lastActivityAt: now,
    children: phases.map(transformPhase)
  };

  // Calculate aggregate stats
  let totalTasks = 0;
  let totalSubtasks = 0;
  let completedTasks = 0;

  const calculateStats = (entity: ProjectEntity) => {
    if (entity.type === 'task') {
      totalTasks++;
      if (entity.status === 'completed') completedTasks++;
    }
    if (entity.type === 'subtask' || entity.type === 'sub-subtask') {
      totalSubtasks++;
    }
    entity.children?.forEach(calculateStats);
  };

  rootProject.children?.forEach(calculateStats);

  // Update root progress based on real data
  rootProject.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  rootProject.documentsCount = totalTasks;
  rootProject.issuesCount = Math.max(1, Math.floor(totalTasks * 0.1));
  rootProject.commentsCount = totalSubtasks;

  return rootProject;
};

const transformPhase = (phase: GraphQLPhase): ProjectEntity => {
  const now = new Date();
  
  return {
    id: phase.id,
    type: 'phase',
    title: phase.name,
    description: phase.description,
    status: mapStatus(phase.status),
    progress: phase.progress,
    priority: phase.progress > 80 ? 'high' : phase.progress > 50 ? 'medium' : 'low',
    assignee: 'Development Team',
    documentsCount: phase.tasks.length,
    issuesCount: phase.tasks.filter(t => t.status === 'blocked').length,
    reviewsCount: phase.tasks.filter(t => t.status === 'in_review').length,
    commentsCount: phase.tasks.reduce((acc, task) => acc + task.subtasks.length, 0),
    documents: [],
    issues: [],
    reviews: [],
    comments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: now,
    recentActivity: `${phase.tasks.filter(t => t.status === 'in_progress').length} tasks in progress`,
    lastActivityAt: now,
    children: phase.tasks.map(task => transformTask(task, phase.id))
  };
};

const transformTask = (task: GraphQLTask, _phaseId: string): ProjectEntity => {
  const now = new Date();
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;
  const taskProgress = task.subtasks.length > 0 
    ? Math.round((completedSubtasks / task.subtasks.length) * 100)
    : task.progress;
  
  return {
    id: task.id,
    type: 'task',
    title: task.name,
    description: task.description,
    status: mapStatus(task.status),
    progress: taskProgress,
    priority: taskProgress > 80 ? 'medium' : 'high',
    assignee: task.status === 'completed' ? 'Team' : 'You',
    dueDate: new Date('2024-12-31'),
    documentsCount: Math.max(1, Math.floor(task.subtasks.length * 0.3)),
    issuesCount: task.subtasks.filter(st => !st.completed).length > 5 ? 1 : 0,
    reviewsCount: task.status === 'completed' ? 1 : 0,
    commentsCount: Math.max(0, task.subtasks.length - 10),
    documents: [],
    issues: [],
    reviews: [],
    comments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: now,
    recentActivity: `${completedSubtasks}/${task.subtasks.length} subtasks completed`,
    lastActivityAt: now,
    children: task.subtasks.map((subtask, index) => transformSubtask(subtask, task.id, index))
  };
};

const transformSubtask = (subtask: GraphQLSubtask, taskId: string, index: number): ProjectEntity => {
  const now = new Date();
  
  return {
    id: subtask.id,
    type: 'subtask',
    title: subtask.name,
    description: `Subtask ${index + 1} of ${taskId}`,
    status: subtask.completed ? 'completed' : 'pending',
    progress: subtask.completed ? 100 : 0,
    priority: 'medium',
    documentsCount: subtask.completed ? 1 : 0,
    issuesCount: 0,
    reviewsCount: 0,
    commentsCount: 0,
    documents: [],
    issues: [],
    reviews: [],
    comments: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: now,
    children: []
  };
};

export const useProjectTreeData = (): UseProjectTreeDataResult => {
  const [projectData, setProjectData] = useState<ProjectEntity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getGraphQLEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: PHASES_QUERY,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(', '));
      }

      const transformedData = transformGraphQLToProjectEntity(result.data.getAllPhases);
      setProjectData(transformedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('GraphQL fetch error:', err);
      
      // Set fallback data so UI doesn't break
      setProjectData({
        id: 'fallback-project',
        type: 'project',
        title: 'SGS Data Management Core (Offline)',
        description: 'GraphQL server unavailable - showing fallback data',
        status: 'blocked',
        progress: 0,
        priority: 'high',
        documentsCount: 0,
        issuesCount: 1,
        reviewsCount: 0,
        commentsCount: 0,
        documents: [],
        issues: [],
        reviews: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        recentActivity: `Error: ${errorMessage}`,
        children: []
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    projectData,
    isLoading,
    error,
    refetch: fetchData
  };
};
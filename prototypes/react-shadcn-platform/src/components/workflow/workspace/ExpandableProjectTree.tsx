/**
 * Minimalist Expandable Project Tree - Phase 0 Implementation
 * Clean hierarchy with progressive disclosure
 * Following December 2024 revision principles:
 * - Minimal by default: Show only essential information in collapsed state
 * - Single navigation source: Tree IS the navigation - remove ALL other navigation methods
 * - Progressive disclosure: Details only on demand, never forced on users
 * - Zero redundancy: Each piece of information appears exactly ONCE
 * - Clean visual hierarchy: Use whitespace, not decorations
 */

import React, { useState, useCallback } from 'react';
import { TreeNode } from './TreeNode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Search, 
  Filter,
  RefreshCw,
  Settings,
  ChevronRight
} from 'lucide-react';

export interface ProjectEntity {
  id: string;
  type: 'project' | 'phase' | 'task' | 'subtask' | 'sub-subtask' | 'issue' | 'document';
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'ready_for_review' | 'in_review' | 'approved' | 'completed' | 'blocked' | 'cancelled';
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  children?: ProjectEntity[];
  
  // Metadata
  documentsCount: number;
  issuesCount: number;
  reviewsCount: number;
  commentsCount: number;
  
  // Related entities
  documents: DocumentRef[];
  issues: IssueRef[];
  reviews: ReviewRef[];
  comments: CommentRef[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Activity
  recentActivity?: string;
  lastActivityAt?: Date;
}

export interface DocumentRef {
  id: string;
  name: string;
  type: 'markdown' | 'json' | 'text';
  lastModified: Date;
  size: number;
}

export interface IssueRef {
  id: string;
  title: string;
  type: 'bug' | 'feature' | 'qa' | 'uat' | 'improvement';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee?: string;
  resolutionAttempts: number;
}

export interface ReviewRef {
  id: string;
  type: 'approval' | 'feedback' | 'qa';
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  reviewer: string;
  createdAt: Date;
}

export interface CommentRef {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  replies: number;
}

export interface TreeExpansionState {
  [entityId: string]: boolean;
}

export interface ExpandableProjectTreeProps {
  projectData?: ProjectEntity;
  entities?: ProjectEntity[];
  selectedEntity?: ProjectEntity | null;
  className?: string;
  showSearch?: boolean;
  showGlobalActions?: boolean;
  showWorkspaceHeader?: boolean;
  onEntitySelect?: (entity: ProjectEntity) => void;
  onEntityUpdate?: (entityId: string, updates: Partial<ProjectEntity>) => void;
  onManageStatus?: (entityId: string) => void;
  onNewTask?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onRefresh?: () => void;
  onSettings?: () => void;
}

export const ExpandableProjectTree: React.FC<ExpandableProjectTreeProps> = ({
  projectData,
  entities,
  selectedEntity: externalSelectedEntity,
  className = '',
  showSearch = false,
  showGlobalActions = false,
  showWorkspaceHeader = false,
  onEntitySelect,
  onEntityUpdate,
  onManageStatus,
  onNewTask,
  onSearch,
  onFilter,
  onRefresh,
  onSettings
}) => {
  // Expansion state for all tree nodes
  const [expansionState, setExpansionState] = useState<TreeExpansionState>({});
  
  // Selected entity for detail view (internal if not controlled)
  const [internalSelectedEntity, setInternalSelectedEntity] = useState<ProjectEntity | null>(null);
  const selectedEntity = externalSelectedEntity !== undefined ? externalSelectedEntity : internalSelectedEntity;
  
  // Use entities prop or convert projectData to array
  const treeData = entities || (projectData ? [projectData] : []);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state  
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Handle node expansion/collapse
  const handleToggleExpansion = useCallback((entityId: string) => {
    setExpansionState(prev => ({
      ...prev,
      [entityId]: !prev[entityId]
    }));
  }, []);


  // Handle entity selection
  const handleEntitySelect = useCallback((entity: ProjectEntity) => {
    if (externalSelectedEntity === undefined) {
      setInternalSelectedEntity(entity);
    }
    onEntitySelect?.(entity);
  }, [onEntitySelect, externalSelectedEntity]);

  // Handle entity updates
  const handleEntityUpdate = useCallback((entityId: string, updates: Partial<ProjectEntity>) => {
    onEntityUpdate?.(entityId, updates);
  }, [onEntityUpdate]);

  // Handle search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  // Calculate quick stats for workspace header
  const getWorkspaceStats = useCallback(() => {
    const countEntities = (entity: ProjectEntity): {
      tasks: number;
      issues: number;
      documents: number;
      inProgress: number;
    } => {
      let stats = {
        tasks: 0,
        issues: entity.issuesCount || 0,
        documents: entity.documentsCount || 0,
        inProgress: entity.status === 'in_progress' ? 1 : 0
      };

      if (entity.type === 'task' || entity.type === 'subtask') {
        stats.tasks = 1;
      }

      if (entity.children) {
        for (const child of entity.children) {
          const childStats = countEntities(child);
          stats.tasks += childStats.tasks;
          stats.issues += childStats.issues;
          stats.documents += childStats.documents;
          stats.inProgress += childStats.inProgress;
        }
      }

      return stats;
    };

    return treeData.reduce((acc, entity) => {
      const stats = countEntities(entity);
      return {
        tasks: acc.tasks + stats.tasks,
        issues: acc.issues + stats.issues,
        documents: acc.documents + stats.documents,
        inProgress: acc.inProgress + stats.inProgress
      };
    }, { tasks: 0, issues: 0, documents: 0, inProgress: 0 });
  }, [treeData]);

  // Workspace header with global actions
  const renderWorkspaceHeader = () => {
    if (!showWorkspaceHeader) return null;

    const stats = getWorkspaceStats();

    return (
      <div className="mb-4 space-y-4">
        {/* Title and Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{treeData[0]?.title || 'Project Tree'}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
              <span>{stats.tasks} tasks</span>
              <span>{stats.inProgress} in progress</span>
              <span>{stats.issues} issues</span>
              <span>{stats.documents} documents</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Global Actions */}
        {showGlobalActions && (
          <div className="flex gap-2">
            <Button size="sm" onClick={onNewTask}>
              <Plus className="h-4 w-4 mr-1" />
              New Task
            </Button>
            <Button size="sm" variant="outline" onClick={onFilter}>
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm" variant="outline" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        )}

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, issues, documents..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-9 h-9"
            />
          </div>
        )}

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {activeFilters.map((filter) => (
              <Badge 
                key={filter} 
                variant="secondary" 
                className="text-xs cursor-pointer"
                onClick={() => setActiveFilters(prev => prev.filter(f => f !== filter))}
              >
                {filter} ×
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };



  return (
    <div className={`w-full ${className}`}>
      {/* Workspace Header with Global Actions (replaces NavigationSidebar functionality) */}
      {renderWorkspaceHeader()}


      {/* Main Tree Structure - No decorative containers */}
      <div className="space-y-0">
        {treeData.map((entity) => (
          <TreeNode
            key={entity.id}
            entity={entity}
            level={0}
            isExpanded={expansionState[entity.id] || false}
            onToggleExpansion={handleToggleExpansion}
            onEntitySelect={handleEntitySelect}
            onEntityUpdate={handleEntityUpdate}
            onManageStatus={onManageStatus}
            isSelected={selectedEntity?.id === entity.id}
            expansionState={expansionState}
            breadcrumbPath={[]}
            onStatusChange={handleEntityUpdate}
            onViewDocuments={() => {}}
            onViewIssues={() => {}}
            onViewReviews={() => {}}
            onEditEntity={() => {}}
            onDeleteEntity={() => {}}
            onDuplicateEntity={() => {}}
            userRole="developer"
          />
        ))}
      </div>
    </div>
  );
};

export default ExpandableProjectTree;
/**
 * Minimalist Tree Node - Phase 0 Implementation
 * Clean hierarchy with progressive disclosure
 * Following December 2024 revision principles:
 * - Minimal by default: Show only essential information
 * - Single navigation source: Tree IS the navigation
 * - Progressive disclosure: Details only on demand
 * - Zero redundancy: Each piece of info appears exactly ONCE
 * - Clean visual hierarchy: Use whitespace, not decorations
 */

import React, { useState, useCallback } from 'react';
import { ProjectEntity, TreeExpansionState } from './ExpandableProjectTree';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineDocumentManager } from '../document/InlineDocumentManager';
import { InlineIssueManager } from '../issue/InlineIssueManager';
import { TreeStatusManagement } from '../status/TreeStatusManagement';
import { TreeReviewSystem } from '../review/TreeReviewSystem';
import { 
  FileText, 
  Bug, 
  GitPullRequest,
  MessageSquare,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers,
  CheckSquare,
  ListTodo,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export interface TreeNodeProps {
  entity: ProjectEntity;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpansion: (entityId: string) => void;
  onEntitySelect: (entity: ProjectEntity) => void;
  onEntityUpdate: (entityId: string, updates: Partial<ProjectEntity>) => void;
  expansionState: TreeExpansionState;
  breadcrumbPath?: ProjectEntity[];
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  entity,
  level,
  isExpanded,
  isSelected,
  onToggleExpansion,
  onEntitySelect,
  onEntityUpdate,
  expansionState,
  breadcrumbPath = []
}) => {
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [activeManager, setActiveManager] = useState<'documents' | 'issues' | 'reviews' | 'status' | null>(null);
  
  const hasChildren = entity.children && entity.children.length > 0;
  const indentationLevel = level * 20; // VS Code-style 20px per level

  // VS Code-style entity type icon
  const getEntityIcon = () => {
    const iconProps = { className: 'h-4 w-4' };
    
    // Determine icon based on entity type and state
    switch (entity.type) {
      case 'project':
        return isExpanded ? <FolderOpen {...iconProps} /> : <Folder {...iconProps} />;
      case 'phase':
        return <Layers {...iconProps} />;
      case 'task':
        return entity.status === 'completed' ? <CheckSquare {...iconProps} /> : <ListTodo {...iconProps} />;
      case 'subtask':
        return entity.status === 'completed' ? <CheckCircle2 {...iconProps} className="h-3.5 w-3.5" /> : <Circle {...iconProps} className="h-3.5 w-3.5" />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  // Status badge with colors
  const getStatusBadge = () => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let icon = null;
    let text = entity.status;
    
    switch (entity.status) {
      case 'completed':
      case 'approved':
        variant = "default";
        icon = <CheckCircle2 className="h-3 w-3" />;
        break;
      case 'in_progress':
      case 'ready_for_review':
      case 'in_review':
        variant = "secondary";
        icon = <Clock className="h-3 w-3" />;
        break;
      case 'blocked':
        variant = "destructive";
        icon = <AlertCircle className="h-3 w-3" />;
        break;
      case 'pending':
      case 'cancelled':
      default:
        variant = "outline";
        icon = <Circle className="h-3 w-3" />;
        break;
    }
    
    return { variant, icon, text };
  };

  // VS Code-style priority coloring
  const getPriorityColor = () => {
    switch (entity.priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  // Format assignee and due date (only if they exist)
  const getMetadataText = () => {
    const parts: string[] = [];
    if (entity.assignee) parts.push(entity.assignee);
    if (entity.dueDate) {
      const date = new Date(entity.dueDate);
      const today = new Date();
      const isOverdue = date < today;
      const dateStr = date.toLocaleDateString();
      parts.push(isOverdue ? `⚠️ Due: ${dateStr}` : `Due: ${dateStr}`);
    }
    return parts.length > 0 ? ` - ${parts.join(', ')}` : '';
  };

  const handleToggleExpansion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpansion(entity.id);
    }
  }, [entity.id, onToggleExpansion, hasChildren]);

  // Handle node selection and detail panel toggle
  const handleNodeClick = useCallback(() => {
    onEntitySelect(entity);
    setShowDetailPanel(!showDetailPanel);
  }, [entity, onEntitySelect, showDetailPanel]);

  // Handle detail panel actions
  const handleDetailPanelClose = useCallback(() => {
    setShowDetailPanel(false);
  }, []);

  // Build current breadcrumb path
  const getCurrentBreadcrumbPath = useCallback(() => {
    return [...breadcrumbPath, entity];
  }, [breadcrumbPath, entity]);

  // Render breadcrumb component
  const renderBreadcrumb = useCallback(() => {
    const currentPath = getCurrentBreadcrumbPath();
    if (currentPath.length <= 1) return null;

    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 px-2 py-1 bg-muted/30 rounded">
        {currentPath.map((pathEntity, index) => (
          <React.Fragment key={pathEntity.id}>
            {index > 0 && <ChevronRight className="h-3 w-3 mx-0.5" />}
            <span className={index === currentPath.length - 1 ? 'text-foreground font-medium' : ''}>
              {pathEntity.title}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }, [getCurrentBreadcrumbPath]);

  // Get contextual actions that launch inline managers
  const getContextualActions = useCallback(() => {
    const actions = [];

    // Document management
    if (entity.documentsCount > 0) {
      actions.push({
        id: 'documents',
        label: `Documents (${entity.documentsCount})`,
        icon: FileText,
        onClick: () => {
          setActiveManager(activeManager === 'documents' ? null : 'documents');
          if (!showDetailPanel) setShowDetailPanel(true);
        }
      });
    }

    // Issue management
    if (entity.issuesCount > 0) {
      actions.push({
        id: 'issues',
        label: `Issues (${entity.issuesCount})`, 
        icon: Bug,
        onClick: () => {
          setActiveManager(activeManager === 'issues' ? null : 'issues');
          if (!showDetailPanel) setShowDetailPanel(true);
        }
      });
    }

    // Review management
    if (entity.reviewsCount > 0) {
      actions.push({
        id: 'reviews',
        label: `Reviews (${entity.reviewsCount})`,
        icon: GitPullRequest,
        onClick: () => {
          setActiveManager(activeManager === 'reviews' ? null : 'reviews');
          if (!showDetailPanel) setShowDetailPanel(true);
        }
      });
    }

    return actions;
  }, [entity, activeManager, showDetailPanel]);

  return (
    <div className="w-full">
      {/* VS Code-style tree node */}
      <div 
        className={`
          group flex items-center py-0.5 px-1 cursor-pointer 
          hover:bg-accent/50 transition-colors
          ${isSelected ? 'bg-accent border-l-2 border-primary' : ''}
        `}
        style={{ paddingLeft: `${indentationLevel}px` }}
        onClick={handleNodeClick}
      >
        {/* VS Code-style expansion chevron */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0 mr-1 hover:bg-transparent text-muted-foreground"
            onClick={handleToggleExpansion}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>
        ) : (
          <div className="w-6" /> // Spacer for alignment
        )}
        
        {/* Entity icon with type-specific coloring */}
        <div className={`mr-2 ${getPriorityColor()}`}>
          {getEntityIcon()}
        </div>
        
        {/* Title and metadata */}
        <div className="flex items-center min-w-0 flex-1 gap-2">
          <span className={`text-sm truncate ${
            entity.type === 'project' ? 'font-semibold' : 
            entity.type === 'phase' ? 'font-medium' : ''
          }`}>
            {entity.title}
          </span>
          
          {/* Progress bar (VS Code extension style) */}
          {entity.progress > 0 && entity.progress < 100 && (
            <div className="flex items-center gap-1.5">
              <Progress 
                value={entity.progress} 
                className="h-1.5 w-16" 
              />
              <span className="text-xs text-muted-foreground">
                {entity.progress}%
              </span>
            </div>
          )}
          
          {/* Status badge */}
          {entity.status !== 'pending' && (
            <Badge 
              variant={getStatusBadge().variant} 
              className="h-5 px-1.5 text-xs gap-0.5"
            >
              {getStatusBadge().icon}
              <span className="ml-1">{getStatusBadge().text}</span>
            </Badge>
          )}
          
          {/* Resource counts (subtle) */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {entity.documentsCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {entity.documentsCount}
              </span>
            )}
            {entity.issuesCount > 0 && (
              <span className="flex items-center gap-1">
                <Bug className="h-3 w-3" />
                {entity.issuesCount}
              </span>
            )}
            {entity.reviewsCount > 0 && (
              <span className="flex items-center gap-1">
                <GitPullRequest className="h-3 w-3" />
                {entity.reviewsCount}
              </span>
            )}
          </div>
        </div>
        
        {/* Due date warning (if overdue) */}
        {entity.dueDate && new Date(entity.dueDate) < new Date() && (
          <AlertCircle className="h-3.5 w-3.5 text-destructive mr-2" title={`Overdue: ${new Date(entity.dueDate).toLocaleDateString()}`} />
        )}
      </div>

      {/* Expanded children */}
      {hasChildren && isExpanded && (
        <div>
          {entity.children?.map((child) => (
            <TreeNode
              key={child.id}
              entity={child}
              level={level + 1}
              isExpanded={expansionState[child.id] || false}
              isSelected={false}
              onToggleExpansion={onToggleExpansion}
              onEntitySelect={onEntitySelect}
              onEntityUpdate={onEntityUpdate}
              expansionState={expansionState}
              breadcrumbPath={getCurrentBreadcrumbPath()}
            />
          ))}
        </div>
      )}

      {/* Progressive disclosure panel with integrated managers */}
      {showDetailPanel && (
        <div className="ml-8 mt-1 mb-2 pl-3 border-l border-border/50">
          <div className="bg-muted/30 rounded-md p-3 space-y-3">
            {/* Context breadcrumb */}
            {renderBreadcrumb()}
            {/* Quick metadata when no manager is active */}
            {!activeManager && (entity.assignee || entity.dueDate) && (
              <div className="grid grid-cols-1 gap-2 text-sm">
                {entity.assignee && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Assigned:</span>
                    <span>{entity.assignee}</span>
                  </div>
                )}
                {entity.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Due:</span>
                    <span>{new Date(entity.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Resource management actions */}
            {getContextualActions().length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Resources
                </div>
                <div className="flex flex-wrap gap-2">
                  {getContextualActions().map((action) => {
                    const Icon = action.icon;
                    const isActive = activeManager === action.id;
                    return (
                      <Button
                        key={action.id}
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className="h-7 text-xs"
                        onClick={action.onClick}
                      >
                        <Icon className="h-3 w-3 mr-1.5" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inline Managers - The key integration */}
            {activeManager === 'documents' && (
              <div className="border-t pt-3">
                <InlineDocumentManager
                  entityId={entity.id}
                  entityType={entity.type === 'phase' ? 'phase' : entity.type === 'task' ? 'task' : 'issue'}
                  documents={entity.documents || []}
                  onCreateDocument={(name, type) => console.log('Create document:', name, type)}
                  onSaveDocument={(docId, content) => console.log('Save document:', docId, content)}
                  onDeleteDocument={(docId) => console.log('Delete document:', docId)}
                />
              </div>
            )}

            {activeManager === 'issues' && (
              <div className="border-t pt-3">
                <InlineIssueManager
                  entityId={entity.id}
                  issues={entity.issues || []}
                  onCreateIssue={(issue) => console.log('Create issue:', issue)}
                  onUpdateIssue={(issueId, updates) => console.log('Update issue:', issueId, updates)}
                />
              </div>
            )}

            {activeManager === 'reviews' && (
              <div className="border-t pt-3">
                <TreeReviewSystem
                  entityId={entity.id}
                  entityType={entity.type}
                  reviews={entity.reviews || []}
                  onCreateReview={(review) => console.log('Create review:', review)}
                  onSubmitReview={(reviewId, decision) => console.log('Submit review:', reviewId, decision)}
                />
              </div>
            )}
            
            {/* Entity actions */}
            {!activeManager && (
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-xs"
                    onClick={() => setActiveManager('status')}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Status
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs"
                  onClick={handleDetailPanelClose}
                >
                  Close
                </Button>
              </div>
            )}

            {/* Status Management */}
            {activeManager === 'status' && (
              <div className="border-t pt-3">
                <TreeStatusManagement
                  entityId={entity.id}
                  currentStatus={entity.status}
                  currentProgress={entity.progress}
                  onStatusUpdate={(status, progress) => {
                    console.log('Update status:', status, progress);
                    onEntityUpdate(entity.id, { status, progress });
                  }}
                />
              </div>
            )}

            {/* Close button when manager is active */}
            {activeManager && (
              <div className="flex justify-end pt-2 border-t border-border">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs"
                  onClick={() => setActiveManager(null)}
                >
                  Back
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 text-xs ml-2"
                  onClick={handleDetailPanelClose}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeNode;
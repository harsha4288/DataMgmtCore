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

import React, { useCallback } from 'react';
import { ProjectEntity, TreeExpansionState } from './ExpandableProjectTree';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TreeNodeContextMenu } from './TreeNodeContextMenu';
import { 
  FileText, 
  Bug, 
  GitPullRequest,
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
  // Context menu handlers
  onStatusChange?: (entityId: string, newStatus: string) => void;
  onViewDocuments?: (entityId: string) => void;
  onViewIssues?: (entityId: string) => void;
  onViewReviews?: (entityId: string) => void;
  onEditEntity?: (entityId: string) => void;
  onDeleteEntity?: (entityId: string) => void;
  onDuplicateEntity?: (entityId: string) => void;
  onManageStatus?: (entityId: string) => void;
  userRole?: 'developer' | 'pm' | 'qa' | 'admin';
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
  breadcrumbPath = [],
  onStatusChange,
  onViewDocuments,
  onViewIssues,
  onViewReviews,
  onEditEntity,
  onDeleteEntity,
  onDuplicateEntity,
  onManageStatus,
  userRole = 'developer'
}) => {
  
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

  // Compact status indicator with tooltip
  const getStatusIndicator = () => {
    let dotColor = 'bg-muted-foreground';
    let icon = null;
    let tooltip = '';
    let showBadge = false;
    
    switch (entity.status) {
      case 'completed':
        dotColor = 'bg-green-500';
        icon = <CheckCircle2 className="h-3 w-3 text-green-500" />;
        tooltip = 'Completed';
        break;
      case 'approved':
        dotColor = 'bg-green-500';
        icon = <CheckCircle2 className="h-3 w-3 text-green-500" />;
        tooltip = 'Approved';
        break;
      case 'in_progress':
        dotColor = 'bg-blue-500';
        icon = <Clock className="h-3 w-3 text-blue-500" />;
        tooltip = 'In Progress';
        showBadge = true;
        break;
      case 'ready_for_review':
        dotColor = 'bg-orange-500';
        icon = <Clock className="h-3 w-3 text-orange-500" />;
        tooltip = 'Ready for Review';
        showBadge = true;
        break;
      case 'in_review':
        dotColor = 'bg-orange-500';
        icon = <Clock className="h-3 w-3 text-orange-500" />;
        tooltip = 'In Review';
        showBadge = true;
        break;
      case 'blocked':
        dotColor = 'bg-red-500';
        icon = <AlertCircle className="h-3 w-3 text-red-500" />;
        tooltip = 'Blocked';
        showBadge = true;
        break;
      case 'cancelled':
        dotColor = 'bg-gray-500';
        icon = <Circle className="h-3 w-3 text-gray-500" />;
        tooltip = 'Cancelled';
        break;
      case 'pending':
      default:
        dotColor = 'bg-muted-foreground/40';
        icon = <Circle className="h-3 w-3 text-muted-foreground" />;
        tooltip = 'Pending';
        break;
    }
    
    return { dotColor, icon, tooltip, showBadge };
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

  // Handle node selection
  const handleNodeClick = useCallback(() => {
    onEntitySelect(entity);
  }, [entity, onEntitySelect]);



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
          
          
          {/* Progress percentage badge (compact) */}
          {entity.progress > 0 && entity.progress < 100 && (
            <Badge variant="outline" className="h-4 px-1.5 text-xs text-muted-foreground">
              {entity.progress}%
            </Badge>
          )}
          
          {/* Compact status indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  {getStatusIndicator().showBadge ? (
                    <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                      {getStatusIndicator().icon}
                    </Badge>
                  ) : (
                    <>
                      <div className={`w-2 h-2 rounded-full ${getStatusIndicator().dotColor}`} />
                      {entity.status === 'completed' || entity.status === 'approved' ? (
                        getStatusIndicator().icon
                      ) : null}
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getStatusIndicator().tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Resource counts and actions (subtle) */}
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
            
            {/* Context menu trigger button */}
            <TreeNodeContextMenu
              entity={entity}
              onStatusChange={onStatusChange}
              onViewDocuments={onViewDocuments}
              onViewIssues={onViewIssues}
              onViewReviews={onViewReviews}
              onEditEntity={onEditEntity}
              onDeleteEntity={onDeleteEntity}
              onDuplicateEntity={onDuplicateEntity}
              onManageStatus={onManageStatus}
              userRole={userRole}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-accent"
                onClick={(e) => e.stopPropagation()}
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </TreeNodeContextMenu>
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
              breadcrumbPath={[...breadcrumbPath, entity]}
              onStatusChange={onStatusChange}
              onViewDocuments={onViewDocuments}
              onViewIssues={onViewIssues}
              onViewReviews={onViewReviews}
              onEditEntity={onEditEntity}
              onDeleteEntity={onDeleteEntity}
              onDuplicateEntity={onDuplicateEntity}
              onManageStatus={onManageStatus}
              userRole={userRole}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default TreeNode;
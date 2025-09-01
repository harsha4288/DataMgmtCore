/**
 * TreeNodeContextMenu - Right-click context menu for tree nodes
 * Provides quick access to status changes and other actions
 * Part of Phase 2 Advanced Feature Integration (Task 5.8.3.1)
 */

import React from 'react';
import { ProjectEntity } from './ExpandableProjectTree';
import { BrowserClaudeContextManager } from '@/lib/context/claude-context-manager';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  FileText,
  Bug,
  GitPullRequest,
  Copy,
  Trash2,
  Edit,
  Target
} from 'lucide-react';

type TaskStatus = 'pending' | 'in_progress' | 'ready_for_review' | 'in_review' | 'approved' | 'completed' | 'blocked' | 'cancelled';

interface TreeNodeContextMenuProps {
  entity: ProjectEntity;
  children: React.ReactNode;
  onStatusChange?: (entityId: string, newStatus: TaskStatus) => void;
  onViewDocuments?: (entityId: string) => void;
  onViewIssues?: (entityId: string) => void;
  onViewReviews?: (entityId: string) => void;
  onEditEntity?: (entityId: string) => void;
  onDeleteEntity?: (entityId: string) => void;
  onDuplicateEntity?: (entityId: string) => void;
  onManageStatus?: (entityId: string) => void;
  onSetAsActive?: (entityId: string) => void;
  userRole?: 'developer' | 'pm' | 'qa' | 'admin';
}

export const TreeNodeContextMenu: React.FC<TreeNodeContextMenuProps> = ({
  entity,
  children,
  onStatusChange,
  onViewDocuments,
  onViewIssues,
  onViewReviews,
  onEditEntity,
  onDeleteEntity,
  onDuplicateEntity,
  onManageStatus,
  onSetAsActive,
  userRole = 'developer'
}) => {

  // Get available status transitions based on current status and user role
  const getAvailableStatusTransitions = (): { status: TaskStatus; label: string; icon: React.ReactNode; allowed: boolean }[] => {
    const allTransitions = [
      { status: 'in_progress' as TaskStatus, label: 'Start Work', icon: <Play className="h-4 w-4" />, allowed: true },
      { status: 'ready_for_review' as TaskStatus, label: 'Ready for Review', icon: <Clock className="h-4 w-4" />, allowed: true },
      { status: 'approved' as TaskStatus, label: 'Approve', icon: <CheckCircle2 className="h-4 w-4" />, allowed: userRole === 'pm' || userRole === 'qa' || userRole === 'admin' },
      { status: 'completed' as TaskStatus, label: 'Mark Complete', icon: <CheckCircle2 className="h-4 w-4" />, allowed: userRole === 'pm' || userRole === 'admin' },
      { status: 'blocked' as TaskStatus, label: 'Mark as Blocked', icon: <AlertCircle className="h-4 w-4" />, allowed: true },
      { status: 'pending' as TaskStatus, label: 'Reset to Pending', icon: <Pause className="h-4 w-4" />, allowed: userRole === 'pm' || userRole === 'admin' },
    ];

    // Filter out current status and return only allowed transitions
    return allTransitions.filter(t => t.status !== entity.status && t.allowed);
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    onStatusChange?.(entity.id, newStatus);
  };

  const handleViewDocuments = () => {
    onViewDocuments?.(entity.id);
  };

  const handleViewIssues = () => {
    onViewIssues?.(entity.id);
  };

  const handleViewReviews = () => {
    onViewReviews?.(entity.id);
  };

  const handleEdit = () => {
    onEditEntity?.(entity.id);
  };

  const handleDelete = () => {
    onDeleteEntity?.(entity.id);
  };

  const handleDuplicate = () => {
    onDuplicateEntity?.(entity.id);
  };

  const handleManageStatus = () => {
    onManageStatus?.(entity.id);
  };

  const handleSetAsActive = async () => {
    try {
      const contextManager = BrowserClaudeContextManager.getInstance();
      await contextManager.setActiveEntity({
        id: entity.id,
        type: entity.type,
        title: entity.title,
        description: entity.description || '',
        status: entity.status,
        priority: entity.priority,
        assignedTo: entity.assignedTo,
        boardId: entity.boardId,
        metadata: entity.metadata || {},
        createdAt: entity.createdAt || new Date().toISOString(),
        updatedAt: entity.updatedAt || new Date().toISOString()
      });
      
      toast.success(`Set "${entity.title}" as active task for Claude CLI`);
      onSetAsActive?.(entity.id);
    } catch (error) {
      console.error('Failed to set active task:', error);
      toast.error('Failed to set active task');
    }
  };

  const availableTransitions = getAvailableStatusTransitions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="right" sideOffset={5}>
        {/* Quick Status Changes */}
        {availableTransitions.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Settings className="h-4 w-4 mr-2" />
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              {availableTransitions.map((transition) => (
                <DropdownMenuItem 
                  key={transition.status}
                  onClick={() => handleStatusChange(transition.status)}
                  className="flex items-center"
                >
                  {transition.icon}
                  <span className="ml-2">{transition.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {availableTransitions.length > 0 && <DropdownMenuSeparator />}

        {/* View Actions */}
        {entity.documentsCount > 0 && (
          <DropdownMenuItem onClick={handleViewDocuments}>
            <FileText className="h-4 w-4 mr-2" />
            View Documents ({entity.documentsCount})
          </DropdownMenuItem>
        )}

        {entity.issuesCount > 0 && (
          <DropdownMenuItem onClick={handleViewIssues}>
            <Bug className="h-4 w-4 mr-2" />
            View Issues ({entity.issuesCount})
          </DropdownMenuItem>
        )}

        {entity.reviewsCount > 0 && (
          <DropdownMenuItem onClick={handleViewReviews}>
            <GitPullRequest className="h-4 w-4 mr-2" />
            View Reviews ({entity.reviewsCount})
          </DropdownMenuItem>
        )}

        {(entity.documentsCount > 0 || entity.issuesCount > 0 || entity.reviewsCount > 0) && <DropdownMenuSeparator />}

        {/* Claude Integration */}
        <DropdownMenuItem onClick={handleSetAsActive}>
          <Target className="h-4 w-4 mr-2" />
          Set as Active Task
        </DropdownMenuItem>

        {/* Status Management */}
        <DropdownMenuItem onClick={handleManageStatus}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Status & History
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Entity Actions */}
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit {entity.type}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicate {entity.type}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {(userRole === 'pm' || userRole === 'admin') && (
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {entity.type}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TreeNodeContextMenu;
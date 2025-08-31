/**
 * BreadcrumbNavigation - Shows current navigation path
 * Phase 1.3 Implementation (Task 5.8.3.1)
 * Provides visual context of current selection within tree hierarchy
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';
import { ProjectEntity } from './ExpandableProjectTree';

interface BreadcrumbNavigationProps {
  currentPath: ProjectEntity[];
  onNavigate: (entity: ProjectEntity) => void;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  currentPath,
  onNavigate,
  className = ''
}) => {
  if (currentPath.length === 0) {
    return null;
  }

  const getStatusIcon = (status: ProjectEntity['status']) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '→';
      case 'blocked': return '⚠️';
      case 'cancelled': return '✕';
      default: return '○';
    }
  };

  const getTypeColor = (type: ProjectEntity['type']) => {
    switch (type) {
      case 'project': return 'text-blue-600 hover:text-blue-700';
      case 'phase': return 'text-green-600 hover:text-green-700';
      case 'task': return 'text-orange-600 hover:text-orange-700';
      case 'subtask': return 'text-purple-600 hover:text-purple-700';
      default: return 'text-muted-foreground hover:text-foreground';
    }
  };

  return (
    <nav className={`flex items-center space-x-1 py-2 px-3 bg-muted/30 border-b text-sm ${className}`} aria-label="Breadcrumb">
      {/* Home/Root indicator */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => onNavigate(currentPath[0])}
      >
        <Home className="h-3 w-3" />
      </Button>

      {/* Breadcrumb path */}
      {currentPath.map((entity, index) => (
        <React.Fragment key={entity.id}>
          {index > 0 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 font-medium truncate max-w-[200px] ${getTypeColor(entity.type)}`}
            onClick={() => onNavigate(entity)}
            title={`${entity.type}: ${entity.title}`}
          >
            <span className="mr-1">
              {getStatusIcon(entity.status)}
            </span>
            <span className="truncate">
              {entity.title}
            </span>
            {index === currentPath.length - 1 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({entity.type})
              </span>
            )}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};
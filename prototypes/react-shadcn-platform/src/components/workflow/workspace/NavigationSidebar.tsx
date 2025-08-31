/**
 * Navigation Sidebar - Fixed left navigation with contextual actions
 * Replaces fragmented tabs with unified navigation
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Home,
  CheckSquare, 
  List, 
  Bug, 
  FileText, 
  Shield, 
  BarChart3,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { WorkspaceView, SelectedTask } from './UnifiedWorkspace';

interface NavigationItem {
  id: WorkspaceView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  { id: 'overview', label: 'Project Tree', icon: Home },
  { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare, badge: 3 },
  { id: 'all-tasks', label: 'All Tasks', icon: List, badge: 12 },
  { id: 'issues', label: 'Issues', icon: Bug, badge: 5 },
  { id: 'documentation', label: 'Documentation', icon: FileText },
  { id: 'quality', label: 'Quality', icon: Shield },
  { id: 'reports', label: 'Reports', icon: BarChart3 }
];

interface NavigationSidebarProps {
  currentView: WorkspaceView;
  onNavigationChange: (_view: WorkspaceView) => void;
  selectedTask: SelectedTask | null;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentView,
  onNavigationChange,
  selectedTask
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Project Workspace</h2>
        <p className="text-sm text-muted-foreground">Real Data Management</p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Button className="w-full justify-start" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="flex-1">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      <Separator />

      {/* Navigation Items */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start h-9"
                onClick={() => onNavigationChange(item.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge 
                    variant={isActive ? "default" : "secondary"} 
                    className="ml-2 px-1.5 h-4 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Task Context */}
      {selectedTask && (
        <>
          <Separator />
          <div className="p-3 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Selected Task</div>
            <div className="text-sm font-medium line-clamp-2 mb-2">
              {selectedTask.title}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-1.5">
                {selectedTask.status}
              </Badge>
              {selectedTask.priority && (
                <Badge 
                  variant={selectedTask.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs px-1.5"
                >
                  {selectedTask.priority}
                </Badge>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        <div>Last updated: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
};
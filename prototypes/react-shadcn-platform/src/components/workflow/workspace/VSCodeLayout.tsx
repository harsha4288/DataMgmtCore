/**
 * VS Code-style 3-Panel Layout
 * Left: Navigation Tree | Center: Content View | Right: Properties/Actions
 * Mobile-responsive with collapsible panels
 * Phase 5.8.3.1 - Navigation Flow Architecture
 */

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DocumentContentViewer } from '../document/DocumentContentViewer';
import { InlineIssueManager } from '../issue/InlineIssueManager';
import { TreeStatusManagement } from '../status/TreeStatusManagement';
import { TreeReviewSystem } from '../review/TreeReviewSystem';
import { ExpandableProjectTree } from './ExpandableProjectTree';
import {
  PanelLeft,
  PanelRight,
  Menu,
  X,
  FileText,
  Bug,
  GitPullRequest,
  Settings,
  User,
  Calendar,
  Clock,
  Target,
  Layers
} from 'lucide-react';

interface ProjectEntity {
  id: string;
  type: 'project' | 'phase' | 'task' | 'subtask';
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'blocked';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: Date;
  documentsCount: number;
  issuesCount: number;
  reviewsCount: number;
  commentsCount: number;
  children?: ProjectEntity[];
}

interface VSCodeLayoutProps {
  entities: ProjectEntity[];
  className?: string;
}

export const VSCodeLayout: React.FC<VSCodeLayoutProps> = ({
  entities,
  className = ''
}) => {
  const [selectedEntity, setSelectedEntity] = useState<ProjectEntity | null>(null);
  const [activeView, setActiveView] = useState<'documents' | 'issues' | 'reviews' | 'status' | null>('documents');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const handleEntitySelect = useCallback((entity: ProjectEntity) => {
    setSelectedEntity(entity);
    setMobilePanelOpen(false); // Close mobile panel when selecting
  }, []);

  const renderCenterContent = () => {
    if (!selectedEntity) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-2">
            <Layers className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-sm">Select an item from the tree to view details</p>
            <p className="text-xs">Choose a project, phase, task, or subtask to get started</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'documents':
        return (
          <DocumentContentViewer
            entityId={selectedEntity.id}
            entityType={selectedEntity.type as any}
            className="h-full"
          />
        );
      case 'issues':
        return (
          <InlineIssueManager
            entityId={selectedEntity.id}
            entityType={selectedEntity.type as any}
            className="h-full"
          />
        );
      case 'reviews':
        return (
          <TreeReviewSystem
            entityId={selectedEntity.id}
            entityType={selectedEntity.type}
            className="h-full"
          />
        );
      case 'status':
        return (
          <TreeStatusManagement
            entityId={selectedEntity.id}
            entityType={selectedEntity.type}
            className="h-full"
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a view from the right panel</p>
          </div>
        );
    }
  };

  const renderRightPanel = () => {
    if (!selectedEntity) return null;

    const getStatusColor = () => {
      switch (selectedEntity.status) {
        case 'completed': case 'approved': return 'default';
        case 'in_progress': case 'ready_for_review': return 'secondary';
        case 'blocked': return 'destructive';
        default: return 'outline';
      }
    };

    const getPriorityColor = () => {
      switch (selectedEntity.priority) {
        case 'critical': return 'destructive';
        case 'high': return 'destructive';
        case 'medium': return 'secondary';
        default: return 'outline';
      }
    };

    return (
      <div className="h-full flex flex-col">
        {/* Entity Header */}
        <div className="p-4 border-b">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm truncate">{selectedEntity.title}</h3>
              <p className="text-xs text-muted-foreground capitalize">{selectedEntity.type}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor()}>{selectedEntity.status}</Badge>
                <Badge variant={getPriorityColor()}>{selectedEntity.priority}</Badge>
              </div>
              
              {selectedEntity.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{selectedEntity.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      style={{ width: `${selectedEntity.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Entity Details */}
        <div className="p-4 border-b space-y-3">
          {selectedEntity.assignee && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Assigned:</span>
              <span>{selectedEntity.assignee}</span>
            </div>
          )}
          
          {selectedEntity.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span className={new Date(selectedEntity.dueDate) < new Date() ? 'text-destructive' : ''}>
                {new Date(selectedEntity.dueDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* View Navigation */}
        <div className="p-4 border-b">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Views
          </h4>
          <div className="space-y-1">
            <Button
              variant={activeView === 'documents' ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => setActiveView('documents')}
            >
              <FileText className="h-3.5 w-3.5 mr-2" />
              Documents ({selectedEntity.documentsCount})
            </Button>
            <Button
              variant={activeView === 'issues' ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => setActiveView('issues')}
            >
              <Bug className="h-3.5 w-3.5 mr-2" />
              Issues ({selectedEntity.issuesCount})
            </Button>
            <Button
              variant={activeView === 'reviews' ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => setActiveView('reviews')}
            >
              <GitPullRequest className="h-3.5 w-3.5 mr-2" />
              Reviews ({selectedEntity.reviewsCount})
            </Button>
            <Button
              variant={activeView === 'status' ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start h-8"
              onClick={() => setActiveView('status')}
            >
              <Settings className="h-3.5 w-3.5 mr-2" />
              Status & History
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h4>
          <div className="space-y-1">
            <Button variant="outline" size="sm" className="w-full justify-start h-8">
              <Target className="h-3.5 w-3.5 mr-2" />
              Set Priority
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start h-8">
              <Clock className="h-3.5 w-3.5 mr-2" />
              Update Due Date
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start h-8">
              <User className="h-3.5 w-3.5 mr-2" />
              Reassign
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Desktop: Left Panel - Navigation Tree */}
      <div className={`
        hidden md:flex flex-col border-r transition-all duration-200
        ${leftPanelOpen ? 'w-80' : 'w-0 overflow-hidden'}
      `}>
        <div className="flex items-center justify-between p-2 border-b bg-muted/20">
          <h2 className="font-semibold text-sm">Explorer</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <ExpandableProjectTree
            entities={entities}
            onEntitySelect={handleEntitySelect}
            selectedEntity={selectedEntity}
            className="p-2"
          />
        </ScrollArea>
      </div>

      {/* Mobile: Navigation Sheet */}
      <Sheet open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-2 left-2 z-50 h-8 w-8 p-0 bg-background/80 backdrop-blur"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-sm">Explorer</h2>
          </div>
          <ScrollArea className="h-full">
            <ExpandableProjectTree
              entities={entities}
              onEntitySelect={handleEntitySelect}
              selectedEntity={selectedEntity}
              className="p-4"
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Center Panel - Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-2 border-b bg-muted/10">
          <div className="ml-12"> {/* Space for menu button */}
            {selectedEntity ? (
              <h2 className="font-medium text-sm truncate">{selectedEntity.title}</h2>
            ) : (
              <h2 className="font-medium text-sm">Select an item</h2>
            )}
          </div>
          {selectedEntity && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
            >
              <PanelRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4">
          {renderCenterContent()}
        </div>
      </div>

      {/* Desktop: Right Panel - Properties */}
      <div className={`
        hidden md:flex flex-col border-l transition-all duration-200
        ${rightPanelOpen && selectedEntity ? 'w-80' : 'w-0 overflow-hidden'}
      `}>
        {rightPanelOpen && (
          <>
            <div className="flex items-center justify-between p-2 border-b bg-muted/20">
              <h2 className="font-semibold text-sm">Properties</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
              >
                <PanelRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              {renderRightPanel()}
            </ScrollArea>
          </>
        )}
      </div>

      {/* Mobile: Properties Sheet */}
      {selectedEntity && (
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden fixed bottom-4 right-4 h-10 w-10 p-0 rounded-full bg-primary text-primary-foreground shadow-lg"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-sm">Properties</h2>
            </div>
            <ScrollArea className="h-full">
              {renderRightPanel()}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Panel Toggle Buttons (when panels are closed) */}
      {!leftPanelOpen && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex fixed top-2 left-2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur"
          onClick={() => setLeftPanelOpen(true)}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}

      {!rightPanelOpen && selectedEntity && (
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex fixed top-2 right-2 z-10 h-8 w-8 p-0 bg-background/80 backdrop-blur"
          onClick={() => setRightPanelOpen(true)}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default VSCodeLayout;
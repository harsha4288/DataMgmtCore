/**
 * Contextual Panel - Dynamic slide-in panels for task-related actions
 * Provides contextual actions without losing main view context
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Settings, 
  Bug, 
  FileText, 
  MessageSquare,
  CheckSquare,
  User,
  Calendar,
  Tag
} from 'lucide-react';
import { SelectedTask } from './UnifiedWorkspace';

type PanelContent = 'status' | 'issue' | 'document' | 'collaboration' | null;

interface ContextualPanelProps {
  isOpen: boolean;
  content: PanelContent;
  selectedTask: SelectedTask | null;
  onClose: () => void;
  onContentChange: (_content: PanelContent) => void;
}

export const ContextualPanel: React.FC<ContextualPanelProps> = ({
  isOpen,
  content,
  selectedTask,
  onClose,
  onContentChange
}) => {
  if (!isOpen || !selectedTask) return null;

  const panelTabs = [
    { id: 'status' as const, label: 'Status', icon: Settings },
    { id: 'issue' as const, label: 'Issues', icon: Bug },
    { id: 'document' as const, label: 'Docs', icon: FileText },
    { id: 'collaboration' as const, label: 'Chat', icon: MessageSquare }
  ];

  const renderContent = () => {
    switch (content) {
      case 'status':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Task Status</h3>
              <Badge variant="outline">{selectedTask.status}</Badge>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Reassign
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Set Deadline
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Labels
                </Button>
              </div>
            </div>
          </div>
        );

      case 'issue':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Related Issues</h3>
              <p className="text-sm text-muted-foreground">No issues found</p>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              <Bug className="h-4 w-4 mr-2" />
              Create New Issue
            </Button>
          </div>
        );

      case 'document':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Attached Documents</h3>
              {selectedTask.documents?.length ? (
                <div className="space-y-2">
                  {selectedTask.documents.map((doc) => (
                    <div key={doc.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-muted-foreground">{doc.type}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents attached</p>
              )}
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Attach Document
            </Button>
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Comments</h3>
              <p className="text-sm text-muted-foreground">No comments yet</p>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a tab above to begin</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">Task Actions</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Task Summary */}
      <div className="p-4 bg-muted/30 border-b">
        <h3 className="font-medium text-sm mb-1">{selectedTask.title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {selectedTask.status}
          </Badge>
          {selectedTask.priority && (
            <Badge 
              variant={selectedTask.priority === 'high' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {selectedTask.priority}
            </Badge>
          )}
        </div>
      </div>

      {/* Panel Tabs */}
      <div className="flex border-b">
        {panelTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={content === tab.id ? "secondary" : "ghost"}
              size="sm"
              className="flex-1 rounded-none"
              onClick={() => onContentChange(tab.id)}
            >
              <Icon className="h-4 w-4 mr-1" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Panel Content */}
      <ScrollArea className="flex-1 p-4">
        {renderContent()}
      </ScrollArea>
    </div>
  );
};
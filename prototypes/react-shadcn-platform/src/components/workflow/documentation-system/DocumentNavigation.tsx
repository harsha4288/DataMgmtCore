/**
 * Document Navigation - Tree navigation sidebar
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen
} from 'lucide-react';

interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string;
}

interface DocumentNavigationProps {
  sections: DocumentSection[];
  activeSection: string;
  onSectionSelect: (sectionId: string) => void;
}

export const DocumentNavigation: React.FC<DocumentNavigationProps> = ({
  sections,
  activeSection,
  onSectionSelect
}) => {
  const renderSection = (section: DocumentSection, index: number) => {
    const isActive = activeSection === section.id;
    const indentLevel = Math.max(0, section.level - 1);
    
    return (
      <div key={section.id} className="w-full">
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          size="sm"
          className={`w-full justify-start text-left h-auto p-2 ${
            isActive ? 'bg-accent' : 'hover:bg-accent/50'
          }`}
          style={{ paddingLeft: `${8 + (indentLevel * 16)}px` }}
          onClick={() => onSectionSelect(section.id)}
        >
          <div className="flex items-center gap-2 w-full min-w-0">
            <FileText className="h-3 w-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {section.title}
              </div>
              <div className="text-xs text-muted-foreground">
                Level {section.level} • {section.content.length} chars
              </div>
            </div>
            {isActive && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </div>
        </Button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-medium text-sm">Document Sections</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {sections.length} sections found
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {sections.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">
              No sections found in document
            </div>
          ) : (
            sections.map((section, index) => renderSection(section, index))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
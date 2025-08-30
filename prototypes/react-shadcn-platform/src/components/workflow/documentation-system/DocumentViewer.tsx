/**
 * Document Viewer - Rich document viewing and editing interface
 * Replaces basic popups with comprehensive document management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Edit3,
  Eye,
  History,
  Download,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Save,
  X
} from 'lucide-react';
import { DocumentEditor } from './DocumentEditor';
import { DocumentNavigation } from './DocumentNavigation';
import { DocumentSearch } from './DocumentSearch';
import { DocumentHistory } from './DocumentHistory';
import { DocumentExport } from './DocumentExport';

interface DocumentViewerProps {
  documentId?: string;
  initialContent?: string;
  title?: string;
  type?: 'task' | 'phase' | 'issue' | 'documentation';
  onClose?: () => void;
  onSave?: (content: string) => void;
}

interface DocumentSection {
  id: string;
  title: string;
  level: number;
  content: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  initialContent = '',
  title = 'Untitled Document',
  type = 'documentation',
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('view');
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Parse document into sections for navigation
  useEffect(() => {
    const parsedSections = parseDocumentSections(content);
    setSections(parsedSections);
    if (parsedSections.length > 0 && !activeSection) {
      setActiveSection(parsedSections[0].id);
    }
  }, [content, activeSection]);

  const parseDocumentSections = (text: string): DocumentSection[] => {
    const lines = text.split('\n');
    const sections: DocumentSection[] = [];
    let currentSection = '';
    let sectionContent = '';

    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            id: `section-${sections.length}`,
            title: currentSection,
            level: headerMatch[1].length,
            content: sectionContent.trim()
          });
        }
        // Start new section
        currentSection = headerMatch[2];
        sectionContent = '';
      } else {
        sectionContent += line + '\n';
      }
    });

    // Add final section
    if (currentSection) {
      sections.push({
        id: `section-${sections.length}`,
        title: currentSection,
        level: 1,
        content: sectionContent.trim()
      });
    }

    return sections;
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirm) return;
    }
    setContent(initialContent);
    setHasUnsavedChanges(false);
    setIsEditing(false);
  };

  const getTypeIcon = (docType: string) => {
    switch (docType) {
      case 'task': return <FileText className="h-4 w-4" />;
      case 'phase': return <BookOpen className="h-4 w-4" />;
      case 'issue': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const renderDocumentContent = () => {
    if (activeTab === 'edit' || isEditing) {
      return (
        <DocumentEditor
          content={content}
          onChange={handleContentChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <div className="prose prose-sm max-w-none">
        <div 
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ 
            __html: content.replace(/\n/g, '<br>').replace(/#{1,6}\s+([^\n]+)/g, (match, text, offset, string) => {
              const level = match.match(/^#{1,6}/)?.[0].length || 1;
              return `<h${level} class="font-semibold text-lg mt-4 mb-2">${text}</h${level}>`;
            })
          }}
        />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {getTypeIcon(type)}
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {documentId && (
              <p className="text-sm text-muted-foreground">Document ID: {documentId}</p>
            )}
          </div>
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="ml-2">Unsaved</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchVisible(!searchVisible)}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {searchVisible && (
        <div className="border-b p-4">
          <DocumentSearch
            content={content}
            onSearchResults={(results) => {
              console.log('Search results:', results);
            }}
          />
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Navigation Sidebar */}
        {sections.length > 0 && (
          <div className="w-64 border-r">
            <DocumentNavigation
              sections={sections}
              activeSection={activeSection}
              onSectionSelect={setActiveSection}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
              <TabsTrigger value="view">
                <Eye className="h-4 w-4 mr-1" />
                View
              </TabsTrigger>
              <TabsTrigger value="edit">
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-1" />
                History
              </TabsTrigger>
              <TabsTrigger value="export">
                <Download className="h-4 w-4 mr-1" />
                Export
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 p-4">
              <TabsContent value="view" className="h-full m-0">
                <ScrollArea className="h-full">
                  {renderDocumentContent()}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="edit" className="h-full m-0">
                <DocumentEditor
                  content={content}
                  onChange={handleContentChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </TabsContent>

              <TabsContent value="history" className="h-full m-0">
                <DocumentHistory
                  documentId={documentId || ''}
                  onVersionSelect={(version) => {
                    setContent(version.content);
                  }}
                />
              </TabsContent>

              <TabsContent value="export" className="h-full m-0">
                <DocumentExport
                  content={content}
                  title={title}
                  format="markdown"
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      {isEditing && (
        <div className="border-t p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
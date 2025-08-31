/**
 * ContextualDocumentPreview - Document preview and editing within task detail view
 * Part of the unified workspace model (Task 5.8.3.1)
 * Consolidates functionality from DocumentViewer and DocumentEditor
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Edit3,
  Eye,
  History,
  Download,
  Save,
  X
} from 'lucide-react';

interface ContextualDocumentPreviewProps {
  documentId?: string;
  documentName?: string;
  content?: string;
  className?: string;
  editable?: boolean;
  onSave?: (content: string) => void;
  onClose?: () => void;
  type?: 'task' | 'phase' | 'issue' | 'documentation';
}

interface DocumentVersion {
  id: string;
  content: string;
  timestamp: string;
  author: string;
  changes?: string;
}

export const ContextualDocumentPreview: React.FC<ContextualDocumentPreviewProps> = ({
  documentId,
  documentName = 'Document',
  content = '',
  className = '',
  editable = false,
  onSave,
  onClose,
  type = 'documentation'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [activeTab, setActiveTab] = useState('preview');
  const [versions] = useState<DocumentVersion[]>([
    {
      id: '1',
      content: content,
      timestamp: new Date().toISOString(),
      author: 'Current User',
      changes: 'Initial version'
    }
  ]);

  const handleSave = () => {
    if (onSave) {
      onSave(editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const exportDocument = (format: 'md' | 'html' | 'pdf') => {
    // Implementation for document export
    console.log(`Exporting ${documentName} as ${format}`);
  };

  return (
    <Card data-testid="document-preview" className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {documentName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {type}
            </Badge>
            {documentId && (
              <Badge variant="secondary" className="text-xs font-mono">
                {documentId}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editable && (
            <>
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave} className="h-8">
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel} className="h-8">
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)} className="h-8">
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Preview
            </TabsTrigger>
            {editable && (
              <TabsTrigger value="edit" className="flex items-center gap-1" disabled={!isEditing}>
                <Edit3 className="h-3 w-3" />
                Edit
              </TabsTrigger>
            )}
            <TabsTrigger value="history" className="flex items-center gap-1">
              <History className="h-3 w-3" />
              History
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              Export
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="mt-4">
            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="prose max-w-none">
                {(isEditing ? editContent : content) ? (
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: (isEditing ? editContent : content).replace(/\n/g, '<br />') 
                    }} 
                  />
                ) : (
                  <p className="text-muted-foreground text-sm">No content available</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {editable && (
            <TabsContent value="edit" className="mt-4">
              <div className="space-y-4">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Enter document content..."
                  className="min-h-96 font-mono text-sm"
                  data-testid="document-editor"
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {editContent.length} characters
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Save className="h-3 w-3 mr-1" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        Version {versions.length - index}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(version.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">By {version.author}</p>
                    {version.changes && (
                      <p className="text-sm">{version.changes}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="export" className="mt-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Export Options</h4>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => exportDocument('md')}
                  variant="outline" 
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Markdown
                </Button>
                <Button 
                  onClick={() => exportDocument('html')}
                  variant="outline" 
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as HTML
                </Button>
                <Button 
                  onClick={() => exportDocument('pdf')}
                  variant="outline" 
                  className="justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContextualDocumentPreview;
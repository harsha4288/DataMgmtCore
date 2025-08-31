/**
 * InlineDocumentManager - Document management within tree nodes
 * Part of Phase 2 Advanced Feature Integration (Task 5.8.3.1)
 * Provides rich document viewing, editing, and management within expanded tree nodes
 */

import React, { useState } from 'react';
import { ContextualDocumentPreview } from './ContextualDocumentPreview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  FolderOpen
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'specification' | 'documentation' | 'task' | 'implementation';
  content: string;
  lastModified: string;
  author: string;
  size?: number;
  status: 'draft' | 'review' | 'approved' | 'archived';
}

interface InlineDocumentManagerProps {
  entityId: string;
  entityType: 'task' | 'phase' | 'issue';
  documents?: Document[];
  onCreateDocument?: (name: string, type: Document['type']) => void;
  onSaveDocument?: (documentId: string, content: string) => void;
  onDeleteDocument?: (documentId: string) => void;
  className?: string;
}

export const InlineDocumentManager: React.FC<InlineDocumentManagerProps> = ({
  entityId,
  entityType,
  documents = [],
  onCreateDocument,
  onSaveDocument,
  onDeleteDocument,
  className = ''
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  // Mock documents if none provided
  const mockDocuments: Document[] = documents.length > 0 ? documents : [
    {
      id: `${entityId}-spec`,
      name: 'Requirements Specification',
      type: 'specification',
      content: '# Requirements Specification\n\nThis document outlines the requirements for this task.',
      lastModified: new Date().toISOString(),
      author: 'Project Team',
      status: 'approved'
    },
    {
      id: `${entityId}-tech`,
      name: 'Technical Documentation',
      type: 'documentation',
      content: '# Technical Documentation\n\nArchitecture and technical implementation details.',
      lastModified: new Date().toISOString(),
      author: 'Technical Lead',
      status: 'review'
    },
    {
      id: `${entityId}-impl`,
      name: 'Implementation Guide',
      type: 'task',
      content: '# Implementation Guide\n\nStep-by-step implementation instructions.',
      lastModified: new Date().toISOString(),
      author: 'Developer',
      status: 'draft'
    }
  ];

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleCreateDocument = () => {
    if (onCreateDocument) {
      onCreateDocument(`New ${entityType} Document`, 'documentation');
    }
    setIsCreating(false);
  };

  const handleSaveDocument = (content: string) => {
    if (selectedDocument && onSaveDocument) {
      onSaveDocument(selectedDocument.id, content);
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'approved': return 'default';
      case 'review': return 'secondary';
      case 'draft': return 'outline';
      case 'archived': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: Document['type']) => {
    return <FileText className="h-3 w-3" />;
  };

  return (
    <div data-testid="inline-document-manager" className={`w-full ${className}`}>
      {!selectedDocument ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Documents ({filteredDocuments.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Document Type Filter */}
              <Tabs value={filterType} onValueChange={setFilterType}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="specification">Requirements</TabsTrigger>
                  <TabsTrigger value="documentation">Technical</TabsTrigger>
                  <TabsTrigger value="task">Implementation</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Document List */}
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleDocumentSelect(document)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getTypeIcon(document.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{document.name}</p>
                          <p className="text-xs text-muted-foreground">
                            By {document.author} • {new Date(document.lastModified).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getStatusColor(document.status)} className="text-xs">
                          {document.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {document.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No documents found</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsCreating(true)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create First Document
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8">
                    <Upload className="h-3 w-3 mr-1" />
                    Import
                  </Button>
                  <Button size="sm" variant="outline" className="h-8">
                    <Download className="h-3 w-3 mr-1" />
                    Export All
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {mockDocuments.length} total documents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ContextualDocumentPreview
          documentId={selectedDocument.id}
          documentName={selectedDocument.name}
          content={selectedDocument.content}
          type={selectedDocument.type}
          editable={true}
          onSave={handleSaveDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default InlineDocumentManager;
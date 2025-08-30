/**
 * Document Editor - In-line editing with live preview
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Eye,
  Edit3,
  Save,
  X,
  Bold,
  Italic,
  Code,
  List,
  Link,
  Image
} from 'lucide-react';

interface DocumentEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  content,
  onChange,
  onSave,
  onCancel,
  placeholder = "Enter your content here..."
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [cursorPosition, setCursorPosition] = useState(0);

  const insertMarkdown = (syntax: string, wrapper: boolean = false) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newContent: string;
    let newCursorPosition: number;

    if (wrapper && selectedText) {
      // Wrap selected text
      newContent = content.substring(0, start) + syntax + selectedText + syntax + content.substring(end);
      newCursorPosition = end + (syntax.length * 2);
    } else {
      // Insert syntax at cursor
      newContent = content.substring(0, start) + syntax + content.substring(end);
      newCursorPosition = start + syntax.length;
    }

    onChange(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const renderPreview = () => {
    return (
      <div className="prose prose-sm max-w-none p-4">
        <div 
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ 
            __html: content
              .replace(/\n/g, '<br>')
              .replace(/#{1,6}\s+([^\n]+)/g, (match, text) => {
                const level = match.match(/^#{1,6}/)?.[0].length || 1;
                return `<h${level} class="font-semibold text-lg mt-4 mb-2">${text}</h${level}>`;
              })
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
              .replace(/^\* (.+)/gm, '<li>$1</li>')
              .replace(/^- (.+)/gm, '<li>$1</li>')
              .replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul class="list-disc pl-4">$1</ul>')
          }}
        />
      </div>
    );
  };

  const renderEditor = () => {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('**', true)}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('*', true)}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('`', true)}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('## ')}
            title="Heading"
          >
            H2
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('- ')}
            title="List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('[Link text](url)')}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('![Alt text](image-url)')}
            title="Image"
          >
            <Image className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <div className="flex-1 p-4">
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setCursorPosition(target.selectionStart);
            }}
            placeholder={placeholder}
            className="w-full h-full resize-none font-mono text-sm"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-2 border-t text-xs text-muted-foreground">
          <div>
            Lines: {content.split('\n').length} | 
            Characters: {content.length} | 
            Words: {content.trim().split(/\s+/).length}
          </div>
          <div>
            Position: {cursorPosition}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Controls */}
      <div className="flex items-center justify-between p-2 border-b">
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="edit">
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="split">
              Split
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">Markdown</Badge>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={onSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex min-h-0">
        {viewMode === 'edit' && (
          <div className="flex-1">
            {renderEditor()}
          </div>
        )}

        {viewMode === 'preview' && (
          <ScrollArea className="flex-1">
            {renderPreview()}
          </ScrollArea>
        )}

        {viewMode === 'split' && (
          <>
            <div className="flex-1 border-r">
              {renderEditor()}
            </div>
            <ScrollArea className="flex-1">
              {renderPreview()}
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
};
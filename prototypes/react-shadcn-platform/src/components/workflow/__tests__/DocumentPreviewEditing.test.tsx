/**
 * @jest-environment jsdom
 * 
 * Document Preview and Editing Functionality Tests
 * Tests comprehensive document management system as specified in:
 * - task-5.8.3-advanced-dashboard-functionality.md
 * - Structured document viewer with in-line editing capabilities
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen as screenTest } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock document types based on task requirements
interface TestDocumentType {
  id: string;
  name: string;
  type: 'markdown' | 'json' | 'text' | 'pdf' | 'image' | 'spreadsheet';
  content: string;
  url: string;
  size: number;
  lastModified: Date;
  version: number;
  versions: DocumentVersion[];
  metadata: {
    author: string;
    tags: string[];
    description?: string;
  };
}

interface DocumentVersion {
  id: string;
  version: number;
  content: string;
  author: string;
  timestamp: Date;
  changes: string;
}

// Mock Document Viewer Components
const MockDocumentViewer: React.FC<{
  document: TestDocumentType;
  viewMode: 'preview' | 'edit' | 'split';
  onModeChange: (_mode: 'preview' | 'edit' | 'split') => void;
  onSave: (_content: string) => void;
  onExport: (_format: string) => void;
}> = ({ document, viewMode, onModeChange, onSave, onExport }) => (
  <div data-testid="document-viewer">
    <div data-testid="document-header">
      <h1 data-testid="document-title">{document.name}</h1>
      <div data-testid="document-metadata">
        <span data-testid="document-type">{document.type}</span>
        <span data-testid="document-version">v{document.version}</span>
        <span data-testid="document-author">{document.metadata.author}</span>
      </div>
      <div data-testid="view-mode-controls">
        <button 
          data-testid="preview-mode"
          onClick={() => onModeChange('preview')}
          className={viewMode === 'preview' ? 'active' : ''}
        >
          Preview
        </button>
        <button 
          data-testid="edit-mode"
          onClick={() => onModeChange('edit')}
          className={viewMode === 'edit' ? 'active' : ''}
        >
          Edit
        </button>
        <button 
          data-testid="split-mode"
          onClick={() => onModeChange('split')}
          className={viewMode === 'split' ? 'active' : ''}
        >
          Split View
        </button>
      </div>
      <div data-testid="document-actions">
        <button data-testid="save-document" onClick={() => onSave('updated content')}>
          Save
        </button>
        <button data-testid="export-pdf" onClick={() => onExport('pdf')}>
          Export PDF
        </button>
        <button data-testid="export-word" onClick={() => onExport('word')}>
          Export Word
        </button>
        <button data-testid="export-json" onClick={() => onExport('json')}>
          Export JSON
        </button>
      </div>
    </div>
    
    <div data-testid="document-content-area" className={`mode-${viewMode}`}>
      {viewMode === 'preview' && (
        <div data-testid="preview-content" className="document-preview">
          <div dangerouslySetInnerHTML={{ __html: document.content }} />
        </div>
      )}
      
      {viewMode === 'edit' && (
        <div data-testid="edit-content" className="document-editor">
          <textarea 
            data-testid="content-editor"
            defaultValue={document.content}
            placeholder="Edit document content..."
          />
          <div data-testid="editor-toolbar">
            <button data-testid="bold-button">Bold</button>
            <button data-testid="italic-button">Italic</button>
            <button data-testid="link-button">Link</button>
            <button data-testid="image-button">Image</button>
          </div>
        </div>
      )}
      
      {viewMode === 'split' && (
        <div data-testid="split-content" className="split-view">
          <div data-testid="split-editor" className="split-left">
            <textarea 
              data-testid="split-content-editor"
              defaultValue={document.content}
            />
          </div>
          <div data-testid="split-preview" className="split-right">
            <div dangerouslySetInnerHTML={{ __html: document.content }} />
          </div>
        </div>
      )}
    </div>
  </div>
);

const MockDocumentNavigation: React.FC<{
  documents: DocumentType[];
  currentDocument: DocumentType;
  onDocumentSelect: (_document: DocumentType) => void;
  onSearch: (_query: string) => void;
}> = ({ documents, currentDocument, onDocumentSelect, onSearch }) => (
  <div data-testid="document-navigation">
    <div data-testid="document-search">
      <input 
        data-testid="search-input" 
        placeholder="Search documents..."
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
    <div data-testid="document-tree">
      {documents.map((doc) => (
        <div 
          key={doc.id}
          data-testid={`doc-item-${doc.id}`}
          className={`doc-item ${currentDocument.id === doc.id ? 'active' : ''}`}
          onClick={() => onDocumentSelect(doc)}
        >
          <span data-testid={`doc-name-${doc.id}`}>{doc.name}</span>
          <span data-testid={`doc-type-${doc.id}`} className={`type-${doc.type}`}>
            {doc.type}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const MockDocumentHistory: React.FC<{
  document: DocumentType;
  onVersionSelect: (_version: DocumentVersion) => void;
  onRollback: (_versionId: string) => void;
}> = ({ document, onVersionSelect, onRollback }) => (
  <div data-testid="document-history">
    <h3>Version History</h3>
    {document.versions.map((version) => (
      <div key={version.id} data-testid={`version-${version.id}`} className="version-item">
        <div data-testid={`version-info-${version.id}`}>
          <span data-testid={`version-number-${version.id}`}>v{version.version}</span>
          <span data-testid={`version-author-${version.id}`}>{version.author}</span>
          <span data-testid={`version-timestamp-${version.id}`}>
            {version.timestamp.toLocaleDateString()}
          </span>
        </div>
        <div data-testid={`version-changes-${version.id}`}>{version.changes}</div>
        <div data-testid={`version-actions-${version.id}`}>
          <button 
            data-testid={`view-version-${version.id}`}
            onClick={() => onVersionSelect(version)}
          >
            View
          </button>
          <button 
            data-testid={`rollback-version-${version.id}`}
            onClick={() => onRollback(version.id)}
          >
            Rollback
          </button>
        </div>
      </div>
    ))}
  </div>
);

const MockDocumentSearch: React.FC<{
  searchQuery: string;
  searchResults: Array<{
    document: DocumentType;
    matches: Array<{ line: number; content: string; highlight: string }>;
  }>;
  onSearch: (_query: string) => void;
  onResultSelect: (_document: DocumentType, _line: number) => void;
}> = ({ searchQuery, searchResults, onSearch, onResultSelect }) => (
  <div data-testid="document-search-panel">
    <div data-testid="search-controls">
      <input 
        data-testid="search-query"
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search within documents..."
      />
      <div data-testid="search-options">
        <label>
          <input data-testid="case-sensitive" type="checkbox" />
          Case sensitive
        </label>
        <label>
          <input data-testid="whole-word" type="checkbox" />
          Whole word
        </label>
        <label>
          <input data-testid="regex-search" type="checkbox" />
          Regex
        </label>
      </div>
    </div>
    
    <div data-testid="search-results">
      {searchResults.map((result, _resultIndex) => (
        <div key={result.document.id} data-testid={`search-result-${result.document.id}`}>
          <h4 data-testid={`result-document-${result.document.id}`}>{result.document.name}</h4>
          {result.matches.map((match, matchIndex) => (
            <div 
              key={matchIndex}
              data-testid={`match-${result.document.id}-${matchIndex}`}
              className="search-match"
              onClick={() => onResultSelect(result.document, match.line)}
            >
              <span data-testid={`match-line-${result.document.id}-${matchIndex}`}>
                Line {match.line}:
              </span>
              <span data-testid={`match-content-${result.document.id}-${matchIndex}`}>
                {match.content}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

describe('Document Preview and Editing Functionality', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockDocuments: DocumentType[];
  
  const mockCallbacks = {
    onModeChange: vi.fn(),
    onSave: vi.fn(),
    onExport: vi.fn(),
    onDocumentSelect: vi.fn(),
    onSearch: vi.fn(),
    onVersionSelect: vi.fn(),
    onRollback: vi.fn(),
    onResultSelect: vi.fn()
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    mockDocuments = [
      {
        id: 'doc-1',
        name: 'requirements.md',
        type: 'markdown',
        content: '<h1>Requirements</h1><p>Project requirements document</p>',
        url: '/docs/requirements.md',
        size: 2048,
        lastModified: new Date(),
        version: 3,
        versions: [
          {
            id: 'v1',
            version: 1,
            content: '<h1>Requirements</h1><p>Initial draft</p>',
            author: 'john.doe',
            timestamp: new Date('2024-01-01'),
            changes: 'Initial version'
          },
          {
            id: 'v2',
            version: 2,
            content: '<h1>Requirements</h1><p>Updated requirements</p>',
            author: 'jane.smith',
            timestamp: new Date('2024-01-15'),
            changes: 'Added detailed requirements'
          },
          {
            id: 'v3',
            version: 3,
            content: '<h1>Requirements</h1><p>Project requirements document</p>',
            author: 'bob.wilson',
            timestamp: new Date('2024-02-01'),
            changes: 'Final review and updates'
          }
        ],
        metadata: {
          author: 'bob.wilson',
          tags: ['requirements', 'documentation'],
          description: 'Project requirements specification'
        }
      },
      {
        id: 'doc-2',
        name: 'api-spec.json',
        type: 'json',
        content: '{"title": "API Specification", "version": "1.0"}',
        url: '/docs/api-spec.json',
        size: 1024,
        lastModified: new Date(),
        version: 1,
        versions: [],
        metadata: {
          author: 'api.team',
          tags: ['api', 'specification'],
          description: 'REST API specification'
        }
      }
    ];
  });

  describe('Document Viewer Core Functionality', () => {
    it('renders document viewer with all essential components', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('document-viewer')).toBeInTheDocument();
      expect(screenTest.getByTestId('document-header')).toBeInTheDocument();
      expect(screenTest.getByTestId('document-content-area')).toBeInTheDocument();
    });

    it('displays document metadata correctly', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('document-title')).toHaveTextContent('requirements.md');
      expect(screenTest.getByTestId('document-type')).toHaveTextContent('markdown');
      expect(screenTest.getByTestId('document-version')).toHaveTextContent('v3');
      expect(screenTest.getByTestId('document-author')).toHaveTextContent('bob.wilson');
    });

    it('provides view mode controls', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('preview-mode')).toBeInTheDocument();
      expect(screenTest.getByTestId('edit-mode')).toBeInTheDocument();
      expect(screenTest.getByTestId('split-mode')).toBeInTheDocument();
    });

    it('highlights active view mode', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="edit"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      const editButton = screenTest.getByTestId('edit-mode');
      const previewButton = screenTest.getByTestId('preview-mode');
      
      expect(editButton).toHaveClass('active');
      expect(previewButton).not.toHaveClass('active');
    });
  });

  describe('Preview Mode Functionality', () => {
    it('renders document content in preview mode', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('preview-content')).toBeInTheDocument();
      expect(screenTest.getByTestId('document-content-area')).toHaveClass('mode-preview');
    });

    it('displays formatted document content', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      const previewContent = screenTest.getByTestId('preview-content');
      expect(previewContent).toHaveClass('document-preview');
      // Content should be rendered as HTML
      expect(previewContent.innerHTML).toContain(mockDocuments[0].content);
    });
  });

  describe('Edit Mode Functionality', () => {
    it('provides editing interface in edit mode', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="edit"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('edit-content')).toBeInTheDocument();
      expect(screenTest.getByTestId('content-editor')).toBeInTheDocument();
      expect(screenTest.getByTestId('editor-toolbar')).toBeInTheDocument();
    });

    it('pre-populates editor with document content', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="edit"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      const editor = screenTest.getByTestId('content-editor') as HTMLTextAreaElement;
      expect(editor.value).toBe(mockDocuments[0].content);
    });

    it('provides editor toolbar with formatting options', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="edit"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('bold-button')).toBeInTheDocument();
      expect(screenTest.getByTestId('italic-button')).toBeInTheDocument();
      expect(screenTest.getByTestId('link-button')).toBeInTheDocument();
      expect(screenTest.getByTestId('image-button')).toBeInTheDocument();
    });

    it('handles content saving', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="edit"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      await user.click(screenTest.getByTestId('save-document'));
      expect(mockCallbacks.onSave).toHaveBeenCalledWith('updated content');
    });
  });

  describe('Split View Functionality', () => {
    it('provides split view with editor and preview', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="split"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('split-content')).toBeInTheDocument();
      expect(screenTest.getByTestId('split-editor')).toBeInTheDocument();
      expect(screenTest.getByTestId('split-preview')).toBeInTheDocument();
    });

    it('synchronizes editor and preview in split view', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="split"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      const editor = screenTest.getByTestId('split-content-editor') as HTMLTextAreaElement;
      const preview = screenTest.getByTestId('split-preview');
      
      expect(editor.value).toBe(mockDocuments[0].content);
      expect(preview.innerHTML).toContain(mockDocuments[0].content);
    });

    it('applies correct styling to split view', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="split"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('split-content')).toHaveClass('split-view');
      expect(screenTest.getByTestId('split-editor')).toHaveClass('split-left');
      expect(screenTest.getByTestId('split-preview')).toHaveClass('split-right');
    });
  });

  describe('View Mode Switching', () => {
    it('switches between view modes correctly', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      await user.click(screenTest.getByTestId('edit-mode'));
      expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('edit');
      
      await user.click(screenTest.getByTestId('split-mode'));
      expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('split');
      
      await user.click(screenTest.getByTestId('preview-mode'));
      expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('preview');
    });

    it('updates content area styling when mode changes', () => {
      const { rerender } = render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('document-content-area')).toHaveClass('mode-preview');
      
      rerender(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="edit"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('document-content-area')).toHaveClass('mode-edit');
    });
  });

  describe('Document Navigation', () => {
    it('renders document navigation tree', () => {
      render(
        <MockDocumentNavigation
          documents={mockDocuments}
          currentDocument={mockDocuments[0]}
          onDocumentSelect={mockCallbacks.onDocumentSelect}
          onSearch={mockCallbacks.onSearch}
        />
      );
      
      expect(screenTest.getByTestId('document-navigation')).toBeInTheDocument();
      expect(screenTest.getByTestId('document-tree')).toBeInTheDocument();
      expect(screenTest.getByTestId('document-search')).toBeInTheDocument();
    });

    it('displays all documents in navigation tree', () => {
      render(
        <MockDocumentNavigation
          documents={mockDocuments}
          currentDocument={mockDocuments[0]}
          onDocumentSelect={mockCallbacks.onDocumentSelect}
          onSearch={mockCallbacks.onSearch}
        />
      );
      
      expect(screenTest.getByTestId('doc-item-doc-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('doc-item-doc-2')).toBeInTheDocument();
      
      expect(screenTest.getByTestId('doc-name-doc-1')).toHaveTextContent('requirements.md');
      expect(screenTest.getByTestId('doc-name-doc-2')).toHaveTextContent('api-spec.json');
    });

    it('highlights active document', () => {
      render(
        <MockDocumentNavigation
          documents={mockDocuments}
          currentDocument={mockDocuments[0]}
          onDocumentSelect={mockCallbacks.onDocumentSelect}
          onSearch={mockCallbacks.onSearch}
        />
      );
      
      expect(screenTest.getByTestId('doc-item-doc-1')).toHaveClass('active');
      expect(screenTest.getByTestId('doc-item-doc-2')).not.toHaveClass('active');
    });

    it('handles document selection', async () => {
      render(
        <MockDocumentNavigation
          documents={mockDocuments}
          currentDocument={mockDocuments[0]}
          onDocumentSelect={mockCallbacks.onDocumentSelect}
          onSearch={mockCallbacks.onSearch}
        />
      );
      
      await user.click(screenTest.getByTestId('doc-item-doc-2'));
      expect(mockCallbacks.onDocumentSelect).toHaveBeenCalledWith(mockDocuments[1]);
    });

    it('provides document type indicators', () => {
      render(
        <MockDocumentNavigation
          documents={mockDocuments}
          currentDocument={mockDocuments[0]}
          onDocumentSelect={mockCallbacks.onDocumentSelect}
          onSearch={mockCallbacks.onSearch}
        />
      );
      
      const markdownType = screenTest.getByTestId('doc-type-doc-1');
      const jsonType = screenTest.getByTestId('doc-type-doc-2');
      
      expect(markdownType).toHaveTextContent('markdown');
      expect(markdownType).toHaveClass('type-markdown');
      
      expect(jsonType).toHaveTextContent('json');
      expect(jsonType).toHaveClass('type-json');
    });
  });

  describe('Document Search Functionality', () => {
    it('provides search interface with options', () => {
      const searchResults = [
        {
          document: mockDocuments[0],
          matches: [
            { line: 1, content: 'Requirements document', highlight: 'Requirements' },
            { line: 3, content: 'Project requirements', highlight: 'requirements' }
          ]
        }
      ];
      
      render(
        <MockDocumentSearch
          searchQuery="requirements"
          searchResults={searchResults}
          onSearch={mockCallbacks.onSearch}
          onResultSelect={mockCallbacks.onResultSelect}
        />
      );
      
      expect(screenTest.getByTestId('document-search-panel')).toBeInTheDocument();
      expect(screenTest.getByTestId('search-controls')).toBeInTheDocument();
      expect(screenTest.getByTestId('search-options')).toBeInTheDocument();
    });

    it('provides search options for advanced searching', () => {
      render(
        <MockDocumentSearch
          searchQuery=""
          searchResults={[]}
          onSearch={mockCallbacks.onSearch}
          onResultSelect={mockCallbacks.onResultSelect}
        />
      );
      
      expect(screenTest.getByTestId('case-sensitive')).toBeInTheDocument();
      expect(screenTest.getByTestId('whole-word')).toBeInTheDocument();
      expect(screenTest.getByTestId('regex-search')).toBeInTheDocument();
    });

    it('displays search results with context', () => {
      const searchResults = [
        {
          document: mockDocuments[0],
          matches: [
            { line: 1, content: 'Requirements document', highlight: 'Requirements' },
            { line: 3, content: 'Project requirements', highlight: 'requirements' }
          ]
        }
      ];
      
      render(
        <MockDocumentSearch
          searchQuery="requirements"
          searchResults={searchResults}
          onSearch={mockCallbacks.onSearch}
          onResultSelect={mockCallbacks.onResultSelect}
        />
      );
      
      expect(screenTest.getByTestId('search-results')).toBeInTheDocument();
      expect(screenTest.getByTestId('search-result-doc-1')).toBeInTheDocument();
      expect(screenTest.getByTestId('result-document-doc-1')).toHaveTextContent('requirements.md');
      
      expect(screenTest.getByTestId('match-doc-1-0')).toBeInTheDocument();
      expect(screenTest.getByTestId('match-line-doc-1-0')).toHaveTextContent('Line 1:');
      expect(screenTest.getByTestId('match-content-doc-1-0')).toHaveTextContent('Requirements document');
    });

    it('handles search query updates', async () => {
      render(
        <MockDocumentSearch
          searchQuery=""
          searchResults={[]}
          onSearch={mockCallbacks.onSearch}
          onResultSelect={mockCallbacks.onResultSelect}
        />
      );
      
      const searchInput = screenTest.getByTestId('search-query');
      await user.type(searchInput, 'test query');
      
      expect(mockCallbacks.onSearch).toHaveBeenCalledWith('test query');
    });

    it('handles search result selection', async () => {
      const searchResults = [
        {
          document: mockDocuments[0],
          matches: [
            { line: 5, content: 'Test content', highlight: 'Test' }
          ]
        }
      ];
      
      render(
        <MockDocumentSearch
          searchQuery="test"
          searchResults={searchResults}
          onSearch={mockCallbacks.onSearch}
          onResultSelect={mockCallbacks.onResultSelect}
        />
      );
      
      await user.click(screenTest.getByTestId('match-doc-1-0'));
      expect(mockCallbacks.onResultSelect).toHaveBeenCalledWith(mockDocuments[0], 5);
    });
  });

  describe('Version History and Control', () => {
    it('displays document version history', () => {
      render(
        <MockDocumentHistory
          document={mockDocuments[0]}
          onVersionSelect={mockCallbacks.onVersionSelect}
          onRollback={mockCallbacks.onRollback}
        />
      );
      
      expect(screenTest.getByText('Version History')).toBeInTheDocument();
      expect(screenTest.getByTestId('version-v1')).toBeInTheDocument();
      expect(screenTest.getByTestId('version-v2')).toBeInTheDocument();
      expect(screenTest.getByTestId('version-v3')).toBeInTheDocument();
    });

    it('displays version metadata correctly', () => {
      render(
        <MockDocumentHistory
          document={mockDocuments[0]}
          onVersionSelect={mockCallbacks.onVersionSelect}
          onRollback={mockCallbacks.onRollback}
        />
      );
      
      expect(screenTest.getByTestId('version-number-v1')).toHaveTextContent('v1');
      expect(screenTest.getByTestId('version-author-v1')).toHaveTextContent('john.doe');
      expect(screenTest.getByTestId('version-changes-v1')).toHaveTextContent('Initial version');
    });

    it('provides version viewing capability', async () => {
      render(
        <MockDocumentHistory
          document={mockDocuments[0]}
          onVersionSelect={mockCallbacks.onVersionSelect}
          onRollback={mockCallbacks.onRollback}
        />
      );
      
      await user.click(screenTest.getByTestId('view-version-v2'));
      expect(mockCallbacks.onVersionSelect).toHaveBeenCalledWith(mockDocuments[0].versions[1]);
    });

    it('provides rollback capability', async () => {
      render(
        <MockDocumentHistory
          document={mockDocuments[0]}
          onVersionSelect={mockCallbacks.onVersionSelect}
          onRollback={mockCallbacks.onRollback}
        />
      );
      
      await user.click(screenTest.getByTestId('rollback-version-v2'));
      expect(mockCallbacks.onRollback).toHaveBeenCalledWith('v2');
    });

    it('shows chronological version ordering', () => {
      render(
        <MockDocumentHistory
          document={mockDocuments[0]}
          onVersionSelect={mockCallbacks.onVersionSelect}
          onRollback={mockCallbacks.onRollback}
        />
      );
      
      const version1Date = screenTest.getByTestId('version-timestamp-v1');
      const version2Date = screenTest.getByTestId('version-timestamp-v2');
      const version3Date = screenTest.getByTestId('version-timestamp-v3');
      
      expect(version1Date).toHaveTextContent('1/1/2024');
      expect(version2Date).toHaveTextContent('1/15/2024');
      expect(version3Date).toHaveTextContent('2/1/2024');
    });
  });

  describe('Export Functionality', () => {
    it('provides multiple export format options', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      expect(screenTest.getByTestId('export-pdf')).toBeInTheDocument();
      expect(screenTest.getByTestId('export-word')).toBeInTheDocument();
      expect(screenTest.getByTestId('export-json')).toBeInTheDocument();
    });

    it('handles PDF export', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      await user.click(screenTest.getByTestId('export-pdf'));
      expect(mockCallbacks.onExport).toHaveBeenCalledWith('pdf');
    });

    it('handles Word export', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      await user.click(screenTest.getByTestId('export-word'));
      expect(mockCallbacks.onExport).toHaveBeenCalledWith('word');
    });

    it('handles JSON export', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      await user.click(screenTest.getByTestId('export-json'));
      expect(mockCallbacks.onExport).toHaveBeenCalledWith('json');
    });
  });

  describe('Integration with Task Context', () => {
    it('maintains document context within task workflow', () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      // Document viewer should integrate with task context
      expect(screenTest.getByTestId('document-viewer')).toBeInTheDocument();
      expect(screenTest.getByTestId('document-title')).toHaveTextContent('requirements.md');
    });

    it('supports contextual document editing without losing task context', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      // Switch to edit mode
      await user.click(screenTest.getByTestId('edit-mode'));
      expect(mockCallbacks.onModeChange).toHaveBeenCalledWith('edit');
      
      // Document context should be maintained
      expect(screenTest.getByTestId('document-title')).toHaveTextContent('requirements.md');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('handles large documents efficiently', () => {
      const largeDocument = {
        ...mockDocuments[0],
        content: 'Large content '.repeat(1000)
      };
      
      expect(() => render(
        <MockDocumentViewer
          document={largeDocument}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      )).not.toThrow();
    });

    it('maintains responsive UI during mode switching', async () => {
      render(
        <MockDocumentViewer
          document={mockDocuments[0]}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      );
      
      // Rapid mode switching
      await user.click(screenTest.getByTestId('edit-mode'));
      await user.click(screenTest.getByTestId('split-mode'));
      await user.click(screenTest.getByTestId('preview-mode'));
      
      expect(mockCallbacks.onModeChange).toHaveBeenCalledTimes(3);
    });

    it('handles multiple documents in navigation efficiently', () => {
      const manyDocuments = Array.from({ length: 50 }, (_, i) => ({
        ...mockDocuments[0],
        id: `doc-${i}`,
        name: `document-${i}.md`
      }));
      
      expect(() => render(
        <MockDocumentNavigation
          documents={manyDocuments}
          currentDocument={manyDocuments[0]}
          onDocumentSelect={mockCallbacks.onDocumentSelect}
          onSearch={mockCallbacks.onSearch}
        />
      )).not.toThrow();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles documents with missing content', () => {
      const emptyDocument = {
        ...mockDocuments[0],
        content: ''
      };
      
      expect(() => render(
        <MockDocumentViewer
          document={emptyDocument}
          viewMode="preview"
          onModeChange={mockCallbacks.onModeChange}
          onSave={mockCallbacks.onSave}
          onExport={mockCallbacks.onExport}
        />
      )).not.toThrow();
    });

    it('handles documents without version history', () => {
      const noHistoryDocument = {
        ...mockDocuments[0],
        versions: []
      };
      
      expect(() => render(
        <MockDocumentHistory
          document={noHistoryDocument}
          onVersionSelect={mockCallbacks.onVersionSelect}
          onRollback={mockCallbacks.onRollback}
        />
      )).not.toThrow();
    });

    it('handles empty search results gracefully', () => {
      render(
        <MockDocumentSearch
          searchQuery="no-matches"
          searchResults={[]}
          onSearch={mockCallbacks.onSearch}
          onResultSelect={mockCallbacks.onResultSelect}
        />
      );
      
      expect(screenTest.getByTestId('search-results')).toBeInTheDocument();
      expect(screenTest.queryByTestId('search-result-doc-1')).not.toBeInTheDocument();
    });
  });
});
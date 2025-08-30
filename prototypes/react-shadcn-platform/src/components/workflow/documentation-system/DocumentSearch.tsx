/**
 * Document Search - Search within documents with highlighting
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface SearchResult {
  index: number;
  line: number;
  context: string;
  matchStart: number;
  matchEnd: number;
}

interface DocumentSearchProps {
  content: string;
  onSearchResults: (results: SearchResult[]) => void;
  onHighlight?: (searchTerm: string) => void;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  content,
  onSearchResults,
  onHighlight
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);

  const performSearch = (term: string) => {
    if (!term.trim()) {
      setResults([]);
      onSearchResults([]);
      return;
    }

    const lines = content.split('\n');
    const searchResults: SearchResult[] = [];
    
    let flags = 'g';
    if (!caseSensitive) flags += 'i';
    
    let pattern = term;
    if (wholeWords) {
      pattern = `\\b${pattern}\\b`;
    }
    
    try {
      const regex = new RegExp(pattern, flags);
      
      lines.forEach((line, lineIndex) => {
        let match;
        while ((match = regex.exec(line)) !== null) {
          const contextStart = Math.max(0, match.index - 20);
          const contextEnd = Math.min(line.length, match.index + match[0].length + 20);
          const context = line.substring(contextStart, contextEnd);
          
          searchResults.push({
            index: searchResults.length,
            line: lineIndex + 1,
            context: context,
            matchStart: match.index - contextStart,
            matchEnd: match.index - contextStart + match[0].length
          });
        }
      });
    } catch (error) {
      console.error('Search regex error:', error);
    }

    setResults(searchResults);
    onSearchResults(searchResults);
    setCurrentResultIndex(0);
  };

  useEffect(() => {
    performSearch(searchTerm);
  }, [searchTerm, caseSensitive, wholeWords, content]);

  useEffect(() => {
    if (onHighlight) {
      onHighlight(searchTerm);
    }
  }, [searchTerm, onHighlight]);

  const navigateResults = (direction: 'next' | 'prev') => {
    if (results.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % results.length;
    } else {
      newIndex = currentResultIndex === 0 ? results.length - 1 : currentResultIndex - 1;
    }
    setCurrentResultIndex(newIndex);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setCurrentResultIndex(0);
    onSearchResults([]);
  };

  const renderSearchResult = (result: SearchResult, index: number) => {
    const isActive = index === currentResultIndex;
    const beforeMatch = result.context.substring(0, result.matchStart);
    const match = result.context.substring(result.matchStart, result.matchEnd);
    const afterMatch = result.context.substring(result.matchEnd);

    return (
      <div
        key={result.index}
        className={`p-2 text-sm border-l-2 cursor-pointer transition-colors ${
          isActive 
            ? 'border-primary bg-primary/10' 
            : 'border-transparent hover:bg-accent/50'
        }`}
        onClick={() => setCurrentResultIndex(index)}
      >
        <div className="flex items-center justify-between mb-1">
          <Badge variant="outline" className="text-xs">
            Line {result.line}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {index + 1} of {results.length}
          </Badge>
        </div>
        <div className="font-mono text-xs break-all">
          <span>{beforeMatch}</span>
          <span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
            {match}
          </span>
          <span>{afterMatch}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {results.length > 0 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateResults('prev')}
              disabled={results.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateResults('next')}
              disabled={results.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={clearSearch}
          disabled={!searchTerm}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Options */}
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded"
          />
          Case sensitive
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={wholeWords}
            onChange={(e) => setWholeWords(e.target.checked)}
            className="rounded"
          />
          Whole words
        </label>
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {results.length === 0 
              ? 'No matches found' 
              : `${results.length} match${results.length === 1 ? '' : 'es'} found`
            }
          </span>
          {results.length > 0 && (
            <Badge variant="outline">
              {currentResultIndex + 1} of {results.length}
            </Badge>
          )}
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <ScrollArea className="h-64 border rounded">
          <div className="space-y-1">
            {results.map((result, index) => renderSearchResult(result, index))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
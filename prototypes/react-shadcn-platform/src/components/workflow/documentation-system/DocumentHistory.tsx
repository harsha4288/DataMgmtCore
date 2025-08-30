/**
 * Document History - Version control interface
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  History,
  Clock,
  User,
  Eye,
  RotateCcw,
  GitBranch,
  RefreshCw,
  FileText
} from 'lucide-react';

interface DocumentVersion {
  id: string;
  version: string;
  content: string;
  author: string;
  timestamp: Date;
  changes: string;
  size: number;
}

interface DocumentHistoryProps {
  documentId: string;
  onVersionSelect: (version: DocumentVersion) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  documentId,
  onVersionSelect
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string>('');

  // Mock version history - in real app, this would fetch from API
  useEffect(() => {
    const mockVersions: DocumentVersion[] = [
      {
        id: 'v1.3.0',
        version: '1.3.0',
        content: '# Latest Document Version\n\nThis is the current version with all latest changes.',
        author: 'Claude AI',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        changes: 'Added new section on implementation details',
        size: 1245
      },
      {
        id: 'v1.2.1',
        version: '1.2.1',
        content: '# Document Version 1.2.1\n\nThis version includes minor fixes.',
        author: 'User',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        changes: 'Fixed typos and formatting issues',
        size: 1189
      },
      {
        id: 'v1.2.0',
        version: '1.2.0',
        content: '# Document Version 1.2.0\n\nMajor update with new features.',
        author: 'Claude AI',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        changes: 'Added new features and improved structure',
        size: 1067
      },
      {
        id: 'v1.1.0',
        version: '1.1.0',
        content: '# Document Version 1.1.0\n\nInitial structured version.',
        author: 'User',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
        changes: 'Initial version with basic structure',
        size: 892
      }
    ];

    setVersions(mockVersions);
    if (mockVersions.length > 0) {
      setSelectedVersion(mockVersions[0].id);
    }
  }, [documentId]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 1000 * 60) return 'Just now';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))} minutes ago`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))} hours ago`;
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))} days ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleVersionSelect = (version: DocumentVersion) => {
    setSelectedVersion(version.id);
    onVersionSelect(version);
  };

  const renderVersionItem = (version: DocumentVersion, index: number) => {
    const isSelected = selectedVersion === version.id;
    const isLatest = index === 0;

    return (
      <div
        key={version.id}
        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
        }`}
        onClick={() => handleVersionSelect(version)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="h-4 w-4" />
              <span className="font-medium">v{version.version}</span>
              {isLatest && (
                <Badge variant="default" className="text-xs">
                  Current
                </Badge>
              )}
              {isSelected && (
                <Badge variant="secondary" className="text-xs">
                  Viewing
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground mb-2">
              {version.changes}
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {version.author}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimestamp(version.timestamp)}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {formatFileSize(version.size)}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleVersionSelect(version);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!isLatest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Restore to version ${version.version}? This will create a new version.`)) {
                    onVersionSelect(version);
                  }
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Version History...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Version History</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            // Simulate refresh
            setTimeout(() => setLoading(false), 1000);
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        Document ID: {documentId} • {versions.length} versions available
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {versions.map((version, index) => renderVersionItem(version, index))}
        </div>
      </ScrollArea>

      {versions.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Version History</h4>
            <p className="text-sm text-muted-foreground">
              This document doesn't have any saved versions yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
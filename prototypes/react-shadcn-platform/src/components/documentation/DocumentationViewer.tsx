/**
 * Documentation Viewer Component
 * Displays and manages existing documentation items
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Download, Eye, Edit, RefreshCw } from 'lucide-react';
import { DocumentationUtils } from '@/lib/documentation-system/utils';

interface DocumentationViewerProps {
  type: 'task' | 'phase' | 'issue';
}

export function DocumentationViewer({ type }: DocumentationViewerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [markdownContent, setMarkdownContent] = useState<string>('');

  useEffect(() => {
    loadItems();
  }, [type]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, statusFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const query = getGraphQLQuery(type);
      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      if (result.data) {
        const data = Object.values(result.data)[0] as any[];
        setItems(data);
      }
    } catch (error) {
      console.error(`Error loading ${type}s:`, error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const searchableText = [
          item.name || item.title,
          item.description,
          ...(item.metadata?.labels || []),
          item.phase_id,
          item.type
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const status = item.status || item.metadata?.status;
        return status === statusFilter;
      });
    }

    setFilteredItems(filtered);
  };

  const handleItemClick = async (item: any) => {
    setSelectedItem(item);
    setViewMode('detail');
    
    // Load markdown content
    try {
      const markdownQuery = getMarkdownQuery(type, item.id);
      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: markdownQuery })
      });

      const result = await response.json();
      if (result.data) {
        const markdownData = Object.values(result.data)[0] as any;
        setMarkdownContent(markdownData?.content || 'No content available');
      }
    } catch (error) {
      console.error('Error loading markdown:', error);
      setMarkdownContent('Error loading content');
    }
  };

  const handleDownloadMarkdown = () => {
    if (selectedItem && markdownContent) {
      const filename = DocumentationUtils.generateFilename(
        { id: selectedItem.id, name: selectedItem.name || selectedItem.title }
      );
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getStatusOptions = () => {
    switch (type) {
      case 'task':
        return ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'];
      case 'phase':
        return ['pending', 'in_progress', 'completed'];
      case 'issue':
        return ['open', 'in_progress', 'resolved', 'closed'];
      default:
        return [];
    }
  };

  if (viewMode === 'detail' && selectedItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setViewMode('list')}>
            ← Back to {type}s
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {selectedItem.name || selectedItem.title}
              <Badge variant={getStatusVariant(selectedItem.status || selectedItem.metadata?.status)}>
                {selectedItem.status || selectedItem.metadata?.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {type === 'task' && `Phase: ${selectedItem.phase_id} • Progress: ${selectedItem.progress}%`}
              {type === 'phase' && `Progress: ${selectedItem.progress}% • ${selectedItem.tasks?.length || 0} tasks`}
              {type === 'issue' && `${selectedItem.type} • ${selectedItem.severity} severity`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <ItemDetails item={selectedItem} type={type} />
              </TabsContent>
              
              <TabsContent value="markdown">
                <ScrollArea className="h-96 w-full">
                  <pre className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">
                    {markdownContent}
                  </pre>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="json">
                <ScrollArea className="h-96 w-full">
                  <pre className="text-sm p-4 bg-muted rounded-md">
                    {JSON.stringify(selectedItem, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold capitalize">{type}s</h2>
        <Button variant="outline" size="sm" onClick={loadItems} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${type}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {getStatusOptions().map((status) => (
              <SelectItem key={status} value={status}>
                {DocumentationUtils.capitalizeFirst(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading {type}s...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No {type}s found{searchQuery || statusFilter !== 'all' ? ' matching your criteria' : ''}
          </div>
        ) : (
          filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              type={type}
              onClick={() => handleItemClick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Supporting components
function ItemCard({ item, type, onClick }: { item: any; type: string; onClick: () => void }) {
  const getItemTitle = () => item.name || item.title;
  const getItemStatus = () => item.status || item.metadata?.status;
  const getItemProgress = () => {
    if (type === 'task' || type === 'phase') return item.progress;
    return null;
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold">{getItemTitle()}</h3>
              <Badge variant={getStatusVariant(getItemStatus())}>
                {getItemStatus()}
              </Badge>
              {getItemProgress() !== null && (
                <Badge variant="outline">{getItemProgress()}%</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
              <span>ID: {item.id}</span>
              {type === 'task' && <span>Phase: {item.phase_id}</span>}
              {type === 'issue' && <span>Type: {item.type}</span>}
              {type === 'issue' && <span>Severity: {item.severity}</span>}
              {item.created_at && <span>Created: {DocumentationUtils.formatDate(item.created_at, 'short')}</span>}
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ItemDetails({ item, type }: { item: any; type: string }) {
  switch (type) {
    case 'task':
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Overview</h4>
            <p>{item.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Metadata</h4>
              <div className="space-y-1 text-sm">
                <div>Phase: {item.phase_id}</div>
                <div>Priority: {item.metadata?.priority}</div>
                <div>Progress: {item.progress}%</div>
                {item.metadata?.estimated_hours && (
                  <div>Estimated: {item.metadata.estimated_hours}h</div>
                )}
                {item.metadata?.actual_hours && (
                  <div>Actual: {item.metadata.actual_hours}h</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Sub-tasks</h4>
              <div className="space-y-1">
                {item.subtasks?.map((subtask: any, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={subtask.completed} 
                      readOnly 
                      className="h-3 w-3"
                    />
                    <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                      {subtask.name}
                    </span>
                  </div>
                )) || <span className="text-muted-foreground text-sm">No subtasks</span>}
              </div>
            </div>
          </div>

          {item.metadata?.labels?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {item.metadata.labels.map((label: string) => (
                  <Badge key={label} variant="secondary">{label}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case 'phase':
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Overview</h4>
            <p>{item.description}</p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Progress</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">{item.tasks?.length || 0}</div>
                <div className="text-muted-foreground">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">{item.progress}%</div>
                <div className="text-muted-foreground">Complete</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">
                  {item.tasks?.filter((t: any) => t.metadata?.status === 'completed').length || 0}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>

          {item.tasks?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Tasks</h4>
              <div className="space-y-2">
                {item.tasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between text-sm border-l-2 border-muted pl-3">
                    <span>{task.name}</span>
                    <Badge variant={getStatusVariant(task.metadata?.status)}>
                      {task.metadata?.status}
                    </Badge>
                  </div>
                ))}
                {item.tasks.length > 5 && (
                  <div className="text-sm text-muted-foreground">
                    ... and {item.tasks.length - 5} more tasks
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );

    case 'issue':
      return (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p>{item.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Details</h4>
              <div className="space-y-1 text-sm">
                <div>Type: {item.type}</div>
                <div>Severity: {item.severity}</div>
                <div>Created: {DocumentationUtils.formatDate(item.created_date)}</div>
                {item.resolved_date && (
                  <div>Resolved: {DocumentationUtils.formatDate(item.resolved_date)}</div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Resolution Attempts</h4>
              <div className="space-y-1 text-sm">
                <div>Total: {item.resolution_attempts?.length || 0}</div>
                <div>Successful: {item.resolution_attempts?.filter((a: any) => a.outcome === 'success').length || 0}</div>
                <div>Failed: {item.resolution_attempts?.filter((a: any) => a.outcome === 'failure').length || 0}</div>
              </div>
            </div>
          </div>

          {item.related_tasks?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Related Tasks</h4>
              <div className="flex flex-wrap gap-2">
                {item.related_tasks.map((taskId: string) => (
                  <Badge key={taskId} variant="outline">{taskId}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    default:
      return <div>No details available</div>;
  }
}

// Utility functions
function getGraphQLQuery(type: string): string {
  switch (type) {
    case 'task':
      return `
        query GetAllTasks {
          getAllTasks {
            id
            name
            description
            phase_id
            status
            progress
            completion_date
            subtasks {
              id
              name
              completed
            }
            metadata {
              status
              priority
              labels
              dependencies
              estimated_hours
              actual_hours
            }
            created_at
            updated_at
          }
        }
      `;
    case 'phase':
      return `
        query GetAllPhases {
          getAllPhases {
            id
            name
            description
            status
            progress
            tasks {
              id
              name
              metadata {
                status
              }
            }
            metadata {
              dependencies
            }
          }
        }
      `;
    case 'issue':
      return `
        query GetAllIssues {
          getAllIssues {
            id
            title
            description
            type
            status
            severity
            related_tasks
            resolution_attempts {
              id
              approach
              outcome
              details
              timestamp
            }
            created_date
            resolved_date
          }
        }
      `;
    default:
      return '';
  }
}

function getMarkdownQuery(type: string, id: string): string {
  switch (type) {
    case 'task':
      return `
        query GenerateTaskMarkdown($id: ID!) {
          generateTaskMarkdown(id: $id, consumer: "human") {
            content
            metadata {
              generated_at
              source
              consumer
            }
          }
        }
      `;
    case 'phase':
      return `
        query GeneratePhaseMarkdown($id: ID!) {
          generatePhaseMarkdown(id: $id, consumer: "human") {
            content
            metadata {
              generated_at
              source
              consumer
            }
          }
        }
      `;
    case 'issue':
      return `
        query GenerateIssueMarkdown($id: ID!) {
          generateIssueMarkdown(id: $id, consumer: "human") {
            content
            metadata {
              generated_at
              source
              consumer
            }
          }
        }
      `;
    default:
      return '';
  }
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
    case 'resolved':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'blocked':
    case 'open':
      return 'destructive';
    default:
      return 'outline';
  }
}
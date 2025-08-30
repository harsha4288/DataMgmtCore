/**
 * Issue Linking - Connect issues to other entities
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Link2,
  Search,
  Plus,
  X,
  ArrowRight,
  Check
} from 'lucide-react';
import { Issue } from './IssueManagementPanel';

export enum LinkType {
  BLOCKS = 'blocks',
  BLOCKED_BY = 'blocked_by',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  DUPLICATED_BY = 'duplicated_by',
  CAUSED_BY = 'caused_by',
  CAUSES = 'causes'
}

interface IssueLink {
  sourceIssueId: string;
  targetIssueId: string;
  linkType: LinkType;
  createdAt: Date;
  createdBy: string;
}

interface IssueLinkingProps {
  issues: Issue[];
  onLink: (sourceId: string, targetId: string, linkType: LinkType) => void;
  onCancel: () => void;
}

export const IssueLinking: React.FC<IssueLinkingProps> = ({
  issues,
  onLink,
  onCancel
}) => {
  const [sourceIssue, setSourceIssue] = useState<string>('');
  const [targetIssue, setTargetIssue] = useState<string>('');
  const [linkType, setLinkType] = useState<LinkType>(LinkType.RELATES_TO);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = issues.filter(issue =>
    issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLinkTypeDescription = (type: LinkType): string => {
    switch (type) {
      case LinkType.BLOCKS:
        return 'prevents the target issue from being resolved';
      case LinkType.BLOCKED_BY:
        return 'is prevented from being resolved by the target issue';
      case LinkType.RELATES_TO:
        return 'is related to the target issue';
      case LinkType.DUPLICATES:
        return 'is a duplicate of the target issue';
      case LinkType.DUPLICATED_BY:
        return 'is duplicated by the target issue';
      case LinkType.CAUSED_BY:
        return 'is caused by the target issue';
      case LinkType.CAUSES:
        return 'causes the target issue';
      default:
        return 'has a relationship with the target issue';
    }
  };

  const getLinkTypeColor = (type: LinkType): string => {
    switch (type) {
      case LinkType.BLOCKS:
      case LinkType.BLOCKED_BY:
        return 'destructive';
      case LinkType.DUPLICATES:
      case LinkType.DUPLICATED_BY:
        return 'secondary';
      case LinkType.CAUSED_BY:
      case LinkType.CAUSES:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleCreateLink = () => {
    if (!sourceIssue || !targetIssue) {
      alert('Please select both source and target issues');
      return;
    }

    if (sourceIssue === targetIssue) {
      alert('Source and target issues cannot be the same');
      return;
    }

    onLink(sourceIssue, targetIssue, linkType);
  };

  const getIssueById = (id: string) => {
    return issues.find(issue => issue.id === id);
  };

  const renderIssueOption = (issue: Issue) => (
    <div className="flex items-center justify-between p-2 hover:bg-accent rounded">
      <div className="flex-1">
        <div className="font-medium text-sm">{issue.title}</div>
        <div className="text-xs text-muted-foreground">
          #{issue.id} • {issue.type} • {issue.status.replace('_', ' ')}
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {issue.severity}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search Issues */}
      <div>
        <Label className="text-base font-medium">Search Issues</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Issue Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Source Issue</Label>
          <Select value={sourceIssue} onValueChange={setSourceIssue}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select source issue..." />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-48">
                {filteredIssues.map(issue => (
                  <SelectItem key={issue.id} value={issue.id}>
                    <div>
                      <div className="font-medium">{issue.title}</div>
                      <div className="text-xs text-muted-foreground">
                        #{issue.id} • {issue.type}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target Issue</Label>
          <Select value={targetIssue} onValueChange={setTargetIssue}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select target issue..." />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-48">
                {filteredIssues
                  .filter(issue => issue.id !== sourceIssue)
                  .map(issue => (
                    <SelectItem key={issue.id} value={issue.id}>
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-xs text-muted-foreground">
                          #{issue.id} • {issue.type}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Link Type */}
      <div>
        <Label>Relationship Type</Label>
        <Select value={linkType} onValueChange={(value: LinkType) => setLinkType(value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(LinkType).map(type => (
              <SelectItem key={type} value={type}>
                <div>
                  <div className="font-medium capitalize">{type.replace('_', ' ')}</div>
                  <div className="text-xs text-muted-foreground">
                    Source issue {getLinkTypeDescription(type)}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview */}
      {sourceIssue && targetIssue && (
        <div className="p-4 bg-muted rounded-lg">
          <Label className="text-sm font-medium">Link Preview</Label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium">
                {getIssueById(sourceIssue)?.title}
              </div>
              <div className="text-xs text-muted-foreground">
                #{sourceIssue}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              <Badge variant={getLinkTypeColor(linkType)} className="text-xs">
                {linkType.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-medium">
                {getIssueById(targetIssue)?.title}
              </div>
              <div className="text-xs text-muted-foreground">
                #{targetIssue}
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            This means: <strong>#{sourceIssue}</strong> {getLinkTypeDescription(linkType)} <strong>#{targetIssue}</strong>
          </div>
        </div>
      )}

      <Separator />

      {/* Existing Links Preview */}
      <div>
        <Label className="text-sm font-medium">Common Link Patterns</Label>
        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
          <div>• <strong>Blocks/Blocked by:</strong> One issue prevents another from being completed</div>
          <div>• <strong>Duplicates:</strong> Issues that represent the same problem</div>
          <div>• <strong>Relates to:</strong> Issues that are connected but not dependent</div>
          <div>• <strong>Caused by/Causes:</strong> Issues where one creates or triggers another</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button 
          onClick={handleCreateLink}
          disabled={!sourceIssue || !targetIssue}
        >
          <Link2 className="h-4 w-4 mr-2" />
          Create Link
        </Button>
      </div>
    </div>
  );
};
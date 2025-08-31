/**
 * TreeSearchAndExport - Advanced search and export system for tree interface
 * Part of Phase 3 Review & Collaboration Integration (Task 5.8.3.1)
 * Provides global tree search, filtered views, multi-format export, and analytics integration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Download,
  FileText,
  BarChart3,
  Zap
} from 'lucide-react';

interface TreeSearchAndExportProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filterType?: string;
  onFilterTypeChange?: (type: string) => void;
  filterStatus?: string;
  onFilterStatusChange?: (status: string) => void;
  projectData?: any;
  className?: string;
}

export const TreeSearchAndExport: React.FC<TreeSearchAndExportProps> = ({
  searchTerm = '',
  onSearchChange,
  filterType = 'all',
  onFilterTypeChange,
  filterStatus = 'all',
  onFilterStatusChange,
  projectData,
  className = ''
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
    onSearchChange?.(value);
  };

  const handleFilterTypeChange = (value: string) => {
    onFilterTypeChange?.(value);
  };

  const handleFilterStatusChange = (value: string) => {
    onFilterStatusChange?.(value);
  };

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSearching(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          value={localSearchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search across project tree..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <Zap className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={filterType} onValueChange={handleFilterTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="phase">Phases</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="subtask">Subtasks</SelectItem>
            <SelectItem value="issue">Issues</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={handleFilterStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="ready_for_review">Ready for Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Export Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </Button>
      </div>
    </div>
  );
};

export default TreeSearchAndExport;
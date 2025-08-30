/**
 * Issue Form - Create/edit issue form component
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  Save,
  X,
  Calendar as CalendarIcon,
  Tag,
  Plus
} from 'lucide-react';
import { Issue, IssueType, IssueSeverity, IssueStatus } from './IssueManagementPanel';

interface IssueFormProps {
  issue?: Issue;
  onSubmit: (issue: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const IssueForm: React.FC<IssueFormProps> = ({
  issue,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    title: issue?.title || '',
    description: issue?.description || '',
    type: issue?.type || IssueType.BUG,
    severity: issue?.severity || IssueSeverity.MEDIUM,
    status: issue?.status || IssueStatus.OPEN,
    assignee: issue?.assignee || '',
    reporter: issue?.reporter || 'Current User',
    dueDate: issue?.dueDate,
    labels: issue?.labels || [],
    relatedTasks: issue?.relatedTasks || [],
    linkedIssues: issue?.linkedIssues || [],
    resolutionAttempts: issue?.resolutionAttempts || [],
    estimatedHours: issue?.estimatedHours || 0,
    actualHours: issue?.actualHours || 0
  });

  const [newLabel, setNewLabel] = useState('');
  const [newTask, setNewTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }

    onSubmit({
      ...formData,
      estimatedHours: formData.estimatedHours || undefined,
      actualHours: formData.actualHours || undefined,
      dueDate: formData.dueDate || undefined
    });
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }));
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l !== label)
    }));
  };

  const handleAddTask = () => {
    if (newTask.trim() && !formData.relatedTasks.includes(newTask.trim())) {
      setFormData(prev => ({
        ...prev,
        relatedTasks: [...prev.relatedTasks, newTask.trim()]
      }));
      setNewTask('');
    }
  };

  const handleRemoveTask = (task: string) => {
    setFormData(prev => ({
      ...prev,
      relatedTasks: prev.relatedTasks.filter(t => t !== task)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Brief description of the issue..."
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detailed description of the issue, steps to reproduce, expected behavior..."
            rows={4}
          />
        </div>
      </div>

      <Separator />

      {/* Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value: IssueType) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(IssueType).map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Severity</Label>
          <Select 
            value={formData.severity} 
            onValueChange={(value: IssueSeverity) => setFormData(prev => ({ ...prev, severity: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(IssueSeverity).map(severity => (
                <SelectItem key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value: IssueStatus) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(IssueStatus).map(status => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assignee">Assignee</Label>
          <Input
            id="assignee"
            value={formData.assignee}
            onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
            placeholder="Who is responsible for this issue?"
          />
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dueDate ? format(formData.dueDate, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.dueDate}
                onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="estimatedHours">Estimated Hours</Label>
          <Input
            id="estimatedHours"
            type="number"
            min="0"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              estimatedHours: parseFloat(e.target.value) || 0 
            }))}
          />
        </div>

        <div>
          <Label htmlFor="actualHours">Actual Hours</Label>
          <Input
            id="actualHours"
            type="number"
            min="0"
            step="0.5"
            value={formData.actualHours}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              actualHours: parseFloat(e.target.value) || 0 
            }))}
          />
        </div>
      </div>

      <Separator />

      {/* Labels */}
      <div>
        <Label>Labels</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {formData.labels.map(label => (
            <Badge key={label} variant="secondary" className="cursor-pointer">
              <Tag className="h-3 w-3 mr-1" />
              {label}
              <X 
                className="h-3 w-3 ml-1 hover:text-destructive" 
                onClick={() => handleRemoveLabel(label)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add label..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
          />
          <Button type="button" variant="outline" onClick={handleAddLabel}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Related Tasks */}
      <div>
        <Label>Related Tasks</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {formData.relatedTasks.map(task => (
            <Badge key={task} variant="outline" className="cursor-pointer">
              {task}
              <X 
                className="h-3 w-3 ml-1 hover:text-destructive" 
                onClick={() => handleRemoveTask(task)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add related task ID..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
          />
          <Button type="button" variant="outline" onClick={handleAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {issue ? 'Update Issue' : 'Create Issue'}
        </Button>
      </div>
    </form>
  );
};
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Search, Edit, Trash2, Tag, Users, AlertCircle, Loader2 } from 'lucide-react';
import { UserInstruction, UserType } from '@/lib/documentation-system/types';
import { useUserInstructions } from '@/hooks/useConfiguration';

interface UserInstructionsPanelProps {
  className?: string;
}


const userTypeLabels: Record<UserType, string> = {
  [UserType.HUMAN_DEVELOPER]: 'Developer',
  [UserType.PROJECT_MANAGER]: 'PM',
  [UserType.QA_TESTER]: 'QA',
  [UserType.AI_AGENT]: 'AI Agent',
  [UserType.EXTERNAL_TOOL]: 'Tool',
  [UserType.CONSULTANT]: 'Consultant'
};

const priorityColors: Record<string, string> = {
  low: 'hsl(var(--muted))',
  medium: 'hsl(var(--primary))',
  high: 'hsl(var(--warning))',
  critical: 'hsl(var(--destructive))'
};

export function UserInstructionsPanel({ className }: UserInstructionsPanelProps) {
  // Real database connection - NO MORE MOCK DATA
  const { data: instructions, loading, error, refetch, create, update, remove } = useUserInstructions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserType, setSelectedUserType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInstruction, setEditingInstruction] = useState<UserInstruction | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    userTypes: [] as UserType[],
    tags: [] as string[],
    priority: 'medium' as const,
    newTag: ''
  });

  // Filter instructions - with loading/error handling
  const filteredInstructions = (instructions || []).filter(instruction => {
    const matchesSearch = searchTerm === '' || 
      instruction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instruction.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instruction.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesUserType = selectedUserType === 'all' || 
      instruction.userTypes.includes(selectedUserType as UserType);

    const matchesPriority = selectedPriority === 'all' || 
      instruction.priority === selectedPriority;

    return matchesSearch && matchesUserType && matchesPriority;
  });

  const handleCreateInstruction = async () => {
    try {
      await create({
        title: formData.title,
        content: formData.content,
        userTypes: formData.userTypes,
        context: [], // Empty context array
        tags: formData.tags,
        priority: formData.priority
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      // Data will automatically refresh via the hook
    } catch (error) {
      console.error('Error creating instruction:', error);
      // Could add toast notification here
    }
  };

  const handleEditInstruction = (instruction: UserInstruction) => {
    setEditingInstruction(instruction);
    setFormData({
      title: instruction.title,
      content: instruction.content,
      userTypes: instruction.userTypes,
      tags: instruction.tags,
      priority: instruction.priority,
      newTag: ''
    });
  };

  const handleUpdateInstruction = async () => {
    if (!editingInstruction) return;

    try {
      await update(editingInstruction.id, {
        title: formData.title,
        content: formData.content,
        userTypes: formData.userTypes,
        context: editingInstruction.context || [],
        tags: formData.tags,
        priority: formData.priority
      });
      
      resetForm();
      setEditingInstruction(null);
      // Data will automatically refresh via the hook
    } catch (error) {
      console.error('Error updating instruction:', error);
      // Could add toast notification here
    }
  };

  const handleDeleteInstruction = async (id: string) => {
    try {
      await remove(id);
      // Data will automatically refresh via the hook
    } catch (error) {
      console.error('Error deleting instruction:', error);
      // Could add toast notification here
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      userTypes: [],
      tags: [],
      priority: 'medium' as const,
      newTag: ''
    });
  };

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUserTypeChange = (userType: UserType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      userTypes: checked 
        ? [...prev.userTypes, userType]
        : prev.userTypes.filter(type => type !== userType)
    }));
  };

  // Handle loading state
  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading instructions...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading instructions: {error}</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">User Instructions</h2>
            <p className="text-muted-foreground">
              Manage context-aware instructions for different user types
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Instruction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create User Instruction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter instruction title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter detailed instruction content..."
                    rows={6}
                  />
                </div>

                <div>
                  <Label>User Types</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(userTypeLabels).map(([type, label]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={formData.userTypes.includes(type as UserType)}
                          onCheckedChange={(checked) => 
                            handleUserTypeChange(type as UserType, checked as boolean)
                          }
                        />
                        <Label htmlFor={type} className="text-sm">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={formData.newTag}
                      onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                      placeholder="Add tag..."
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInstruction} disabled={!formData.title || !formData.content}>
                    Create Instruction
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search instructions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedUserType} onValueChange={setSelectedUserType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All User Types</SelectItem>
                  {Object.entries(userTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Instructions List */}
        <div className="grid gap-4">
          {filteredInstructions.map((instruction) => (
            <Card key={instruction.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg">{instruction.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>v{instruction.version}</span>
                      <span>Updated: {instruction.lastUpdated}</span>
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <Badge 
                          style={{ backgroundColor: priorityColors[instruction.priority] }}
                          className="text-white"
                        >
                          {instruction.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditInstruction(instruction)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteInstruction(instruction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed">{instruction.content}</p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="flex space-x-1">
                        {instruction.userTypes.map(type => (
                          <Badge key={type} variant="outline">
                            {userTypeLabels[type]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <div className="flex space-x-1">
                        {instruction.tags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInstructions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No instructions match your filters.</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingInstruction} onOpenChange={(open) => !open && setEditingInstruction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User Instruction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>

              <div>
                <Label>User Types</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(userTypeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${type}`}
                        checked={formData.userTypes.includes(type as UserType)}
                        onCheckedChange={(checked) => 
                          handleUserTypeChange(type as UserType, checked as boolean)
                        }
                      />
                      <Label htmlFor={`edit-${type}`} className="text-sm">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex space-x-2 mt-2">
                  <Input
                    value={formData.newTag}
                    onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingInstruction(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateInstruction} disabled={!formData.title || !formData.content}>
                  Update Instruction
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
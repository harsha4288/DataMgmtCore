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
import { Plus, Search, Edit, Trash2, Settings, Code, TestTube, Package, Shield, Globe, Server, Loader2 } from 'lucide-react';
import { ToolConfiguration, ToolCategory, Environment, UserType } from '@/lib/documentation-system/types';
import { useToolConfigurations } from '@/hooks/useConfiguration';

interface ToolConfigurationPanelProps {
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

const categoryLabels: Record<ToolCategory, string> = {
  [ToolCategory.DEVELOPMENT_TOOLS]: 'Development',
  [ToolCategory.TESTING_FRAMEWORKS]: 'Testing',
  [ToolCategory.BUILD_SYSTEMS]: 'Build',
  [ToolCategory.QUALITY_TOOLS]: 'Quality',
  [ToolCategory.INTEGRATION_TOOLS]: 'Integration'
};

const environmentLabels: Record<Environment, string> = {
  [Environment.DEVELOPMENT]: 'Development',
  [Environment.STAGING]: 'Staging',
  [Environment.PRODUCTION]: 'Production',
  [Environment.TESTING]: 'Testing'
};

const categoryIcons = {
  [ToolCategory.DEVELOPMENT_TOOLS]: Code,
  [ToolCategory.TESTING_FRAMEWORKS]: TestTube,
  [ToolCategory.BUILD_SYSTEMS]: Package,
  [ToolCategory.QUALITY_TOOLS]: Shield,
  [ToolCategory.INTEGRATION_TOOLS]: Globe
};

const environmentColors: Record<Environment, string> = {
  [Environment.DEVELOPMENT]: 'hsl(var(--primary))',
  [Environment.STAGING]: 'hsl(var(--warning))',
  [Environment.PRODUCTION]: 'hsl(var(--destructive))',
  [Environment.TESTING]: 'hsl(var(--success))'
};

export function ToolConfigurationPanel({ className }: ToolConfigurationPanelProps) {
  // Real database connection - NO MORE MOCK DATA
  const { data: configurations, loading, error, refetch, create, update, remove } = useToolConfigurations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfiguration, setEditingConfiguration] = useState<ToolConfiguration | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    toolName: '',
    category: ToolCategory.DEVELOPMENT_TOOLS,
    environment: Environment.DEVELOPMENT,
    configuration: '{}',
    userTypes: [] as UserType[]
  });

  // Filter configurations - with loading/error handling
  const filteredConfigurations = (configurations || []).filter(config => {
    const matchesSearch = searchTerm === '' || 
      config.toolName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || 
      config.category === selectedCategory;

    const matchesEnvironment = selectedEnvironment === 'all' || 
      config.environment === selectedEnvironment;

    return matchesSearch && matchesCategory && matchesEnvironment;
  });

  const handleCreateConfiguration = async () => {
    try {
      const configObj = JSON.parse(formData.configuration);
      await create({
        toolName: formData.toolName,
        category: formData.category,
        environment: formData.environment,
        configuration: configObj,
        userTypes: formData.userTypes,
        validationRules: []
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      // Data will automatically refresh via the hook
    } catch (error) {
      console.error('Error creating configuration:', error);
      alert('Invalid JSON configuration or creation failed');
    }
  };

  const handleEditConfiguration = (config: ToolConfiguration) => {
    setEditingConfiguration(config);
    setFormData({
      toolName: config.toolName,
      category: config.category,
      environment: config.environment,
      configuration: JSON.stringify(config.configuration, null, 2),
      userTypes: config.userTypes
    });
  };

  const handleUpdateConfiguration = async () => {
    if (!editingConfiguration) return;

    try {
      const configObj = JSON.parse(formData.configuration);
      await update(editingConfiguration.id, {
        toolName: formData.toolName,
        category: formData.category,
        environment: formData.environment,
        configuration: configObj,
        userTypes: formData.userTypes,
        validationRules: editingConfiguration.validationRules || []
      });
      
      resetForm();
      setEditingConfiguration(null);
      // Data will automatically refresh via the hook
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Invalid JSON configuration or update failed');
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      await remove(id);
      // Data will automatically refresh via the hook
    } catch (error) {
      console.error('Error deleting configuration:', error);
      alert('Failed to delete configuration');
    }
  };

  const resetForm = () => {
    setFormData({
      toolName: '',
      category: ToolCategory.DEVELOPMENT_TOOLS,
      environment: Environment.DEVELOPMENT,
      configuration: '{}',
      userTypes: []
    });
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
          <span className="ml-2">Loading configurations...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <div className="text-center py-8">
          <p className="text-destructive">Error loading configurations: {error}</p>
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
            <h2 className="text-2xl font-bold">Tool Configuration</h2>
            <p className="text-muted-foreground">
              Manage development tools and framework configurations
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Configuration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Create Tool Configuration</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="toolName">Tool Name</Label>
                    <Input
                      id="toolName"
                      value={formData.toolName}
                      onChange={(e) => setFormData(prev => ({ ...prev, toolName: e.target.value }))}
                      placeholder="e.g., ESLint, TypeScript, Vite..."
                    />
                  </div>
                  
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ToolCategory }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Environment</Label>
                    <Select 
                      value={formData.environment} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, environment: value as Environment }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(environmentLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="configuration">Configuration (JSON)</Label>
                  <Textarea
                    id="configuration"
                    value={formData.configuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, configuration: e.target.value }))}
                    placeholder="Enter configuration as JSON object..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Applicable User Types</Label>
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

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateConfiguration} 
                    disabled={!formData.toolName || !formData.userTypes.length}
                  >
                    Create Configuration
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
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Environment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Environments</SelectItem>
                  {Object.entries(environmentLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configurations List */}
        <div className="grid gap-4">
          {filteredConfigurations.map((config) => {
            const CategoryIcon = categoryIcons[config.category] || Settings;
            
            return (
              <Card key={config.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{config.toolName}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {categoryLabels[config.category]}
                        </Badge>
                        <Badge 
                          style={{ backgroundColor: environmentColors[config.environment] }}
                          className="text-white"
                        >
                          {environmentLabels[config.environment]}
                        </Badge>
                        <span>Updated: {config.lastUpdated}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditConfiguration(config)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfiguration(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Configuration:</h4>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        <code>{JSON.stringify(config.configuration, null, 2)}</code>
                      </pre>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Server className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">User Types:</span>
                      <div className="flex space-x-1">
                        {config.userTypes.map(type => (
                          <Badge key={type} variant="secondary">
                            {userTypeLabels[type]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredConfigurations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No configurations match your filters.</p>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingConfiguration} onOpenChange={(open) => !open && setEditingConfiguration(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Tool Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-toolName">Tool Name</Label>
                  <Input
                    id="edit-toolName"
                    value={formData.toolName}
                    onChange={(e) => setFormData(prev => ({ ...prev, toolName: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as ToolCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Environment</Label>
                <Select 
                  value={formData.environment} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, environment: value as Environment }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(environmentLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-configuration">Configuration (JSON)</Label>
                <Textarea
                  id="edit-configuration"
                  value={formData.configuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, configuration: e.target.value }))}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label>Applicable User Types</Label>
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

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingConfiguration(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateConfiguration} 
                  disabled={!formData.toolName || !formData.userTypes.length}
                >
                  Update Configuration
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
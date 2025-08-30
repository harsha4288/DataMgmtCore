import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQualityStandards } from '@/hooks/useConfiguration';
import { Shield, Plus, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

export function QualityStandardsPanel() {
  const { data: standards, loading, error, create, update, remove } = useQualityStandards();
  const [selectedStandard, setSelectedStandard] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateStandard = () => {
    const newStandard = {
      name: 'New Quality Standard',
      category: 'code_quality',
      description: 'A new quality standard for ensuring code meets project requirements.',
      rules: [
        {
          name: 'basic_check',
          description: 'Basic quality validation',
          automated: true,
          severity: 'warning',
          parameters: {}
        }
      ],
      userTypes: ['ai_agent', 'human_developer'],
      enabled: true
    };

    setSelectedStandard(newStandard);
    setIsCreating(true);
  };

  const handleSaveNew = async () => {
    try {
      await create(selectedStandard);
      setIsCreating(false);
      setSelectedStandard(null);
    } catch (error) {
      console.error('Failed to create quality standard:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Quality Standards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading quality standards...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Quality Standards</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quality Standards Management</h2>
          <p className="text-muted-foreground">
            Define and enforce quality standards across code, documentation, and processes
          </p>
        </div>
        <Button onClick={handleCreateStandard}>
          <Plus className="w-4 h-4 mr-2" />
          New Standard
        </Button>
      </div>

      {/* Quality Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {standards.map((standard) => (
          <Card key={standard.id} className={`transition-all ${standard.enabled ? 'border-green-200' : 'border-gray-200 opacity-75'}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-sm font-medium">{standard.name}</CardTitle>
                    {standard.enabled ? (
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {standard.category.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedStandard(standard);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(standard.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground mb-3">
                {standard.description}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium mb-1">Rules ({standard.rules.length})</div>
                  <div className="space-y-1">
                    {standard.rules.slice(0, 3).map((rule: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          {getSeverityIcon(rule.severity)}
                          <span>{rule.name}</span>
                          {rule.automated && (
                            <Badge variant="outline" className="text-xs px-1">
                              Auto
                            </Badge>
                          )}
                        </div>
                        <Badge variant={getSeverityColor(rule.severity) as any} className="text-xs">
                          {rule.severity}
                        </Badge>
                      </div>
                    ))}
                    {standard.rules.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{standard.rules.length - 3} more rules
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {standard.userTypes.map((type: string) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quality Standard Editor/Creator Modal */}
      {(isEditing || isCreating) && selectedStandard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{isCreating ? 'Create New Quality Standard' : `Edit Quality Standard: ${selectedStandard.name}`}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setSelectedStandard(null);
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Standard Name</label>
                  <Input
                    value={selectedStandard.name}
                    onChange={(e) =>
                      setSelectedStandard({
                        ...selectedStandard,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={selectedStandard.category}
                    onValueChange={(value) =>
                      setSelectedStandard({
                        ...selectedStandard,
                        category: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="code_quality">Code Quality</SelectItem>
                      <SelectItem value="documentation_quality">Documentation Quality</SelectItem>
                      <SelectItem value="process_quality">Process Quality</SelectItem>
                      <SelectItem value="output_quality">Output Quality</SelectItem>
                      <SelectItem value="communication_quality">Communication Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={selectedStandard.description}
                  onChange={(e) =>
                    setSelectedStandard({
                      ...selectedStandard,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what this quality standard validates..."
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <label className="text-sm font-medium">Enabled</label>
                  <Switch
                    checked={selectedStandard.enabled}
                    onCheckedChange={(enabled) =>
                      setSelectedStandard({
                        ...selectedStandard,
                        enabled,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Quality Rules</label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {selectedStandard.rules.map((rule: any, index: number) => (
                    <Card key={index} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            {getSeverityIcon(rule.severity)}
                            <span className="font-medium text-sm">{rule.name}</span>
                            <Badge variant={getSeverityColor(rule.severity) as any} className="text-xs">
                              {rule.severity}
                            </Badge>
                            {rule.automated && (
                              <Badge variant="outline" className="text-xs">
                                Automated
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {selectedStandard.rules.filter((r: any) => r.automated).length} automated rules, {' '}
                  {selectedStandard.rules.filter((r: any) => !r.automated).length} manual rules
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                      setSelectedStandard(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (isCreating) {
                        await handleSaveNew();
                      } else {
                        try {
                          await update(selectedStandard.id, selectedStandard);
                          setIsEditing(false);
                          setSelectedStandard(null);
                        } catch (error) {
                          console.error('Failed to update quality standard:', error);
                        }
                      }
                    }}
                  >
                    {isCreating ? 'Create Standard' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Quality Health Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {standards.filter(s => s.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Standards</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {standards.reduce((sum, s) => sum + s.rules.filter((r: any) => r.automated).length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Automated Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {standards.reduce((sum, s) => sum + s.rules.filter((r: any) => r.severity === 'critical').length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Critical Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {standards.reduce((sum, s) => sum + s.rules.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Rules</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTemplates } from '@/hooks/useConfiguration';
import { FileText, Plus, Edit, Trash2, Play } from 'lucide-react';

export function TemplateManagementPanel() {
  const { data: templates, loading, error, create, update, remove } = useTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [renderVariables, setRenderVariables] = useState<Record<string, any>>({});

  const handleCreateTemplate = () => {
    const newTemplate = {
      name: 'New Template',
      type: 'task_template',
      content: '# {{templateName}}\n\nThis is a new template. Edit the content and variables as needed.',
      variables: [
        { name: 'templateName', type: 'string', required: true, defaultValue: 'Template Name' }
      ],
      conditions: [],
      outputFormats: ['markdown'],
      userTypes: ['ai_agent']
    };

    setSelectedTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleSaveNew = async () => {
    try {
      await create(selectedTemplate);
      setIsCreating(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleRenderTemplate = async (template: any) => {
    // Simple rendering with current variables
    let renderedContent = template.content;
    
    for (const variable of template.variables) {
      const value = renderVariables[variable.name] || variable.defaultValue || '';
      const regex = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'g');
      renderedContent = renderedContent.replace(regex, value);
    }

    // Create a preview window
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Template Preview: ${template.name}</title></head>
          <body style="font-family: -apple-system, sans-serif; padding: 20px; max-width: 800px;">
            <h2>Preview: ${template.name}</h2>
            <hr>
            <div style="white-space: pre-wrap; line-height: 1.6;">${renderedContent}</div>
          </body>
        </html>
      `);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Template Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading templates...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Template Management</span>
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
          <h2 className="text-2xl font-bold">Template Management</h2>
          <p className="text-muted-foreground">
            Create and manage dynamic templates for tasks, issues, and reports
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {template.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRenderTemplate(template)}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditing(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(template.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm text-muted-foreground mb-3">
                {template.content.substring(0, 100)}...
              </div>
              <div className="space-y-2">
                <div className="text-xs">
                  <span className="font-medium">Variables:</span>{' '}
                  {template.variables.map((v: any) => v.name).join(', ')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {template.userTypes.map((type: string) => (
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

      {/* Template Editor/Creator Modal */}
      {(isEditing || isCreating) && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{isCreating ? 'Create New Template' : `Edit Template: ${selectedTemplate.name}`}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    setSelectedTemplate(null);
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={selectedTemplate.name}
                    onChange={(e) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Template Type</label>
                  <Select
                    value={selectedTemplate.type}
                    onValueChange={(value) =>
                      setSelectedTemplate({
                        ...selectedTemplate,
                        type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task_template">Task Template</SelectItem>
                      <SelectItem value="issue_template">Issue Template</SelectItem>
                      <SelectItem value="review_template">Review Template</SelectItem>
                      <SelectItem value="report_template">Report Template</SelectItem>
                      <SelectItem value="communication_template">
                        Communication Template
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Template Content</label>
                <Textarea
                  className="min-h-48"
                  value={selectedTemplate.content}
                  onChange={(e) =>
                    setSelectedTemplate({
                      ...selectedTemplate,
                      content: e.target.value,
                    })
                  }
                  placeholder="Enter your template content with {{variable}} placeholders"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Test Variables</label>
                <div className="space-y-2">
                  {selectedTemplate.variables.map((variable: any, index: number) => (
                    <div key={index} className="flex space-x-2">
                      <Input
                        placeholder={`${variable.name} (${variable.type})`}
                        value={renderVariables[variable.name] || ''}
                        onChange={(e) =>
                          setRenderVariables({
                            ...renderVariables,
                            [variable.name]: e.target.value,
                          })
                        }
                      />
                      <Badge variant={variable.required ? 'destructive' : 'secondary'}>
                        {variable.required ? 'Required' : 'Optional'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleRenderTemplate(selectedTemplate)}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                      setSelectedTemplate(null);
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
                          await update(selectedTemplate.id, selectedTemplate);
                          setIsEditing(false);
                          setSelectedTemplate(null);
                        } catch (error) {
                          console.error('Failed to update template:', error);
                        }
                      }
                    }}
                  >
                    {isCreating ? 'Create Template' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
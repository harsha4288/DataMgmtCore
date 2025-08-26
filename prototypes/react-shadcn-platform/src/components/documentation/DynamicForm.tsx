/**
 * Dynamic Form Component
 * Renders forms based on JSON schema configuration
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { FormSchema, QueryResult } from '@/lib/documentation-system/types';
import { FormValidator, FormDataProcessor } from '@/lib/documentation-system/forms';

interface DynamicFormProps {
  schema: FormSchema;
  initialData?: any;
  onSubmit: (data: any, markdown: string) => Promise<QueryResult<any>>;
  onCancel?: () => void;
}

export function DynamicForm({ schema, initialData = {}, onSubmit, onCancel }: DynamicFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleNestedFieldChange = useCallback((parentField: string, childField: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value
      }
    }));
  }, []);

  const handleArrayFieldAdd = useCallback((field: string, newItem: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem]
    }));
  }, []);

  const handleArrayFieldRemove = useCallback((field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  }, []);

  const handleArrayItemChange = useCallback((field: string, index: number, newValue: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].map((item: any, i: number) => i === index ? newValue : item)
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = FormValidator.validate(formData, schema);
    if (!validation.success) {
      setErrors({ general: validation.error || 'Validation failed' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Transform to markdown
      const markdown = FormDataProcessor.transformToDocumentation(formData, schema.id);
      
      // Submit data
      const result = await onSubmit(formData, markdown);
      
      if (!result.success) {
        setErrors({ general: result.error || 'Submission failed' });
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (key: string, property: any, value: any) => {
    const uiSchema = schema.ui_schema[key] || {};
    const fieldId = `field-${key}`;

    switch (property.type) {
      case 'string':
        if (property.enum) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={fieldId}>{property.title}</Label>
              <Select value={value || ''} onValueChange={(val) => handleFieldChange(key, val)}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${property.title}`} />
                </SelectTrigger>
                <SelectContent>
                  {property.enum.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {property.description && <p className="text-sm text-muted-foreground">{property.description}</p>}
              {uiSchema['ui:help'] && <p className="text-sm text-muted-foreground">{uiSchema['ui:help']}</p>}
            </div>
          );
        }
        
        if (uiSchema['ui:widget'] === 'textarea') {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={fieldId}>{property.title}</Label>
              <Textarea
                id={fieldId}
                value={value || ''}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                rows={uiSchema['ui:rows'] || 3}
                placeholder={property.description}
              />
              {property.description && <p className="text-sm text-muted-foreground">{property.description}</p>}
              {uiSchema['ui:help'] && <p className="text-sm text-muted-foreground">{uiSchema['ui:help']}</p>}
            </div>
          );
        }

        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={fieldId}>{property.title}</Label>
            <Input
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              placeholder={property.description}
            />
            {property.description && <p className="text-sm text-muted-foreground">{property.description}</p>}
            {uiSchema['ui:help'] && <p className="text-sm text-muted-foreground">{uiSchema['ui:help']}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={fieldId}>{property.title}</Label>
            <Input
              id={fieldId}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(key, parseFloat(e.target.value) || 0)}
              min={property.minimum}
              max={property.maximum}
              placeholder={property.description}
            />
            {property.description && <p className="text-sm text-muted-foreground">{property.description}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(key, checked)}
            />
            <Label htmlFor={fieldId}>{property.title}</Label>
          </div>
        );

      case 'array':
        if (uiSchema['ui:widget'] === 'tags') {
          return (
            <TagsField
              key={key}
              label={property.title}
              description={property.description}
              help={uiSchema['ui:help']}
              value={value || []}
              onChange={(tags) => handleFieldChange(key, tags)}
            />
          );
        }

        return (
          <ArrayField
            key={key}
            label={property.title}
            description={property.description}
            value={value || []}
            schema={property.items}
            uiSchema={uiSchema.items || {}}
            onChange={(items) => handleFieldChange(key, items)}
          />
        );

      case 'object':
        return (
          <ObjectField
            key={key}
            label={property.title}
            description={property.description}
            value={value || {}}
            schema={property}
            uiSchema={uiSchema}
            onChange={(obj) => handleFieldChange(key, obj)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{schema.title}</CardTitle>
        <CardDescription>{schema.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.entries(schema.schema.properties || {}).map(([key, property]: [string, any]) =>
            renderField(key, property, formData[key])
          )}

          {errors.general && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {errors.general}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : `Create ${schema.name}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Supporting components
function TagsField({ label, description, help, value, onChange }: any) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag: string) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex space-x-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type and press Enter"
        />
        <Button type="button" size="icon" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
          </Badge>
        ))}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {help && <p className="text-sm text-muted-foreground">{help}</p>}
    </div>
  );
}

function ArrayField({ label, description, value, schema, uiSchema, onChange }: any) {
  const addItem = () => {
    const newItem = schema.type === 'object' ? {} : schema.type === 'string' ? '' : null;
    onChange([...value, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_: any, i: number) => i !== index));
  };

  const updateItem = (index: number, newValue: any) => {
    onChange(value.map((item: any, i: number) => i === index ? newValue : item));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Label>{label}</Label>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add {label.slice(0, -1)}
        </Button>
      </div>
      
      <div className="space-y-3">
        {value.map((item: any, index: number) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  {schema.type === 'object' ? (
                    <ObjectFields
                      item={item}
                      schema={schema}
                      uiSchema={uiSchema}
                      onChange={(newItem) => updateItem(index, newItem)}
                    />
                  ) : (
                    <Input
                      value={item || ''}
                      onChange={(e) => updateItem(index, e.target.value)}
                      placeholder={`Enter ${label.slice(0, -1).toLowerCase()}`}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ObjectField({ label, description, value, schema, uiSchema, onChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>{label}</Label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Card>
        <CardContent className="pt-4">
          <ObjectFields
            item={value}
            schema={schema}
            uiSchema={uiSchema}
            onChange={onChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ObjectFields({ item, schema, uiSchema, onChange }: any) {
  const updateField = (key: string, newValue: any) => {
    onChange({
      ...item,
      [key]: newValue
    });
  };

  return (
    <div className="space-y-4">
      {Object.entries(schema.properties || {}).map(([key, property]: [string, any]) => {
        const fieldUiSchema = uiSchema[key] || {};
        
        if (property.type === 'string' && fieldUiSchema['ui:widget'] === 'textarea') {
          return (
            <div key={key} className="space-y-2">
              <Label>{property.title}</Label>
              <Textarea
                value={item[key] || ''}
                onChange={(e) => updateField(key, e.target.value)}
                rows={fieldUiSchema['ui:rows'] || 2}
                placeholder={property.description}
              />
            </div>
          );
        }

        if (property.type === 'string' && property.enum) {
          return (
            <div key={key} className="space-y-2">
              <Label>{property.title}</Label>
              <Select value={item[key] || ''} onValueChange={(val) => updateField(key, val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {property.enum.map((option: string) => (
                    <SelectItem key={option} value={option}>
                      {option.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (property.type === 'array' && fieldUiSchema['ui:widget'] === 'tags') {
          return (
            <TagsField
              key={key}
              label={property.title}
              description={property.description}
              value={item[key] || []}
              onChange={(tags: string[]) => updateField(key, tags)}
            />
          );
        }

        if (property.type === 'boolean') {
          return (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                checked={item[key] || false}
                onCheckedChange={(checked) => updateField(key, checked)}
              />
              <Label>{property.title}</Label>
            </div>
          );
        }

        return (
          <div key={key} className="space-y-2">
            <Label>{property.title}</Label>
            <Input
              type={property.type === 'number' ? 'number' : 'text'}
              value={item[key] || ''}
              onChange={(e) => updateField(key, property.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
              placeholder={property.description}
            />
          </div>
        );
      })}
    </div>
  );
}
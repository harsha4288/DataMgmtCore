// Entity Validation Engine

import type { 
  EntityDefinition, 
  FieldDefinition, 
  ValidationRule, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning
} from '../../types/entity';

export class ValidationEngine {
  /**
   * Validate a record against entity definition
   */
  async validate(data: Record<string, any>, definition: EntityDefinition): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate each field
    for (const field of definition.fields) {
      const value = data[field.name];
      const fieldErrors = await this.validateField(value, field);
      errors.push(...fieldErrors);
    }

    // Validate business rules (basic validation rules only)
    const ruleErrors = await this.validateBusinessRules(data, definition);
    errors.push(...ruleErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single field
   */
  async validateField(value: any, field: FieldDefinition): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check required field
    if (field.required && this.isEmpty(value)) {
      errors.push({
        field: field.name,
        message: `${field.displayName} is required`,
        code: 'REQUIRED',
        value
      });
      return errors; // Don't continue validation if required field is empty
    }

    // Skip further validation if field is empty and not required
    if (this.isEmpty(value)) {
      return errors;
    }

    // Validate field type
    const typeError = this.validateFieldType(value, field);
    if (typeError) {
      errors.push(typeError);
    }

    // Apply validation rules
    for (const rule of field.validation) {
      const ruleError = await this.validateRule(value, rule, field);
      if (ruleError) {
        errors.push(ruleError);
      }
    }

    return errors;
  }

  /**
   * Validate field type
   */
  private validateFieldType(value: any, field: FieldDefinition): ValidationError | null {
    switch (field.type) {
      case 'text':
      case 'richtext':
        if (typeof value !== 'string') {
          return {
            field: field.name,
            message: `${field.displayName} must be a string`,
            code: 'INVALID_TYPE',
            value
          };
        }
        break;

      case 'number':
      case 'currency':
      case 'percentage':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: field.name,
            message: `${field.displayName} must be a valid number`,
            code: 'INVALID_TYPE',
            value
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: field.name,
            message: `${field.displayName} must be a boolean`,
            code: 'INVALID_TYPE',
            value
          };
        }
        break;

      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          return {
            field: field.name,
            message: `${field.displayName} must be a valid date`,
            code: 'INVALID_TYPE',
            value
          };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return {
            field: field.name,
            message: `${field.displayName} must be a valid email address`,
            code: 'INVALID_EMAIL',
            value
          };
        }
        break;

      case 'phone':
        if (typeof value !== 'string' || !this.isValidPhone(value)) {
          return {
            field: field.name,
            message: `${field.displayName} must be a valid phone number`,
            code: 'INVALID_PHONE',
            value
          };
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !this.isValidURL(value)) {
          return {
            field: field.name,
            message: `${field.displayName} must be a valid URL`,
            code: 'INVALID_URL',
            value
          };
        }
        break;

      case 'select':
        if (field.displayOptions.options) {
          const validValues = field.displayOptions.options.map(opt => opt.value);
          if (!validValues.includes(value)) {
            return {
              field: field.name,
              message: `${field.displayName} must be one of: ${validValues.join(', ')}`,
              code: 'INVALID_OPTION',
              value
            };
          }
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return {
            field: field.name,
            message: `${field.displayName} must be an array`,
            code: 'INVALID_TYPE',
            value
          };
        }
        if (field.displayOptions.options) {
          const validValues = field.displayOptions.options.map(opt => opt.value);
          const invalidValues = value.filter(v => !validValues.includes(v));
          if (invalidValues.length > 0) {
            return {
              field: field.name,
              message: `${field.displayName} contains invalid values: ${invalidValues.join(', ')}`,
              code: 'INVALID_OPTION',
              value
            };
          }
        }
        break;
    }

    return null;
  }

  /**
   * Validate a single validation rule
   */
  private async validateRule(value: any, rule: ValidationRule, field: FieldDefinition): Promise<ValidationError | null> {
    let isValid = true;

    switch (rule.type) {
      case 'required':
        isValid = !this.isEmpty(value);
        break;

      case 'min':
        if (typeof value === 'number') {
          isValid = value >= (rule.value as number);
        } else if (typeof value === 'string') {
          isValid = value.length >= (rule.value as number);
        } else if (Array.isArray(value)) {
          isValid = value.length >= (rule.value as number);
        }
        break;

      case 'max':
        if (typeof value === 'number') {
          isValid = value <= (rule.value as number);
        } else if (typeof value === 'string') {
          isValid = value.length <= (rule.value as number);
        } else if (Array.isArray(value)) {
          isValid = value.length <= (rule.value as number);
        }
        break;

      case 'range':
        if (typeof value === 'number' && Array.isArray(rule.value) && rule.value.length === 2) {
          isValid = value >= rule.value[0] && value <= rule.value[1];
        }
        break;

      case 'format':
      case 'pattern':
        if (typeof value === 'string' && typeof rule.value === 'string') {
          const regex = new RegExp(rule.value);
          isValid = regex.test(value);
        }
        break;

      case 'email':
        isValid = typeof value === 'string' && this.isValidEmail(value);
        break;

      case 'phone':
        isValid = typeof value === 'string' && this.isValidPhone(value);
        break;

      case 'url':
        isValid = typeof value === 'string' && this.isValidURL(value);
        break;

      case 'custom':
        // For custom validation, we would need to evaluate the condition
        // This is a simplified implementation
        if (rule.condition) {
          try {
            // In a real implementation, this would be safer evaluation
            isValid = this.evaluateCondition(rule.condition, value, field);
          } catch (error) {
            console.error('Error evaluating custom validation:', error);
            isValid = false;
          }
        }
        break;
    }

    if (!isValid) {
      return {
        field: field.name,
        message: rule.message,
        code: rule.type.toUpperCase(),
        value,
        rule
      };
    }

    return null;
  }

  /**
   * Validate business rules (simplified)
   */
  private async validateBusinessRules(data: Record<string, any>, definition: EntityDefinition): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // This is a basic implementation
    // In a full implementation, this would involve a more sophisticated rule engine
    for (const rule of definition.businessRules) {
      if (rule.trigger === 'before_save' && rule.active) {
        // Evaluate rule conditions
        const conditionsMet = rule.conditions.every(condition => {
          const fieldValue = data[condition.field];
          return this.evaluateRuleCondition(fieldValue, condition);
        });

        if (conditionsMet) {
          // Check if any actions are validation errors
          const validationActions = rule.actions.filter(action => action.type === 'send_notification');
          for (const action of validationActions) {
            errors.push({
              field: action.config.field || 'general',
              message: action.config.message || 'Business rule validation failed',
              code: 'BUSINESS_RULE',
              value: data[action.config.field || 'general']
            });
          }
        }
      }
    }

    return errors;
  }

  // Helper methods

  private isEmpty(value: any): boolean {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - can be enhanced based on requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private evaluateCondition(condition: string, value: any, field: FieldDefinition): boolean {
    // This is a very basic implementation
    // In production, you'd want a safer expression evaluator
    try {
      // Create a context object for evaluation
      const context = { value, field: field.name };
      
      // For security, this should use a proper expression parser
      // This is just a demo implementation
      const result = eval(`(function(context) { 
        const { value, field } = context; 
        return ${condition}; 
      })(${JSON.stringify(context)})`);
      
      return Boolean(result);
    } catch {
      return false;
    }
  }

  private evaluateRuleCondition(value: any, condition: any): boolean {
    switch (condition.operator) {
      case 'eq': return value === condition.value;
      case 'ne': return value !== condition.value;
      case 'gt': return value > condition.value;
      case 'gte': return value >= condition.value;
      case 'lt': return value < condition.value;
      case 'lte': return value <= condition.value;
      case 'in': return Array.isArray(condition.value) && condition.value.includes(value);
      case 'contains': return String(value).includes(String(condition.value));
      case 'is_null': return value == null;
      case 'is_not_null': return value != null;
      default: return true;
    }
  }
}
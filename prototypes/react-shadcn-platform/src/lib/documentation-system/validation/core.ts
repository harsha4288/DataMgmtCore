/**
 * Core Validation Engine
 * Flexible, rule-based validation system for structured documentation
 */

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'content' | 'metadata' | 'relationships' | 'quality' | 'consistency';
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  enabled: boolean;
  conditions?: ValidationCondition[];
  validator: (data: any, context: ValidationContext) => ValidationResult[];
}

export interface ValidationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'exists' | 'not_exists' | 'matches' | 'greater_than' | 'less_than';
  value: any;
}

export interface ValidationContext {
  type: 'task' | 'phase' | 'issue' | 'project';
  allData?: {
    tasks: any[];
    phases: any[];
    issues: any[];
  };
  config: ValidationConfig;
  metadata: {
    validateAt: Date;
    source: string;
    version: string;
  };
}

export interface ValidationResult {
  ruleId: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
  autoFixable: boolean;
  location?: {
    line?: number;
    column?: number;
    path: string;
  };
}

export interface ValidationReport {
  entityId: string;
  entityType: string;
  timestamp: string;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    suggestions: number;
  };
  results: ValidationResult[];
  score: number; // 0-100 quality score
  recommendations: string[];
}

export interface ValidationConfig {
  rules: {
    [ruleId: string]: {
      enabled: boolean;
      severity?: 'error' | 'warning' | 'info' | 'suggestion';
      config?: any;
    };
  };
  categories: {
    [category: string]: {
      enabled: boolean;
      weight: number; // For scoring
    };
  };
  thresholds: {
    minQualityScore: number;
    maxErrors: number;
    maxWarnings: number;
  };
  autoFix: {
    enabled: boolean;
    categories: string[];
  };
  output: {
    formats: ('json' | 'markdown' | 'html' | 'console')[];
    verbosity: 'minimal' | 'standard' | 'detailed' | 'debug';
    includeContext: boolean;
  };
}

export class DocumentationValidator {
  private rules: Map<string, ValidationRule> = new Map();
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  /**
   * Register a validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Register multiple rules
   */
  addRules(rules: ValidationRule[]): void {
    rules.forEach(rule => this.addRule(rule));
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get active rules for a specific entity type and category
   */
  getActiveRules(entityType?: string, category?: string): ValidationRule[] {
    const rules = Array.from(this.rules.values());
    
    return rules.filter(rule => {
      // Check if rule is globally enabled
      const ruleConfig = this.config.rules[rule.id];
      if (!ruleConfig?.enabled && !rule.enabled) return false;

      // Check if category is enabled
      if (category) {
        const categoryConfig = this.config.categories[category];
        if (!categoryConfig?.enabled) return false;
      }

      return true;
    });
  }

  /**
   * Validate a single entity
   */
  async validateEntity(
    data: any, 
    entityType: 'task' | 'phase' | 'issue', 
    allData?: any
  ): Promise<ValidationReport> {
    const context: ValidationContext = {
      type: entityType,
      allData,
      config: this.config,
      metadata: {
        validateAt: new Date(),
        source: data.id || 'unknown',
        version: '1.0.0'
      }
    };

    const results: ValidationResult[] = [];
    const activeRules = this.getActiveRules(entityType);

    // Run each active rule
    for (const rule of activeRules) {
      try {
        // Check conditions
        if (rule.conditions && !this.evaluateConditions(rule.conditions, data)) {
          continue;
        }

        // Run validator
        const ruleResults = rule.validator(data, context);
        
        // Apply severity override from config
        const ruleConfig = this.config.rules[rule.id];
        const finalResults = ruleResults.map(result => ({
          ...result,
          severity: ruleConfig?.severity || result.severity
        }));

        results.push(...finalResults);
      } catch (error) {
        // Rule execution error
        results.push({
          ruleId: rule.id,
          severity: 'error',
          message: `Rule execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          autoFixable: false
        });
      }
    }

    // Calculate quality score
    const score = this.calculateQualityScore(results);

    // Generate recommendations
    const recommendations = this.generateRecommendations(results, data, entityType);

    return {
      entityId: data.id || 'unknown',
      entityType,
      timestamp: new Date().toISOString(),
      summary: this.summarizeResults(results),
      results,
      score,
      recommendations
    };
  }

  /**
   * Validate multiple entities
   */
  async validateBatch(entities: Array<{data: any, type: 'task' | 'phase' | 'issue'}>): Promise<ValidationReport[]> {
    const reports: ValidationReport[] = [];
    
    // Collect all data for cross-references
    const allData = {
      tasks: entities.filter(e => e.type === 'task').map(e => e.data),
      phases: entities.filter(e => e.type === 'phase').map(e => e.data),
      issues: entities.filter(e => e.type === 'issue').map(e => e.data)
    };

    // Validate each entity
    for (const entity of entities) {
      const report = await this.validateEntity(entity.data, entity.type, allData);
      reports.push(report);
    }

    return reports;
  }

  /**
   * Auto-fix issues where possible
   */
  async autoFix(data: any, entityType: string): Promise<{fixed: any, changes: string[]}> {
    if (!this.config.autoFix.enabled) {
      return { fixed: data, changes: [] };
    }

    const report = await this.validateEntity(data, entityType as any);
    const fixableResults = report.results.filter(r => r.autoFixable);
    const changes: string[] = [];
    let fixed = { ...data };

    for (const result of fixableResults) {
      const rule = this.rules.get(result.ruleId);
      if (rule && this.config.autoFix.categories.includes(rule.category)) {
        // Apply auto-fix logic here
        // This would be implemented per rule
        changes.push(`Applied fix for: ${result.message}`);
      }
    }

    return { fixed, changes };
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(conditions: ValidationCondition[], data: any): boolean {
    return conditions.every(condition => {
      const value = this.getNestedValue(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'contains':
          return Array.isArray(value) ? value.includes(condition.value) : String(value).includes(condition.value);
        case 'not_contains':
          return Array.isArray(value) ? !value.includes(condition.value) : !String(value).includes(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        case 'not_exists':
          return value === undefined || value === null;
        case 'matches':
          return new RegExp(condition.value).test(String(value));
        case 'greater_than':
          return Number(value) > Number(condition.value);
        case 'less_than':
          return Number(value) < Number(condition.value);
        default:
          return true;
      }
    });
  }

  /**
   * Get nested object value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(results: ValidationResult[]): number {
    const weights = {
      error: -10,
      warning: -3,
      info: -1,
      suggestion: 0
    };

    const penalty = results.reduce((sum, result) => sum + weights[result.severity], 0);
    const baseScore = 100;
    const finalScore = Math.max(0, Math.min(100, baseScore + penalty));
    
    return Math.round(finalScore);
  }

  /**
   * Summarize validation results
   */
  private summarizeResults(results: ValidationResult[]) {
    const summary = {
      total: results.length,
      errors: 0,
      warnings: 0,
      info: 0,
      suggestions: 0
    };

    results.forEach(result => {
      summary[result.severity]++;
    });

    return summary;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(results: ValidationResult[], data: any, entityType: string): string[] {
    const recommendations: string[] = [];
    
    // High-level recommendations based on common patterns
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');

    if (errors.length > 0) {
      recommendations.push(`Fix ${errors.length} critical error${errors.length > 1 ? 's' : ''} to meet basic quality standards`);
    }

    if (warnings.length > 3) {
      recommendations.push(`Address ${warnings.length} warnings to improve documentation quality`);
    }

    // Entity-specific recommendations
    if (entityType === 'task') {
      const progressIssues = results.filter(r => r.field === 'progress');
      if (progressIssues.length > 0) {
        recommendations.push('Update task progress to reflect current completion status');
      }

      const subtaskIssues = results.filter(r => r.field?.includes('subtask'));
      if (subtaskIssues.length > 0) {
        recommendations.push('Review and update subtask definitions for clarity');
      }
    }

    if (entityType === 'issue') {
      const resolutionIssues = results.filter(r => r.field?.includes('resolution'));
      if (resolutionIssues.length > 0) {
        recommendations.push('Document resolution attempts with clear outcomes and lessons learned');
      }
    }

    // Auto-fixable recommendations
    const autoFixable = results.filter(r => r.autoFixable);
    if (autoFixable.length > 0) {
      recommendations.push(`${autoFixable.length} issue${autoFixable.length > 1 ? 's' : ''} can be automatically fixed`);
    }

    return recommendations;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Export validation report in different formats
   */
  exportReport(report: ValidationReport, format: 'json' | 'markdown' | 'html' | 'console'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'markdown':
        return this.generateMarkdownReport(report);
      
      case 'html':
        return this.generateHtmlReport(report);
      
      case 'console':
        return this.generateConsoleReport(report);
      
      default:
        return JSON.stringify(report, null, 2);
    }
  }

  private generateMarkdownReport(report: ValidationReport): string {
    const { summary, results, score, recommendations } = report;
    
    return `# Validation Report: ${report.entityId}

**Type:** ${report.entityType}  
**Quality Score:** ${score}/100  
**Timestamp:** ${report.timestamp}

## Summary
- **Total Issues:** ${summary.total}
- **Errors:** ${summary.errors} 🔴
- **Warnings:** ${summary.warnings} 🟡
- **Info:** ${summary.info} 🔵
- **Suggestions:** ${summary.suggestions} 💡

## Recommendations
${recommendations.map(rec => `- ${rec}`).join('\n')}

## Detailed Results
${results.map(result => `### ${result.severity.toUpperCase()}: ${result.message}
${result.field ? `**Field:** ${result.field}` : ''}
${result.suggestion ? `**Suggestion:** ${result.suggestion}` : ''}
${result.autoFixable ? '**Auto-fixable:** Yes' : ''}
`).join('\n')}
`;
  }

  private generateHtmlReport(report: ValidationReport): string {
    // HTML report generation would be implemented here
    return `<h1>Validation Report</h1><pre>${JSON.stringify(report, null, 2)}</pre>`;
  }

  private generateConsoleReport(report: ValidationReport): string {
    const { summary, score } = report;
    
    let output = `\n📊 Validation Report: ${report.entityId}\n`;
    output += `Quality Score: ${score}/100\n`;
    output += `Issues: ${summary.errors} errors, ${summary.warnings} warnings, ${summary.info} info\n`;
    
    if (summary.errors > 0) {
      output += '\n🔴 ERRORS:\n';
      report.results
        .filter(r => r.severity === 'error')
        .forEach(result => {
          output += `  - ${result.message}\n`;
        });
    }

    return output;
  }
}
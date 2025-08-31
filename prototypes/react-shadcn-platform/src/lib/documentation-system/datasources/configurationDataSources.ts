/**
 * Real Database Data Sources for Configuration Management
 * Replaces all mock data with actual SQLite persistence
 */

import DatabaseManager from '../../database';
import { UserInstruction, ToolConfiguration, Template, QualityStandard, QueryResult } from '../types';

export class ConfigurationDataSources {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  // ============================================================================
  // User Instructions Data Source
  // ============================================================================

  async getInstructions(userType?: string, context?: string): Promise<UserInstruction[]> {
    try {
      return this.db.getUserInstructions(userType, context);
    } catch (error) {
      console.error('Error fetching user instructions:', error);
      return [];
    }
  }

  async getInstruction(id: string): Promise<UserInstruction | null> {
    try {
      return this.db.getUserInstruction(id);
    } catch (error) {
      console.error('Error fetching user instruction:', error);
      return null;
    }
  }

  async createInstruction(data: Partial<UserInstruction>): Promise<QueryResult<UserInstruction>> {
    try {
      const result = this.db.createUserInstruction(data);
      return {
        data: result.data,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to create instruction: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateInstruction(id: string, data: Partial<UserInstruction>): Promise<QueryResult<UserInstruction>> {
    try {
      const result = this.db.updateUserInstruction(id, data);
      if (result.success) {
        return {
          data: result.data,
          success: result.success,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          data: null as any,
          success: false,
          error: 'Failed to update instruction',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to update instruction: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteInstruction(id: string): Promise<QueryResult<boolean>> {
    try {
      const result = this.db.deleteUserInstruction(id);
      return {
        data: result.success,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: `Failed to delete instruction: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async searchInstructions(query: string, userType?: string): Promise<UserInstruction[]> {
    try {
      return this.db.searchUserInstructions(query, userType);
    } catch (error) {
      console.error('Error searching instructions:', error);
      return [];
    }
  }

  // ============================================================================
  // Tool Configurations Data Source
  // ============================================================================

  async getConfigurations(category?: string, environment?: string, userType?: string): Promise<ToolConfiguration[]> {
    try {
      return this.db.getToolConfigurations(category, environment, userType);
    } catch (error) {
      console.error('Error fetching tool configurations:', error);
      return [];
    }
  }

  async getConfiguration(id: string): Promise<ToolConfiguration | null> {
    try {
      return this.db.getToolConfiguration(id);
    } catch (error) {
      console.error('Error fetching tool configuration:', error);
      return null;
    }
  }

  async createConfiguration(data: Partial<ToolConfiguration>): Promise<QueryResult<ToolConfiguration>> {
    try {
      const result = this.db.createToolConfiguration(data);
      return {
        data: result.data,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to create configuration: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateConfiguration(id: string, data: Partial<ToolConfiguration>): Promise<QueryResult<ToolConfiguration>> {
    try {
      const result = this.db.updateToolConfiguration(id, data);
      if (result.success) {
        return {
          data: result.data,
          success: result.success,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          data: null as any,
          success: false,
          error: 'Failed to update configuration',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to update configuration: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteConfiguration(id: string): Promise<QueryResult<boolean>> {
    try {
      const result = this.db.deleteToolConfiguration(id);
      return {
        data: result.success,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: `Failed to delete configuration: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // Templates Data Source
  // ============================================================================

  async getTemplates(type?: string, userType?: string): Promise<Template[]> {
    try {
      return this.db.getTemplates(type, userType);
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  async getTemplate(id: string): Promise<Template | null> {
    try {
      return this.db.getTemplate(id);
    } catch (error) {
      console.error('Error fetching template:', error);
      return null;
    }
  }

  async renderTemplate(templateId: string, variables: Record<string, any>, outputFormat?: string): Promise<any> {
    try {
      return this.db.renderTemplate(templateId, variables, outputFormat);
    } catch (error) {
      console.error('Error rendering template:', error);
      return {
        success: false,
        error: `Failed to render template: ${error}`
      };
    }
  }

  async createTemplate(data: Partial<Template>): Promise<QueryResult<Template>> {
    try {
      const result = this.db.createTemplate(data);
      return {
        data: result.data,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to create template: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateTemplate(id: string, data: Partial<Template>): Promise<QueryResult<Template>> {
    try {
      const result = this.db.updateTemplate(id, data);
      if (result.success) {
        return {
          data: result.data,
          success: result.success,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          data: null as any,
          success: false,
          error: 'Failed to update template',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to update template: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteTemplate(id: string): Promise<QueryResult<boolean>> {
    try {
      const result = this.db.deleteTemplate(id);
      return {
        data: result.success,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: `Failed to delete template: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // Quality Standards Data Source
  // ============================================================================

  async getStandards(category?: string, userType?: string): Promise<QualityStandard[]> {
    try {
      return this.db.getQualityStandards(category, userType);
    } catch (error) {
      console.error('Error fetching quality standards:', error);
      return [];
    }
  }

  async getStandard(id: string): Promise<QualityStandard | null> {
    try {
      return this.db.getQualityStandard(id);
    } catch (error) {
      console.error('Error fetching quality standard:', error);
      return null;
    }
  }

  async validateContent(content: any, standards: string[]): Promise<any> {
    try {
      const results = [];
      
      for (const standardId of standards) {
        const standard = await this.getStandard(standardId);
        if (!standard || !standard.enabled) continue;
        
        const validationResult = {
          standardId,
          standardName: standard.name,
          category: standard.category,
          passed: true,
          violations: [] as any[],
          warnings: [] as any[]
        };

        // Execute quality rules
        for (const rule of standard.rules) {
          try {
            const ruleResult = await this.executeQualityRule(rule, content);
            if (!ruleResult.passed) {
              validationResult.passed = false;
              if (rule.severity === 'error' || rule.severity === 'critical') {
                validationResult.violations.push({
                  rule: rule.name,
                  message: ruleResult.message,
                  severity: rule.severity
                });
              } else {
                validationResult.warnings.push({
                  rule: rule.name,
                  message: ruleResult.message,
                  severity: rule.severity
                });
              }
            }
          } catch (error) {
            console.error(`Error executing rule ${rule.name}:`, error);
          }
        }

        results.push(validationResult);
      }

      return {
        success: true,
        data: {
          overallPassed: results.every(r => r.passed),
          results,
          summary: {
            totalStandards: results.length,
            passedStandards: results.filter(r => r.passed).length,
            totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
            totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0)
          },
          validatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Quality validation failed: ${error}`
      };
    }
  }

  private async executeQualityRule(rule: any, content: any): Promise<{ passed: boolean; message?: string }> {
    // Basic quality rule implementations
    switch (rule.name.toLowerCase()) {
      case 'no_hardcoded_colors':
        return this.validateNoHardcodedColors(content);
      case 'component_reusability':
        return this.validateComponentReusability(content);
      case 'theme_compliance':
        return this.validateThemeCompliance(content);
      case 'documentation_completeness':
        return this.validateDocumentationCompleteness(content);
      default:
        return { passed: true }; // Unknown rules pass by default
    }
  }

  private validateNoHardcodedColors(content: string): { passed: boolean; message?: string } {
    const hardcodedColorPattern = /(#[0-9a-fA-F]{3,6}|rgb\(|rgba\(|hsl\((?!\s*var\())/;
    if (hardcodedColorPattern.test(content)) {
      return {
        passed: false,
        message: 'Hardcoded colors found. Use theme variables instead.'
      };
    }
    return { passed: true };
  }

  private validateComponentReusability(content: string): { passed: boolean; message?: string } {
    // Simple heuristic: check for prop interfaces and generic patterns
    const hasProps = /interface\s+\w+Props/.test(content);
    const hasGenericPatterns = /\w+Props/.test(content);
    
    if (!hasProps && !hasGenericPatterns && content.includes('export')) {
      return {
        passed: false,
        message: 'Component may not be reusable. Consider adding props interface.'
      };
    }
    return { passed: true };
  }

  private validateThemeCompliance(content: string): { passed: boolean; message?: string } {
    const themeVariablePattern = /hsl\(var\(--[\w-]+\)\)/;
    const hasColors = /(color|background|border):/i.test(content);
    
    if (hasColors && !themeVariablePattern.test(content)) {
      return {
        passed: false,
        message: 'Use theme variables for colors: hsl(var(--variable-name))'
      };
    }
    return { passed: true };
  }

  private validateDocumentationCompleteness(content: string): { passed: boolean; message?: string } {
    const hasComments = /\/\*\*[\s\S]*?\*\//.test(content) || /\/\//.test(content);
    const hasExports = /export/.test(content);
    
    if (hasExports && !hasComments) {
      return {
        passed: false,
        message: 'Exported code should include documentation comments.'
      };
    }
    return { passed: true };
  }

  async createStandard(data: Partial<QualityStandard>): Promise<QueryResult<QualityStandard>> {
    try {
      const result = this.db.createQualityStandard(data);
      return {
        data: result.data,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to create quality standard: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateStandard(id: string, data: Partial<QualityStandard>): Promise<QueryResult<QualityStandard>> {
    try {
      const result = this.db.updateQualityStandard(id, data);
      if (result.success) {
        return {
          data: result.data,
          success: result.success,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          data: null as any,
          success: false,
          error: 'Failed to update quality standard',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        data: null as any,
        success: false,
        error: `Failed to update quality standard: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteStandard(id: string): Promise<QueryResult<boolean>> {
    try {
      const result = this.db.deleteQualityStandard(id);
      return {
        data: result.success,
        success: result.success,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: `Failed to delete quality standard: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}
/**
 * Validation Configuration System
 * Configurable validation settings and presets
 */

import { ValidationConfig } from './core';

export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  rules: {
    'required-fields': { enabled: true, severity: 'error' },
    'id-format': { enabled: true, severity: 'error' },
    'content-length': { enabled: true, severity: 'warning' },
    'content-quality': { enabled: true, severity: 'suggestion' },
    'status-consistency': { enabled: true, severity: 'error' },
    'progress-validation': { enabled: true, severity: 'warning' },
    'dependency-validation': { enabled: true, severity: 'warning' },
    'phase-task-relationship': { enabled: true, severity: 'error' },
    'naming-conventions': { enabled: true, severity: 'suggestion' },
    'date-consistency': { enabled: true, severity: 'warning' }
  },
  categories: {
    structure: { enabled: true, weight: 30 },
    content: { enabled: true, weight: 25 },
    metadata: { enabled: true, weight: 20 },
    relationships: { enabled: true, weight: 15 },
    consistency: { enabled: true, weight: 10 }
  },
  thresholds: {
    minQualityScore: 70,
    maxErrors: 0,
    maxWarnings: 3
  },
  autoFix: {
    enabled: true,
    categories: ['metadata', 'consistency']
  },
  output: {
    formats: ['json', 'console'],
    verbosity: 'standard',
    includeContext: true
  }
};

export const STRICT_CONFIG: ValidationConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  thresholds: {
    minQualityScore: 90,
    maxErrors: 0,
    maxWarnings: 1
  },
  rules: {
    ...DEFAULT_VALIDATION_CONFIG.rules,
    'content-length': { enabled: true, severity: 'error' },
    'content-quality': { enabled: true, severity: 'warning' },
    'naming-conventions': { enabled: true, severity: 'warning' }
  }
};

export const LENIENT_CONFIG: ValidationConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  thresholds: {
    minQualityScore: 50,
    maxErrors: 2,
    maxWarnings: 10
  },
  rules: {
    'required-fields': { enabled: true, severity: 'error' },
    'id-format': { enabled: true, severity: 'warning' },
    'content-length': { enabled: true, severity: 'info' },
    'content-quality': { enabled: false },
    'status-consistency': { enabled: true, severity: 'warning' },
    'progress-validation': { enabled: true, severity: 'info' },
    'dependency-validation': { enabled: true, severity: 'info' },
    'phase-task-relationship': { enabled: true, severity: 'error' },
    'naming-conventions': { enabled: false },
    'date-consistency': { enabled: true, severity: 'info' }
  }
};

export const AI_FOCUSED_CONFIG: ValidationConfig = {
  ...DEFAULT_VALIDATION_CONFIG,
  rules: {
    'required-fields': { enabled: true, severity: 'error' },
    'id-format': { enabled: true, severity: 'error' },
    'content-length': { enabled: true, severity: 'warning' },
    'content-quality': { enabled: true, severity: 'error' }, // AI needs quality content
    'status-consistency': { enabled: true, severity: 'error' },
    'progress-validation': { enabled: true, severity: 'error' },
    'dependency-validation': { enabled: true, severity: 'error' },
    'phase-task-relationship': { enabled: true, severity: 'error' },
    'naming-conventions': { enabled: true, severity: 'warning' },
    'date-consistency': { enabled: true, severity: 'warning' }
  },
  categories: {
    structure: { enabled: true, weight: 35 },
    content: { enabled: true, weight: 35 }, // Higher weight for AI
    metadata: { enabled: true, weight: 15 },
    relationships: { enabled: true, weight: 10 },
    consistency: { enabled: true, weight: 5 }
  },
  thresholds: {
    minQualityScore: 85,
    maxErrors: 0,
    maxWarnings: 2
  }
};

export class ValidationConfigManager {
  private configs: Map<string, ValidationConfig> = new Map();

  constructor() {
    // Register built-in configs
    this.addConfig('default', DEFAULT_VALIDATION_CONFIG);
    this.addConfig('strict', STRICT_CONFIG);
    this.addConfig('lenient', LENIENT_CONFIG);
    this.addConfig('ai-focused', AI_FOCUSED_CONFIG);
  }

  /**
   * Add a custom configuration
   */
  addConfig(name: string, config: ValidationConfig): void {
    this.configs.set(name, config);
  }

  /**
   * Get a configuration by name
   */
  getConfig(name: string): ValidationConfig | null {
    return this.configs.get(name) || null;
  }

  /**
   * List all available configurations
   */
  listConfigs(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Create a custom configuration from a base config
   */
  createCustomConfig(baseConfig: string, overrides: Partial<ValidationConfig>): ValidationConfig {
    const base = this.getConfig(baseConfig);
    if (!base) {
      throw new Error(`Base configuration '${baseConfig}' not found`);
    }

    return this.mergeConfigs(base, overrides);
  }

  /**
   * Merge configuration objects
   */
  private mergeConfigs(base: ValidationConfig, overrides: Partial<ValidationConfig>): ValidationConfig {
    return {
      rules: { ...base.rules, ...overrides.rules },
      categories: { ...base.categories, ...overrides.categories },
      thresholds: { ...base.thresholds, ...overrides.thresholds },
      autoFix: { ...base.autoFix, ...overrides.autoFix },
      output: { ...base.output, ...overrides.output }
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: ValidationConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check thresholds
    if (config.thresholds.minQualityScore < 0 || config.thresholds.minQualityScore > 100) {
      errors.push('minQualityScore must be between 0 and 100');
    }

    if (config.thresholds.maxErrors < 0) {
      errors.push('maxErrors must be non-negative');
    }

    if (config.thresholds.maxWarnings < 0) {
      errors.push('maxWarnings must be non-negative');
    }

    // Check category weights
    const totalWeight = Object.values(config.categories).reduce((sum, cat) => sum + cat.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      errors.push('Category weights must sum to 100');
    }

    // Check output formats
    const validFormats = ['json', 'markdown', 'html', 'console'];
    for (const format of config.output.formats) {
      if (!validFormats.includes(format)) {
        errors.push(`Invalid output format: ${format}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate configuration for specific use cases
   */
  generateConfigForUseCase(useCase: 'development' | 'ci-cd' | 'production' | 'ai-consumption'): ValidationConfig {
    switch (useCase) {
      case 'development':
        return this.createCustomConfig('lenient', {
          output: {
            formats: ['console'],
            verbosity: 'detailed',
            includeContext: true
          }
        });

      case 'ci-cd':
        return this.createCustomConfig('strict', {
          output: {
            formats: ['json'],
            verbosity: 'minimal',
            includeContext: false
          },
          autoFix: {
            enabled: false,
            categories: []
          }
        });

      case 'production':
        return this.createCustomConfig('default', {
          thresholds: {
            minQualityScore: 95,
            maxErrors: 0,
            maxWarnings: 0
          },
          output: {
            formats: ['json', 'html'],
            verbosity: 'standard',
            includeContext: true
          }
        });

      case 'ai-consumption':
        return this.getConfig('ai-focused')!;

      default:
        return DEFAULT_VALIDATION_CONFIG;
    }
  }

  /**
   * Export configuration to JSON
   */
  exportConfig(name: string): string {
    const config = this.getConfig(name);
    if (!config) {
      throw new Error(`Configuration '${name}' not found`);
    }
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(name: string, jsonString: string): void {
    try {
      const config = JSON.parse(jsonString) as ValidationConfig;
      const validation = this.validateConfig(config);
      
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      this.addConfig(name, config);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Rule configuration builder for dynamic rule creation
 */
export class RuleConfigBuilder {
  private config: Partial<ValidationConfig['rules']> = {};

  /**
   * Enable a rule with optional severity override
   */
  enable(ruleId: string, severity?: 'error' | 'warning' | 'info' | 'suggestion'): this {
    this.config[ruleId] = { enabled: true, severity };
    return this;
  }

  /**
   * Disable a rule
   */
  disable(ruleId: string): this {
    this.config[ruleId] = { enabled: false };
    return this;
  }

  /**
   * Enable all rules in a category
   */
  enableCategory(rules: any[], category: string, severity?: 'error' | 'warning' | 'info' | 'suggestion'): this {
    const categoryRules = rules.filter(rule => rule.category === category);
    for (const rule of categoryRules) {
      this.enable(rule.id, severity);
    }
    return this;
  }

  /**
   * Disable all rules in a category
   */
  disableCategory(rules: any[], category: string): this {
    const categoryRules = rules.filter(rule => rule.category === category);
    for (const rule of categoryRules) {
      this.disable(rule.id);
    }
    return this;
  }

  /**
   * Build the rule configuration
   */
  build(): ValidationConfig['rules'] {
    return { ...this.config };
  }
}

// Export singleton instance
export const configManager = new ValidationConfigManager();
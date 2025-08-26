/**
 * Advanced Documentation Validation API Server
 * Runs on port 3005, provides robust validation services
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3005;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3004'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Simple in-memory validation engine (would use proper imports in TypeScript)
class ValidationEngine {
  constructor() {
    this.rules = new Map();
    this.config = this.getDefaultConfig();
    this.initializeRules();
  }

  getDefaultConfig() {
    return {
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
      }
    };
  }

  initializeRules() {
    // Required fields rule
    this.rules.set('required-fields', {
      id: 'required-fields',
      name: 'Required Fields',
      category: 'structure',
      severity: 'error',
      validator: (data, context) => {
        const results = [];
        const requiredFields = this.getRequiredFields(context.type);

        for (const field of requiredFields) {
          const value = this.getNestedValue(data, field.path);
          if (value === undefined || value === null || value === '') {
            results.push({
              ruleId: 'required-fields',
              severity: 'error',
              message: 'Required field \'' + field.name + '\' is missing',
              field: field.path,
              suggestion: field.suggestion,
              autoFixable: false
            });
          }
        }

        return results;
      }
    });

    // ID format rule
    this.rules.set('id-format', {
      id: 'id-format',
      name: 'ID Format Validation',
      category: 'structure',
      severity: 'error',
      validator: (data, context) => {
        const results = [];
        if (!data.id) return results;

        const patterns = {
          task: /^task-\\d+\\.\\d+-.+$/,
          phase: /^phase-\\d+$/,
          issue: /^issue-.+$/
        };

        const pattern = patterns[context.type];
        if (pattern && !pattern.test(data.id)) {
          results.push({
            ruleId: 'id-format',
            severity: 'error',
            message: 'Invalid ID format for ' + context.type + ': \'' + data.id + '\'',
            field: 'id',
            suggestion: this.getIdFormatSuggestion(context.type),
            autoFixable: false
          });
        }

        return results;
      }
    });

    // Content length rule
    this.rules.set('content-length', {
      id: 'content-length',
      name: 'Content Length Validation',
      category: 'content',
      severity: 'warning',
      validator: (data, context) => {
        const results = [];
        const contentFields = this.getContentFields(context.type);

        for (const field of contentFields) {
          const value = this.getNestedValue(data, field.path);
          if (typeof value === 'string') {
            if (value.length < field.minLength) {
              results.push({
                ruleId: 'content-length',
                severity: 'warning',
                message: field.name + ' is too short (' + value.length + ' chars, minimum: ' + field.minLength + ')',
                field: field.path,
                suggestion: 'Expand ' + field.name + ' with more detailed information',
                autoFixable: false
              });
            }

            if (field.maxLength && value.length > field.maxLength) {
              results.push({
                ruleId: 'content-length',
                severity: 'info',
                message: field.name + ' is very long (' + value.length + ' chars, consider splitting)',
                field: field.path,
                suggestion: 'Consider breaking down ' + field.name + ' into smaller sections',
                autoFixable: false
              });
            }
          }
        }

        return results;
      }
    });

    // Status consistency rule
    this.rules.set('status-consistency', {
      id: 'status-consistency',
      name: 'Status Consistency',
      category: 'metadata',
      severity: 'error',
      validator: (data, context) => {
        const results = [];
        const validStatuses = this.getValidStatuses(context.type);
        const status = this.getNestedValue(data, 'status') || this.getNestedValue(data, 'metadata.status');
        
        if (status && !validStatuses.includes(status)) {
          results.push({
            ruleId: 'status-consistency',
            severity: 'error',
            message: 'Invalid status: \'' + status + '\' for ' + context.type,
            field: 'status',
            suggestion: 'Use one of: ' + validStatuses.join(', '),
            autoFixable: true
          });
        }

        return results;
      }
    });

    // Progress validation rule
    this.rules.set('progress-validation', {
      id: 'progress-validation',
      name: 'Progress Validation',
      category: 'metadata',
      severity: 'warning',
      validator: (data, context) => {
        const results = [];
        const progress = data.progress;
        const status = data.status || data.metadata?.status;

        if (typeof progress === 'number') {
          if (progress < 0 || progress > 100) {
            results.push({
              ruleId: 'progress-validation',
              severity: 'error',
              message: 'Progress must be between 0 and 100, got: ' + progress,
              field: 'progress',
              suggestion: 'Set progress to a value between 0 and 100',
              autoFixable: true
            });
          }

          if (status === 'completed' && progress < 100) {
            results.push({
              ruleId: 'progress-validation',
              severity: 'warning',
              message: 'Task marked as completed but progress is ' + progress + '%',
              field: 'progress',
              suggestion: 'Set progress to 100% for completed tasks',
              autoFixable: true
            });
          }

          if (status === 'pending' && progress > 0) {
            results.push({
              ruleId: 'progress-validation',
              severity: 'info',
              message: 'Task marked as pending but has ' + progress + '% progress',
              field: 'status',
              suggestion: 'Consider changing status to "in_progress"',
              autoFixable: true
            });
          }
        }

        return results;
      }
    });
  }

  async validateEntity(data, entityType, allData = null) {
    const context = {
      type: entityType,
      allData,
      config: this.config,
      metadata: {
        validateAt: new Date(),
        source: data.id || 'unknown',
        version: '1.0.0'
      }
    };

    const results = [];
    const activeRules = Array.from(this.rules.values()).filter(rule => {
      const ruleConfig = this.config.rules[rule.id];
      return ruleConfig?.enabled;
    });

    for (const rule of activeRules) {
      try {
        const ruleResults = rule.validator(data, context);
        
        // Apply severity override from config
        const ruleConfig = this.config.rules[rule.id];
        const finalResults = ruleResults.map(result => ({
          ...result,
          severity: ruleConfig?.severity || result.severity
        }));

        results.push(...finalResults);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          severity: 'error',
          message: 'Rule execution failed: ' + error.message,
          autoFixable: false
        });
      }
    }

    const score = this.calculateQualityScore(results);
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

  calculateQualityScore(results) {
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

  summarizeResults(results) {
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

  generateRecommendations(results, data, entityType) {
    const recommendations = [];
    
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');

    if (errors.length > 0) {
      recommendations.push('Fix ' + errors.length + ' critical error' + (errors.length > 1 ? 's' : '') + ' to meet basic quality standards');
    }

    if (warnings.length > 3) {
      recommendations.push('Address ' + warnings.length + ' warnings to improve documentation quality');
    }

    const autoFixable = results.filter(r => r.autoFixable);
    if (autoFixable.length > 0) {
      recommendations.push(autoFixable.length + ' issue' + (autoFixable.length > 1 ? 's' : '') + ' can be automatically fixed');
    }

    return recommendations;
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getRequiredFields(entityType) {
    const fieldMap = {
      task: [
        { path: 'id', name: 'ID', suggestion: 'Use format: task-X.Y-description' },
        { path: 'name', name: 'Name', suggestion: 'Provide a descriptive task name' },
        { path: 'description', name: 'Description', suggestion: 'Add detailed task description' },
        { path: 'phase_id', name: 'Phase ID', suggestion: 'Specify which phase this task belongs to' },
        { path: 'metadata.status', name: 'Status', suggestion: 'Set initial status (typically "pending")' }
      ],
      phase: [
        { path: 'id', name: 'ID', suggestion: 'Use format: phase-X' },
        { path: 'name', name: 'Name', suggestion: 'Provide a descriptive phase name' },
        { path: 'description', name: 'Description', suggestion: 'Describe phase objectives and scope' }
      ],
      issue: [
        { path: 'title', name: 'Title', suggestion: 'Provide a clear issue title' },
        { path: 'description', name: 'Description', suggestion: 'Describe the issue in detail' },
        { path: 'type', name: 'Type', suggestion: 'Specify issue type (bug, feature, qa, etc.)' },
        { path: 'severity', name: 'Severity', suggestion: 'Set issue severity level' }
      ]
    };

    return fieldMap[entityType] || [];
  }

  getContentFields(entityType) {
    const fieldMap = {
      task: [
        { path: 'name', name: 'Task Name', minLength: 5, maxLength: 100 },
        { path: 'description', name: 'Description', minLength: 20, maxLength: 1000 }
      ],
      phase: [
        { path: 'name', name: 'Phase Name', minLength: 5, maxLength: 100 },
        { path: 'description', name: 'Description', minLength: 20, maxLength: 2000 }
      ],
      issue: [
        { path: 'title', name: 'Issue Title', minLength: 10, maxLength: 200 },
        { path: 'description', name: 'Description', minLength: 20, maxLength: 2000 }
      ]
    };

    return fieldMap[entityType] || [];
  }

  getValidStatuses(entityType) {
    const statusMap = {
      task: ['pending', 'in_progress', 'completed', 'blocked', 'cancelled'],
      phase: ['pending', 'in_progress', 'completed'],
      issue: ['open', 'in_progress', 'resolved', 'closed']
    };

    return statusMap[entityType] || [];
  }

  getIdFormatSuggestion(entityType) {
    const suggestions = {
      task: 'Use format: task-X.Y-description (e.g., task-1.1-setup-project)',
      phase: 'Use format: phase-X (e.g., phase-1)',
      issue: 'Use format: issue-description (e.g., issue-login-bug)'
    };

    return suggestions[entityType] || 'Follow ID naming conventions';
  }
}

const validator = new ValidationEngine();

// === API ENDPOINTS ===

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'documentation-validation-api',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Validate single entity
app.post('/validate/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data, allData } = req.body;

    if (!['task', 'phase', 'issue'].includes(entityType)) {
      return res.status(400).json({
        error: 'Invalid entity type. Must be task, phase, or issue'
      });
    }

    if (!data) {
      return res.status(400).json({
        error: 'Missing data field in request body'
      });
    }

    const report = await validator.validateEntity(data, entityType, allData);
    res.json(report);

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

// Validate batch of entities
app.post('/validate-batch', async (req, res) => {
  try {
    const { entities, allData } = req.body;

    if (!Array.isArray(entities)) {
      return res.status(400).json({
        error: 'entities must be an array'
      });
    }

    const reports = [];
    for (const entity of entities) {
      if (!entity.data || !entity.type) {
        reports.push({
          error: 'Each entity must have data and type fields',
          entity
        });
        continue;
      }

      const report = await validator.validateEntity(entity.data, entity.type, allData);
      reports.push(report);
    }

    const summary = {
      total: reports.length,
      successful: reports.filter(r => !r.error).length,
      failed: reports.filter(r => r.error).length,
      avgScore: reports
        .filter(r => !r.error)
        .reduce((sum, r) => sum + r.score, 0) / Math.max(1, reports.filter(r => !r.error).length)
    };

    res.json({ summary, reports });

  } catch (error) {
    console.error('Batch validation error:', error);
    res.status(500).json({
      error: 'Batch validation failed',
      message: error.message
    });
  }
});

// Get validation configuration
app.get('/config', (req, res) => {
  res.json(validator.config);
});

// Update validation configuration
app.post('/config', (req, res) => {
  try {
    const newConfig = req.body;
    validator.config = { ...validator.config, ...newConfig };
    res.json({ 
      success: true, 
      message: 'Configuration updated',
      config: validator.config 
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid configuration',
      message: error.message
    });
  }
});

// Get available rules
app.get('/rules', (req, res) => {
  const rules = Array.from(validator.rules.values()).map(rule => ({
    id: rule.id,
    name: rule.name,
    category: rule.category,
    severity: rule.severity,
    enabled: validator.config.rules[rule.id]?.enabled || false
  }));

  res.json(rules);
});

// Validate project structure
app.post('/validate-project', async (req, res) => {
  try {
    const { projectPath } = req.body;
    
    if (!projectPath) {
      return res.status(400).json({
        error: 'projectPath is required'
      });
    }

    // Load project data from file system
    const basePath = path.resolve(projectPath, 'docs/progress');
    if (!fs.existsSync(basePath)) {
      return res.status(404).json({
        error: 'Project documentation path not found'
      });
    }

    // Simple project validation
    const entities = [];
    
    // Load phases
    const phaseDirs = fs.readdirSync(basePath)
      .filter(dir => dir.startsWith('phase-') && fs.statSync(path.join(basePath, dir)).isDirectory());

    for (const phaseDir of phaseDirs) {
      const phasePath = path.join(basePath, phaseDir);
      const readmePath = path.join(phasePath, 'README.md');
      
      if (fs.existsSync(readmePath)) {
        // Simple phase data extraction
        const content = fs.readFileSync(readmePath, 'utf-8');
        const nameMatch = content.match(/^# (.+)$/m);
        
        entities.push({
          type: 'phase',
          data: {
            id: phaseDir,
            name: nameMatch ? nameMatch[1] : phaseDir,
            description: 'Phase description from file',
            status: 'pending'
          }
        });
      }
    }

    // Validate all entities
    const reports = [];
    for (const entity of entities) {
      const report = await validator.validateEntity(entity.data, entity.type);
      reports.push(report);
    }

    const summary = {
      total: reports.length,
      avgScore: reports.reduce((sum, r) => sum + r.score, 0) / Math.max(1, reports.length),
      totalIssues: reports.reduce((sum, r) => sum + r.summary.total, 0),
      totalErrors: reports.reduce((sum, r) => sum + r.summary.errors, 0),
      totalWarnings: reports.reduce((sum, r) => sum + r.summary.warnings, 0)
    };

    res.json({ summary, reports });

  } catch (error) {
    console.error('Project validation error:', error);
    res.status(500).json({
      error: 'Project validation failed',
      message: error.message
    });
  }
});

// Error handling for server startup
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception in Validation API:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection in Validation API:', reason);
  process.exit(1);
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log('🔍 Documentation Validation API running at http://localhost:' + PORT);
  console.log('📊 Available endpoints:');
  console.log('  POST /validate/:entityType - Validate single entity');
  console.log('  POST /validate-batch - Validate multiple entities');
  console.log('  POST /validate-project - Validate entire project');
  console.log('  GET  /config - Get validation configuration');
  console.log('  POST /config - Update validation configuration');
  console.log('  GET  /rules - Get available validation rules');
  console.log('  GET  /health - Health check');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the existing server or use a different port.`);
  } else {
    console.error('❌ Server error:', error.message);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Validation API server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Validation API server closed');
    process.exit(0);
  });
});
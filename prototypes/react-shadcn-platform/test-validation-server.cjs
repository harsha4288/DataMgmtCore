/**
 * Test Validation Server with Fixed Regex
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3006; // Different port to avoid conflicts

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3004'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Fixed ValidationEngine with correct regex patterns
class TestValidationEngine {
  constructor() {
    this.rules = new Map();
    this.initializeRules();
  }

  initializeRules() {
    // ID format rule with FIXED regex patterns
    this.rules.set('id-format', {
      id: 'id-format',
      name: 'ID Format Validation',
      category: 'structure',
      severity: 'error',
      validator: (data, context) => {
        const results = [];
        if (!data.id) return results;

        // CORRECTED patterns without double escaping
        const patterns = {
          task: /^task-\d+\.\d+-.+$/,
          phase: /^phase-\d+$/,
          issue: /^issue-.+$/
        };

        const pattern = patterns[context.type];
        if (pattern && !pattern.test(data.id)) {
          results.push({
            ruleId: 'id-format',
            severity: 'error',
            message: `Invalid ID format for ${context.type}: '${data.id}'`,
            field: 'id',
            suggestion: this.getIdFormatSuggestion(context.type),
            autoFixable: false
          });
        }

        return results;
      }
    });
  }

  async validateEntity(data, entityType) {
    const context = {
      type: entityType,
      metadata: {
        validateAt: new Date(),
        source: data.id || 'unknown',
        version: '2.0.0-test'
      }
    };

    const results = [];
    const activeRules = Array.from(this.rules.values());

    for (const rule of activeRules) {
      try {
        const ruleResults = rule.validator(data, context);
        results.push(...ruleResults);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          severity: 'error',
          message: `Rule execution failed: ${error.message}`,
          autoFixable: false
        });
      }
    }

    const score = this.calculateQualityScore(results);

    return {
      entityId: data.id || 'unknown',
      entityType,
      timestamp: new Date().toISOString(),
      summary: this.summarizeResults(results),
      results,
      score,
      recommendations: this.generateRecommendations(results)
    };
  }

  calculateQualityScore(results) {
    const weights = { error: -10, warning: -3, info: -1, suggestion: 0 };
    const penalty = results.reduce((sum, result) => sum + weights[result.severity], 0);
    const baseScore = 100;
    return Math.max(0, Math.min(100, baseScore + penalty));
  }

  summarizeResults(results) {
    const summary = { total: results.length, errors: 0, warnings: 0, info: 0, suggestions: 0 };
    results.forEach(result => { summary[result.severity]++; });
    return summary;
  }

  generateRecommendations(results) {
    const recommendations = [];
    const errors = results.filter(r => r.severity === 'error');
    if (errors.length > 0) {
      recommendations.push(`Fix ${errors.length} critical error${errors.length > 1 ? 's' : ''} to meet basic quality standards`);
    }
    return recommendations;
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

const validator = new TestValidationEngine();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'test-validation-api',
    version: '2.0.0-test',
    timestamp: new Date().toISOString()
  });
});

// Validate single entity  
app.post('/validate/:entityType', async (req, res) => {
  try {
    const { entityType } = req.params;
    const { data } = req.body;

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

    const report = await validator.validateEntity(data, entityType);
    res.json(report);

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🔍 TEST Validation API running at http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log('  POST /validate/:entityType - Validate single entity');
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
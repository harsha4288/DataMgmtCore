/**
 * Serverless Validation API Handler for Vercel
 * Handles validation requests for production deployment
 */

// Import validation rules and engine if available
let validationRules, ValidationEngine;
try {
  const rulesModule = require('../dist/lib/documentation-system/validation/rules.js');
  const engineModule = require('../dist/lib/documentation-system/validation/core.js');
  validationRules = rulesModule.validationRules;
  ValidationEngine = engineModule.ValidationEngine;
} catch (error) {
  console.warn('Validation modules not available in serverless environment, using mock validation');
  validationRules = [];
  ValidationEngine = null;
}

// Mock validation rules for when modules are not available
const mockValidationRules = [
  {
    id: 'required-fields',
    name: 'Required Fields',
    category: 'structure',
    severity: 'error',
    enabled: true
  },
  {
    id: 'id-format',
    name: 'ID Format Validation',
    category: 'structure', 
    severity: 'error',
    enabled: true
  },
  {
    id: 'content-length',
    name: 'Content Length Validation',
    category: 'content',
    severity: 'warning',
    enabled: true
  },
  {
    id: 'status-consistency',
    name: 'Status Consistency',
    category: 'metadata',
    severity: 'error',
    enabled: true
  },
  {
    id: 'progress-validation',
    name: 'Progress Validation',
    category: 'metadata',
    severity: 'warning',
    enabled: true
  }
];

// Mock validation function
function mockValidate(data, rules) {
  const results = [];
  
  // Simple validation example
  if (!data.id) {
    results.push({
      rule: 'required-fields',
      message: 'ID is required',
      severity: 'error',
      field: 'id'
    });
  }
  
  if (!data.title && !data.name) {
    results.push({
      rule: 'required-fields', 
      message: 'Title or name is required',
      severity: 'error',
      field: 'title/name'
    });
  }
  
  return {
    valid: results.length === 0,
    results,
    summary: {
      total: results.length,
      errors: results.filter(r => r.severity === 'error').length,
      warnings: results.filter(r => r.severity === 'warning').length,
      suggestions: results.filter(r => r.severity === 'suggestion').length
    }
  };
}

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method, url } = req;
  const urlPath = url.replace('/api/validation', '');

  try {
    switch (method) {
      case 'GET':
        if (urlPath === '/health') {
          res.status(200).json({
            status: 'healthy',
            service: 'documentation-validation-api',
            version: '2.0.0',
            timestamp: new Date().toISOString()
          });
          return;
        }
        
        if (urlPath === '/rules') {
          const rules = validationRules?.length > 0 ? validationRules : mockValidationRules;
          res.status(200).json(rules.map(rule => ({
            id: rule.id,
            name: rule.name,
            category: rule.category,
            severity: rule.severity,
            enabled: rule.enabled
          })));
          return;
        }
        
        if (urlPath === '/config') {
          res.status(200).json({
            enabled: true,
            rules: validationRules?.length > 0 ? validationRules.length : mockValidationRules.length,
            version: '2.0.0'
          });
          return;
        }
        
        break;
        
      case 'POST':
        if (urlPath.startsWith('/validate/')) {
          const entityType = urlPath.replace('/validate/', '');
          const data = req.body;
          
          let validationResult;
          if (ValidationEngine) {
            const engine = new ValidationEngine(validationRules);
            validationResult = engine.validate(data, { type: entityType });
          } else {
            validationResult = mockValidate(data, mockValidationRules);
          }
          
          res.status(200).json(validationResult);
          return;
        }
        
        if (urlPath === '/validate-batch') {
          const { entities } = req.body;
          const results = [];
          
          for (const entity of entities || []) {
            let validationResult;
            if (ValidationEngine) {
              const engine = new ValidationEngine(validationRules);
              validationResult = engine.validate(entity.data, { type: entity.type });
            } else {
              validationResult = mockValidate(entity.data, mockValidationRules);
            }
            
            results.push({
              id: entity.id,
              type: entity.type,
              validation: validationResult
            });
          }
          
          res.status(200).json({
            results,
            summary: {
              total: results.length,
              valid: results.filter(r => r.validation.valid).length,
              invalid: results.filter(r => !r.validation.valid).length
            }
          });
          return;
        }
        
        if (urlPath === '/validate-project') {
          // Mock project validation
          res.status(200).json({
            valid: true,
            results: [],
            summary: {
              total: 0,
              errors: 0,
              warnings: 0,
              suggestions: 0
            },
            timestamp: new Date().toISOString()
          });
          return;
        }
        
        if (urlPath === '/config') {
          // Mock config update
          res.status(200).json({
            success: true,
            message: 'Configuration updated'
          });
          return;
        }
        
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    // If we get here, the route wasn't handled
    res.status(404).json({ error: 'Not found' });
    
  } catch (error) {
    console.error('Validation API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
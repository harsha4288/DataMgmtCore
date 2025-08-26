/**
 * Simple Validation API Server
 * Minimal Express server focused only on validation results
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execAsync = util.promisify(exec);

const app = express();
const PORT = 3003; // Use different port to avoid conflicts

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Simple validation endpoint
app.get('/api/validation-results', async (req, res) => {
  console.log('🔧 Validation endpoint called');
  
  try {
    const validationScript = path.join(__dirname, 'validate-documentation.js');
    console.log('🔧 Running:', `node "${validationScript}" --json`);
    
    let result;
    try {
      // Try to run the script (it will exit with code 1 if errors found)
      result = await execAsync(`node "${validationScript}" --json`, {
        cwd: __dirname,
        maxBuffer: 2 * 1024 * 1024 // 2MB buffer
      });
      console.log('🔧 Script completed successfully (no errors found)');
    } catch (error) {
      // This is expected when validation finds errors (exit code 1)
      console.log('🔧 Script exited with code:', error.code, '(expected when errors found)');
      result = { stdout: error.stdout, stderr: error.stderr };
    }
    
    const output = result.stdout || '';
    console.log('🔧 Output length:', output.length);
    
    if (output.length === 0) {
      return res.json({
        isRunning: false,
        lastRun: new Date().toISOString(),
        errors: [],
        warnings: [{
          id: 'no-output',
          type: 'MISSING_CONTENT',
          message: 'Validation script produced no output',
          recommendation: 'Check if validate-documentation.js script exists and is working'
        }],
        summary: {
          totalFiles: 0,
          filesWithErrors: 0,
          filesWithWarnings: 1,
          coverage: []
        }
      });
    }
    
    // Try to parse JSON output
    try {
      const validationData = JSON.parse(output.trim());
      console.log('🔧 Successfully parsed validation data:', {
        errors: validationData.errors?.length || 0,
        warnings: validationData.warnings?.length || 0
      });
      
      // Return the parsed data directly
      return res.json({
        ...validationData,
        isRunning: false,
        lastRun: new Date().toISOString()
      });
      
    } catch (parseError) {
      console.error('🔧 Failed to parse JSON:', parseError.message);
      console.log('🔧 First 500 chars of output:', output.substring(0, 500));
      
      return res.json({
        isRunning: false,
        lastRun: new Date().toISOString(),
        errors: [{
          id: 'parse-error',
          type: 'STANDARDS_VIOLATION',
          severity: 'error',
          file: 'validation-system',
          message: 'Failed to parse validation script output as JSON',
          suggestion: parseError.message
        }],
        warnings: [],
        summary: {
          totalFiles: 0,
          filesWithErrors: 1,
          filesWithWarnings: 0,
          coverage: ['JSON parsing validation']
        }
      });
    }
    
  } catch (error) {
    console.error('🔧 Unexpected error:', error);
    return res.status(500).json({
      isRunning: false,
      lastRun: new Date().toISOString(),
      errors: [{
        id: 'system-error',
        type: 'STANDARDS_VIOLATION',
        severity: 'error',
        file: 'validation-system',
        message: 'Failed to run validation script',
        suggestion: error.message
      }],
      warnings: [],
      summary: {
        totalFiles: 0,
        filesWithErrors: 1,
        filesWithWarnings: 0,
        coverage: ['System error handling']
      }
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'simple-validation-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Validation API running at http://localhost:${PORT}`);
  console.log(`   GET  /api/validation-results - Get validation results`);
  console.log(`   GET  /api/health - Health check`);
});
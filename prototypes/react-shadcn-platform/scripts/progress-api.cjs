/**
 * Progress API Server
 * Simple Express server to serve progress data from PROGRESS.md
 * Can be run alongside the Vite dev server
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { ProgressReader } = require('./readProgress.cjs');

const execAsync = util.promisify(exec);

const app = express();
const PORT = 3002;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Progress endpoint
app.get('/api/progress', (req, res) => {
  try {
    const reader = new ProgressReader();
    const data = reader.read();
    
    if (data) {
      const dashboardFormat = reader.toDashboardFormat(data);
      res.json(dashboardFormat);
    } else {
      res.status(404).json({ error: 'Progress data not found' });
    }
  } catch (error) {
    console.error('Error reading progress:', error);
    res.status(500).json({ error: 'Failed to read progress data' });
  }
});

// Progress sync endpoint
app.post('/api/progress/sync', (req, res) => {
  try {
    const { ProgressSync } = require('./sync-progress.cjs');
    const sync = new ProgressSync();
    sync.sync();
    
    res.json({ success: true, message: 'Progress synced successfully' });
  } catch (error) {
    console.error('Error syncing progress:', error);
    res.status(500).json({ error: 'Failed to sync progress' });
  }
});

// Task status update endpoint
app.post('/api/task-status', async (req, res) => {
  try {
    const { taskId, newStatus, filePath } = req.body;
    
    if (!taskId || !newStatus || !filePath) {
      return res.status(400).json({ 
        error: 'Missing required fields: taskId, newStatus, filePath' 
      });
    }
    
    console.log(`🔄 API: Updating task ${taskId} to ${newStatus} in ${filePath}`);
    
    // Convert relative path to absolute path
    const absolutePath = filePath.startsWith('/') 
      ? path.join(__dirname, '..', filePath.substring(1))
      : filePath;
    
    console.log(`📁 Resolved absolute path: ${absolutePath}`);
    
    // Read current file
    const fileContent = await fs.readFile(absolutePath, 'utf8');
    
    // Update YAML front matter status
    const updatedContent = updateYamlStatus(fileContent, newStatus);
    
    // Write back to file
    await fs.writeFile(absolutePath, updatedContent, 'utf8');
    
    console.log(`✅ Successfully updated task ${taskId} status to ${newStatus}`);
    res.json({ 
      success: true, 
      message: `Task ${taskId} status updated to ${newStatus}`,
      filePath: absolutePath
    });
    
  } catch (error) {
    console.error(`❌ Failed to update task status:`, error);
    res.status(500).json({ 
      error: 'Failed to update task status', 
      details: error.message 
    });
  }
});

// Helper function to update YAML status
function updateYamlStatus(content, newStatus) {
  const statusEmoji = getStatusEmoji(newStatus);
  const formattedStatus = formatStatus(newStatus);
  
  // Replace status line in YAML front matter
  // More comprehensive pattern to handle various formats
  const patterns = [
    /^> \*\*Status:\*\* 🟡 [\w\s]+/m,
    /^> \*\*Status:\*\* 🔄 [\w\s]+/m,
    /^> \*\*Status:\*\* 🟢 [\w\s]+/m,
    /^> \*\*Status:\*\* 🔴 [\w\s]+/m,
    /^> \*\*Status:\*\* ⚫ [\w\s]+/m,
    /^> \*\*Status:\*\* [🟡🔄🟢🔴⚫] [\w\s]+/mu,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      return content.replace(
        pattern,
        `> **Status:** ${statusEmoji} ${formattedStatus}  `
      );
    }
  }
  
  // If no existing status pattern found, try to add after other YAML front matter
  const yamlSectionMatch = content.match(/^(> \*\*[^:]+:\*\* [^\n]+\n)/m);
  if (yamlSectionMatch) {
    const insertIndex = content.indexOf(yamlSectionMatch[0]) + yamlSectionMatch[0].length;
    return content.slice(0, insertIndex) + 
           `> **Status:** ${statusEmoji} ${formattedStatus}  \n` + 
           content.slice(insertIndex);
  }
  
  console.warn(`⚠️ Could not find status pattern in file content for update`);
  return content;
}

function getStatusEmoji(status) {
  switch (status) {
    case 'pending':
      return '🟡';
    case 'in_progress':
      return '🔄';
    case 'completed':
      return '🟢';
    case 'blocked':
      return '🔴';
    case 'on_hold':
      return '⚫';
    default:
      return '🟡';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'blocked':
      return 'Blocked';
    case 'on_hold':
      return 'On Hold';
    default:
      return 'Pending';
  }
}

// Git status endpoint
app.get('/api/git-status', async (req, res) => {
  try {
    const [statusResult, branchResult, logResult] = await Promise.all([
      execAsync('git status --porcelain', { cwd: path.join(__dirname, '..') }),
      execAsync('git branch --show-current', { cwd: path.join(__dirname, '..') }),
      execAsync('git log -1 --format="%H|%s|%an|%ai"', { cwd: path.join(__dirname, '..') })
    ]);

    const statusLines = statusResult.stdout.trim().split('\n').filter(line => line.trim());
    const staged = statusLines.filter(line => line.charAt(0) !== ' ' && line.charAt(0) !== '?').length;
    const unstaged = statusLines.filter(line => line.charAt(1) !== ' ').length;
    const untracked = statusLines.filter(line => line.startsWith('??')).length;

    const branch = branchResult.stdout.trim();
    const logParts = logResult.stdout.trim().split('|');

    res.json({
      branch,
      ahead: 0,
      behind: 0,
      staged,
      unstaged,
      untracked,
      lastCommit: {
        hash: logParts[0]?.substring(0, 7) || 'Unknown',
        message: logParts[1] || 'Unknown',
        author: logParts[2] || 'Unknown',
        timestamp: logParts[3] || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting git status:', error);
    res.status(500).json({ 
      error: 'Failed to get git status',
      details: error.message 
    });
  }
});

// Quality checks endpoint
app.get('/api/quality-checks', async (req, res) => {
  try {
    const checks = [];
    
    // Run lint check
    try {
      const lintResult = await execAsync('npm run lint', { cwd: path.join(__dirname, '..') });
      checks.push({
        id: `lint-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lint',
        status: 'pass',
        message: 'ESLint passed with no errors',
        errorCount: 0,
        warningCount: 0,
        fileCount: 0
      });
    } catch (error) {
      const errorLines = error.stdout ? error.stdout.split('\n') : [];
      const errorCount = errorLines.filter(line => line.includes('error')).length;
      const warningCount = errorLines.filter(line => line.includes('warning')).length;
      
      checks.push({
        id: `lint-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'lint',
        status: errorCount > 0 ? 'fail' : 'warning',
        message: `ESLint found ${errorCount} errors, ${warningCount} warnings`,
        errorCount,
        warningCount,
        fileCount: 0,
        details: error.stdout
      });
    }

    // Run type check
    try {
      const typeResult = await execAsync('npm run type-check', { cwd: path.join(__dirname, '..') });
      checks.push({
        id: `type-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'type-check',
        status: 'pass',
        message: 'TypeScript compilation successful',
        errorCount: 0,
        warningCount: 0,
        fileCount: 0
      });
    } catch (error) {
      const errorLines = error.stdout ? error.stdout.split('\n') : [];
      const errorCount = errorLines.filter(line => line.includes('error')).length;
      
      checks.push({
        id: `type-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'type-check',
        status: 'fail',
        message: `TypeScript found ${errorCount} errors`,
        errorCount,
        warningCount: 0,
        fileCount: 0,
        details: error.stdout
      });
    }

    res.json(checks);
  } catch (error) {
    console.error('Error running quality checks:', error);
    res.status(500).json({ 
      error: 'Failed to run quality checks',
      details: error.message 
    });
  }
});

// Documentation validation endpoint
app.get('/api/validation-results', async (req, res) => {
  try {
    // Check if validation script exists
    const validationScript = path.join(__dirname, '..', 'validate-documentation.js');
    const scriptExists = await fs.access(validationScript).then(() => true).catch(() => false);
    
    if (!scriptExists) {
      return res.json({
        isRunning: false,
        lastRun: new Date(),
        summary: {
          totalErrors: 0,
          totalWarnings: 1,
          sizeViolations: 0,
          templateViolations: 0,
          brokenLinks: 0
        },
        results: [{
          type: 'warning',
          message: 'Documentation validation script not found',
          file: 'validate-documentation.js',
          details: 'Run: npm install documentation validation dependencies'
        }]
      });
    }

    // Run validation script
    const result = await execAsync(`node "${validationScript}"`, { cwd: path.join(__dirname, '..') });
    
    // Parse validation results (this would depend on your validation script output format)
    res.json({
      isRunning: false,
      lastRun: new Date(),
      summary: {
        totalErrors: 0,
        totalWarnings: 0,
        sizeViolations: 0,
        templateViolations: 0,
        brokenLinks: 0
      },
      results: []
    });
  } catch (error) {
    console.error('Error running documentation validation:', error);
    res.json({
      isRunning: false,
      lastRun: new Date(),
      summary: {
        totalErrors: 1,
        totalWarnings: 0,
        sizeViolations: 0,
        templateViolations: 0,
        brokenLinks: 0
      },
      results: [{
        type: 'error',
        message: 'Failed to run documentation validation',
        file: 'validation-system',
        details: error.message
      }]
    });
  }
});

// Run validation endpoint
app.post('/api/run-validation', async (req, res) => {
  try {
    const validationScript = path.join(__dirname, '..', 'validate-documentation.js');
    const result = await execAsync(`node "${validationScript}"`, { cwd: path.join(__dirname, '..') });
    
    res.json({
      success: true,
      message: 'Documentation validation completed',
      output: result.stdout
    });
  } catch (error) {
    console.error('Error running validation:', error);
    res.status(500).json({
      success: false,
      message: 'Documentation validation failed',
      error: error.message,
      output: error.stdout || error.stderr
    });
  }
});

// Run quality check endpoint
app.post('/api/run-quality-check', async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Quality check type is required' });
    }

    let command;
    switch (type) {
      case 'lint':
        command = 'npm run lint';
        break;
      case 'type-check':
        command = 'npm run type-check';
        break;
      case 'theme':
        command = 'npm run validate:theme';
        break;
      case 'build':
        command = 'npm run build';
        break;
      default:
        return res.status(400).json({ error: `Unknown quality check type: ${type}` });
    }

    try {
      const result = await execAsync(command, { cwd: path.join(__dirname, '..') });
      res.json({
        status: 'pass',
        message: `${type} check passed successfully`,
        errorCount: 0,
        warningCount: 0,
        fileCount: 0,
        details: result.stdout
      });
    } catch (error) {
      const errorLines = error.stdout ? error.stdout.split('\n') : [];
      const errorCount = errorLines.filter(line => line.includes('error')).length;
      const warningCount = errorLines.filter(line => line.includes('warning')).length;
      
      res.json({
        status: errorCount > 0 ? 'fail' : 'warning',
        message: `${type} check found ${errorCount} errors, ${warningCount} warnings`,
        errorCount,
        warningCount,
        fileCount: 0,
        details: error.stdout || error.stderr
      });
    }
  } catch (error) {
    console.error('Error running quality check:', error);
    res.status(500).json({
      status: 'fail',
      message: `Failed to run ${req.body.type} check`,
      errorCount: 1,
      warningCount: 0,
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'progress-api' });
});

app.listen(PORT, () => {
  console.log(`📊 Progress API server running at http://localhost:${PORT}`);
  console.log(`   GET  /api/progress - Get current progress data`);
  console.log(`   POST /api/progress/sync - Sync progress from task files`);
  console.log(`   POST /api/task-status - Update task status in .md files`);
});
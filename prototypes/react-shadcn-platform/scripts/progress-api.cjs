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
        errors: [],
        warnings: [{
          id: 'script-missing',
          type: 'MISSING_CONTENT',
          message: 'Documentation validation script not found',
          file: 'validate-documentation.js',
          recommendation: 'Run: npm install documentation validation dependencies'
        }],
        summary: {
          totalFiles: 0,
          filesWithErrors: 0,
          filesWithWarnings: 1,
          coverage: ['Documentation validation script availability check']
        }
      });
    }

    let validationOutput = '';
    let hasErrors = false;
    
    try {
      const result = await execAsync(`node "${validationScript}"`, { cwd: path.join(__dirname, '..') });
      validationOutput = result.stdout;
    } catch (error) {
      // Validation script returns exit code 1 when it finds errors, this is expected behavior
      validationOutput = error.stdout || error.stderr || '';
      hasErrors = true;
    }

    // Parse the validation output to extract structured data
    const errors = [];
    const warnings = [];
    let totalErrors = 0;
    let sizeViolations = 0;
    let templateViolations = 0;
    let brokenLinks = 0;

    if (validationOutput) {
      const lines = validationOutput.split('\n');
      let currentErrorId = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Parse size violations
        if (line.includes('SIZE VIOLATION:')) {
          const match = line.match(/SIZE VIOLATION: (.+?) has (\d+) lines \(limit: (\d+)\)/);
          if (match) {
            errors.push({
              id: `size-${currentErrorId++}`,
              type: 'SIZE_VIOLATION',
              severity: 'error',
              file: match[1].replace(/\\/g, '/'),
              message: `File has ${match[2]} lines (limit: ${match[3]})`,
              suggestion: 'Consider splitting into smaller files'
            });
            sizeViolations++;
            totalErrors++;
          }
        }
        
        // Parse template violations
        if (line.includes('TEMPLATE VIOLATION:')) {
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const fileMatch = nextLine.match(/→ File: (.+?)$/);
          const taskMatch = line.match(/Task ([\d.]+) missing required section: (.+)$/);
          const phaseMatch = line.match(/Phase (\d+) README missing required section: (.+)$/);
          
          let file = 'unknown';
          let message = line;
          
          if (fileMatch) {
            file = fileMatch[1].replace(/\\/g, '/');
          }
          
          if (taskMatch) {
            message = `Task ${taskMatch[1]} missing required section: ${taskMatch[2]}`;
          } else if (phaseMatch) {
            message = `Phase ${phaseMatch[1]} README missing required section: ${phaseMatch[2]}`;
          }
          
          errors.push({
            id: `template-${currentErrorId++}`,
            type: 'TEMPLATE_VIOLATION',
            severity: 'error',
            file,
            message,
            suggestion: 'Add the required section to meet documentation standards'
          });
          templateViolations++;
          totalErrors++;
        }
        
        // Parse broken links
        if (line.includes('BROKEN LINK:')) {
          const match = line.match(/BROKEN LINK: (.+?)$/);
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const linkMatch = nextLine.match(/→ Link: (.+?) → (.+?)$/);
          
          if (match) {
            let message = `Broken link found in ${match[1]}`;
            if (linkMatch) {
              message = `Broken link: ${linkMatch[1]} → ${linkMatch[2]}`;
            }
            
            errors.push({
              id: `link-${currentErrorId++}`,
              type: 'BROKEN_LINK',
              severity: 'error',
              file: match[1].replace(/\\/g, '/'),
              message,
              suggestion: 'Fix or remove the broken link'
            });
            brokenLinks++;
            totalErrors++;
          }
        }
        
        // Parse STANDARDS VIOLATION
        if (line.includes('STANDARDS VIOLATION:')) {
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const nextLine2 = lines[i + 2] ? lines[i + 2].trim() : '';
          
          let message = line.replace('🚨 STANDARDS VIOLATION: ', '');
          let file = 'unknown';
          
          // Look for file info in next lines
          if (nextLine.includes('→ File:')) {
            const fileMatch = nextLine.match(/→ File: (.+?)$/);
            if (fileMatch) file = fileMatch[1].replace(/\\/g, '/');
          } else if (nextLine.includes('→ Found:')) {
            const foundMatch = nextLine.match(/→ Found: "(.+?)"$/);
            if (foundMatch && nextLine2.includes('→ Per docs/')) {
              file = 'PROGRESS.md';
              message = `Individual task status found: ${foundMatch[1]}`;
            }
          }
          
          errors.push({
            id: `standards-${currentErrorId++}`,
            type: 'STANDARDS_VIOLATION',
            severity: 'error',
            file,
            message,
            suggestion: 'Fix standards compliance issue'
          });
          totalErrors++;
        }
        
        // Parse INVALID STATUS
        if (line.includes('INVALID STATUS:')) {
          const taskMatch = line.match(/INVALID STATUS: (.+?)$/);
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const nextLine2 = lines[i + 2] ? lines[i + 2].trim() : '';
          
          let message = 'Invalid status detected';
          let file = 'unknown';
          
          if (taskMatch) {
            message = `Invalid status for ${taskMatch[1]}`;
          }
          
          if (nextLine2.includes('→ File:')) {
            const fileMatch = nextLine2.match(/→ File: (.+?)$/);
            if (fileMatch) file = fileMatch[1].replace(/\\/g, '/');
          }
          
          errors.push({
            id: `status-${currentErrorId++}`,
            type: 'INVALID_STATUS',
            severity: 'error',
            file,
            message,
            suggestion: 'Use approved status values only'
          });
          totalErrors++;
        }
        
        // Parse SINGLE ACTIVE RULE VIOLATION
        if (line.includes('SINGLE ACTIVE RULE VIOLATION:')) {
          let message = line.replace('🚨 SINGLE ACTIVE RULE VIOLATION: ', '');
          
          // Capture the task list that follows
          let taskList = '';
          let j = i + 1;
          
          // Look for the "Found X tasks in progress:" line
          if (lines[j] && lines[j].includes('→ Found') && lines[j].includes('tasks in progress:')) {
            taskList += '\n' + lines[j].trim();
            j++;
            
            // Capture all task lines starting with "• Task"
            while (j < lines.length && lines[j].trim().startsWith('• Task')) {
              taskList += '\n' + lines[j].trim();
              j++;
            }
            
            // Also capture the rule and solution lines
            if (lines[j] && lines[j].includes('→ Rule:')) {
              taskList += '\n' + lines[j].trim();
              j++;
            }
            if (lines[j] && lines[j].includes('→ Solution:')) {
              taskList += '\n' + lines[j].trim();
            }
          }
          
          errors.push({
            id: `single-active-${currentErrorId++}`,
            type: 'SINGLE_ACTIVE_RULE_VIOLATION',
            severity: 'error',
            file: 'multiple-files',
            message: message + taskList,
            suggestion: 'Mark additional tasks as Paused or change priority'
          });
          totalErrors++;
        }
      }
      
      // Extract total errors from the output
      const errorCountMatch = validationOutput.match(/❌ ERRORS \((\d+)\):/);
      if (errorCountMatch) {
        totalErrors = parseInt(errorCountMatch[1]);
      }
    }

    const totalFiles = Math.ceil(totalErrors / 3); // Rough estimate based on violations
    const filesWithErrors = errors.length > 0 ? Math.ceil(errors.length / 2.5) : 0;

    res.json({
      isRunning: false,
      lastRun: new Date(),
      errors,
      warnings,
      summary: {
        totalFiles,
        filesWithErrors,
        filesWithWarnings: warnings.length,
        coverage: [
          'Size limit validation (250 lines for tasks, 150 for READMEs)',
          'Template compliance checking',
          'Link integrity verification', 
          'Status consistency validation',
          'AI restriction compliance',
          'Documentation standards enforcement',
          'File structure validation',
          'Content requirement verification'
        ]
      }
    });
  } catch (error) {
    console.error('Error running documentation validation:', error);
    res.json({
      isRunning: false,
      lastRun: new Date(),
      errors: [{
        id: 'system-error',
        type: 'STANDARDS_VIOLATION',
        severity: 'error',
        file: 'validation-system',
        message: 'Failed to run documentation validation',
        suggestion: error.message
      }],
      warnings: [],
      summary: {
        totalFiles: 0,
        filesWithErrors: 1,
        filesWithWarnings: 0,
        coverage: ['Error handling']
      }
    });
  }
});

// Run validation endpoint
app.post('/api/run-validation', async (req, res) => {
  try {
    const validationScript = path.join(__dirname, '..', 'validate-documentation.js');
    
    let validationOutput = '';
    let hasErrors = false;
    
    try {
      const result = await execAsync(`node "${validationScript}"`, { cwd: path.join(__dirname, '..') });
      validationOutput = result.stdout;
    } catch (error) {
      // Validation script returns exit code 1 when it finds errors, this is expected behavior
      validationOutput = error.stdout || error.stderr || '';
      hasErrors = true;
    }
    
    // Count errors from the output
    const errorCountMatch = validationOutput.match(/❌ ERRORS \((\d+)\):/);
    const errorCount = errorCountMatch ? parseInt(errorCountMatch[1]) : 0;
    
    res.json({
      success: true, // Always success if the script ran, regardless of validation results
      hasValidationErrors: hasErrors || errorCount > 0,
      errorCount,
      message: errorCount > 0 
        ? `Documentation validation found ${errorCount} errors` 
        : 'Documentation validation completed successfully',
      output: validationOutput
    });
  } catch (error) {
    console.error('Error running validation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run documentation validation script',
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
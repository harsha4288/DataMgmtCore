/**
 * Progress API Server
 * Simple Express server to serve progress data from PROGRESS.md
 * Can be run alongside the Vite dev server
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { ProgressReader } = require('./readProgress.cjs');

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
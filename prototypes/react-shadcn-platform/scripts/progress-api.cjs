/**
 * Progress API Server
 * Simple Express server to serve progress data from PROGRESS.md
 * Can be run alongside the Vite dev server
 */

const express = require('express');
const cors = require('cors');
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'progress-api' });
});

app.listen(PORT, () => {
  console.log(`📊 Progress API server running at http://localhost:${PORT}`);
  console.log(`   GET  /api/progress - Get current progress data`);
  console.log(`   POST /api/progress/sync - Sync progress from task files`);
});
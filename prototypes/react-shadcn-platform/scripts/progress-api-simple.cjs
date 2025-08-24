/**
 * Simple Progress API Server
 * Minimal HTTP server without external dependencies
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { ProgressReader } = require('./readProgress.cjs');
const { ProgressSync } = require('./sync-progress.cjs');

const PORT = 3002;

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Route: GET /api/progress
  if (req.url === '/api/progress' && req.method === 'GET') {
    try {
      const reader = new ProgressReader();
      const data = reader.read();
      
      if (data) {
        const dashboardFormat = reader.toDashboardFormat(data);
        res.writeHead(200, corsHeaders);
        res.end(JSON.stringify(dashboardFormat));
      } else {
        res.writeHead(404, corsHeaders);
        res.end(JSON.stringify({ error: 'Progress data not found' }));
      }
    } catch (error) {
      console.error('Error reading progress:', error);
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ error: 'Failed to read progress data' }));
    }
    return;
  }

  // Route: POST /api/progress/sync
  if (req.url === '/api/progress/sync' && req.method === 'POST') {
    try {
      const sync = new ProgressSync();
      sync.sync();
      
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ success: true, message: 'Progress synced successfully' }));
    } catch (error) {
      console.error('Error syncing progress:', error);
      res.writeHead(500, corsHeaders);
      res.end(JSON.stringify({ error: 'Failed to sync progress' }));
    }
    return;
  }

  // Route: GET /api/health
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ status: 'ok', service: 'progress-api' }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, () => {
  console.log(`📊 Progress API server running at http://localhost:${PORT}`);
  console.log(`   GET  /api/progress - Get current progress data`);
  console.log(`   POST /api/progress/sync - Sync progress from task files`);
  console.log(`   GET  /api/health - Health check`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
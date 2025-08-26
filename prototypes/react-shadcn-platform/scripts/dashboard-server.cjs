/**
 * Real-time Development Dashboard Server
 * Phase 5: Development Infrastructure Integration
 * 
 * Provides:
 * - Real-time system monitoring
 * - GraphQL API health checks
 * - Validation system status
 * - Quality pipeline results
 * - WebSocket updates for live data
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = 3001;
const GRAPHQL_URL = 'http://localhost:3004';
const VALIDATION_URL = 'http://localhost:3005';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// System status tracking
let systemStatus = {
  lastUpdate: new Date().toISOString(),
  services: {
    graphql: { status: 'checking', response_time: 0, port: 3004 },
    validation: { status: 'checking', response_time: 0, port: 3005 },
    dashboard: { status: 'healthy', response_time: 0, port: 3001 }
  },
  metrics: {
    total_tests: 0,
    passed_tests: 0,
    quality_score: 0,
    last_build_time: 0
  },
  project: {
    total_phases: 0,
    total_tasks: 0,
    completed_tasks: 0,
    completion_percentage: 0
  }
};

// Health check for services
async function checkServiceHealth(url, serviceName) {
  const startTime = Date.now();
  try {
    const response = await fetch(`${url}/health`);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { status: 'healthy', response_time: responseTime };
    } else {
      return { status: 'error', response_time: responseTime };
    }
  } catch (error) {
    return { status: 'down', response_time: Date.now() - startTime };
  }
}

// Get project statistics from GraphQL
async function getProjectStats() {
  try {
    const response = await fetch(`${GRAPHQL_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetProjectStats {
            getProjectStats {
              total_phases
              total_tasks
              completed_tasks
              completion_percentage
            }
          }
        `
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.getProjectStats) {
        return data.data.getProjectStats;
      }
    }
  } catch (error) {
    console.warn('Could not fetch project stats:', error.message);
  }
  
  return {
    total_phases: 0,
    total_tasks: 0,
    completed_tasks: 0,
    completion_percentage: 0
  };
}

// Update system status
async function updateSystemStatus() {
  console.log('🔄 Updating system status...');
  
  // Check service health
  const [graphqlHealth, validationHealth] = await Promise.all([
    checkServiceHealth(GRAPHQL_URL, 'graphql'),
    checkServiceHealth(VALIDATION_URL, 'validation')
  ]);

  // Get project statistics
  const projectStats = await getProjectStats();

  // Update status
  systemStatus = {
    lastUpdate: new Date().toISOString(),
    services: {
      graphql: graphqlHealth,
      validation: validationHealth,
      dashboard: { status: 'healthy', response_time: 0, port: 3001 }
    },
    metrics: {
      total_tests: systemStatus.metrics.total_tests,
      passed_tests: systemStatus.metrics.passed_tests,
      quality_score: systemStatus.metrics.quality_score,
      last_build_time: systemStatus.metrics.last_build_time
    },
    project: projectStats
  };

  // Emit to connected clients
  io.emit('status-update', systemStatus);
  
  console.log(`✅ Status updated - GraphQL: ${graphqlHealth.status}, Validation: ${validationHealth.status}`);
}

// Routes
app.get('/api/status', (req, res) => {
  res.json(systemStatus);
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint for quality pipeline results
app.post('/api/quality-results', (req, res) => {
  const { total_tests, passed_tests, quality_score, build_time } = req.body;
  
  systemStatus.metrics = {
    total_tests: total_tests || 0,
    passed_tests: passed_tests || 0,
    quality_score: quality_score || 0,
    last_build_time: build_time || 0
  };
  
  io.emit('quality-update', systemStatus.metrics);
  res.json({ success: true, message: 'Quality results updated' });
});

// Main dashboard HTML
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phase 5 Development Dashboard</title>
    <script src="https://cdn.socket.io/4.5.0/socket.io.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #e5e5e5;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            color: #9ca3af;
            font-size: 1.1rem;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .status-card {
            background: #1a1a1a;
            border: 1px solid #2d2d2d;
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .status-card:hover {
            border-color: #4a4a4a;
            transform: translateY(-2px);
        }
        
        .status-card h3 {
            color: #f3f4f6;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .status-healthy { background: #10b981; }
        .status-error { background: #ef4444; }
        .status-down { background: #6b7280; }
        .status-checking { background: #f59e0b; animation: pulse 2s infinite; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .metric-label {
            color: #9ca3af;
        }
        
        .metric-value {
            color: #f3f4f6;
            font-weight: 600;
        }
        
        .links-section {
            background: #1a1a1a;
            border: 1px solid #2d2d2d;
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        
        .links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .link-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: #374151;
            border: 1px solid #4b5563;
            border-radius: 6px;
            color: #e5e5e5;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .link-button:hover {
            background: #4b5563;
            border-color: #6b7280;
        }
        
        .last-update {
            text-align: center;
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #2d2d2d;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #374151;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #059669);
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Phase 5 Development Dashboard</h1>
            <p>Real-time monitoring of development infrastructure</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h3>
                    <span class="status-indicator status-checking" id="graphql-indicator"></span>
                    GraphQL API
                </h3>
                <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="metric-value" id="graphql-status">Checking...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value" id="graphql-response">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Port</span>
                    <span class="metric-value">3004</span>
                </div>
            </div>
            
            <div class="status-card">
                <h3>
                    <span class="status-indicator status-checking" id="validation-indicator"></span>
                    Validation API
                </h3>
                <div class="metric">
                    <span class="metric-label">Status</span>
                    <span class="metric-value" id="validation-status">Checking...</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Response Time</span>
                    <span class="metric-value" id="validation-response">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Port</span>
                    <span class="metric-value">3005</span>
                </div>
            </div>
            
            <div class="status-card">
                <h3>
                    <span class="status-indicator status-healthy"></span>
                    Project Stats
                </h3>
                <div class="metric">
                    <span class="metric-label">Total Tasks</span>
                    <span class="metric-value" id="total-tasks">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Completed</span>
                    <span class="metric-value" id="completed-tasks">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Progress</span>
                    <span class="metric-value" id="completion-percentage">-</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="status-card">
                <h3>
                    <span class="status-indicator status-healthy"></span>
                    Quality Metrics
                </h3>
                <div class="metric">
                    <span class="metric-label">Quality Score</span>
                    <span class="metric-value" id="quality-score">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Tests Passed</span>
                    <span class="metric-value" id="test-results">-</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Build</span>
                    <span class="metric-value" id="last-build">-</span>
                </div>
            </div>
        </div>
        
        <div class="links-section">
            <h3>🔗 Quick Access Links</h3>
            <div class="links-grid">
                <a href="http://localhost:3004/graphql" target="_blank" class="link-button">
                    🔍 GraphiQL Playground
                </a>
                <a href="http://localhost:3005/health" target="_blank" class="link-button">
                    ✅ Validation Health
                </a>
                <a href="/api/status" target="_blank" class="link-button">
                    📊 API Status JSON
                </a>
                <a href="javascript:location.reload()" class="link-button">
                    🔄 Refresh Dashboard
                </a>
            </div>
        </div>
        
        <div class="last-update">
            Last updated: <span id="last-update">Never</span>
        </div>
    </div>
    
    <script>
        const socket = io();
        
        // Update status display
        function updateStatus(status) {
            // GraphQL service
            const graphqlStatus = status.services.graphql;
            document.getElementById('graphql-status').textContent = graphqlStatus.status.toUpperCase();
            document.getElementById('graphql-response').textContent = graphqlStatus.response_time + 'ms';
            document.getElementById('graphql-indicator').className = \`status-indicator status-\${graphqlStatus.status}\`;
            
            // Validation service
            const validationStatus = status.services.validation;
            document.getElementById('validation-status').textContent = validationStatus.status.toUpperCase();
            document.getElementById('validation-response').textContent = validationStatus.response_time + 'ms';
            document.getElementById('validation-indicator').className = \`status-indicator status-\${validationStatus.status}\`;
            
            // Project stats
            const project = status.project;
            document.getElementById('total-tasks').textContent = project.total_tasks;
            document.getElementById('completed-tasks').textContent = project.completed_tasks;
            document.getElementById('completion-percentage').textContent = project.completion_percentage + '%';
            document.getElementById('progress-fill').style.width = project.completion_percentage + '%';
            
            // Quality metrics
            const metrics = status.metrics;
            document.getElementById('quality-score').textContent = metrics.quality_score + '/100';
            document.getElementById('test-results').textContent = \`\${metrics.passed_tests}/\${metrics.total_tests}\`;
            document.getElementById('last-build').textContent = metrics.last_build_time ? metrics.last_build_time + 'ms' : 'Never';
            
            // Last update
            document.getElementById('last-update').textContent = new Date(status.lastUpdate).toLocaleTimeString();
        }
        
        // Socket events
        socket.on('status-update', updateStatus);
        socket.on('quality-update', (metrics) => {
            document.getElementById('quality-score').textContent = metrics.quality_score + '/100';
            document.getElementById('test-results').textContent = \`\${metrics.passed_tests}/\${metrics.total_tests}\`;
            document.getElementById('last-build').textContent = metrics.last_build_time ? metrics.last_build_time + 'ms' : 'Never';
        });
        
        // Initial load
        fetch('/api/status')
            .then(response => response.json())
            .then(updateStatus)
            .catch(error => console.error('Failed to load initial status:', error));
        
        console.log('🚀 Phase 5 Dashboard loaded successfully');
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('📡 Client connected to dashboard');
  
  // Send current status immediately
  socket.emit('status-update', systemStatus);
  
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected from dashboard');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Phase 5 Development Dashboard running at http://localhost:${PORT}`);
  console.log('📊 Features:');
  console.log('   • Real-time service monitoring');
  console.log('   • GraphQL API health checks');
  console.log('   • Validation system status');
  console.log('   • Quality pipeline integration');
  console.log('   • WebSocket live updates');
  console.log('');
  
  // Start periodic status updates
  updateSystemStatus();
  setInterval(updateSystemStatus, 10000); // Update every 10 seconds
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Dashboard server shutting down...');
  server.close(() => {
    console.log('✅ Dashboard server closed');
  });
});

module.exports = { app, server, io };
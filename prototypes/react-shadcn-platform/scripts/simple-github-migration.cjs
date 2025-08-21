#!/usr/bin/env node

/**
 * Simple GitHub Migration without CLI dependency
 * Creates GitHub issues from our task inventory using only REST API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SimpleGitHubMigrator {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required either as environment variable or command line argument');
    }
  }

  async migrate() {
    console.log('🚀 Starting GitHub migration...\n');

    try {
      // Step 1: Load task inventory
      const taskData = this.loadTaskInventory();
      console.log(`📋 Loaded ${taskData.metadata.totalTasks} tasks\n`);

      // Step 2: Create labels first
      await this.createLabels();

      // Step 3: Create GitHub issues for all tasks
      await this.createIssuesFromTasks(taskData);

      console.log('\n✅ Migration completed! Next steps:');
      console.log(`🔗 1. Go to: https://github.com/${this.owner}/${this.repo}/issues`);
      console.log('🔧 2. Create a GitHub Project from the Projects tab');
      console.log('📋 3. Add your issues to the project board');
      console.log('⚙️ 4. Set up automation rules');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  loadTaskInventory() {
    const inventoryPath = path.join(process.cwd(), 'task-inventory.json');
    if (!fs.existsSync(inventoryPath)) {
      throw new Error('task-inventory.json not found. Run generate-task-inventory.cjs first.');
    }
    return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  }

  async githubRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'SGS-Task-Migrator',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`GitHub API Error ${res.statusCode}: ${parsed.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async createLabels() {
    console.log('🏷️  Creating labels...');

    const labels = [
      // Priorities
      { name: 'priority:critical', color: 'B60205', description: 'Critical priority task' },
      { name: 'priority:high', color: 'D93F0B', description: 'High priority task' },
      { name: 'priority:medium', color: 'FBCA04', description: 'Medium priority task' },
      { name: 'priority:low', color: '0E8A16', description: 'Low priority task' },
      
      // Phases
      { name: 'phase:1', color: '1D76DB', description: 'Phase 1: Foundation Setup' },
      { name: 'phase:2', color: '0052CC', description: 'Phase 2: Gita Alumni Implementation' },
      { name: 'phase:3', color: '0747A6', description: 'Phase 3: Multi-Domain Validation' },
      { name: 'phase:recurring', color: '6F42C1', description: 'Recurring Tasks' },
      
      // Categories
      { name: 'category:setup', color: 'C2E0C6', description: 'Project setup tasks' },
      { name: 'category:theming', color: 'F1C21B', description: 'Theme system tasks' },
      { name: 'category:components', color: '0052CC', description: 'Component development' },
      { name: 'category:table', color: '6F42C1', description: 'Table system tasks' },
      { name: 'category:auth', color: 'E99695', description: 'Authentication tasks' },
      { name: 'category:dashboard', color: 'FF6900', description: 'Dashboard tasks' },
      { name: 'category:posting', color: '1F77B4', description: 'Posting system tasks' },
      { name: 'category:browse', color: 'FF7F0E', description: 'Browse system tasks' },
      { name: 'category:preferences', color: '2CA02C', description: 'User preferences' },
      { name: 'category:messaging', color: 'D62728', description: 'Messaging system' },
      { name: 'category:moderation', color: '9467BD', description: 'Moderation system' },
      { name: 'category:analytics', color: '8C564B', description: 'Analytics system' },
      { name: 'category:volunteer', color: 'E377C2', description: 'Volunteer platform' },
      { name: 'category:education', color: '7F7F7F', description: 'Education platform' },
      { name: 'category:events', color: 'BCBD22', description: 'Events platform' },
      { name: 'category:quality', color: '28A745', description: 'Quality assurance' },
      { name: 'category:docs', color: '6F42C1', description: 'Documentation tasks' },
      { name: 'category:maintenance', color: '6A737D', description: 'Maintenance tasks' }
    ];

    for (const label of labels) {
      try {
        await this.githubRequest(`/repos/${this.owner}/${this.repo}/labels`, 'POST', label);
        console.log(`  ✅ Created: ${label.name}`);
      } catch (error) {
        if (error.message.includes('422')) {
          console.log(`  ⚠️  Already exists: ${label.name}`);
        } else {
          console.log(`  ❌ Failed to create: ${label.name} - ${error.message}`);
        }
      }
      
      // Rate limiting
      await this.sleep(100);
    }
  }

  async createIssuesFromTasks(taskData) {
    console.log('\n📋 Creating GitHub issues...');

    let created = 0;
    let failed = 0;

    // Process development phases
    for (const phase of taskData.phases) {
      console.log(`\n  📂 Processing ${phase.name}...`);
      
      for (const task of phase.tasks) {
        try {
          await this.createTaskIssue(task, phase);
          created++;
          console.log(`    ✅ ${task.id}: ${task.title}`);
        } catch (error) {
          failed++;
          console.log(`    ❌ Failed ${task.id}: ${error.message}`);
        }
        
        // Rate limiting - GitHub allows 5000 requests/hour
        await this.sleep(200);
      }
    }

    // Process recurring tasks
    const recurringCategories = [
      { name: 'Quality Assurance', tasks: taskData.qualityTasks, phase: 'recurring' },
      { name: 'Documentation', tasks: taskData.documentationTasks, phase: 'recurring' },
      { name: 'Maintenance', tasks: taskData.maintenanceTasks, phase: 'recurring' }
    ];

    for (const category of recurringCategories) {
      console.log(`\n  📂 Processing ${category.name}...`);
      
      for (const task of category.tasks) {
        try {
          await this.createTaskIssue(task, { id: category.phase, name: category.name });
          created++;
          console.log(`    ✅ ${task.id}: ${task.title}`);
        } catch (error) {
          failed++;
          console.log(`    ❌ Failed ${task.id}: ${error.message}`);
        }
        
        await this.sleep(200);
      }
    }

    console.log(`\n📊 Results: ${created} created, ${failed} failed`);
  }

  async createTaskIssue(task, phase) {
    const labels = [
      `priority:${task.priority}`,
      `category:${task.category}`
    ];

    if (phase.id === 'recurring') {
      labels.push('phase:recurring');
    } else {
      labels.push(`phase:${phase.id.replace('phase-', '')}`);
    }

    const body = this.generateIssueBody(task, phase);

    const issueData = {
      title: `${task.id}: ${task.title}`,
      body: body,
      labels: labels
    };

    return await this.githubRequest(`/repos/${this.owner}/${this.repo}/issues`, 'POST', issueData);
  }

  generateIssueBody(task, phase) {
    let body = `## 📋 Task Details\n\n`;
    body += `- **Task ID:** ${task.id}\n`;
    body += `- **Phase:** ${phase.name}\n`;
    body += `- **Category:** ${task.category}\n`;
    body += `- **Priority:** ${task.priority}\n`;

    if (task.recurring) {
      body += `- **Recurring:** ${task.recurring}\n`;
    }

    body += `\n## 📝 Description\n\n${task.title}\n\n`;

    // Add implementation checklist
    body += this.generateTaskChecklist(task);

    body += `\n---\n`;
    body += `*Auto-generated from task-inventory.json | Total: 117 tasks*`;

    return body;
  }

  generateTaskChecklist(task) {
    const categoryChecklists = {
      'setup': [
        '- [ ] Research and analyze requirements',
        '- [ ] Create configuration files',
        '- [ ] Test setup and validate functionality',
        '- [ ] Update documentation'
      ],
      'theming': [
        '- [ ] Design theme structure',
        '- [ ] Implement CSS variables',
        '- [ ] Test theme switching',
        '- [ ] Validate dark/light modes'
      ],
      'components': [
        '- [ ] Create component interface',
        '- [ ] Implement component logic',
        '- [ ] Add TypeScript types',
        '- [ ] Test component functionality'
      ],
      'quality': [
        '- [ ] Run quality checks',
        '- [ ] Fix identified issues',
        '- [ ] Update quality metrics',
        '- [ ] Document findings'
      ]
    };

    const checklist = categoryChecklists[task.category] || [
      '- [ ] Analyze requirements',
      '- [ ] Implement functionality',
      '- [ ] Test implementation', 
      '- [ ] Update documentation'
    ];

    return `\n## ✅ Acceptance Criteria\n\n${checklist.join('\n')}\n`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const token = process.argv[2]; // Get token from command line
  
  if (!token && !process.env.GITHUB_TOKEN) {
    console.log('Usage: node simple-github-migration.cjs <github_token>');
    console.log('Or set GITHUB_TOKEN environment variable');
    process.exit(1);
  }
  
  const migrator = new SimpleGitHubMigrator(token);
  migrator.migrate().catch(console.error);
}

module.exports = { SimpleGitHubMigrator };
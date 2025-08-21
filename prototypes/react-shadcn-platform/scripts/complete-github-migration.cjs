#!/usr/bin/env node

/**
 * Complete GitHub Migration - Handle remaining 37 tasks
 * This script continues where the previous migration left off
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class CompleteGitHubMigrator {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required');
    }
  }

  async migrate() {
    console.log('🚀 Completing GitHub migration - remaining 37 tasks...\n');

    try {
      // Load task inventory
      const taskData = this.loadTaskInventory();
      
      // Create only the remaining tasks (Phase 3 + Recurring)
      await this.createRemainingTasks(taskData);

      console.log('\n✅ Migration fully completed!');
      console.log(`🔗 View all tasks: https://github.com/${this.owner}/${this.repo}/issues`);
      console.log('\n🎯 Next: Create GitHub Project and add these issues to it!');

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  loadTaskInventory() {
    const inventoryPath = path.join(process.cwd(), 'task-inventory.json');
    if (!fs.existsSync(inventoryPath)) {
      throw new Error('task-inventory.json not found');
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

  async createRemainingTasks(taskData) {
    console.log('📋 Creating remaining GitHub issues...');

    let created = 0;
    let failed = 0;

    // Process Phase 3 (15 tasks)
    const phase3 = taskData.phases.find(p => p.id === 'phase-3');
    if (phase3) {
      console.log(`\n  📂 Processing ${phase3.name}...`);
      
      for (const task of phase3.tasks) {
        try {
          await this.createTaskIssue(task, phase3);
          created++;
          console.log(`    ✅ ${task.id}: ${task.title}`);
        } catch (error) {
          failed++;
          console.log(`    ❌ Failed ${task.id}: ${error.message}`);
        }
        
        // Slower rate limiting - 1 second between requests
        await this.sleep(1000);
      }
    }

    // Process recurring tasks (22 tasks)
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
        
        // Slower rate limiting
        await this.sleep(1000);
      }
    }

    console.log(`\n📊 Final Results: ${created} created, ${failed} failed`);
    console.log(`🎯 Total in GitHub: ${80 + created} issues from 117 tasks`);
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
    body += `*Auto-generated from task-inventory.json | Migration completion: 117 total tasks*`;

    return body;
  }

  generateTaskChecklist(task) {
    const categoryChecklists = {
      'volunteer': [
        '- [ ] Design platform structure',
        '- [ ] Implement core functionality',
        '- [ ] Test with volunteer scenarios',
        '- [ ] Integrate with main platform'
      ],
      'education': [
        '- [ ] Design educational interfaces',
        '- [ ] Implement learning management features',
        '- [ ] Test with educational scenarios',
        '- [ ] Integrate with main platform'
      ],
      'events': [
        '- [ ] Design event management system',
        '- [ ] Implement RSVP and calendar features',
        '- [ ] Test with event scenarios',
        '- [ ] Integrate with main platform'
      ],
      'quality': [
        '- [ ] Run quality checks',
        '- [ ] Fix identified issues',
        '- [ ] Update quality metrics',
        '- [ ] Document findings'
      ],
      'docs': [
        '- [ ] Update documentation',
        '- [ ] Review for accuracy',
        '- [ ] Ensure completeness',
        '- [ ] Publish updates'
      ],
      'maintenance': [
        '- [ ] Perform maintenance task',
        '- [ ] Test functionality',
        '- [ ] Update monitoring',
        '- [ ] Document changes'
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
  const token = process.argv[2];
  
  if (!token && !process.env.GITHUB_TOKEN) {
    console.log('Usage: node complete-github-migration.cjs <github_token>');
    process.exit(1);
  }
  
  const migrator = new CompleteGitHubMigrator(token);
  migrator.migrate().catch(console.error);
}

module.exports = { CompleteGitHubMigrator };
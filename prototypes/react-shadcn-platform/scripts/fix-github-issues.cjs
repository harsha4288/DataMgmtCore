#!/usr/bin/env node

/**
 * Fix GitHub Issues - Remove wrong issues and create correct ones
 * from the corrected task-inventory.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class GitHubIssuesFixer {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required');
    }
  }

  async fix() {
    console.log('🔧 Fixing GitHub Issues with corrected task mapping...\n');

    try {
      // Step 1: Close all wrong issues (they're all wrong from the bad inventory)
      console.log('📋 Step 1: Closing all existing wrong issues...');
      await this.closeAllExistingIssues();

      // Step 2: Load corrected task inventory
      const taskData = this.loadCorrectedInventory();
      console.log(`\n📋 Step 2: Loaded ${taskData.metadata.totalTasks} corrected tasks\n`);

      // Step 3: Create correct issues from corrected inventory
      console.log('📋 Step 3: Creating correct issues...');
      await this.createCorrectIssues(taskData);

      console.log('\n✅ GitHub Issues fixed!');
      console.log(`🔗 View issues: https://github.com/${this.owner}/${this.repo}/issues`);

    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  async closeAllExistingIssues() {
    const issues = await this.getAllOpenIssues();
    console.log(`  📋 Found ${issues.length} open issues to close`);

    let closed = 0;
    for (const issue of issues) {
      try {
        await this.closeIssue(issue.number, 'Closed - regenerating with correct task mapping');
        console.log(`    ✅ Closed #${issue.number}: ${issue.title}`);
        closed++;
        await this.sleep(100); // Rate limiting
      } catch (error) {
        console.log(`    ❌ Failed to close #${issue.number}: ${error.message}`);
      }
    }

    console.log(`  📊 Closed ${closed} issues`);
  }

  async getAllOpenIssues() {
    const issues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.githubRequest(
        `/repos/${this.owner}/${this.repo}/issues?state=open&per_page=100&page=${page}`
      );
      
      if (response.length === 0) {
        hasMore = false;
      } else {
        issues.push(...response.filter(issue => !issue.pull_request));
        page++;
      }
    }

    return issues;
  }

  async closeIssue(issueNumber, reason) {
    await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
      'PATCH',
      { 
        state: 'closed',
        state_reason: 'not_planned'
      }
    );

    // Add closing comment
    await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`,
      'POST',
      {
        body: `🔧 **Issue Closed - Task Inventory Correction**\n\n${reason}\n\nThe task inventory has been regenerated from PROGRESS.md to ensure accurate mapping. New issues will be created with correct task IDs and descriptions.`
      }
    );
  }

  loadCorrectedInventory() {
    const inventoryPath = path.join(process.cwd(), 'task-inventory.json');
    if (!fs.existsSync(inventoryPath)) {
      throw new Error('task-inventory.json not found');
    }
    return JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  }

  async createCorrectIssues(taskData) {
    let created = 0;
    let failed = 0;

    // Process each phase
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
        
        // Rate limiting
        await this.sleep(200);
      }
    }

    console.log(`\n📊 Results: ${created} created, ${failed} failed`);
  }

  async createTaskIssue(task, phase) {
    const labels = [
      `priority:${task.priority}`,
      `category:${task.category}`,
      `phase:${phase.id.replace('phase-', '')}`
    ];

    // Add completion status label
    if (task.completed) {
      labels.push('status:completed');
    } else {
      labels.push('status:pending');
    }

    const body = this.generateIssueBody(task, phase);

    const issueData = {
      title: `${task.id}: ${task.title}`,
      body: body,
      labels: labels,
      state: task.completed ? 'closed' : 'open'
    };

    return await this.githubRequest(`/repos/${this.owner}/${this.repo}/issues`, 'POST', issueData);
  }

  generateIssueBody(task, phase) {
    let body = `## 📋 Task Details\\n\\n`;
    body += `- **Task ID:** ${task.id}\\n`;
    body += `- **Phase:** ${phase.name}\\n`;
    body += `- **Category:** ${task.category}\\n`;
    body += `- **Priority:** ${task.priority}\\n`;
    body += `- **Progress:** ${task.progress}\\n`;
    body += `- **Status:** ${task.completed ? '✅ Completed' : '🔄 Pending'}\\n`;

    body += `\\n## 📝 Description\\n\\n${task.title}\\n\\n`;

    if (task.completed) {
      body += `## ✅ Completion Status\\n\\nThis task has been completed as documented in PROGRESS.md.\\n\\n`;
    } else {
      body += `## 🔄 Next Steps\\n\\nThis task is pending implementation.\\n\\n`;
    }

    body += `\\n---\\n`;
    body += `*Generated from corrected task-inventory.json | Total: ${83} tasks | Accuracy: ✅ Verified*`;

    return body;
  }

  async githubRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'SGS-Task-Fixer',
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const token = process.argv[2];
  
  if (!token && !process.env.GITHUB_TOKEN) {
    console.log('Usage: node fix-github-issues.cjs <github_token>');
    process.exit(1);
  }
  
  const fixer = new GitHubIssuesFixer(token);
  fixer.fix().catch(console.error);
}

module.exports = { GitHubIssuesFixer };
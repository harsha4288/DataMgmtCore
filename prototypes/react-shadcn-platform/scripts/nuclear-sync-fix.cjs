#!/usr/bin/env node

/**
 * NUCLEAR SYNC FIX - Clean slate solution
 * 1. Close ALL existing issues (they're all wrong)
 * 2. Create fresh issues with CORRECT state mapping
 * 3. completed = closed, pending = open
 * 4. No confusing status labels
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class NuclearSyncFix {
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
    console.log('💥 NUCLEAR SYNC FIX - Starting clean slate...\n');

    try {
      // Step 1: Get current status
      console.log('📊 Step 1: Analyzing current mess...');
      await this.analyzeCurrentState();

      // Step 2: Close ALL existing issues  
      console.log('\n🧹 Step 2: Closing ALL existing issues...');
      await this.closeAllIssues();

      // Step 3: Load corrected task data
      console.log('\n📋 Step 3: Loading corrected task inventory...');
      const taskData = this.loadTaskInventory();
      
      // Step 4: Create fresh issues with CORRECT states
      console.log('\n✨ Step 4: Creating fresh issues with correct states...');
      await this.createFreshIssues(taskData);

      // Step 5: Verify final state
      console.log('\n✅ Step 5: Verifying final state...');
      await this.verifyFinalState();

      console.log('\n🎉 NUCLEAR FIX COMPLETE!');
      console.log(`🔗 View issues: https://github.com/${this.owner}/${this.repo}/issues`);

    } catch (error) {
      console.error('💥 Nuclear fix failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeCurrentState() {
    const allIssues = await this.getAllIssues();
    const openIssues = allIssues.filter(i => i.state === 'open');
    const closedIssues = allIssues.filter(i => i.state === 'closed');
    
    console.log(`  📊 Current state: ${openIssues.length} open, ${closedIssues.length} closed`);
    console.log(`  🎯 Target: Clean slate with 83 accurate issues`);
  }

  async closeAllIssues() {
    const allIssues = await this.getAllIssues();
    let closed = 0;
    
    console.log(`  📋 Found ${allIssues.length} total issues to close`);

    for (const issue of allIssues) {
      if (issue.state === 'open') {
        try {
          await this.closeIssue(issue.number);
          closed++;
          console.log(`    ✅ Closed #${issue.number}: ${issue.title.substring(0, 50)}...`);
          await this.sleep(100); // Rate limiting
        } catch (error) {
          console.log(`    ❌ Failed to close #${issue.number}: ${error.message}`);
        }
      }
    }

    console.log(`  📊 Closed ${closed} issues - clean slate achieved`);
  }

  async createFreshIssues(taskData) {
    let created = 0;
    let failed = 0;

    // Process each phase
    for (const phase of taskData.phases) {
      console.log(`\n  📂 Creating ${phase.name} issues...`);
      
      for (const task of phase.tasks) {
        try {
          await this.createCorrectIssue(task, phase);
          created++;
          const status = task.completed ? '✅ CLOSED' : '🔄 OPEN';
          console.log(`    ${status} ${task.id}: ${task.title}`);
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

  async createCorrectIssue(task, phase) {
    const labels = [
      `priority:${task.priority}`,
      `category:${task.category}`,
      `phase:${phase.id.replace('phase-', '')}`
    ];

    const body = this.generateCorrectIssueBody(task, phase);

    const issueData = {
      title: `${task.id}: ${task.title}`,
      body: body,
      labels: labels,
      // CRITICAL: Set correct state based on completion
      state: task.completed ? 'closed' : 'open'
    };

    const response = await this.githubRequest(`/repos/${this.owner}/${this.repo}/issues`, 'POST', issueData);
    
    // If task is completed, close the issue immediately after creation
    if (task.completed && response.state === 'open') {
      await this.closeIssue(response.number);
    }

    return response;
  }

  generateCorrectIssueBody(task, phase) {
    let body = `## 📋 Task Details\\n\\n`;
    body += `- **Task ID:** ${task.id}\\n`;
    body += `- **Phase:** ${phase.name}\\n`;
    body += `- **Category:** ${task.category}\\n`;
    body += `- **Priority:** ${task.priority}\\n`;
    body += `- **Progress:** ${task.progress}\\n`;

    if (task.completed) {
      body += `\\n## ✅ Status: COMPLETED\\n\\n`;
      body += `This task has been completed as documented in PROGRESS.md.\\n\\n`;
      body += `**Completion confirmed by:** Other Claude Code session\\n`;
    } else {
      body += `\\n## 🔄 Status: PENDING\\n\\n`;
      body += `This task is pending implementation.\\n\\n`;
    }

    body += `\\n---\\n`;
    body += `*Generated by Nuclear Sync Fix | Accurate mapping from PROGRESS.md*`;

    return body;
  }

  async verifyFinalState() {
    const allIssues = await this.getAllIssues();
    const openIssues = allIssues.filter(i => i.state === 'open');
    const closedIssues = allIssues.filter(i => i.state === 'closed');
    
    console.log(`  📊 Final state: ${openIssues.length} open, ${closedIssues.length} closed`);
    console.log(`  🎯 Expected: ~58 open (pending), ~25 closed (completed)`);
    
    if (openIssues.length + closedIssues.length === 83) {
      console.log(`  ✅ Perfect! Total issues = 83 (matches task inventory)`);
    } else {
      console.log(`  ⚠️  Issue count mismatch - expected 83 total`);
    }
  }

  async getAllIssues() {
    const issues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.githubRequest(
        `/repos/${this.owner}/${this.repo}/issues?state=all&per_page=100&page=${page}`
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

  async closeIssue(issueNumber) {
    return await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
      'PATCH',
      { 
        state: 'closed',
        state_reason: 'completed'
      }
    );
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
          'User-Agent': 'SGS-Nuclear-Fix',
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
    console.log('💥 NUCLEAR SYNC FIX');
    console.log('Usage: node nuclear-sync-fix.cjs <github_token>');
    console.log('');
    console.log('⚠️  WARNING: This will close ALL existing GitHub Issues');
    console.log('   and create fresh ones with correct completion status.');
    console.log('');
    process.exit(1);
  }
  
  const fixer = new NuclearSyncFix(token);
  fixer.fix().catch(console.error);
}

module.exports = { NuclearSyncFix };
#!/usr/bin/env node

/**
 * Create Clean GitHub Issues with Built-in Checklists
 * 83 sub-tasks with proper GitHub task lists for individual items
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class CleanIssueCreator {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required');
    }
  }

  async createCleanIssues() {
    console.log('✨ CREATING CLEAN GITHUB ISSUES WITH CHECKLISTS...\n');

    try {
      // Step 1: Parse PROGRESS.md directly for full details
      console.log('📋 Step 1: Parsing PROGRESS.md for detailed task information...');
      const taskData = this.parseProgressMd();
      
      // Step 2: Create issues with proper checklists
      console.log('\n🎯 Step 2: Creating 83 sub-task issues with built-in checklists...');
      await this.createIssuesWithChecklists(taskData);

      // Step 3: Verify final state
      console.log('\n✅ Step 3: Verification...');
      await this.verifyCreation();

      console.log('\n🎉 CLEAN ISSUES CREATED SUCCESSFULLY!');
      console.log(`🔗 View issues: https://github.com/${this.owner}/${this.repo}/issues`);

    } catch (error) {
      console.error('❌ Creation failed:', error.message);
      process.exit(1);
    }
  }

  parseProgressMd() {
    const progressPath = path.join(process.cwd(), 'PROGRESS.md');
    const content = fs.readFileSync(progressPath, 'utf8');
    const lines = content.split('\n');
    
    const tasks = [];
    let currentPhase = null;
    let currentSubTask = null;
    let currentChecklistItems = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Phase detection
      if (line.match(/^### Phase \d+:/)) {
        const phaseMatch = line.match(/^### Phase (\d+): (.+?) \((.+?)\)/);
        if (phaseMatch) {
          currentPhase = {
            id: `phase-${phaseMatch[1]}`,
            name: `Phase ${phaseMatch[1]}: ${phaseMatch[2]}`,
            status: phaseMatch[3]
          };
        }
        continue;
      }

      // Sub-task detection
      if (line.match(/^- \[.\] \*\*Sub-task \d+\./)) {
        // Save previous sub-task if exists
        if (currentSubTask && currentPhase) {
          currentSubTask.checklistItems = [...currentChecklistItems];
          tasks.push(currentSubTask);
        }
        
        // Parse new sub-task
        const subTaskMatch = line.match(/^- \[(.)\] \*\*Sub-task (\d+\.\d+\.?\d*): (.+?)\*\* \((.+?)\)/);
        if (subTaskMatch) {
          const isCompleted = subTaskMatch[1] === 'x';
          currentSubTask = {
            id: subTaskMatch[2],
            title: subTaskMatch[3],
            progress: subTaskMatch[4],
            completed: isCompleted,
            phase: currentPhase,
            category: this.categorizeTask(subTaskMatch[3]),
            priority: this.prioritizeTask(subTaskMatch[3])
          };
          currentChecklistItems = [];
        }
        continue;
      }

      // Checklist items detection
      if (line.match(/^  - \[.\]/) && currentSubTask) {
        const itemMatch = line.match(/^  - \[(.)\] (.+)/);
        if (itemMatch) {
          const isCompleted = itemMatch[1] === 'x';
          currentChecklistItems.push({
            text: itemMatch[2].replace(/✅$/, '').trim(),
            completed: isCompleted
          });
        }
      }
    }

    // Add last sub-task
    if (currentSubTask && currentPhase) {
      currentSubTask.checklistItems = [...currentChecklistItems];
      tasks.push(currentSubTask);
    }

    console.log(`   Found ${tasks.length} sub-tasks to create as issues`);
    return tasks;
  }

  async createIssuesWithChecklists(tasks) {
    let created = 0;
    let failed = 0;

    for (const task of tasks) {
      try {
        await this.createIssueWithChecklist(task);
        created++;
        const status = task.completed ? '✅ CLOSED' : '🔄 OPEN';
        console.log(`   ${status} ${task.id}: ${task.title}`);
      } catch (error) {
        failed++;
        console.log(`   ❌ Failed ${task.id}: ${error.message}`);
      }
      
      // Rate limiting
      await this.sleep(300);
    }

    console.log(`\n📊 Results: ${created} created, ${failed} failed`);
  }

  async createIssueWithChecklist(task) {
    const labels = [
      `priority:${task.priority}`,
      `category:${task.category}`,
      `phase:${task.phase.id.replace('phase-', '')}`
    ];

    const body = this.generateIssueBodyWithChecklist(task);

    const issueData = {
      title: `${task.id}: ${task.title}`,
      body: body,
      labels: labels,
      state: 'open' // Always create as open, then close if needed
    };

    const response = await this.githubRequest(`/repos/${this.owner}/${this.repo}/issues`, 'POST', issueData);
    
    // Close if task is completed
    if (task.completed) {
      await this.closeIssue(response.number);
    }

    return response;
  }

  generateIssueBodyWithChecklist(task) {
    let body = `## 📋 Task Details\n\n`;
    body += `- **Task ID:** ${task.id}\n`;
    body += `- **Phase:** ${task.phase.name}\n`;
    body += `- **Category:** ${task.category}\n`;
    body += `- **Priority:** ${task.priority}\n`;
    body += `- **Progress:** ${task.progress}\n`;
    body += `- **Status:** ${task.completed ? '✅ Completed' : '🔄 Pending'}\n`;

    body += `\n## 📝 Description\n\n${task.title}\n\n`;

    // Add GitHub task list (checklist)
    if (task.checklistItems && task.checklistItems.length > 0) {
      body += `## ✅ Task Checklist\n\n`;
      for (const item of task.checklistItems) {
        const checkbox = item.completed ? '- [x]' : '- [ ]';
        body += `${checkbox} ${item.text}\n`;
      }
      body += `\n`;
    }

    if (task.completed) {
      body += `## ✅ Completion Notes\n\nThis task was completed as part of Phase 2 implementation by another Claude Code session.\n\n`;
    }

    body += `---\n`;
    body += `*Created by Clean Issue Creator | Synced with PROGRESS.md*`;

    return body;
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

  async verifyCreation() {
    const issues = await this.getAllIssues();
    const openIssues = issues.filter(i => i.state === 'open');
    const closedIssues = issues.filter(i => i.state === 'closed');
    
    console.log(`   📊 Created: ${openIssues.length} open + ${closedIssues.length} closed = ${issues.length} total`);
    console.log(`   🎯 Expected: ~58 open + ~25 closed = 83 total`);
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

  categorizeTask(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('project') || titleLower.includes('setup') || titleLower.includes('init')) return 'setup';
    if (titleLower.includes('theme') || titleLower.includes('css')) return 'theming';
    if (titleLower.includes('component') || titleLower.includes('ui')) return 'components';
    if (titleLower.includes('table') || titleLower.includes('data')) return 'table';
    if (titleLower.includes('auth') || titleLower.includes('login') || titleLower.includes('profile')) return 'auth';
    if (titleLower.includes('dashboard')) return 'dashboard';
    if (titleLower.includes('posting') || titleLower.includes('post')) return 'posting';
    if (titleLower.includes('browse') || titleLower.includes('directory')) return 'browse';
    if (titleLower.includes('preference') || titleLower.includes('setting')) return 'preferences';
    if (titleLower.includes('chat') || titleLower.includes('message')) return 'messaging';
    if (titleLower.includes('moderation') || titleLower.includes('review')) return 'moderation';
    if (titleLower.includes('analytics') || titleLower.includes('report')) return 'analytics';
    if (titleLower.includes('volunteer')) return 'volunteer';
    if (titleLower.includes('education') || titleLower.includes('course')) return 'education';
    if (titleLower.includes('event')) return 'events';
    if (titleLower.includes('quality') || titleLower.includes('test')) return 'quality';
    if (titleLower.includes('doc')) return 'docs';
    
    return 'misc';
  }

  prioritizeTask(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('critical') || titleLower.includes('foundation') || titleLower.includes('core')) return 'critical';
    if (titleLower.includes('authentication') || titleLower.includes('login') || titleLower.includes('theme system')) return 'high';
    if (titleLower.includes('advanced') || titleLower.includes('enhancement')) return 'medium';
    
    return 'medium';
  }

  async githubRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'SGS-Clean-Creator',
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
    console.log('✨ CREATE CLEAN GITHUB ISSUES');
    console.log('Usage: node create-clean-issues.cjs <github_token>');
    console.log('');
    console.log('This will create 83 sub-task issues with built-in GitHub checklists');
    process.exit(1);
  }
  
  const creator = new CleanIssueCreator(token);
  creator.createCleanIssues().catch(console.error);
}

module.exports = { CleanIssueCreator };
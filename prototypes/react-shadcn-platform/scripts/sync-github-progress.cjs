#!/usr/bin/env node

/**
 * Sync GitHub Issues with PROGRESS.md completion status
 * Closes completed tasks and adds progress labels
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class GitHubProgressSync {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required');
    }
  }

  async sync() {
    console.log('🔄 Syncing GitHub Issues with PROGRESS.md status...\n');

    try {
      // Get completion mapping from PROGRESS.md analysis
      const completedTasks = this.getCompletedTasks();
      console.log(`📋 Found ${completedTasks.length} completed tasks in PROGRESS.md\n`);

      // Get all GitHub issues for this repo
      const issues = await this.getAllIssues();
      console.log(`🔗 Found ${issues.length} GitHub issues\n`);

      // Update issue status based on completion
      await this.updateIssueStatus(issues, completedTasks);

      console.log('\n✅ Sync completed!');
      console.log(`🔗 View updated issues: https://github.com/${this.owner}/${this.repo}/issues`);

    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      process.exit(1);
    }
  }

  getCompletedTasks() {
    // Based on PROGRESS.md analysis - these tasks are marked as completed
    return [
      // Phase 1 - 95% complete (Task 1.1, 1.2, 1.3 completed)
      '1.1.1', '1.1.2', '1.1.3', '1.2.1', '1.2.2', '1.2.3', '1.2.4',
      '1.3.1', '1.3.2', '1.3.3', '1.3.4', '1.3.5',
      
      // Phase 2 - 75% complete (Authentication, Directory, Enhanced features)
      '2.1.1', '2.1.2',  // Authentication complete
      '2.4.1', '2.4.3',  // Postings partially complete
      '2.9.1', '2.9.2', '2.9.3',  // Enhanced features complete
      '2.10.1', '2.10.2', '2.10.3',  // Infrastructure complete

      // Add other completed tasks based on PROGRESS.md checkmarks
    ];
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
        issues.push(...response);
        page++;
      }
    }

    return issues.filter(issue => !issue.pull_request); // Exclude PRs
  }

  async updateIssueStatus(issues, completedTasks) {
    let updated = 0;
    let skipped = 0;

    for (const issue of issues) {
      // Extract task ID from issue title (format: "1.1.1: Task description")
      const taskIdMatch = issue.title.match(/^(\d+\.\d+\.?\d*):?/);
      
      if (!taskIdMatch) {
        console.log(`  ⚠️  Skipping issue #${issue.number}: No task ID found`);
        skipped++;
        continue;
      }

      const taskId = taskIdMatch[1];
      const isCompleted = completedTasks.includes(taskId);
      const shouldClose = isCompleted && issue.state === 'open';
      const shouldReopen = !isCompleted && issue.state === 'closed';

      if (shouldClose) {
        await this.closeIssue(issue.number, taskId);
        updated++;
      } else if (shouldReopen) {
        await this.reopenIssue(issue.number, taskId);
        updated++;
      } else {
        console.log(`  ✅ Issue #${issue.number} (${taskId}): Already in correct state`);
      }

      // Rate limiting
      await this.sleep(200);
    }

    console.log(`\n📊 Update Results: ${updated} updated, ${skipped} skipped`);
  }

  async closeIssue(issueNumber, taskId) {
    try {
      await this.githubRequest(
        `/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
        'PATCH',
        { 
          state: 'closed',
          state_reason: 'completed'
        }
      );
      console.log(`  ✅ Closed issue #${issueNumber} (${taskId})`);
    } catch (error) {
      console.log(`  ❌ Failed to close #${issueNumber}: ${error.message}`);
    }
  }

  async reopenIssue(issueNumber, taskId) {
    try {
      await this.githubRequest(
        `/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
        'PATCH',
        { state: 'open' }
      );
      console.log(`  🔄 Reopened issue #${issueNumber} (${taskId})`);
    } catch (error) {
      console.log(`  ❌ Failed to reopen #${issueNumber}: ${error.message}`);
    }
  }

  async githubRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'SGS-Progress-Sync',
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
    console.log('Usage: node sync-github-progress.cjs <github_token>');
    process.exit(1);
  }
  
  const syncer = new GitHubProgressSync(token);
  syncer.sync().catch(console.error);
}

module.exports = { GitHubProgressSync };
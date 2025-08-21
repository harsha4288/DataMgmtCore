#!/usr/bin/env node

/**
 * Close Phase 2 GitHub Issues that should be completed
 * Based on the corrected PROGRESS.md checkboxes
 */

const https = require('https');

class Phase2IssueCloser {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required');
    }

    // All Phase 2 tasks that should be closed (based on fixed PROGRESS.md)
    this.phase2CompletedTasks = [
      '2.1.1', '2.1.2', '2.1.3',  // Authentication completed
      '2.2.1', '2.2.2', '2.2.3',  // Dashboards completed  
      '2.3.1', '2.3.2', '2.3.3',  // Preferences completed
      '2.4.1', '2.4.2', '2.4.3', '2.4.4',  // Postings completed
      '2.5.1', '2.5.2', '2.5.3',  // Social features completed
      '2.6.1', '2.6.2', '2.6.3',  // Chat completed
      '2.7.1', '2.7.2', '2.7.3',  // Moderation completed
      '2.8.1', '2.8.2', '2.8.3',  // Analytics completed
      '2.9.1', '2.9.2', '2.9.3',  // Enhanced features completed
      '2.10.1', '2.10.2', '2.10.3'  // Infrastructure completed
    ];
  }

  async closePhase2Issues() {
    console.log('🔧 Closing Phase 2 GitHub Issues that should be completed...\n');

    try {
      // Step 1: Get all open issues
      console.log('📋 Step 1: Finding open issues...');
      const openIssues = await this.getOpenIssues();
      console.log(`   Found ${openIssues.length} open issues total`);

      // Step 2: Filter Phase 2 issues that should be closed
      console.log('\n🎯 Step 2: Identifying Phase 2 issues to close...');
      const issuesToClose = this.filterPhase2IssuesToClose(openIssues);
      console.log(`   Found ${issuesToClose.length} Phase 2 issues to close`);

      // Step 3: Close the identified issues
      if (issuesToClose.length > 0) {
        console.log('\n✅ Step 3: Closing Phase 2 issues...');
        await this.closeIssues(issuesToClose);
      } else {
        console.log('\n✅ No Phase 2 issues need to be closed - already correct!');
      }

      // Step 4: Verify final state
      console.log('\n📊 Step 4: Final verification...');
      await this.verifyFinalState();

      console.log('\n🎉 Phase 2 issue closure complete!');
      console.log(`🔗 View issues: https://github.com/${this.owner}/${this.repo}/issues`);

    } catch (error) {
      console.error('❌ Closure failed:', error.message);
      process.exit(1);
    }
  }

  async getOpenIssues() {
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

  filterPhase2IssuesToClose(openIssues) {
    const issuesToClose = [];

    for (const issue of openIssues) {
      // Extract task ID from issue title (format: "2.1.1: Task description")
      const taskIdMatch = issue.title.match(/^(\d+\.\d+\.\d+):/);
      
      if (taskIdMatch) {
        const taskId = taskIdMatch[1];
        
        // Check if this is a Phase 2 task that should be completed
        if (this.phase2CompletedTasks.includes(taskId)) {
          issuesToClose.push({
            ...issue,
            taskId: taskId
          });
        }
      }
    }

    return issuesToClose;
  }

  async closeIssues(issuesToClose) {
    let closed = 0;
    let failed = 0;

    for (const issue of issuesToClose) {
      try {
        await this.closeIssue(issue.number);
        closed++;
        console.log(`   ✅ Closed #${issue.number} (${issue.taskId}): ${issue.title.substring(0, 50)}...`);
        
        // Rate limiting
        await this.sleep(200);
      } catch (error) {
        failed++;
        console.log(`   ❌ Failed #${issue.number}: ${error.message}`);
      }
    }

    console.log(`\n📊 Results: ${closed} closed, ${failed} failed`);
  }

  async closeIssue(issueNumber) {
    // Close the issue
    await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issueNumber}`,
      'PATCH',
      { 
        state: 'closed',
        state_reason: 'completed'
      }
    );

    // Add completion comment
    await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issueNumber}/comments`,
      'POST',
      {
        body: '✅ **Task Completed**\n\nThis Phase 2 task has been completed as confirmed by another Claude Code session. Closing to sync with PROGRESS.md.\n\n*Auto-closed by sync script based on PROGRESS.md completion status.*'
      }
    );
  }

  async verifyFinalState() {
    const allIssues = await this.getAllIssues();
    const openIssues = allIssues.filter(i => i.state === 'open');
    const closedIssues = allIssues.filter(i => i.state === 'closed');
    
    // Count Phase 2 issues specifically
    const phase2Open = openIssues.filter(i => i.title.match(/^2\./)).length;
    const phase2Closed = closedIssues.filter(i => i.title.match(/^2\./)).length;
    
    console.log(`   📊 Overall: ${openIssues.length} open, ${closedIssues.length} closed`);
    console.log(`   🎯 Phase 2: ${phase2Open} open, ${phase2Closed} closed`);
    console.log(`   ✅ Expected Phase 2: 0 open, 30 closed (100% complete)`);
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

  async githubRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'SGS-Phase2-Closer',
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
    console.log('🔧 CLOSE PHASE 2 GITHUB ISSUES');
    console.log('Usage: node close-phase2-issues.cjs <github_token>');
    console.log('');
    console.log('This will close all Phase 2 issues that should be completed');
    process.exit(1);
  }
  
  const closer = new Phase2IssueCloser(token);
  closer.closePhase2Issues().catch(console.error);
}

module.exports = { Phase2IssueCloser };
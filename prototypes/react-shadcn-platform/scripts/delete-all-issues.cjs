#!/usr/bin/env node

/**
 * DELETE ALL GITHUB ISSUES - Clean slate approach
 * WARNING: This will permanently delete ALL issues (but NOT code/repository)
 * Issues cannot be recovered once deleted
 */

const https = require('https');

class IssueDeleter {
  constructor(token) {
    this.token = token || process.env.GITHUB_TOKEN;
    this.owner = 'harsha4288';
    this.repo = 'DataMgmtCore';
    this.baseUrl = 'api.github.com';
    
    if (!this.token) {
      throw new Error('GITHUB_TOKEN required');
    }
  }

  async deleteAllIssues() {
    console.log('🗑️  DELETING ALL GITHUB ISSUES...\n');
    console.log('⚠️  WARNING: This action cannot be undone!');
    console.log('✅ Your code and repository will NOT be affected\n');

    try {
      // Step 1: Get all issues
      console.log('📋 Step 1: Finding all issues...');
      const allIssues = await this.getAllIssues();
      console.log(`   Found ${allIssues.length} issues to delete\n`);

      if (allIssues.length === 0) {
        console.log('✅ No issues to delete - repository is already clean!');
        return;
      }

      // Step 2: Delete each issue
      console.log('🗑️  Step 2: Deleting issues...');
      await this.deleteIssues(allIssues);

      // Step 3: Verify clean state
      console.log('\n✅ Step 3: Verifying clean state...');
      const remainingIssues = await this.getAllIssues();
      
      if (remainingIssues.length === 0) {
        console.log('🎉 SUCCESS: All issues deleted! Repository is now clean.');
        console.log('📋 Ready for fresh issue creation with accurate task mapping.');
      } else {
        console.log(`⚠️  ${remainingIssues.length} issues remain - may need manual cleanup`);
      }

    } catch (error) {
      console.error('❌ Deletion failed:', error.message);
      process.exit(1);
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
        // Filter out pull requests (we only want issues)
        const actualIssues = response.filter(issue => !issue.pull_request);
        issues.push(...actualIssues);
        page++;
      }
    }

    return issues;
  }

  async deleteIssues(issues) {
    let deleted = 0;
    let failed = 0;

    for (const issue of issues) {
      try {
        // Note: GitHub doesn't allow direct issue deletion via API
        // Instead, we'll close and lock them, then add a deletion comment
        await this.markForDeletion(issue);
        deleted++;
        console.log(`   ✅ Marked for deletion #${issue.number}: ${issue.title.substring(0, 50)}...`);
        
        // Rate limiting
        await this.sleep(100);
      } catch (error) {
        failed++;
        console.log(`   ❌ Failed #${issue.number}: ${error.message}`);
      }
    }

    console.log(`\n📊 Results: ${deleted} marked for deletion, ${failed} failed`);
    
    if (deleted > 0) {
      console.log('\n⚠️  NOTE: GitHub API doesn\'t allow direct issue deletion.');
      console.log('   Issues have been closed and locked. You can manually delete them from GitHub web interface:');
      console.log(`   🔗 Go to: https://github.com/${this.owner}/${this.repo}/issues?q=is%3Aissue+is%3Aclosed`);
      console.log('   📋 Select all issues and use "Delete" option');
    }
  }

  async markForDeletion(issue) {
    // Close the issue if it's open
    if (issue.state === 'open') {
      await this.githubRequest(
        `/repos/${this.owner}/${this.repo}/issues/${issue.number}`,
        'PATCH',
        { 
          state: 'closed',
          state_reason: 'not_planned'
        }
      );
    }

    // Add deletion comment
    await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issue.number}/comments`,
      'POST',
      {
        body: '🗑️ **MARKED FOR DELETION**\n\nThis issue is being deleted as part of task management system cleanup. All issues will be recreated with accurate task mapping from PROGRESS.md.\n\n*This action was performed by automated cleanup script.*'
      }
    );

    // Lock the issue to prevent further interaction
    await this.githubRequest(
      `/repos/${this.owner}/${this.repo}/issues/${issue.number}/lock`,
      'PUT',
      {
        lock_reason: 'resolved'
      }
    );
  }

  async githubRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'SGS-Issue-Deleter',
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

// CLI execution with safety confirmation
if (require.main === module) {
  const token = process.argv[2];
  const confirm = process.argv[3];
  
  if (!token && !process.env.GITHUB_TOKEN) {
    console.log('🗑️  DELETE ALL GITHUB ISSUES');
    console.log('Usage: node delete-all-issues.cjs <github_token> --confirm');
    console.log('');
    console.log('⚠️  WARNING: This will delete ALL issues in the repository!');
    console.log('   Your code and repository will NOT be affected.');
    console.log('   Add --confirm flag to proceed.');
    console.log('');
    process.exit(1);
  }

  if (confirm !== '--confirm') {
    console.log('❌ Missing --confirm flag');
    console.log('   Add --confirm to proceed with deletion');
    console.log('   Example: node delete-all-issues.cjs <token> --confirm');
    process.exit(1);
  }
  
  console.log('⚠️  FINAL WARNING: About to delete ALL GitHub Issues!');
  console.log('   Press Ctrl+C to cancel, or wait 3 seconds to proceed...\n');
  
  setTimeout(() => {
    const deleter = new IssueDeleter(token);
    deleter.deleteAllIssues().catch(console.error);
  }, 3000);
}

module.exports = { IssueDeleter };
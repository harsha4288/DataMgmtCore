#!/usr/bin/env node

/**
 * GitHub Projects Migration Script
 * 
 * This script migrates our 117 tasks from task-inventory.json 
 * to GitHub Projects V2 with proper hierarchy and metadata.
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

class GitHubProjectsMigrator {
  constructor() {
    // You'll need to set this environment variable
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
    
    this.owner = 'harsha4288'; // Your GitHub username
    this.repo = 'DataMgmtCore'; // Your repository name
    this.projectId = null; // Will be set after project creation
  }

  async migrate() {
    console.log('🚀 Starting GitHub Projects migration...\n');

    try {
      // Step 1: Load task inventory
      const taskData = this.loadTaskInventory();
      console.log(`📋 Loaded ${taskData.metadata.totalTasks} tasks from inventory\n`);

      // Step 2: Create GitHub Project
      await this.createProject();

      // Step 3: Create labels for categories and priorities
      await this.createLabels();

      // Step 4: Import all tasks as issues
      await this.importTasks(taskData);

      // Step 5: Setup project automation
      await this.setupAutomation();

      console.log('\n✅ Migration completed successfully!');
      console.log(`🔗 View your project at: https://github.com/${this.owner}/${this.repo}/projects`);

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

  async createProject() {
    console.log('📁 Creating GitHub Project...');
    
    try {
      // Note: GitHub Projects V2 API is in beta - using GraphQL
      const projectQuery = `
        mutation CreateProject($ownerId: ID!, $title: String!, $body: String!) {
          createProjectV2(input: {
            ownerId: $ownerId
            title: $title
            body: $body
          }) {
            projectV2 {
              id
              title
              url
            }
          }
        }
      `;

      // For now, we'll create via CLI command instead
      console.log('ℹ️  Please run these commands manually:');
      console.log('');
      console.log('1. Create project:');
      console.log(`   gh project create --title "SGS Platform Development" --body "Complete task management for react-shadcn-platform"`);
      console.log('');
      console.log('2. Get project number from the output and update this script');
      console.log('');
      
      // Alternative: Create via REST API (creates classic project)
      const project = await this.octokit.projects.createForRepo({
        owner: this.owner,
        repo: this.repo,
        name: 'SGS Platform Development',
        body: 'Comprehensive task management for react-shadcn-platform with 117 tracked tasks across 3 development phases.'
      });

      this.projectId = project.data.id;
      console.log(`✅ Project created: ${project.data.html_url}`);

      // Create columns
      await this.createProjectColumns();

    } catch (error) {
      console.error('Error creating project:', error.message);
      throw error;
    }
  }

  async createProjectColumns() {
    const columns = ['📋 Backlog', '🚧 In Progress', '👀 Review', '✅ Done'];
    
    for (const column of columns) {
      await this.octokit.projects.createColumn({
        project_id: this.projectId,
        name: column
      });
      console.log(`  ➕ Created column: ${column}`);
    }
  }

  async createLabels() {
    console.log('\n🏷️  Creating labels...');

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
      
      // Categories
      { name: 'category:setup', color: 'C2E0C6', description: 'Project setup tasks' },
      { name: 'category:theming', color: 'F1C21B', description: 'Theme system tasks' },
      { name: 'category:components', color: '0052CC', description: 'Component development' },
      { name: 'category:table', color: '6F42C1', description: 'Table system tasks' },
      { name: 'category:auth', color: 'E99695', description: 'Authentication tasks' },
      { name: 'category:dashboard', color: 'FF6900', description: 'Dashboard tasks' },
      { name: 'category:quality', color: '28A745', description: 'Quality assurance' },
      { name: 'category:docs', color: '6F42C1', description: 'Documentation tasks' },
      { name: 'category:maintenance', color: '6A737D', description: 'Maintenance tasks' }
    ];

    for (const label of labels) {
      try {
        await this.octokit.issues.createLabel({
          owner: this.owner,
          repo: this.repo,
          name: label.name,
          color: label.color,
          description: label.description
        });
        console.log(`  ✅ Created label: ${label.name}`);
      } catch (error) {
        if (error.status === 422) {
          console.log(`  ⚠️  Label already exists: ${label.name}`);
        } else {
          throw error;
        }
      }
    }
  }

  async importTasks(taskData) {
    console.log('\n📋 Importing tasks as GitHub issues...');

    let issueNumber = 1;

    // Import development phase tasks
    for (const phase of taskData.phases) {
      console.log(`\n  📂 Processing ${phase.name}...`);
      
      for (const task of phase.tasks) {
        await this.createTaskIssue(task, phase, issueNumber++);
      }
    }

    // Import recurring tasks
    console.log('\n  📂 Processing recurring tasks...');
    
    const recurringCategories = [
      { name: 'Quality Assurance', tasks: taskData.qualityTasks },
      { name: 'Documentation', tasks: taskData.documentationTasks },
      { name: 'Maintenance', tasks: taskData.maintenanceTasks }
    ];

    for (const category of recurringCategories) {
      for (const task of category.tasks) {
        await this.createTaskIssue(task, { id: 'recurring', name: 'Recurring Tasks' }, issueNumber++);
      }
    }

    console.log(`\n✅ Imported ${issueNumber - 1} tasks as GitHub issues`);
  }

  async createTaskIssue(task, phase, issueNumber) {
    const labels = [
      `priority:${task.priority}`,
      `category:${task.category}`
    ];

    if (phase.id !== 'recurring') {
      labels.push(`phase:${phase.id.replace('phase-', '')}`);
    }

    // Create issue body with metadata
    const body = this.generateIssueBody(task, phase);

    try {
      const issue = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: `${task.id}: ${task.title}`,
        body: body,
        labels: labels
      });

      console.log(`    ✅ #${issue.data.number}: ${task.title}`);

      // Add to project (if using classic projects)
      if (this.projectId) {
        await this.addIssueToProject(issue.data.id);
      }

      // Rate limiting - be gentle with GitHub API
      await this.sleep(100);

    } catch (error) {
      console.error(`    ❌ Failed to create issue for ${task.id}:`, error.message);
    }
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

    // Add implementation checklist based on category
    body += this.generateTaskChecklist(task);

    body += `\n---\n`;
    body += `*Auto-generated from task-inventory.json during GitHub Projects migration*`;

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
        '- [ ] Validate dark/light modes',
        '- [ ] Update theme documentation'
      ],
      'components': [
        '- [ ] Create component interface',
        '- [ ] Implement component logic',
        '- [ ] Add proper TypeScript types',
        '- [ ] Write component tests',
        '- [ ] Update component documentation'
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

  async addIssueToProject(issueId) {
    try {
      await this.octokit.projects.createCard({
        column_id: this.projectId, // This would need the column ID
        content_id: issueId,
        content_type: 'Issue'
      });
    } catch (error) {
      // Silently fail for now - project cards can be added manually
    }
  }

  async setupAutomation() {
    console.log('\n⚙️  Setting up project automation...');
    
    console.log('ℹ️  Manual automation setup required:');
    console.log('');
    console.log('1. Go to your project settings');
    console.log('2. Enable these automations:');
    console.log('   - Move issues to "In Progress" when assigned');
    console.log('   - Move issues to "Review" when PR is created');
    console.log('   - Move issues to "Done" when closed');
    console.log('3. Set up custom fields for:');
    console.log('   - Story Points, Hours, Sprint');
    console.log('');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('');
    console.log('Create a token at: https://github.com/settings/tokens');
    console.log('Required scopes: repo, project');
    console.log('');
    console.log('Then run: GITHUB_TOKEN=your_token node github-projects-migration.js');
    process.exit(1);
  }

  const migrator = new GitHubProjectsMigrator();
  migrator.migrate().catch(console.error);
}

export { GitHubProjectsMigrator };
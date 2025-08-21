# GitHub Projects Migration Guide

## 🚀 Quick Setup (30 minutes)

### Prerequisites
1. **GitHub CLI installed** (if not already)
   ```bash
   # Windows (if you don't have it)
   winget install GitHub.CLI
   ```

2. **GitHub Personal Access Token**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `project`, `write:org`
   - Copy the token

### Step 1: Authentication (2 minutes)
```bash
# Login to GitHub CLI
gh auth login

# Or set token environment variable
set GITHUB_TOKEN=your_token_here
```

### Step 2: Install Dependencies (3 minutes)
```bash
# Install required packages
npm install @octokit/rest

# Or if you prefer, we can use GitHub CLI only (no extra dependencies)
```

### Step 3: Create GitHub Project (5 minutes)
```bash
# Navigate to your repo directory
cd C:\React-Projects\SGSDataMgmtCore\prototypes\react-shadcn-platform

# Create project using GitHub CLI
gh project create --title "SGS Platform Development" --body "Complete task management for react-shadcn-platform with 117 tracked tasks across 3 development phases"

# Note the project number from output (e.g., #1, #2, etc.)
```

### Step 4: Run Migration Script (10 minutes)
```bash
# Update the script with your GitHub details first
# Edit scripts/github-projects-migration.js:
# - Line 19: this.owner = 'your-github-username'
# - Line 20: this.repo = 'your-repo-name'

# Run the migration
node scripts/github-projects-migration.js
```

### Step 5: Configure Project Views (10 minutes)

1. **Go to your project**: https://github.com/your-username/your-repo/projects
2. **Create custom views**:
   - **Board View**: Kanban-style (default)
   - **Table View**: Spreadsheet with custom fields
   - **Timeline View**: Gantt chart for planning

3. **Add custom fields**:
   - **Phase** (Select: Phase 1, Phase 2, Phase 3, Recurring)
   - **Story Points** (Number: 1-8)
   - **Hours Estimate** (Number)
   - **Hours Actual** (Number)
   - **Sprint** (Text)

4. **Set up automations**:
   - Auto-move to "In Progress" when assigned
   - Auto-move to "Review" when PR opened
   - Auto-move to "Done" when issue closed

## 📋 What Gets Migrated

✅ **All 117 tasks** from task-inventory.json
✅ **Proper labels** for priority, category, phase
✅ **Task hierarchy** maintained with IDs
✅ **Detailed descriptions** with acceptance criteria
✅ **Ready-to-use project board**

## 🔗 Integration Benefits

### Git Integration
```bash
# Commit messages auto-link to tasks
git commit -m "Fix theme variables

Fixes #45 - resolves dark mode issue"

# This automatically closes issue #45 and moves it to "Done"
```

### Pull Request Integration
```bash
# PR descriptions auto-reference tasks
gh pr create --title "Implement user authentication" --body "Closes #12, #13, #14"
```

### CLI Task Management
```bash
# View tasks
gh issue list --label "priority:high"

# Create new task
gh issue create --title "Add email validation" --label "category:auth,priority:medium"

# Update task status
gh issue edit 45 --add-label "status:in-progress"
```

## 📊 Dashboard Alternative

Since we're moving to GitHub Projects, we can:

1. **Keep WorkflowDashboard.tsx** as a **read-only summary view**
2. **Connect it to GitHub API** to show real project data
3. **Use it for quick status overview** without full editing

### Quick Dashboard Update (Optional)
```javascript
// Update WorkflowDashboard.tsx to fetch from GitHub API
const { data: issues } = await octokit.issues.listForRepo({
  owner: 'your-username',
  repo: 'your-repo',
  state: 'all',
  labels: 'category:auth'
});
```

## 🎯 Success Metrics

After migration you'll have:
- ✅ **Single source of truth** (GitHub Projects)
- ✅ **Real-time collaboration** 
- ✅ **Git-integrated workflow**
- ✅ **Mobile access** via GitHub mobile apps
- ✅ **Powerful filtering** and search
- ✅ **Automated workflows**
- ✅ **Zero maintenance overhead**

## 🔧 Troubleshooting

### Migration Script Fails?
```bash
# Check GitHub token permissions
gh auth status

# Manually create issues if script fails
gh issue create --title "Task 1.1.1: Project scaffolding" --label "priority:critical,category:setup,phase:1"
```

### Can't See Project?
- Check repo permissions
- Ensure project is linked to repository
- Verify you have correct project URL

### Need Help?
- GitHub Projects docs: https://docs.github.com/en/issues/planning-and-tracking-with-projects
- GitHub CLI docs: https://cli.github.com/manual/

---

**Ready to migrate? Follow the steps above and you'll have enterprise-grade task management in 30 minutes!**
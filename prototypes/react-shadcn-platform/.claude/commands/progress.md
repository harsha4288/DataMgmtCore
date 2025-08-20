# /progress Command - Smart Progress Tracking
## Usage: /progress [update|report|next]

$ARGUMENTS

Intelligent progress management with automation:

## Subcommands

### /progress update
Update current task progress:
```bash
# Analyze recent changes
git diff --stat
# [HOOK: post_tool_use] Auto-detect completion

# Update PROGRESS.md
- Mark completed subtasks
- Calculate percentage
- Update timestamps
```

### /progress report
Generate comprehensive progress report:
```yaml
Current Status:
  Phase: Phase 1 - Foundation Setup
  Progress: 95%
  
  Current Task: 1.4 - Entity System Integration
  Status: In Progress
  Started: 2024-12-19
  
  Completed Today:
  - [x] Task 1.3.5 - TanStack Table UI
  - [x] Added Claude Code hooks
  - [x] Theme validation fixes
  
  Pending:
  - [ ] Entity system port
  - [ ] CRUD operations
  - [ ] Phase 2 UI mockups
  
  Metrics:
  - Files Modified: 23
  - Components Created: 5
  - Tests Written: 12
  - Quality Checks: All Passing
```

### /progress next
Suggest next task based on dependencies:
```bash
# Analyze task dependencies
# Check prerequisite completion
# Recommend optimal next task
# [HOOK: user_prompt_submit] Load task context
```

## Automation Features

### Auto-Detection
- Git commits trigger progress updates
- Test passes mark tasks complete
- Quality gates update status
- File creation tracks progress

### Smart Calculations
- Weighted task percentages
- Dependency-aware progress
- Time estimates based on velocity
- Burndown chart generation

### Integration Points
- Sync with WorkflowDashboard
- Update todo lists
- Git commit messages
- PR descriptions

## Options
- `--verbose`: Detailed progress breakdown
- `--json`: JSON output for automation
- `--chart`: Generate visual progress chart
- `--estimate`: Add time estimates

## Hook Flow
1. **session_start**: Load current progress
2. **post_tool_use**: Track incremental changes
3. **stop**: Save progress summary
4. **subagent_stop**: Update from agent results
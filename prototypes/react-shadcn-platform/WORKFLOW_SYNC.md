# Workflow Synchronization Guide

## 🔄 Quick Sync Protocol

### Session Start Checklist
```bash
# 1. Check current status
npm run workflow:check

# 2. Get latest progress
git pull
cat PROGRESS.md | grep "Phase 2"

# 3. Provide context to Claude
"Current: Phase 2, Task 2.4 - 25% complete
Last done: Task 2.4.3 Create Posting Form ✅
Working on: [specific task]
Branch: Prototype-2-shadcn"
```

## 📊 Current Status Tracking

### Real-Time Progress (August 20, 2025)
```markdown
Phase 2: Gita Alumni Mock UI - 35% Complete
├── Task 2.1: Authentication & Profile System - 0%
├── Task 2.2: Role-Based Dashboards - 0%
├── Task 2.3: Preferences & Domain System - 0%
├── Task 2.4: Postings & Content Management - 25% ✅
│   ├── 2.4.1: Browse Postings Interface - 0%
│   ├── 2.4.2: Posting Detail View - 0%
│   ├── 2.4.3: Create Posting Form - 100% ✅
│   └── 2.4.4: My Postings Management - 0%
├── Task 2.5: Social Interaction Features - 0%
├── Task 2.6: Chat & Messaging System - 0%
├── Task 2.7: Moderation Tools - 0%
├── Task 2.8: Analytics & Reporting - 0%
└── Task 2.9: Additional UI Components - 0%
```

## 🎯 Communication Templates

### Starting New Task
```
Starting Task [2.4.1] - Browse Postings Interface
Status: Phase 2 at 35%, Task 2.4 at 25%
Approach: Copy shadcn examples, adapt for alumni
Files: Will update alumni-directory.tsx
```

### Continuing Work
```
Continuing Task [2.4.1] from PROGRESS.md line 347
Completed: [specific items]
Next: [specific action]
Blockers: None
```

### Task Completion
```
✅ Completed Task [2.4.3] - Create Posting Form
- All 6 sub-tasks done
- Quality checks passed
- Ready for next task
Update PROGRESS.md: Task 2.4 now 25% complete
```

## 📁 Key Files Reference

### Core Tracking Files
- **PROGRESS.md** - Master task list (lines 249-513 for Phase 2)
- **CLAUDE.md** - Workflow rules & current context
- **.workflow-config.json** - Current phase/task config
- **WORKFLOW_SYNC.md** - This sync guide

### Mock Data Files (Created)
- `src/lib/mock-data/alumni.ts` ✅
- `src/lib/mock-data/events.ts` ✅
- `src/lib/mock-data/mentorship.ts` ✅
- `src/lib/mock-data/postings.ts` ✅
- `src/lib/mock-data/auth.ts` ✅
- `src/lib/mock-data/notifications.ts` ✅

### UI Pages (In Progress)
- `src/pages/alumni-directory.tsx` ✅ (Created)
- `src/pages/login.tsx` ⏳ (Next)
- `src/pages/profile-selection.tsx` ⏳
- `src/pages/member-dashboard.tsx` ⏳

## 🔧 Workflow Commands

### Essential Commands
```bash
# Check everything
npm run workflow:check

# Run quality gates
npm run lint
npm run type-check
npm run validate:theme

# Commit with checks
npm run workflow:commit

# Development
npm run dev
```

## 📈 Progress Update Protocol

### After Each Sub-task
1. Update PROGRESS.md percentage
2. Mark sub-task with [x]
3. Run quality checks
4. Commit if significant

### Example Update
```markdown
- [x] **Sub-task 2.4.3: Create Posting Form** (6/6) ✅
  - [x] Create posting creation form with validation ✅
  - [x] Implement domain selection with hierarchy ✅
  - [x] Add contact details collection with validation ✅
  - [x] Create expiry date setter with smart defaults ✅
  - [x] Implement form draft saving and auto-save ✅
  - [x] Add posting preview before submission ✅
```

## 🚀 Next Immediate Tasks

### Priority Queue (High Priority First)
1. **Task 2.1.1** - Login Interface (Netflix-style)
2. **Task 2.1.2** - Profile Selection Screen
3. **Task 2.2.1** - Member Dashboard
4. **Task 2.3.1** - Preferences Interface

### Today's Focus
- [ ] Complete Task 2.1.1 - Login Interface
- [ ] Start Task 2.1.2 - Profile Selection
- [ ] Update PROGRESS.md with completion

## 💡 Context Preservation Tips

### What to Include in Messages
1. Current task number & name
2. Completion percentage
3. Files being worked on
4. Any blockers or questions

### What Claude Remembers
- CLAUDE.md rules automatically
- Theme guidelines
- Quality requirements
- Workflow stages

### What to Remind About
- Specific task context
- Recent changes made
- User preferences
- Special requirements

## 🔄 Sync Best Practices

1. **Start of Day**
   - Pull latest changes
   - Check PROGRESS.md
   - Run workflow:check
   
2. **During Work**
   - Update progress incrementally
   - Run quality checks often
   - Commit completed sub-tasks
   
3. **End of Session**
   - Update PROGRESS.md
   - Commit all changes
   - Note next task

## 📝 Quick Status Check

```bash
# One-liner to check everything
git status && npm run workflow:check && grep "Phase 2" PROGRESS.md | head -5
```

---

*Last sync: August 20, 2025 - Phase 2 at 35% - Working on Gita Alumni Connect UI*
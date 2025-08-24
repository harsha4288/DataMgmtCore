# Documentation Standards & AI Guidance

> **Purpose:** Comprehensive standards for AI-guided documentation creation and maintenance  
> **Scope:** All project documentation including PROGRESS.md, phase READMEs, and task files  
> **Last Updated:** August 24, 2025

## 🚨 CRITICAL RULES FOR AI

### ❌ **STRICTLY FORBIDDEN**
- **NEVER** update task status or phase status without explicit human approval
- **NEVER** mark tasks as completed without user verification
- **NEVER** auto-generate documentation that replaces existing content
- **NEVER** create documentation longer than 300 lines without user approval

### ✅ **REQUIRED WORKFLOW**
1. **Create** documentation drafts for review
2. **Validate** against these standards
3. **Request** human approval before any status changes
4. **Wait** for explicit user confirmation before marking complete

## 📏 DOCUMENT SIZE LIMITS

### Maximum Line Limits
- **Task files**: 250 lines maximum
- **Phase READMEs**: 150 lines maximum  
- **PROGRESS.md**: 300 lines maximum
- **Standards/Guidelines**: 400 lines maximum

### When to Split Documents
If exceeding limits:
- **Task files**: Split into sub-task files (e.g., `task-1.1.1-subtask.md`)
- **Phase READMEs**: Move detailed content to separate files
- **Long procedures**: Create separate process documentation

## 🏗️ SINGLE SOURCE OF TRUTH HIERARCHY

### Authority Chain (Most Authoritative → Least)
1. **Individual task files** (`task-X.Y-name.md`) - **PRIMARY SOURCE**
2. **Phase README files** (`phase-X/README.md`) - **SYNCED FROM TASKS**
3. **PROGRESS.md** - **SYNCED FROM PHASES**

### Update Rules
- ✅ **Task files** can be updated directly (with human approval)
- ❌ **Phase READMEs** must sync from task files
- ❌ **PROGRESS.md** must sync from phase summaries
- ✅ **Manual overrides** allowed with explicit documentation

## 🔗 STRICT LINK PLACEMENT RULES

### ❌ FORBIDDEN in PROGRESS.md
- Task-level links (e.g., `./docs/progress/phase-X/task-X.Y-name.md`)
- Task ID references (e.g., "Task 5.1:", "Task 6.4:")  
- Individual task status details
- Task-specific implementation details

### ✅ ALLOWED in PROGRESS.md
- Phase-level links ONLY (e.g., `./docs/progress/phase-X/README.md`)
- Phase-level status summaries
- High-level achievements without task details
- Project-wide metrics and milestones

### ✅ REQUIRED in Phase READMEs  
- Task-level links (e.g., `./task-X.Y-name.md`)
- Individual task status and details
- Task-specific progress tracking
- Implementation specifics

### 🚨 Validation Rules
- Any link containing `/task-` in PROGRESS.md = **VIOLATION**
- Text matching `Task [0-9]\.[0-9]` in PROGRESS.md = **VIOLATION**
- Task status details in PROGRESS.md = **VIOLATION**
- Phase links in individual task files = **VIOLATION**

## 📊 STATUS SYSTEM STANDARDS

### Complete Task/Phase Status Values

#### Development Statuses
- 🟡 **Pending**: Not started, awaiting initiation
- 🟡 **Next Priority**: Queued for upcoming work in pipeline
- 🟢 **In Progress**: Currently being worked on (applies to both tasks AND phases)

#### Blocked/Paused Statuses
- 🟠 **Paused**: Partially completed work, temporarily halted
- 🔴 **On Hold**: Will resume later (strategic pause, dependencies, never-started tasks)

#### Final Statuses
- 🔄 **Ready for Sign-off**: Development complete, awaiting user approval/testing
- ✅ **Complete**: Fully finished and approved
- ❌ **Cancelled**: Permanently discontinued, will not be completed

### Status Usage Rules
- **AI Restrictions**: Never change status to Complete without explicit human approval
- **Single Active Rule**: Only ONE task/phase can be "In Progress" in any branch/worktree
- **Paused vs On Hold**: Use "Paused" for started work, "On Hold" for strategic delays
- **Ready for Sign-off**: Required intermediate status before completion
- **Consistency**: Same task must have same status across all documentation levels
- **Validation**: All status values must match this approved list exactly

## 📋 DOCUMENTATION STRUCTURE STANDARDS

### Task File Template
```markdown
# Task X.Y: [Title]

> **Status:** [🟡 Pending | 🟡 Next Priority | 🟢 In Progress | 🟠 Paused | 🔴 On Hold | 🔄 Ready for Sign-off | ✅ Complete | ❌ Cancelled]  
> **Priority:** [High | Medium | Low]  
> **Duration:** [X hours]

## 📋 Objective
[Single paragraph - max 3 sentences]

## ✅ Success Criteria  
- [ ] Criterion 1
- [ ] Criterion 2

## 🔧 Implementation
[Keep under 100 lines total]

## 📊 Progress
**Current:** X%  
**Blockers:** None | [List blockers]

---
*Last Updated: [Date] | Status: [Status]*
```

### Phase README Template
```markdown
# Phase X: [Title]

> **Status:** [🟡 Pending | 🟡 Next Priority | 🟢 In Progress | 🟠 Paused | 🔴 On Hold | 🔄 Ready for Sign-off | ✅ Complete | ❌ Cancelled] | **Progress:** X% | **Duration:** X weeks

## 🎯 Overview
[2-3 sentences maximum]

## 📋 Tasks
[Auto-generated from task files - DO NOT EDIT MANUALLY]

## 📈 Progress Summary
[Auto-generated metrics]

---
*Auto-synced from task files*
```

## 🔍 VALIDATION REQUIREMENTS

### Before Creating/Updating Documentation
- [ ] **Size Check**: Document under line limits
- [ ] **Hierarchy Check**: Updating correct authority level
- [ ] **Consistency Check**: No conflicts with source documents
- [ ] **Redundancy Check**: No duplicate information exists

### Automated Validation Rules
1. **Link Integrity**: All internal links must be valid
2. **Link Placement**: Enforce strict hierarchy rules (no task links in PROGRESS.md)
3. **Status Validation**: All status values must match approved list: Pending, Next Priority, In Progress, Paused, On Hold, Ready for Sign-off, Complete, Cancelled
4. **Status Consistency**: Same task must have identical status across all documentation levels
5. **Single Active Rule**: Only ONE task/phase can be "In Progress" per branch/worktree
6. **Progress Math**: Phase progress must equal average of task progress
7. **Template Compliance**: All documents must follow templates
8. **Hierarchy Compliance**: Single source of truth rules enforced

## 🤖 AI GUIDANCE RULES

### Documentation Creation Process
1. **Read** existing documentation to understand context
2. **Validate** against standards before writing
3. **Create** draft following templates
4. **Run** validation scripts to check compliance
5. **Request** human review and approval
6. **Wait** for explicit confirmation before finalizing

### Status Update Process
```
Current Status: [X] → Proposed Status: [Y]
Reason: [Human-provided justification]
Evidence: [Completed work/verification]

⚠️ WAITING FOR HUMAN APPROVAL ⚠️
```

### Content Guidelines
- **Concise**: Every sentence must add value
- **Scannable**: Use bullet points and headers
- **Actionable**: Focus on what needs to be done
- **Measurable**: Include specific success criteria

## 🛠️ INTEGRATION WITH EXISTING SYSTEMS

### Script Compatibility
- `sync-progress.cjs` must continue working with new structure
- `workflow-dashboard.tsx` must display validation status
- All existing automation must remain functional

### Quality Pipeline Integration
```bash
# Add to existing check:all workflow
npm run validate:docs     # New validation command
npm run lint             # Existing
npm run type-check       # Existing
npm run validate:theme   # Existing
```

## 📊 METRICS & MONITORING

### Documentation Health Metrics
- **Consistency Score**: % of documents in sync
- **Size Compliance**: % of documents under limits
- **Link Integrity**: % of valid internal links
- **Update Frequency**: Days since last meaningful update

### Success Indicators
- ✅ Zero redundant information across documents
- ✅ 100% status consistency between hierarchy levels
- ✅ All documents under size limits
- ✅ <5 minutes to find any project information

## 🚦 ENFORCEMENT

### Validation Gates
- **Pre-commit**: Run documentation validation
- **PR Reviews**: Check for documentation standards compliance
- **Quality Checks**: Include documentation health in `check:all`

### Violation Handling
1. **Size Violations**: Auto-suggest document splitting
2. **Consistency Violations**: Block until resolved
3. **Status Violations**: Require human approval override
4. **Template Violations**: Provide correction suggestions

---

## 🔄 MAINTENANCE

This standards document should be reviewed and updated monthly to ensure it continues to serve the project's documentation needs effectively.

**Next Review:** September 24, 2025
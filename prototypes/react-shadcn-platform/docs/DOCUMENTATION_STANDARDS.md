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

## 📋 DOCUMENTATION STRUCTURE STANDARDS

### Task File Template
```markdown
# Task X.Y: [Title]

> **Status:** [🟡 Pending | 🟢 In Progress | ✅ Complete]  
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

> **Status:** [Status] | **Progress:** X% | **Duration:** X weeks

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
2. **Status Consistency**: Task status must match between files
3. **Progress Math**: Phase progress must equal average of task progress
4. **Template Compliance**: All documents must follow templates

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
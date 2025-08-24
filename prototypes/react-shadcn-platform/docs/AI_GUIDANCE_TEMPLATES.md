# AI Guidance Templates

> **Purpose:** Standardized templates for AI-assisted documentation creation  
> **Audience:** Claude AI and other AI assistants  
> **Last Updated:** August 24, 2025

## 📋 TASK FILE TEMPLATE

```markdown
# Task X.Y: [Descriptive Title]

> **Status:** [🟡 Pending | 🟢 In Progress | ✅ Complete]  
> **Priority:** [High | Medium | Low]  
> **Duration:** [X hours]  
> **Dependencies:** [None | List dependencies]

## 📋 Objective
[Single clear paragraph - maximum 3 sentences describing what needs to be accomplished]

## ✅ Success Criteria
- [ ] [Specific, measurable criterion 1]
- [ ] [Specific, measurable criterion 2]
- [ ] [Specific, measurable criterion 3]

## 🔧 Implementation Details
[Brief technical approach - keep under 50 lines]

### Key Steps
1. [Step 1 description]
2. [Step 2 description]  
3. [Step 3 description]

## 📊 Progress Tracking
**Current Progress:** X%  
**Completed Items:**
- [Completed item 1]
- [Completed item 2]

**Remaining Items:**
- [Remaining item 1]
- [Remaining item 2]

**Blockers:** [None | List any blockers]

## 🔗 Related Files
- [Related file 1]
- [Related file 2]

---
**Created:** [Date]  
**Last Updated:** [Date]  
**Next Review:** [Date]
```

## 📋 PHASE README TEMPLATE

```markdown
# Phase X: [Phase Title]

> **Status:** [🟡 Active | 🔴 On Hold | ✅ Complete]  
> **Progress:** X%  
> **Duration:** X weeks  
> **Timeline:** [Start Date] - [End Date]

## 🎯 Overview
[2-3 sentence summary of phase objectives and expected outcomes]

## 📋 Tasks Summary
[AUTO-GENERATED - DO NOT EDIT MANUALLY]

| Task | Status | Progress | Priority |
|------|--------|----------|----------|
| [Task X.1] | [Status] | X% | [Priority] |
| [Task X.2] | [Status] | X% | [Priority] |

## 📈 Progress Metrics
**Overall Progress:** X%  
**Tasks Completed:** X/Y  
**On Schedule:** [Yes/No]  
**Estimated Completion:** [Date]

## 🔧 Key Deliverables
[AUTO-GENERATED from task success criteria]

## 🚫 Blocked Items
[AUTO-GENERATED from task blockers]

---
*This file is auto-synced from individual task files. Manual edits will be overwritten.*
```

## 📋 DOCUMENTATION UPDATE TEMPLATE

```markdown
## Documentation Update Request

**File:** [file path]  
**Update Type:** [Creation | Modification | Deletion]  
**Requestor:** [AI Assistant Name]  
**Date:** [Current Date]

### Proposed Changes
[Description of what needs to be changed and why]

### Affected Sections
- [Section 1]: [Change description]
- [Section 2]: [Change description]

### Size Impact
- **Current Size:** X lines
- **Proposed Size:** X lines
- **Within Limits:** [Yes/No]

### Validation Checklist
- [ ] Content follows documentation standards
- [ ] No redundancy with existing documentation
- [ ] All links are valid
- [ ] Size within limits
- [ ] Template compliance verified

### Human Review Required
```
⚠️ HUMAN APPROVAL REQUIRED ⚠️

Please review the proposed changes above and confirm:
1. Content accuracy and completeness
2. Alignment with project standards  
3. No conflicts with existing documentation
4. Approval to proceed with changes

Status: WAITING FOR APPROVAL
```
```

## 📋 STATUS UPDATE REQUEST TEMPLATE

```markdown
## Task Status Update Request

**Task:** [Task X.Y: Title]  
**Current Status:** [Current]  
**Proposed Status:** [Proposed]  
**Requestor:** Claude AI  
**Date:** [Current Date]

### Justification
[Detailed explanation of why status should change]

### Evidence of Completion
- [Completed item 1 with verification]
- [Completed item 2 with verification]
- [All success criteria met: Yes/No]

### Quality Checks
- [ ] All success criteria verified
- [ ] No blockers remaining
- [ ] Quality gates passed
- [ ] Manual testing completed (if applicable)

### Human Verification Required
```
⚠️ WAITING FOR HUMAN APPROVAL ⚠️

Current Status: [Current] → Proposed Status: [Proposed]

Please verify:
1. All listed evidence is accurate
2. Quality standards have been met
3. Task completion is satisfactory
4. Ready to update status

Action Required: Please confirm status update approval
```
```

## 🛠️ AI USAGE INSTRUCTIONS

### Before Creating Documentation
1. **Check existing files** to avoid duplication
2. **Validate against standards** in DOCUMENTATION_STANDARDS.md
3. **Verify size limits** will not be exceeded
4. **Follow templates** exactly as provided

### During Documentation Creation
1. **Use templates** as base structure
2. **Keep content concise** and focused
3. **Include all required sections**
4. **Add placeholders** for human input where needed

### After Creating Documentation
1. **Run validation checks** against standards
2. **Request human review** using templates
3. **Wait for explicit approval** before finalizing
4. **Update tracking** only after approval

### Status Update Protocol
```
NEVER update status without:
1. ✅ Using Status Update Request Template
2. ✅ Providing evidence and justification  
3. ✅ Waiting for explicit human approval
4. ✅ Receiving confirmation to proceed
```

## 📊 VALIDATION CHECKLIST FOR AI

### Before Submitting Any Documentation
- [ ] Document follows appropriate template
- [ ] Content is within size limits
- [ ] No redundancy with existing docs  
- [ ] All internal links are valid
- [ ] Template sections are complete
- [ ] Human review has been requested
- [ ] Approval status is clearly marked

### For Status Updates
- [ ] Current status is accurately stated
- [ ] Proposed status is justified
- [ ] Evidence is specific and verifiable
- [ ] Quality checks are documented
- [ ] Human approval is explicitly requested
- [ ] Update process follows protocol

---

**Note:** These templates must be used consistently by all AI assistants to maintain documentation quality and ensure proper human oversight.
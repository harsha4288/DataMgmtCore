# Commit Message Template

## Format: [PHASE]: Task [TASK_ID] - [BRIEF_DESCRIPTION]

### Example:
```
Phase 1: Task 1.4.1 - Port Entity System from Prototype 1
```

## Full Template:

```
[PHASE]: Task [TASK_ID] - [BRIEF_DESCRIPTION]

## Changes
- [Primary change 1]
- [Primary change 2]
- [Primary change 3]

## Technical Details
- [Technical implementation detail if relevant]
- [Architecture decision if applicable]

## Quality Checks
✅ ESLint: Passed (0 errors, 0 warnings)
✅ TypeScript: Passed (0 errors)
✅ Theme Validation: Passed
✅ Build: Successful
✅ Manual Testing: Approved by user

## Testing
- [What was tested]
- [Test scenarios covered]
- [Any edge cases verified]

## Notes
- [Any additional context or future considerations]

Task Status: [Completed/In Progress]
Component Reusability: [XX]%
Performance Impact: [None/Positive/Neutral]
```

## Quick Templates

### Feature Implementation
```
Phase [X]: Task [Y.Z] - Implement [Feature Name]

- Added [component/feature]
- Integrated with [existing system]
- Updated [affected files]

Quality: ✅ All checks passed | Manual testing approved
```

### Bug Fix
```
Phase [X]: Task [Y.Z] - Fix [Issue Description]

- Fixed [specific issue]
- Root cause: [explanation]
- Affected components: [list]

Quality: ✅ All checks passed | Regression tested
```

### Refactoring
```
Phase [X]: Task [Y.Z] - Refactor [Component/System]

- Refactored [what was changed]
- Improved [performance/readability/maintainability]
- No functional changes

Quality: ✅ All checks passed | Behavior unchanged
```

### Configuration Update
```
Phase [X]: Task [Y.Z] - Update [Configuration Type]

- Updated [config file/settings]
- Purpose: [why the change was needed]
- Impact: [what this affects]

Quality: ✅ All checks passed | Environment tested
```
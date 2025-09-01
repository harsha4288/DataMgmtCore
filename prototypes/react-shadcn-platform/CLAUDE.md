# Claude AI Assistant Instructions & Workflow Automation

> **Project:** react-shadcn-platform  
> **Purpose:** Streamlined development workflow with automated context management  
> **Critical:** This file provides persistent context and workflow automation rules  
> **Last Updated:** December 19, 2024

## 🚀 CURRENT PROJECT STATUS

### Active Phase: Managed by Active Context System
**Current Active Task:** Check `.claude/active-context.json` for current task

## 🎯 ACTIVE TASK MANAGEMENT

### ❗ PRIMARY TASK IDENTIFICATION RULES

**WHEN ASKED "WHAT'S THE CURRENT TASK" OR SIMILAR:**
1. **ALWAYS** check `.claude/active-context.json` or run `node scripts/sync-claude-context.cjs export`
2. **USE** the active context as the primary source of truth (all tasks migrated to database)

### 🔗 ACTIVE CONTEXT REFERENCES

- `@active` - References the current active task from `.claude/active-context.json`
- `@entity:TASK-123` - References specific entity by ID
- Always check active context before starting work

### 📋 ACTIVE CONTEXT WORKFLOW

```bash
# Check current active task
node scripts/sync-claude-context.cjs export

# List available entities
node scripts/sync-claude-context.cjs list

# Set active task (typically done from dashboard)
node scripts/sync-claude-context.cjs set TASK-123

# Clear active task
node scripts/sync-claude-context.cjs clear
```

**Auto-Generated Documentation:**
- `docs/active/current-task.md` - Active task details
- `docs/active/related-entities.md` - Related entities
- `docs/active/context-history.md` - Activity history

## 📋 DEVELOPMENT LIFECYCLE WORKFLOW

### 1. Task Initiation
**AUTOMATIC ACTIONS WHEN STARTING A TASK:**
- **FIRST** Check `.claude/active-context.json` or run `node scripts/sync-claude-context.cjs export` for active task
- Create task documentation folder if needed
- Run `npm run workflow:check` to verify environment
- Create todo list for task breakdown
- Update task status in active context system

### 2. Implementation Phase
**DURING DEVELOPMENT:**
- Follow existing code patterns and conventions
- Use theme variables (never hardcode colors)
- Maintain component reusability (>85% target)
- Update progress incrementally in todo list
- Run quality checks after each significant change

### 3. Quality Assurance Gates
**BEFORE MARKING TASK COMPLETE:**
```bash
# Mandatory checks - run automatically
npm run lint              # Must pass with 0 errors
npm run type-check        # Must pass with 0 errors
npm run validate:theme    # Must pass theme validation
npm run check:all         # Comprehensive quality check
```

### 4. Manual Testing & Approval
**REQUIRED BEFORE GIT COMMIT:**
- [ ] Await user's manual testing confirmation
- [ ] Get explicit approval: "approved", "sign off", or "commit"
- [ ] Ensure all quality gates have passed
- [ ] Verify no regression in existing functionality

### 5. Git Commit Process
**ONLY AFTER MANUAL APPROVAL:**
```bash
# Use the automated commit workflow
npm run workflow:commit

# Or manual with template:
git add .
git commit -m "Phase X: Task Y.Z - [Description]

- [Change 1]
- [Change 2]
- [Change 3]

Quality Checks: ✅ Lint | ✅ TypeCheck | ✅ Theme | ✅ Manual Testing"
```

## 🎯 WORKFLOW AUTOMATION RULES

### Context Awareness
**I WILL AUTOMATICALLY:**
1. Check current active task from `.claude/active-context.json` (primary source of truth)
2. Reference relevant documentation and guidelines
3. Track progress using TodoWrite tool
4. Run quality checks before suggesting completion
5. Wait for manual testing approval before commits

### Task Progression
**AUTOMATIC TASK FLOW:**
```
Start Task → Check Active Context → Implement → Quality Checks → 
Manual Testing → User Approval → Git Commit → Update Task Status → Next Task
```

### Quality Standards
**NON-NEGOTIABLE REQUIREMENTS:**
- ✅ Zero ESLint errors/warnings
- ✅ Zero TypeScript errors
- ✅ Theme validation passes
- ✅ Component reusability >85%
- ✅ Manual testing approved by user
- ✅ No hardcoded colors or styles

## 🔧 PROJECT-SPECIFIC GUIDELINES

## 🎯 DATA IMPLEMENTATION BEHAVIORAL RULES

### ❌ **DEFAULT BEHAVIORS TO AVOID**
- Creating sample/mock/dummy data when data source is unclear
- Using useState with hardcoded arrays to "make it work"
- Assuming demo data is needed for functionality
- Taking shortcuts with fake data to show quick results

### ✅ **CORRECT DEFAULT BEHAVIORS**
- ASK about data sources before implementing
- Implement proper empty states and loading indicators
- Connect to real APIs/databases or leave placeholders for integration
- Focus on architecture first, then data population

### 🔧 **DECISION FRAMEWORK**
When implementing new functionality, always ask:
1. "Where will this data come from in production?"
2. "Should I implement the real data flow or ask the user first?"
3. "Is this mock data serving a legitimate demo purpose or just convenience?"

### 💡 **ARCHITECTURE-FIRST MINDSET**
- Build components that accept real data props
- Implement proper loading/error states
- Design for integration with actual backends
- Only use mock data when explicitly requested for demos

### 🚨 **EXCEPTION: Alumni Module Only**
- Alumni features (`src/lib/mock-data/alumni.ts` etc.) use demo data intentionally
- This will be removed in Phase 6 production implementation
- Do NOT replicate this pattern for any other features

## 🚨 CRITICAL THEME RULES

### ❌ **NEVER DO (Zero Tolerance)**
```typescript
// NEVER hardcode colors in style props
backgroundColor: 'hsl(210 25% 11%)'  // ❌ WRONG - breaks theme switching
backgroundColor: '#1f2937'           // ❌ WRONG - hardcoded hex
color: 'rgb(31, 41, 55)'            // ❌ WRONG - hardcoded rgb

// NEVER override theme variables in CSS
:root {
  --muted: 210 40% 96%;      // ❌ WRONG - breaks theme system
  --background: 0 0% 100%;   // ❌ WRONG - prevents dark mode
}
```

### ✅ **ALWAYS DO (Required)**
```typescript
// ✅ USE theme variables in style props
backgroundColor: 'hsl(var(--muted))'      // Muted backgrounds
backgroundColor: 'hsl(var(--background))' // Main backgrounds
color: 'hsl(var(--foreground))'          // Text colors
```

## ✅ **LEGITIMATE EXCEPTIONS (Allowed)**

### 1. **Shadows and Effects**
```typescript
// ✅ ALLOWED - rgba for shadows
boxShadow: '2px 0 4px rgba(0,0,0,0.2)'
boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
```

### 2. **Layout Constants (Non-Color)**
```css
/* ✅ ALLOWED - layout constants in CSS */
:root {
  --radius: 0.5rem;             /* Border radius */
  --table-row-height: 48px;     /* Component sizing */
  --table-selection-width: 48px; /* Component sizing */
}
```

### 3. **Tailwind Classes**
```typescript
// ✅ ALLOWED - Tailwind utility classes
<Badge className="bg-green-500">Success</Badge>
<div className="text-red-500">Error</div>
```

### 4. **Theme Configuration Files**
```typescript
// ✅ ALLOWED - in theme config files only
// src/lib/theme/configs/dark.ts
export const darkTheme = {
  table: {
    container: 'hsl(222.2 84% 4.9%)',  // OK in theme config
    header: 'hsl(217.2 32.6% 17.5%)',  // OK in theme config
  }
}
```

## 🎯 **COMPONENT-SPECIFIC RULES**

### Table Components
```typescript
// ✅ CORRECT for table styling
style={{
  backgroundColor: 'hsl(var(--muted))',     // Headers
  backgroundColor: 'hsl(var(--background))', // Cells
  boxShadow: '2px 0 4px rgba(0,0,0,0.2)',  // Shadows OK
}}
```

### Badge Components
```typescript
// ✅ PREFERRED - use semantic variants
<Badge variant="destructive">Error</Badge>
<Badge variant="secondary">Info</Badge>

// ✅ ALLOWED - Tailwind classes
<Badge className="bg-green-500">Success</Badge>

// ❌ WRONG - hardcoded style props
<Badge style={{ backgroundColor: 'hsl(210 25% 11%)' }}>Wrong</Badge>
```

## 📋 **PRE-EDIT CHECKLIST**

Before making ANY style changes, ask:

1. ✅ Am I using `hsl(var(--variable))` format?
2. ✅ Is this a legitimate exception (shadow, constant, Tailwind)?
3. ✅ Will this work in both light AND dark themes?
4. ✅ Am I following the GUIDELINES_THEME_COMPONENT_ENHANCEMENT.md?

## 🔧 **VALIDATION TOOLS**

Run validation before committing:
```bash
# Check for violations
node validate-theme-usage.js

# Verbose output
node validate-theme-usage.js --verbose

# Auto-fix where possible
node validate-theme-usage.js --fix
```

## 📚 **KEY REFERENCE FILES**

1. **GUIDELINES_THEME_COMPONENT_ENHANCEMENT.md** - Complete rules
2. **TANSTACK_TABLE_ISSUES_ANALYSIS.md** - Known issues and fixes
3. **validate-theme-usage.js** - Automated checking

## 🚨 **COMMON MISTAKES TO AVOID**

1. **Converting colors from screenshots** - Use theme variables instead
2. **"Fixing" styling with hardcoded values** - Find the right theme variable
3. **Conditional hardcoding** - `isPinned ? 'hsl(210...)' : 'hsl(220...)'` is wrong
4. **Overriding in CSS** - Theme variables are managed by theme system

## 💡 **WHY THESE RULES EXIST**

- **Theme switching** must work seamlessly (< 200ms)
- **Dark/light modes** must both work perfectly
- **Maintenance** is easier with centralized theme management
- **Consistency** across all components and themes

## 🎯 **SUCCESS CRITERIA**

- All colors use `var(--variable)` format in components
- No hardcoded HSL/RGB/HEX values in style props
- Theme switching works instantly
- Both light and dark themes look correct

---

## 🚨 CRITICAL DOCUMENTATION RULES

### ❌ **AI RESTRICTIONS** 
- **NEVER** update task/phase status without explicit human approval
- **NEVER** mark tasks completed without user verification
- **ALWAYS** request approval before any documentation status changes

### ✅ **DOCUMENTATION WORKFLOW INTEGRATION**
1. **Follow** standards in `docs/DOCUMENTATION_STANDARDS.md` 
2. **Validate** using `npm run validate:docs` before completion
3. **Request** human approval for all status changes
4. **Run** `npm run health:docs` to check documentation health

### 🤖 **STATUS UPDATE REQUIREMENT**
All status changes must use this format:
```
Current Status: [X] → Proposed Status: [Y] 
⚠️ HUMAN APPROVAL REQUIRED ⚠️
```

📚 **Complete Standards:** See `docs/DOCUMENTATION_STANDARDS.md` for all rules, templates, and detailed guidance

---

**Remember: The user has excellent guidelines. My job is to follow them precisely, understanding both the rules AND the legitimate exceptions.**
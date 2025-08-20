# /theme Command - Theme Compliance Checker
## Usage: /theme [check|fix|convert] [file-pattern]

$ARGUMENTS

Comprehensive theme validation and fixing:

## Subcommands

### /theme check
Validate theme compliance across codebase:
```bash
# Run theme validator
node validate-theme-usage.js --verbose

# Check specific files
node validate-theme-usage.js "src/**/*.tsx"
```

**Checks for:**
- Hardcoded HSL/RGB/HEX colors
- Incorrect variable usage
- Missing theme variables
- Inconsistent styling
- Dark mode compatibility

### /theme fix
Auto-fix theme violations:
```bash
# Fix all violations
node validate-theme-usage.js --fix

# Interactive fixing
node validate-theme-usage.js --fix --interactive
```

**Fixes:**
- Convert hardcoded colors to variables
- Replace style props with theme vars
- Add missing CSS variables
- Update deprecated patterns

### /theme convert
Convert colors to theme variables:
```javascript
// Before:
backgroundColor: 'hsl(210 25% 11%)'
color: '#1f2937'

// After:
backgroundColor: 'hsl(var(--background))'
color: 'hsl(var(--foreground))'
```

## Validation Rules

### ✅ ALLOWED
```typescript
// Theme variables
backgroundColor: 'hsl(var(--muted))'
color: 'hsl(var(--foreground))'

// Shadows (rgba)
boxShadow: '0 2px 4px rgba(0,0,0,0.1)'

// Tailwind classes
className="bg-green-500"

// Layout constants
--radius: 0.5rem
```

### ❌ FORBIDDEN
```typescript
// Hardcoded colors
backgroundColor: 'hsl(210 25% 11%)'
backgroundColor: '#1f2937'
color: 'rgb(31, 41, 55)'

// Override theme vars
:root {
  --muted: 210 40% 96%;
}
```

## Report Format
```yaml
Theme Validation Report:
  Files Scanned: 47
  
  Violations Found: 3
  - src/components/Table.tsx:45
    Issue: Hardcoded HSL color
    Line: backgroundColor: 'hsl(210 25% 11%)'
    Fix: backgroundColor: 'hsl(var(--background))'
  
  Warnings: 2
  - Consider using semantic variants
  - Missing dark mode support
  
  Auto-Fixed: 3
  Require Manual Fix: 0
```

## Options
- `--fix`: Auto-fix violations
- `--interactive`: Confirm each fix
- `--strict`: Fail on warnings
- `--report`: Generate HTML report
- `--ci`: CI mode with exit codes

## Hook Integration
- **pre_tool_use**: Validate before edits
- **post_tool_use**: Check after changes
- **subagent_stop**: Theme validation agent
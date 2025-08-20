# /quality Command - Comprehensive Quality Validation
## Usage: /quality [--fix] [--report]

$ARGUMENTS

Execute full quality assurance suite with automated fixes:

## Quality Gates

### 1. Code Quality
```bash
# ESLint Check
npm run lint
# [HOOK: post_tool_use] Track lint results

# TypeScript Check
npm run type-check
# [HOOK: post_tool_use] Track type errors
```

### 2. Theme Compliance
```bash
# Custom theme validator
npm run validate:theme
# [HOOK: post_tool_use] Log violations

# Auto-fix theme issues (if --fix)
node validate-theme-usage.js --fix
```

### 3. Test Coverage
```bash
# Run all tests with coverage
npm test -- --coverage
# [HOOK: post_tool_use] Check coverage thresholds
```

### 4. Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run analyze
# Check for large dependencies
```

### 5. Security Audit
```bash
# Check for vulnerabilities
npm audit
# Review dependency licenses
```

### 6. Performance Checks
- Component render performance
- Bundle size limits
- Code splitting validation
- Lazy loading verification

## Output Format
```yaml
Quality Report:
  Lint:
    Status: PASS/FAIL
    Errors: 0
    Warnings: 0
  
  TypeScript:
    Status: PASS/FAIL
    Errors: 0
  
  Theme:
    Status: PASS/FAIL
    Violations: 0
    Auto-fixed: 0
  
  Tests:
    Status: PASS/FAIL
    Coverage: 85%
    Failed: 0
  
  Security:
    Vulnerabilities: 0
    Critical: 0
```

## Options
- `--fix`: Auto-fix issues where possible
- `--report`: Generate detailed HTML report
- `--strict`: Fail on any warning
- `--ci`: CI/CD mode with JSON output

## Hook Integration
- **pre_tool_use**: Validate environment
- **post_tool_use**: Track each check result
- **stop**: Generate final quality report
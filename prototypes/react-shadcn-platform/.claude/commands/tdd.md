# /tdd Command - Test-Driven Development Workflow
## Usage: /tdd [component-name] [options]

$ARGUMENTS

Execute strict TDD workflow with hook enforcement:

## Workflow Steps

### 1. Test Creation Phase
```bash
# [HOOK: pre_tool_use] Validate component doesn't exist
# Generate test file: __tests__/$1.test.tsx
```

**Test Template:**
- Component rendering tests
- Props validation tests
- Event handler tests
- Edge case coverage
- Accessibility tests

### 2. Test Verification (Red Phase)
```bash
npm test $1.test.tsx
# [HOOK: post_tool_use] Verify tests fail correctly
```

### 3. Mock Implementation
```bash
# Create minimal component to pass tests
# [HOOK: pre_tool_use] Enforce minimal implementation
```

### 4. Test Pass Verification (Green Phase)
```bash
npm test $1.test.tsx
# [HOOK: post_tool_use] Confirm all tests pass
```

### 5. Refactoring Phase
- Improve code quality
- Add proper types
- Enhance performance
- Apply theme variables

### 6. Final Validation
```bash
npm run lint
npm run type-check
npm run validate:theme
# [HOOK: stop] Update progress with TDD completion
```

## Options
- `--coverage`: Generate coverage report
- `--integration`: Include integration tests
- `--e2e`: Add E2E test scaffolding
- `--strict`: Enforce 100% coverage

## Hook Enforcement
- **pre_tool_use**: Blocks implementation before test
- **post_tool_use**: Validates test-first approach
- **subagent_stop**: Aggregates test results
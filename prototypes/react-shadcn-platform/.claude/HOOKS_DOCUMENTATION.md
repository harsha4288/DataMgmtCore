# Claude Code Hooks Documentation
> **Version:** 1.0.0  
> **Created:** December 20, 2024  
> **Status:** Implemented and Ready for Use

## 📚 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Hook Architecture](#hook-architecture)
4. [Available Hooks](#available-hooks)
5. [Custom Commands](#custom-commands)
6. [Usage Examples](#usage-examples)
7. [Testing & Validation](#testing--validation)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Claude Code Hooks provide deterministic control, safety, and automation for AI-assisted development. This implementation follows patterns from the claude-code-hooks-mastery repository, using Python scripts that integrate seamlessly with Claude Code CLI.

### Key Features
- 🛡️ **Safety Controls**: Block dangerous commands and protect critical files
- 🚀 **Context Injection**: Automatically enhance prompts with project context
- 📊 **Progress Tracking**: Auto-update progress based on tool usage
- 🤖 **Agent Coordination**: Manage specialized sub-agents
- ✅ **Quality Gates**: Enforce code standards and theme compliance
- 📝 **Session Management**: Initialize and cleanup development sessions

---

## Quick Start

### 1. Install Dependencies
```bash
# Install Python dependencies for hooks
pip install -r .claude/hooks/requirements.txt

# Or use npm script
npm run hook:install
```

### 2. Validate Hooks
```bash
# Validate all hooks are working
python .claude/hooks/validate_all.py

# Or use npm script
npm run hook:validate
```

### 3. Test Individual Hooks
```bash
# Test safety hook
npm run hook:safety

# Test context injection
npm run hook:context
```

---

## Hook Architecture

### Hook Lifecycle
```
Session Start → User Prompt → Pre-Tool → Tool Execution → Post-Tool → Session End
     ↓              ↓            ↓            ↓              ↓            ↓
session_start  user_prompt   pre_tool    [Claude Code]  post_tool      stop
                _submit       _use                       _use
```

### Exit Code Convention
- `0` = Continue execution
- `1` = Block operation
- Other = Hook error (logged but doesn't block)

### Data Flow
```json
// Input (from Claude Code)
{
  "tool": "Edit",
  "args": {
    "file_path": "src/component.tsx",
    "content": "..."
  }
}

// Output (from hook)
{
  "status": "success",
  "warnings": ["..."],
  "metadata": {...}
}
```

---

## Available Hooks

### 1. pre_tool_use.py
**Purpose:** Validate and block dangerous operations

**Features:**
- Blocks dangerous commands (rm -rf, fork bombs, etc.)
- Protects sensitive files (.env, package-lock.json)
- Validates theme compliance
- Checks import statements

**Example Block:**
```python
BLOCKED_PATTERNS = [
    r"rm\s+-rf\s+/",           # Dangerous rm
    r"git\s+push.*--force",    # Force push
    r"npm\s+publish",           # Accidental publish
]
```

### 2. user_prompt_submit.py
**Purpose:** Enhance prompts with project context

**Features:**
- Loads CLAUDE.md instructions
- Extracts current task from PROGRESS.md
- Adds recent git changes
- Injects relevant reminders

**Context Injection:**
```
[PROJECT STATUS]
Phase: Phase 1 - Foundation Setup (95%)

[CURRENT TASK]
Task 1.4: Entity System Integration

[USER REQUEST]
<original prompt>
```

### 3. post_tool_use.py
**Purpose:** Track progress and run quality checks

**Features:**
- Analyzes file modifications
- Updates PROGRESS.md automatically
- Runs theme validation
- Logs activity for dashboard

**Progress Tracking:**
- Edit operations → Update file count
- Commands run → Track quality checks
- Tests passed → Mark task progress

### 4. session_start.py
**Purpose:** Initialize workspace and load context

**Features:**
- Checks development environment
- Creates required directories
- Loads previous session state
- Generates session plan

**Session Initialization:**
```yaml
Session ID: 20241220_143022
Environment: React/TypeScript
Current Phase: Phase 1
Pending Tasks: 3
```

### 5. stop.py
**Purpose:** Cleanup and save session state

**Features:**
- Generates session summary
- Updates PROGRESS.md
- Creates commit message suggestion
- Syncs dashboard state

**Session Summary:**
```yaml
Files Edited: 12
Commands Run: 8
Quality Checks: All Passing
Suggested Commit: "Add Claude Code hooks infrastructure"
```

### 6. subagent_stop.py
**Purpose:** Coordinate specialized agents

**Features:**
- Parses agent results
- Aggregates outcomes
- Updates progress
- Suggests follow-up actions

**Agent Types:**
- `test-writer`: TDD test generation
- `theme-validator`: Theme compliance
- `ui-builder`: Component creation
- `code-reviewer`: Quality review

---

## Custom Commands

### /sync - Context Restoration
```bash
# Usage
/sync [task-id]

# Restores:
- Git status and branch
- Current phase and task
- Recent changes
- Pending todos
```

### /tdd - Test-Driven Development
```bash
# Usage
/tdd ComponentName

# Workflow:
1. Create test file
2. Run tests (should fail)
3. Create implementation
4. Run tests (should pass)
5. Refactor
```

### /quality - Quality Validation
```bash
# Usage
/quality [--fix] [--report]

# Checks:
- ESLint
- TypeScript
- Theme compliance
- Test coverage
- Security audit
```

### /progress - Progress Tracking
```bash
# Usage
/progress [update|report|next]

# Features:
- Auto-detect completion
- Calculate percentages
- Suggest next task
```

### /theme - Theme Compliance
```bash
# Usage
/theme [check|fix|convert]

# Operations:
- Validate theme usage
- Auto-fix violations
- Convert hardcoded colors
```

---

## Usage Examples

### Example 1: Safe Command Execution
```python
# Command: rm -rf /
# Hook: pre_tool_use.py
# Result: BLOCKED - Dangerous command pattern detected
```

### Example 2: Context-Enhanced Development
```python
# Original: "create a new component"
# Enhanced: 
#   [CURRENT TASK] Task 1.4: Entity System
#   [RECENT CHANGES] Modified: src/components/Table.tsx
#   [USER REQUEST] create a new component
```

### Example 3: Automated Progress
```python
# Action: Edit src/components/NewFeature.tsx
# Hook: post_tool_use.py
# Result: 
#   - Updated PROGRESS.md
#   - Logged to activity.log
#   - Streamed to dashboard
```

---

## Testing & Validation

### Run All Validations
```bash
# Full validation suite
npm run hook:validate

# Output:
✅ pre_tool_use
✅ user_prompt_submit
✅ post_tool_use
✅ session_start
✅ stop
✅ subagent_stop
Summary: 6/6 hooks validated successfully!
```

### Test Individual Hooks
```python
# Test dangerous command blocking
echo '{"tool":"Bash","args":{"command":"rm -rf /"}}' | python .claude/hooks/pre_tool_use.py

# Test context injection
echo '{"user_prompt":"implement feature"}' | python .claude/hooks/user_prompt_submit.py
```

### Create Custom Tests
```python
# .claude/hooks/tests/test_custom.py
def test_my_validation():
    result = run_hook("pre_tool_use", {
        "tool": "Edit",
        "args": {"file_path": "test.tsx"}
    })
    assert result.returncode == 0
```

---

## Troubleshooting

### Common Issues

#### 1. Hook Not Triggering
```bash
# Check hook is executable
chmod +x .claude/hooks/*.py

# Verify Python path
which python3

# Test hook directly
python3 .claude/hooks/pre_tool_use.py --test
```

#### 2. Import Errors
```bash
# Reinstall dependencies
pip install -r .claude/hooks/requirements.txt

# Check Python version (requires 3.7+)
python3 --version
```

#### 3. Permission Denied
```bash
# Fix permissions
chmod 755 .claude/hooks/*.py

# Check file ownership
ls -la .claude/hooks/
```

#### 4. JSON Parse Errors
```python
# Validate JSON input
echo '{"test": "data"}' | python -m json.tool

# Check hook output
python3 .claude/hooks/user_prompt_submit.py < test_input.json
```

### Debug Mode
```python
# Enable debug logging in any hook
import logging
logging.basicConfig(level=logging.DEBUG, 
                   filename='.claude/logs/hooks.log')
```

### Hook Logs
```bash
# View hook activity
tail -f .claude/logs/activity.log

# Check event stream
tail -f .claude/logs/events.jsonl

# Review session reports
cat .claude/logs/session_*.json
```

---

## Best Practices

### 1. Safety First
- Always validate dangerous patterns
- Protect critical files
- Log blocked operations

### 2. Performance
- Keep hooks fast (<50ms)
- Use caching for repeated operations
- Avoid blocking I/O

### 3. Error Handling
- Always exit 0 on errors (log but don't block)
- Provide helpful error messages
- Create fallback behavior

### 4. Testing
- Test each hook individually
- Create integration tests
- Validate with real scenarios

---

## Integration with Dashboard

### WebSocket Events
Hooks stream events to `.claude/logs/events.jsonl` for dashboard consumption:

```json
{
  "event": "tool_completion",
  "tool": "Edit",
  "completion": {
    "type": "edit",
    "file": "src/component.tsx",
    "timestamp": "2024-12-20T14:30:00Z"
  }
}
```

### State Synchronization
Session state is maintained in `.claude/state.json`:

```json
{
  "session_id": "20241220_143022",
  "todos": [...],
  "recent_files": [...],
  "quality_status": {...}
}
```

---

## Future Enhancements

### Planned Features
1. **WebSocket Integration**: Real-time dashboard updates
2. **Parallel Hook Execution**: Improved performance
3. **Hook Marketplace**: Share custom hooks
4. **AI Hook Generation**: Auto-create hooks from requirements
5. **Visual Hook Builder**: GUI for creating hooks

### Contributing
To add new hooks:
1. Create hook file in `.claude/hooks/`
2. Follow the template structure
3. Add tests to `validate_all.py`
4. Update this documentation

---

## Resources

- [Claude Code Hooks Mastery](https://github.com/disler/claude-code-hooks-mastery)
- [Python Hook Examples](.claude/hooks/)
- [Custom Commands](.claude/commands/)
- [Validation Script](.claude/hooks/validate_all.py)

---

*This documentation is part of the Claude Code Enhancement implementation for the react-shadcn-platform project.*
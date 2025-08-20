# /sync Command - Full Context Restoration
## Usage: /sync [task-id]

$ARGUMENTS

Execute comprehensive workflow sync protocol:

1. **Check Git Status**
   - Verify current branch
   - List uncommitted changes
   - Show recent commits

2. **Load Project Context**
   - Read CLAUDE.md for instructions
   - Parse PROGRESS.md for current phase
   - Extract active task details

3. **Identify Recent Changes**
   - Scan modified files
   - Detect new components
   - Review test changes

4. **Restore Task Context**
   - Load task-specific guidelines
   - Retrieve quality gate status
   - Check pending todos

5. **Display Summary**
   ```yaml
   Phase: $CURRENT_PHASE
   Task: $CURRENT_TASK
   Branch: $GIT_BRANCH
   Modified: $FILE_COUNT files
   Todos: $TODO_COUNT pending
   Last Activity: $TIMESTAMP
   ```

6. **Recommendations**
   - Next immediate action
   - Required quality checks
   - Suggested workflow steps

## Hooks Integration
- [HOOK: session_start] Initialize workspace
- [HOOK: user_prompt_submit] Inject context
- [HOOK: post_tool_use] Track progress
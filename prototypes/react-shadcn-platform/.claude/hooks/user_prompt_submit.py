#!/usr/bin/env python3
"""
User prompt submit hook for Claude Code
Enhances prompts with project context and current task information
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import re

def extract_current_task(progress_content: str) -> str:
    """Extract the current task from PROGRESS.md"""
    # Look for tasks marked as in_progress or current
    in_progress_pattern = r'\*\*Status:\*\*\s*In Progress.*?(?:\n.*?){0,3}'
    current_task_pattern = r'###\s+Current Task:.*?(?:\n.*?){0,3}'
    
    # Try to find in-progress task
    match = re.search(in_progress_pattern, progress_content, re.IGNORECASE)
    if match:
        return match.group(0).strip()
    
    # Try to find current task section
    match = re.search(current_task_pattern, progress_content, re.IGNORECASE)
    if match:
        return match.group(0).strip()
    
    # Fallback to active phase
    phase_pattern = r'###\s+Active Phase:.*?(?:\n.*?){0,3}'
    match = re.search(phase_pattern, progress_content, re.IGNORECASE)
    if match:
        return match.group(0).strip()
    
    return "No current task found"

def extract_recent_changes(git_status: str) -> str:
    """Extract recent changes from git status"""
    modified_files = re.findall(r'modified:\s+(.+)', git_status)
    new_files = re.findall(r'new file:\s+(.+)', git_status)
    
    changes = []
    if modified_files:
        changes.append(f"Modified files: {', '.join(modified_files[:5])}")
    if new_files:
        changes.append(f"New files: {', '.join(new_files[:5])}")
    
    return "\n".join(changes) if changes else "No recent changes"

def load_project_context() -> Dict[str, str]:
    """Load context from project files"""
    context = {}
    
    # Load CLAUDE.md (project instructions)
    claude_path = Path("CLAUDE.md")
    if claude_path.exists():
        try:
            claude_content = claude_path.read_text(encoding='utf-8')
            # Extract key sections
            context['instructions'] = claude_content[:1500]  # First 1500 chars
            
            # Extract current status section
            status_match = re.search(
                r'## 🚀 CURRENT PROJECT STATUS.*?(?=##|\Z)',
                claude_content,
                re.DOTALL
            )
            if status_match:
                context['current_status'] = status_match.group(0).strip()
        except Exception as e:
            context['instructions'] = f"Error loading CLAUDE.md: {str(e)}"
    
    # Load PROGRESS.md (current progress)
    progress_path = Path("PROGRESS.md")
    if progress_path.exists():
        try:
            progress_content = progress_path.read_text(encoding='utf-8')
            context['current_task'] = extract_current_task(progress_content)
        except Exception as e:
            context['current_task'] = f"Error loading PROGRESS.md: {str(e)}"
    
    # Load recent git status
    try:
        import subprocess
        result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            timeout=2
        )
        if result.returncode == 0:
            context['recent_changes'] = extract_recent_changes(result.stdout)
    except:
        context['recent_changes'] = "Git status unavailable"
    
    # Load workflow configuration
    workflow_config_path = Path(".claude/workflow.json")
    if workflow_config_path.exists():
        try:
            import json as json_module
            with open(workflow_config_path, 'r') as f:
                workflow_config = json_module.load(f)
                context['workflow_config'] = json_module.dumps(
                    workflow_config.get('active_workflows', {}),
                    indent=2
                )
        except:
            pass
    
    return context

def should_inject_context(prompt: str) -> bool:
    """Determine if context should be injected"""
    # Skip context for simple queries
    skip_patterns = [
        r'^(what|how|why|when|where|who)\s+is\s+\d+',  # Math questions
        r'^(ls|pwd|cd|git status|npm|yarn)',            # Simple commands
        r'^\s*\d+\s*[\+\-\*/]\s*\d+',                  # Arithmetic
        r'^(yes|no|okay|ok|thanks|thank you)',          # Simple responses
    ]
    
    for pattern in skip_patterns:
        if re.match(pattern, prompt.lower().strip()):
            return False
    
    # Always inject for development tasks
    dev_keywords = [
        'implement', 'create', 'build', 'fix', 'update', 'refactor',
        'test', 'deploy', 'component', 'function', 'feature', 'bug',
        'task', 'phase', 'workflow', 'claude', 'hook'
    ]
    
    prompt_lower = prompt.lower()
    return any(keyword in prompt_lower for keyword in dev_keywords)

def enhance_prompt(original_prompt: str) -> str:
    """Enhance the prompt with context"""
    # Check if context injection is appropriate
    if not should_inject_context(original_prompt):
        return original_prompt
    
    # Load project context
    context = load_project_context()
    
    # Build enhanced prompt
    enhanced_parts = []
    
    # Add current status if available
    if 'current_status' in context:
        enhanced_parts.append(f"[PROJECT STATUS]\n{context['current_status']}\n")
    
    # Add current task if available
    if 'current_task' in context and context['current_task'] != "No current task found":
        enhanced_parts.append(f"[CURRENT TASK]\n{context['current_task']}\n")
    
    # Add recent changes if significant
    if 'recent_changes' in context and context['recent_changes'] != "No recent changes":
        enhanced_parts.append(f"[RECENT CHANGES]\n{context['recent_changes']}\n")
    
    # Add the original prompt
    enhanced_parts.append(f"[USER REQUEST]\n{original_prompt}")
    
    # Add reminders for common issues
    if any(word in original_prompt.lower() for word in ['style', 'color', 'theme']):
        enhanced_parts.append(
            "\n[REMINDER] Use theme variables (hsl(var(--variable))) for all colors. "
            "Never hardcode HSL/RGB/HEX values in style props."
        )
    
    if 'test' in original_prompt.lower():
        enhanced_parts.append(
            "\n[REMINDER] Follow TDD workflow: Create test first, then implementation."
        )
    
    return "\n\n".join(enhanced_parts)

def main():
    """Main hook entry point"""
    try:
        # Read input from Claude Code
        input_data = json.loads(sys.stdin.read())
        original_prompt = input_data.get("user_prompt", "")
        
        # Enhance the prompt
        enhanced_prompt = enhance_prompt(original_prompt)
        
        # Log enhancement if significant
        if enhanced_prompt != original_prompt:
            # Create log entry
            log_path = Path(".claude/logs/prompt_enhancements.log")
            log_path.parent.mkdir(parents=True, exist_ok=True)
            
            from datetime import datetime
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f"\n--- {datetime.now().isoformat()} ---\n")
                f.write(f"Original: {original_prompt[:100]}...\n")
                f.write(f"Enhanced: Added {len(enhanced_prompt) - len(original_prompt)} chars of context\n")
        
        # Output enhanced prompt
        print(json.dumps({
            "user_prompt": enhanced_prompt,
            "metadata": {
                "context_injected": enhanced_prompt != original_prompt,
                "original_length": len(original_prompt),
                "enhanced_length": len(enhanced_prompt)
            }
        }))
        
        # Continue with enhanced prompt
        sys.exit(0)
        
    except Exception as e:
        # On error, use original prompt
        print(json.dumps({
            "user_prompt": input_data.get("user_prompt", ""),
            "error": f"Enhancement failed: {str(e)}"
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
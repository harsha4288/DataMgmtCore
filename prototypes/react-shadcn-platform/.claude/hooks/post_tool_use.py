#!/usr/bin/env python3
"""
Post-tool use hook for Claude Code
Automatically updates progress tracking and performs quality checks
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import re

def analyze_edit_completion(tool_args: Dict, result: Any) -> Dict[str, Any]:
    """Analyze edit operations for progress tracking"""
    file_path = tool_args.get('file_path', '')
    
    # Determine what was edited
    completion_info = {
        'type': 'edit',
        'file': file_path,
        'timestamp': datetime.now().isoformat(),
    }
    
    # Check if this is a component file
    if 'components' in file_path:
        completion_info['category'] = 'component'
    elif 'pages' in file_path:
        completion_info['category'] = 'page'
    elif 'hooks' in file_path:
        completion_info['category'] = 'hook'
    elif 'lib' in file_path or 'utils' in file_path:
        completion_info['category'] = 'utility'
    else:
        completion_info['category'] = 'other'
    
    return completion_info

def analyze_write_completion(tool_args: Dict, result: Any) -> Dict[str, Any]:
    """Analyze write operations for progress tracking"""
    file_path = tool_args.get('file_path', '')
    
    completion_info = {
        'type': 'create',
        'file': file_path,
        'timestamp': datetime.now().isoformat(),
    }
    
    # Determine file type
    if file_path.endswith('.tsx'):
        completion_info['file_type'] = 'react_component'
    elif file_path.endswith('.ts'):
        completion_info['file_type'] = 'typescript'
    elif file_path.endswith('.py'):
        completion_info['file_type'] = 'python'
    elif file_path.endswith('.md'):
        completion_info['file_type'] = 'documentation'
    else:
        completion_info['file_type'] = 'other'
    
    return completion_info

def analyze_command_completion(tool_args: Dict, result: Any) -> Dict[str, Any]:
    """Analyze bash command execution"""
    command = tool_args.get('command', '')
    
    completion_info = {
        'type': 'command',
        'command': command[:100],  # Truncate long commands
        'timestamp': datetime.now().isoformat(),
    }
    
    # Identify command type
    if 'npm run' in command:
        completion_info['category'] = 'npm_script'
        if 'lint' in command:
            completion_info['subcategory'] = 'quality_check'
        elif 'test' in command:
            completion_info['subcategory'] = 'testing'
        elif 'build' in command:
            completion_info['subcategory'] = 'build'
    elif 'git' in command:
        completion_info['category'] = 'version_control'
    else:
        completion_info['category'] = 'general'
    
    return completion_info

def analyze_bulk_changes(tool_args: Dict, result: Any) -> Dict[str, Any]:
    """Analyze MultiEdit operations"""
    file_path = tool_args.get('file_path', '')
    edits = tool_args.get('edits', [])
    
    return {
        'type': 'bulk_edit',
        'file': file_path,
        'edit_count': len(edits),
        'timestamp': datetime.now().isoformat(),
    }

def update_progress_file(completion_info: Dict[str, Any]) -> None:
    """Update PROGRESS.md with completion information"""
    progress_path = Path("PROGRESS.md")
    
    if not progress_path.exists():
        return
    
    try:
        content = progress_path.read_text(encoding='utf-8')
        
        # Find the current task section
        task_pattern = r'(###.*?Current Task:.*?)(?=###|\Z)'
        match = re.search(task_pattern, content, re.DOTALL | re.IGNORECASE)
        
        if match:
            # Add completion info to current task
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            update_line = f"\n- [{timestamp}] {completion_info['type'].title()}: {completion_info.get('file', completion_info.get('command', 'Unknown'))[:50]}"
            
            # Insert update after task description
            updated_content = content[:match.end()] + update_line + content[match.end():]
            
            # Write back
            progress_path.write_text(updated_content, encoding='utf-8')
    except Exception as e:
        # Log error but don't fail
        pass

def stream_to_dashboard(data: Dict[str, Any]) -> None:
    """Stream updates to dashboard (placeholder for WebSocket integration)"""
    # Create event log for dashboard consumption
    event_log_path = Path(".claude/logs/events.jsonl")
    event_log_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(event_log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(data) + '\n')
    except:
        pass

def run_quality_checks(tool_name: str, tool_args: Dict) -> List[Dict[str, Any]]:
    """Run automated quality checks based on tool usage"""
    checks = []
    
    if tool_name in ["Edit", "Write", "MultiEdit"]:
        file_path = tool_args.get('file_path', '')
        
        # Check for theme compliance
        if file_path.endswith(('.tsx', '.jsx')):
            content = tool_args.get('content', '') or tool_args.get('new_string', '')
            if content:
                # Look for hardcoded colors
                if re.search(r'style=\{\{.*?(?:background|color):\s*["\'](?!hsl\(var)', content):
                    checks.append({
                        'check': 'theme_compliance',
                        'status': 'warning',
                        'message': 'Possible hardcoded color detected'
                    })
                else:
                    checks.append({
                        'check': 'theme_compliance',
                        'status': 'passed'
                    })
    
    return checks

def update_todo_progress() -> None:
    """Check and update todo list progress"""
    # Read current todos if they exist
    todo_file = Path(".claude/todos.json")
    if todo_file.exists():
        try:
            with open(todo_file, 'r') as f:
                todos = json.load(f)
                
            # Analyze completion patterns
            # This would integrate with TodoWrite in real implementation
            
        except:
            pass

def main():
    """Main hook entry point"""
    try:
        # Read input from Claude Code
        input_data = json.loads(sys.stdin.read())
        tool_name = input_data.get("tool", "")
        tool_args = input_data.get("args", {})
        result = input_data.get("result", {})
        
        # Progress tracking functions
        progress_analyzers = {
            "Edit": analyze_edit_completion,
            "Write": analyze_write_completion,
            "Bash": analyze_command_completion,
            "MultiEdit": analyze_bulk_changes,
        }
        
        # Analyze completion if applicable
        completion_info = None
        if tool_name in progress_analyzers:
            completion_info = progress_analyzers[tool_name](tool_args, result)
            
            # Update progress file
            update_progress_file(completion_info)
            
            # Stream to dashboard
            stream_to_dashboard({
                'event': 'tool_completion',
                'tool': tool_name,
                'completion': completion_info
            })
        
        # Run quality checks
        quality_results = run_quality_checks(tool_name, tool_args)
        if quality_results:
            stream_to_dashboard({
                'event': 'quality_check',
                'tool': tool_name,
                'results': quality_results
            })
        
        # Update todo progress
        update_todo_progress()
        
        # Log the activity
        activity_log = Path(".claude/logs/activity.log")
        activity_log.parent.mkdir(parents=True, exist_ok=True)
        
        with open(activity_log, 'a', encoding='utf-8') as f:
            f.write(f"[{datetime.now().isoformat()}] {tool_name}: ")
            if 'file_path' in tool_args:
                f.write(f"{tool_args['file_path']}")
            elif 'command' in tool_args:
                f.write(f"{tool_args['command'][:50]}")
            f.write("\n")
        
        # Output status
        output = {
            "status": "success",
            "progress_updated": completion_info is not None,
        }
        
        if quality_results:
            output["quality_checks"] = quality_results
        
        print(json.dumps(output))
        
        # Continue execution
        sys.exit(0)
        
    except Exception as e:
        # Log error but don't block
        print(json.dumps({
            "error": f"Post-tool hook error: {str(e)}",
            "status": "continuing"
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
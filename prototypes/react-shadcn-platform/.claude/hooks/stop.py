#!/usr/bin/env python3
"""
Stop hook for Claude Code
Runs when Claude Code session ends to update progress and sync state
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import re

def get_session_summary() -> Dict[str, Any]:
    """Generate summary of the session"""
    summary = {
        'timestamp': datetime.now().isoformat(),
        'duration': None,  # Would calculate from session_start
        'activities': []
    }
    
    # Read activity log
    activity_log = Path(".claude/logs/activity.log")
    if activity_log.exists():
        try:
            with open(activity_log, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Get last 20 activities
                recent_activities = lines[-20:] if len(lines) > 20 else lines
                summary['activities'] = [line.strip() for line in recent_activities]
        except:
            pass
    
    # Read event log for statistics
    event_log = Path(".claude/logs/events.jsonl")
    if event_log.exists():
        try:
            stats = {
                'files_edited': 0,
                'files_created': 0,
                'commands_run': 0,
                'quality_checks': 0
            }
            
            with open(event_log, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        event = json.loads(line)
                        if event.get('event') == 'tool_completion':
                            completion = event.get('completion', {})
                            if completion.get('type') == 'edit':
                                stats['files_edited'] += 1
                            elif completion.get('type') == 'create':
                                stats['files_created'] += 1
                            elif completion.get('type') == 'command':
                                stats['commands_run'] += 1
                        elif event.get('event') == 'quality_check':
                            stats['quality_checks'] += 1
                    except:
                        continue
            
            summary['statistics'] = stats
        except:
            pass
    
    return summary

def update_progress_summary(summary: Dict[str, Any]) -> None:
    """Update PROGRESS.md with session summary"""
    progress_path = Path("PROGRESS.md")
    
    if not progress_path.exists():
        return
    
    try:
        content = progress_path.read_text(encoding='utf-8')
        
        # Create session summary section
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        session_section = f"\n\n### Session Summary - {timestamp}\n"
        
        if 'statistics' in summary:
            stats = summary['statistics']
            session_section += f"- Files edited: {stats['files_edited']}\n"
            session_section += f"- Files created: {stats['files_created']}\n"
            session_section += f"- Commands run: {stats['commands_run']}\n"
            session_section += f"- Quality checks: {stats['quality_checks']}\n"
        
        if summary['activities']:
            session_section += "\nRecent activities:\n"
            for activity in summary['activities'][-5:]:  # Last 5 activities
                session_section += f"- {activity}\n"
        
        # Find a good place to insert (after current task or at end)
        task_pattern = r'(###.*?Current Task:.*?)(?=###|\Z)'
        match = re.search(task_pattern, content, re.DOTALL | re.IGNORECASE)
        
        if match:
            # Insert after current task
            updated_content = content[:match.end()] + session_section + content[match.end():]
        else:
            # Append at end
            updated_content = content + session_section
        
        # Write back
        progress_path.write_text(updated_content, encoding='utf-8')
    except Exception as e:
        pass

def sync_dashboard_state() -> None:
    """Sync final state to dashboard"""
    # Create state file for dashboard to read
    state_file = Path(".claude/state.json")
    
    try:
        state = {
            'last_updated': datetime.now().isoformat(),
            'session_ended': True,
            'todos': [],
            'recent_files': [],
            'quality_status': {}
        }
        
        # Read todos if they exist
        todo_file = Path(".claude/todos.json")
        if todo_file.exists():
            with open(todo_file, 'r') as f:
                state['todos'] = json.load(f)
        
        # Get recent files from activity log
        activity_log = Path(".claude/logs/activity.log")
        if activity_log.exists():
            with open(activity_log, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                files = []
                for line in reversed(lines):
                    # Extract file paths
                    if 'Edit:' in line or 'Write:' in line:
                        parts = line.split(': ')
                        if len(parts) > 1:
                            file_path = parts[1].strip()
                            if file_path and file_path not in files:
                                files.append(file_path)
                                if len(files) >= 10:
                                    break
                state['recent_files'] = files
        
        # Write state file
        state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2)
        
    except Exception as e:
        pass

def cleanup_temp_files() -> None:
    """Clean up temporary files from the session"""
    # Clear old event logs (keep last 1000 lines)
    event_log = Path(".claude/logs/events.jsonl")
    if event_log.exists():
        try:
            with open(event_log, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            if len(lines) > 1000:
                # Keep only last 1000 lines
                with open(event_log, 'w', encoding='utf-8') as f:
                    f.writelines(lines[-1000:])
        except:
            pass

def generate_commit_message() -> str:
    """Generate a suggested commit message based on session activity"""
    message_parts = []
    
    # Read recent activities
    activity_log = Path(".claude/logs/activity.log")
    if activity_log.exists():
        try:
            with open(activity_log, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
            # Analyze activities
            files_edited = set()
            components_created = []
            hooks_added = []
            
            for line in lines:
                if 'Edit:' in line:
                    parts = line.split(': ')
                    if len(parts) > 1:
                        file_path = parts[1].strip()
                        files_edited.add(file_path)
                        if 'components' in file_path and file_path.endswith('.tsx'):
                            component_name = Path(file_path).stem
                            if component_name not in components_created:
                                components_created.append(component_name)
                elif 'Write:' in line and '.claude/hooks' in line:
                    parts = line.split(': ')
                    if len(parts) > 1:
                        hook_name = Path(parts[1].strip()).stem
                        hooks_added.append(hook_name)
            
            # Build message
            if hooks_added:
                message_parts.append(f"Add Claude Code hooks: {', '.join(hooks_added[:3])}")
            if components_created:
                message_parts.append(f"Update components: {', '.join(components_created[:3])}")
            if len(files_edited) > 0:
                message_parts.append(f"Modified {len(files_edited)} files")
            
        except:
            pass
    
    if message_parts:
        return "Claude Code Enhancement: " + "; ".join(message_parts)
    else:
        return "Claude Code: Session updates"

def main():
    """Main hook entry point"""
    try:
        # Read input from Claude Code
        input_data = json.loads(sys.stdin.read())
        
        # Generate session summary
        summary = get_session_summary()
        
        # Update PROGRESS.md
        update_progress_summary(summary)
        
        # Sync dashboard state
        sync_dashboard_state()
        
        # Clean up temporary files
        cleanup_temp_files()
        
        # Generate commit message suggestion
        commit_message = generate_commit_message()
        
        # Create session end report
        report = {
            'session_ended': datetime.now().isoformat(),
            'summary': summary,
            'suggested_commit_message': commit_message,
            'next_steps': []
        }
        
        # Check for incomplete todos
        todo_file = Path(".claude/todos.json")
        if todo_file.exists():
            try:
                with open(todo_file, 'r') as f:
                    todos = json.load(f)
                    incomplete = [t for t in todos if t.get('status') != 'completed']
                    if incomplete:
                        report['next_steps'].append(f"Complete {len(incomplete)} remaining todos")
            except:
                pass
        
        # Save report
        report_file = Path(".claude/logs/session_reports.jsonl")
        report_file.parent.mkdir(parents=True, exist_ok=True)
        with open(report_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(report) + '\n')
        
        # Output final status
        print(json.dumps({
            'status': 'session_ended',
            'summary': summary,
            'commit_message': commit_message,
            'report_saved': str(report_file)
        }))
        
        # Exit successfully
        sys.exit(0)
        
    except Exception as e:
        # Log error but don't block
        print(json.dumps({
            'error': f"Stop hook error: {str(e)}",
            'status': 'session_ended_with_error'
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Session start hook for Claude Code
Initializes workspace, loads context, and sets up the development environment
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List
import subprocess
import re

def check_environment() -> Dict[str, Any]:
    """Check development environment status"""
    env_status = {
        'git': False,
        'node': False,
        'npm': False,
        'python': False,
        'project_type': None,
        'warnings': []
    }
    
    # Check Git
    try:
        result = subprocess.run(['git', '--version'], capture_output=True, text=True, timeout=2)
        env_status['git'] = result.returncode == 0
        
        # Get current branch
        if env_status['git']:
            result = subprocess.run(['git', 'branch', '--show-current'], capture_output=True, text=True, timeout=2)
            if result.returncode == 0:
                env_status['git_branch'] = result.stdout.strip()
    except:
        env_status['warnings'].append("Git not available")
    
    # Check Node/NPM
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=2)
        env_status['node'] = result.returncode == 0
        if env_status['node']:
            env_status['node_version'] = result.stdout.strip()
        
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True, timeout=2)
        env_status['npm'] = result.returncode == 0
    except:
        env_status['warnings'].append("Node.js not available")
    
    # Check Python
    try:
        result = subprocess.run(['python', '--version'], capture_output=True, text=True, timeout=2)
        env_status['python'] = result.returncode == 0
        if env_status['python']:
            env_status['python_version'] = result.stdout.strip()
    except:
        env_status['warnings'].append("Python not available")
    
    # Detect project type
    if Path('package.json').exists():
        env_status['project_type'] = 'node'
        
        # Check if it's a React project
        try:
            with open('package.json', 'r') as f:
                package_data = json.load(f)
                deps = package_data.get('dependencies', {})
                if 'react' in deps:
                    env_status['project_type'] = 'react'
                if '@tanstack/react-table' in deps:
                    env_status['has_tanstack'] = True
        except:
            pass
    elif Path('requirements.txt').exists() or Path('pyproject.toml').exists():
        env_status['project_type'] = 'python'
    
    return env_status

def load_project_context() -> Dict[str, Any]:
    """Load all relevant project context"""
    context = {
        'loaded_at': datetime.now().isoformat(),
        'files': {},
        'configuration': {},
        'current_state': {}
    }
    
    # Load CLAUDE.md
    claude_path = Path('CLAUDE.md')
    if claude_path.exists():
        try:
            context['files']['CLAUDE.md'] = claude_path.read_text(encoding='utf-8')[:2000]
        except:
            pass
    
    # Load PROGRESS.md
    progress_path = Path('PROGRESS.md')
    if progress_path.exists():
        try:
            content = progress_path.read_text(encoding='utf-8')
            context['files']['PROGRESS.md'] = content[:2000]
            
            # Extract current phase and task
            phase_match = re.search(r'###\s+Active Phase:\s*(.+)', content)
            if phase_match:
                context['current_state']['active_phase'] = phase_match.group(1).strip()
            
            task_match = re.search(r'###\s+Current Task:\s*(.+)', content)
            if task_match:
                context['current_state']['current_task'] = task_match.group(1).strip()
        except:
            pass
    
    # Load workflow configuration
    workflow_config_path = Path('.claude/workflow.json')
    if workflow_config_path.exists():
        try:
            with open(workflow_config_path, 'r') as f:
                context['configuration']['workflow'] = json.load(f)
        except:
            pass
    
    # Load hook configuration
    hook_config_path = Path('.claude/hooks/config.json')
    if hook_config_path.exists():
        try:
            with open(hook_config_path, 'r') as f:
                context['configuration']['hooks'] = json.load(f)
        except:
            pass
    
    # Load recent session reports
    session_reports_path = Path('.claude/logs/session_reports.jsonl')
    if session_reports_path.exists():
        try:
            with open(session_reports_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if lines:
                    # Get last session report
                    last_report = json.loads(lines[-1])
                    context['last_session'] = last_report
        except:
            pass
    
    return context

def initialize_workspace() -> Dict[str, Any]:
    """Initialize workspace directories and files"""
    initialization = {
        'directories_created': [],
        'files_created': [],
        'existing': []
    }
    
    # Required directories
    required_dirs = [
        '.claude/hooks',
        '.claude/commands',
        '.claude/agents',
        '.claude/templates',
        '.claude/logs',
        '.claude/utils'
    ]
    
    for dir_path in required_dirs:
        path = Path(dir_path)
        if not path.exists():
            path.mkdir(parents=True, exist_ok=True)
            initialization['directories_created'].append(str(path))
        else:
            initialization['existing'].append(str(path))
    
    # Create default configuration files if they don't exist
    
    # Workflow configuration
    workflow_config = Path('.claude/workflow.json')
    if not workflow_config.exists():
        default_workflow = {
            'version': '1.0.0',
            'active_workflows': {
                'tdd': False,
                'auto_quality_checks': True,
                'progress_tracking': True,
                'context_injection': True
            },
            'quality_gates': {
                'lint': True,
                'type_check': True,
                'theme_validation': True,
                'test_coverage': False
            }
        }
        with open(workflow_config, 'w') as f:
            json.dump(default_workflow, f, indent=2)
        initialization['files_created'].append(str(workflow_config))
    
    # Hook configuration
    hook_config = Path('.claude/hooks/config.json')
    if not hook_config.exists():
        default_hooks = {
            'enabled': True,
            'hooks': {
                'user_prompt_submit': True,
                'pre_tool_use': True,
                'post_tool_use': True,
                'session_start': True,
                'stop': True,
                'subagent_stop': True
            },
            'safety': {
                'block_dangerous_commands': True,
                'protect_files': True,
                'enforce_quality': True
            }
        }
        with open(hook_config, 'w') as f:
            json.dump(default_hooks, f, indent=2)
        initialization['files_created'].append(str(hook_config))
    
    # Create initial todos file
    todos_file = Path('.claude/todos.json')
    if not todos_file.exists():
        with open(todos_file, 'w') as f:
            json.dump([], f)
        initialization['files_created'].append(str(todos_file))
    
    return initialization

def check_pending_tasks() -> List[Dict[str, Any]]:
    """Check for pending tasks from previous sessions"""
    pending_tasks = []
    
    # Check todos
    todos_file = Path('.claude/todos.json')
    if todos_file.exists():
        try:
            with open(todos_file, 'r') as f:
                todos = json.load(f)
                incomplete = [t for t in todos if t.get('status') != 'completed']
                if incomplete:
                    pending_tasks.append({
                        'type': 'todos',
                        'count': len(incomplete),
                        'items': incomplete[:5]  # First 5 items
                    })
        except:
            pass
    
    # Check for uncommitted changes
    try:
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True, timeout=2)
        if result.returncode == 0 and result.stdout.strip():
            changes = result.stdout.strip().split('\n')
            pending_tasks.append({
                'type': 'uncommitted_changes',
                'count': len(changes),
                'files': changes[:10]  # First 10 files
            })
    except:
        pass
    
    return pending_tasks

def generate_session_plan(context: Dict[str, Any], pending: List[Dict[str, Any]]) -> str:
    """Generate a session plan based on context and pending tasks"""
    plan_parts = []
    
    # Current state
    if 'current_state' in context:
        state = context['current_state']
        if 'active_phase' in state:
            plan_parts.append(f"Continue with: {state['active_phase']}")
        if 'current_task' in state:
            plan_parts.append(f"Current task: {state['current_task']}")
    
    # Pending items
    for item in pending:
        if item['type'] == 'todos':
            plan_parts.append(f"Resume {item['count']} incomplete todos")
        elif item['type'] == 'uncommitted_changes':
            plan_parts.append(f"Review {item['count']} uncommitted changes")
    
    # Last session info
    if 'last_session' in context:
        last = context['last_session']
        if 'next_steps' in last and last['next_steps']:
            plan_parts.append("Suggested next steps from last session:")
            for step in last['next_steps'][:3]:
                plan_parts.append(f"  - {step}")
    
    return "\n".join(plan_parts) if plan_parts else "Ready to start new tasks"

def main():
    """Main hook entry point"""
    try:
        # Read input from Claude Code
        input_data = json.loads(sys.stdin.read())
        
        # Initialize session tracking
        session_start = datetime.now()
        session_id = session_start.strftime("%Y%m%d_%H%M%S")
        
        # Check environment
        env_status = check_environment()
        
        # Load project context
        context = load_project_context()
        
        # Initialize workspace
        initialization = initialize_workspace()
        
        # Check pending tasks
        pending_tasks = check_pending_tasks()
        
        # Generate session plan
        session_plan = generate_session_plan(context, pending_tasks)
        
        # Create session start record
        session_record = {
            'session_id': session_id,
            'started_at': session_start.isoformat(),
            'environment': env_status,
            'context_loaded': bool(context['files']),
            'workspace_initialized': initialization,
            'pending_tasks': pending_tasks,
            'session_plan': session_plan
        }
        
        # Save session record
        session_file = Path(f'.claude/logs/session_{session_id}.json')
        session_file.parent.mkdir(parents=True, exist_ok=True)
        with open(session_file, 'w') as f:
            json.dump(session_record, f, indent=2)
        
        # Create active session marker
        active_session = Path('.claude/active_session.json')
        with open(active_session, 'w') as f:
            json.dump({
                'session_id': session_id,
                'started_at': session_start.isoformat(),
                'pid': sys.argv[0] if sys.argv else None
            }, f, indent=2)
        
        # Output initialization message
        output = {
            'session_initialized': True,
            'session_id': session_id,
            'environment': {
                'project_type': env_status.get('project_type', 'unknown'),
                'git_branch': env_status.get('git_branch', 'unknown')
            },
            'context': {
                'phase': context.get('current_state', {}).get('active_phase', 'Not set'),
                'task': context.get('current_state', {}).get('current_task', 'Not set')
            },
            'pending': len(pending_tasks),
            'plan': session_plan,
            'workspace': {
                'dirs_created': len(initialization['directories_created']),
                'files_created': len(initialization['files_created'])
            }
        }
        
        # Add warnings if any
        if env_status.get('warnings'):
            output['warnings'] = env_status['warnings']
        
        print(json.dumps(output))
        
        # Continue execution
        sys.exit(0)
        
    except Exception as e:
        # Log error but don't block
        print(json.dumps({
            'error': f"Session start hook error: {str(e)}",
            'status': 'continuing_without_initialization'
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
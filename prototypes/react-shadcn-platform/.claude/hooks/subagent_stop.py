#!/usr/bin/env python3
"""
Subagent stop hook for Claude Code
Coordinates and aggregates results from specialized sub-agents
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
import re

def parse_agent_results(result_data: Any) -> Dict[str, Any]:
    """Parse and structure agent results"""
    parsed = {
        'raw_output': str(result_data),
        'files_created': [],
        'files_modified': [],
        'tests_run': [],
        'errors': [],
        'warnings': [],
        'suggestions': []
    }
    
    result_text = str(result_data)
    
    # Extract file operations
    file_patterns = [
        (r'Created file:\s*(.+)', 'files_created'),
        (r'Modified file:\s*(.+)', 'files_modified'),
        (r'Updated:\s*(.+)', 'files_modified'),
        (r'Writing to:\s*(.+)', 'files_created')
    ]
    
    for pattern, key in file_patterns:
        matches = re.findall(pattern, result_text, re.IGNORECASE)
        parsed[key].extend(matches)
    
    # Extract test results
    test_patterns = [
        r'(\d+) tests? passed',
        r'(\d+) tests? failed',
        r'Test suite:.*?(passed|failed)',
    ]
    
    for pattern in test_patterns:
        matches = re.findall(pattern, result_text, re.IGNORECASE)
        if matches:
            parsed['tests_run'].extend(matches)
    
    # Extract errors and warnings
    error_patterns = [
        (r'ERROR:\s*(.+)', 'errors'),
        (r'Error:\s*(.+)', 'errors'),
        (r'WARNING:\s*(.+)', 'warnings'),
        (r'Warning:\s*(.+)', 'warnings'),
    ]
    
    for pattern, key in error_patterns:
        matches = re.findall(pattern, result_text, re.MULTILINE)
        parsed[key].extend(matches)
    
    return parsed

def aggregate_agent_results(agent_type: str, results: Dict[str, Any]) -> Dict[str, Any]:
    """Aggregate results based on agent type"""
    aggregation = {
        'agent_type': agent_type,
        'timestamp': datetime.now().isoformat(),
        'summary': {},
        'actions_taken': [],
        'recommendations': []
    }
    
    # Agent-specific aggregation
    if agent_type == 'test-writer':
        aggregation['summary']['tests_created'] = len(results.get('files_created', []))
        aggregation['summary']['test_coverage'] = 'unknown'  # Would calculate from results
        
        if results.get('files_created'):
            aggregation['actions_taken'].append(f"Created {len(results['files_created'])} test files")
        
        if results.get('errors'):
            aggregation['recommendations'].append("Fix test errors before proceeding")
    
    elif agent_type == 'theme-validator':
        violations = results.get('errors', [])
        warnings = results.get('warnings', [])
        
        aggregation['summary']['violations'] = len(violations)
        aggregation['summary']['warnings'] = len(warnings)
        aggregation['summary']['compliant'] = len(violations) == 0
        
        if violations:
            aggregation['actions_taken'].append(f"Found {len(violations)} theme violations")
            aggregation['recommendations'].append("Fix theme violations for consistency")
    
    elif agent_type == 'ui-builder':
        components = results.get('files_created', [])
        aggregation['summary']['components_created'] = len(components)
        
        for comp in components:
            aggregation['actions_taken'].append(f"Created component: {Path(comp).stem}")
    
    elif agent_type == 'code-reviewer':
        issues = results.get('errors', []) + results.get('warnings', [])
        aggregation['summary']['issues_found'] = len(issues)
        aggregation['summary']['suggestions'] = len(results.get('suggestions', []))
        
        if issues:
            aggregation['recommendations'].append(f"Address {len(issues)} code review findings")
    
    return aggregation

def update_progress_from_agent(agent_type: str, aggregation: Dict[str, Any]) -> None:
    """Update PROGRESS.md with agent results"""
    progress_path = Path("PROGRESS.md")
    
    if not progress_path.exists():
        return
    
    try:
        content = progress_path.read_text(encoding='utf-8')
        
        # Create agent result section
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        agent_section = f"\n\n#### Sub-Agent Result - {timestamp}\n"
        agent_section += f"**Agent:** {agent_type}\n"
        
        # Add summary
        if aggregation['summary']:
            agent_section += "**Summary:**\n"
            for key, value in aggregation['summary'].items():
                agent_section += f"- {key.replace('_', ' ').title()}: {value}\n"
        
        # Add actions taken
        if aggregation['actions_taken']:
            agent_section += "**Actions:**\n"
            for action in aggregation['actions_taken']:
                agent_section += f"- {action}\n"
        
        # Add recommendations
        if aggregation['recommendations']:
            agent_section += "**Recommendations:**\n"
            for rec in aggregation['recommendations']:
                agent_section += f"- {rec}\n"
        
        # Find current task section to insert after
        task_pattern = r'(###.*?Current Task:.*?)(?=###|\Z)'
        match = re.search(task_pattern, content, re.DOTALL | re.IGNORECASE)
        
        if match:
            updated_content = content[:match.end()] + agent_section + content[match.end():]
        else:
            updated_content = content + agent_section
        
        # Write back
        progress_path.write_text(updated_content, encoding='utf-8')
    except Exception as e:
        pass

def notify_completion(agent_type: str, aggregation: Dict[str, Any]) -> None:
    """Send completion notification (for dashboard integration)"""
    # Create notification record
    notification = {
        'type': 'subagent_completion',
        'agent': agent_type,
        'timestamp': datetime.now().isoformat(),
        'summary': aggregation['summary'],
        'success': len(aggregation.get('errors', [])) == 0
    }
    
    # Write to notification queue
    notification_file = Path('.claude/notifications.jsonl')
    notification_file.parent.mkdir(parents=True, exist_ok=True)
    
    with open(notification_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(notification) + '\n')
    
    # Update dashboard state
    state_file = Path('.claude/state.json')
    if state_file.exists():
        try:
            with open(state_file, 'r') as f:
                state = json.load(f)
        except:
            state = {}
    else:
        state = {}
    
    # Add agent result to state
    if 'agent_results' not in state:
        state['agent_results'] = []
    
    state['agent_results'].append({
        'agent': agent_type,
        'completed_at': datetime.now().isoformat(),
        'summary': aggregation['summary']
    })
    
    # Keep only last 10 results
    state['agent_results'] = state['agent_results'][-10:]
    
    with open(state_file, 'w') as f:
        json.dump(state, f, indent=2)

def check_followup_actions(agent_type: str, results: Dict[str, Any]) -> List[str]:
    """Determine follow-up actions based on agent results"""
    followup = []
    
    if agent_type == 'test-writer':
        if results.get('files_created'):
            followup.append("Run tests to verify they pass")
            followup.append("Implement code to make tests pass")
    
    elif agent_type == 'theme-validator':
        if results.get('errors'):
            followup.append("Fix theme violations in affected files")
            followup.append("Re-run validation after fixes")
    
    elif agent_type == 'ui-builder':
        if results.get('files_created'):
            followup.append("Test new components in browser")
            followup.append("Add props and types if needed")
            followup.append("Create stories for Storybook")
    
    elif agent_type == 'code-reviewer':
        if results.get('errors') or results.get('warnings'):
            followup.append("Address critical issues first")
            followup.append("Consider refactoring suggestions")
            followup.append("Run quality checks after changes")
    
    return followup

def main():
    """Main hook entry point"""
    try:
        # Read input from Claude Code
        input_data = json.loads(sys.stdin.read())
        
        # Extract agent information
        agent_type = input_data.get('agent_type', 'unknown')
        agent_task = input_data.get('task', '')
        agent_result = input_data.get('result', {})
        
        # Parse agent results
        parsed_results = parse_agent_results(agent_result)
        
        # Aggregate results based on agent type
        aggregation = aggregate_agent_results(agent_type, parsed_results)
        
        # Update progress tracking
        update_progress_from_agent(agent_type, aggregation)
        
        # Send completion notification
        notify_completion(agent_type, aggregation)
        
        # Determine follow-up actions
        followup_actions = check_followup_actions(agent_type, parsed_results)
        
        # Log agent result
        agent_log = Path('.claude/logs/agents.jsonl')
        agent_log.parent.mkdir(parents=True, exist_ok=True)
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'agent': agent_type,
            'task': agent_task[:200],  # Truncate long tasks
            'summary': aggregation['summary'],
            'actions': aggregation['actions_taken'],
            'followup': followup_actions
        }
        
        with open(agent_log, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry) + '\n')
        
        # Create output
        output = {
            'agent_completed': True,
            'agent_type': agent_type,
            'summary': aggregation['summary'],
            'actions_taken': aggregation['actions_taken'],
            'recommendations': aggregation['recommendations'],
            'followup_actions': followup_actions,
            'success': len(parsed_results.get('errors', [])) == 0
        }
        
        # Add specific details based on agent type
        if agent_type == 'test-writer' and parsed_results.get('files_created'):
            output['test_files'] = parsed_results['files_created']
        
        elif agent_type == 'theme-validator':
            output['compliant'] = aggregation['summary'].get('compliant', False)
            if parsed_results.get('errors'):
                output['violations'] = parsed_results['errors'][:5]  # First 5 violations
        
        elif agent_type == 'ui-builder' and parsed_results.get('files_created'):
            output['components'] = [Path(f).stem for f in parsed_results['files_created']]
        
        elif agent_type == 'code-reviewer':
            output['review_complete'] = True
            output['issues_found'] = aggregation['summary'].get('issues_found', 0)
        
        print(json.dumps(output))
        
        # Continue execution
        sys.exit(0)
        
    except Exception as e:
        # Log error but don't block
        print(json.dumps({
            'error': f"Subagent stop hook error: {str(e)}",
            'agent_type': input_data.get('agent_type', 'unknown'),
            'status': 'continuing_despite_error'
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
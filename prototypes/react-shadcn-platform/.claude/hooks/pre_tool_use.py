#!/usr/bin/env python3
"""
Pre-tool use hook for Claude Code
Validates commands and enforces safety rules before execution
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Any

# Dangerous command patterns to block
BLOCKED_PATTERNS = [
    r"rm\s+-rf\s+/",                    # Dangerous rm
    r"rm\s+-rf\s+\*",                   # Wildcard rm
    r":(){ :|:& };:",                   # Fork bomb
    r"git\s+push.*--force.*main",       # Force push to main
    r"git\s+push.*--force.*master",     # Force push to master
    r"npm\s+publish",                    # Prevent accidental publish
    r"DELETE\s+FROM",                   # SQL deletion
    r"DROP\s+(TABLE|DATABASE)",         # SQL drop
    r"format\s+[cC]:",                  # Windows format
    r"del\s+/[sS]\s+/[qQ]\s+[cC]:",    # Windows recursive delete
]

# Quality gate checks per tool
QUALITY_GATES = {
    "Edit": ["validate_theme_compliance", "check_imports", "validate_indentation"],
    "Write": ["prevent_duplicate_files", "validate_structure", "check_file_extension"],
    "MultiEdit": ["validate_theme_compliance", "check_consistency"],
    "Bash": ["validate_command_safety", "check_permissions"],
}

# Protected files that shouldn't be modified without explicit permission
PROTECTED_FILES = [
    ".env",
    ".env.production",
    "package-lock.json",
    "yarn.lock",
    ".git/config",
]

def validate_command_safety(command: str) -> Dict[str, Any]:
    """Validate bash commands for safety"""
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return {
                "allowed": False,
                "reason": f"Dangerous command pattern detected: {pattern}",
                "suggestion": "Please use a safer alternative or request explicit permission"
            }
    
    return {"allowed": True}

def validate_theme_compliance(file_path: str, content: str) -> Dict[str, Any]:
    """Check for hardcoded colors in style props"""
    # Check for hardcoded HSL/RGB/HEX colors
    hardcoded_patterns = [
        r'backgroundColor:\s*["\']hsl\(\d+',
        r'backgroundColor:\s*["\']#[0-9a-fA-F]{3,6}',
        r'color:\s*["\']rgb\(',
        r'style=\{\{[^}]*(?:background|color):\s*["\'](?!hsl\(var)',
    ]
    
    for pattern in hardcoded_patterns:
        if re.search(pattern, content):
            return {
                "allowed": True,  # Warn but don't block
                "warning": "Hardcoded color detected. Use theme variables: hsl(var(--variable))",
            }
    
    return {"allowed": True}

def check_imports(file_path: str, content: str) -> Dict[str, Any]:
    """Validate import statements"""
    # Check for relative imports that go too far up
    if re.search(r'from\s+["\']\.\.\/\.\.\/\.\.\/\.\.', content):
        return {
            "allowed": False,
            "reason": "Import path goes too many levels up",
            "suggestion": "Use absolute imports or aliases"
        }
    
    return {"allowed": True}

def validate_file_protection(file_path: str) -> Dict[str, Any]:
    """Check if file is protected"""
    path = Path(file_path)
    
    for protected in PROTECTED_FILES:
        if path.name == protected or str(path).endswith(protected):
            return {
                "allowed": False,
                "reason": f"Protected file: {protected}",
                "suggestion": "This file requires explicit permission to modify"
            }
    
    return {"allowed": True}

def main():
    """Main hook entry point"""
    try:
        # Read input from Claude Code
        input_data = json.loads(sys.stdin.read())
        tool_name = input_data.get("tool", "")
        tool_args = input_data.get("args", {})
        
        # Track all validation results
        validations = []
        
        # Run tool-specific quality gates
        if tool_name in QUALITY_GATES:
            for check_name in QUALITY_GATES[tool_name]:
                if check_name == "validate_command_safety" and "command" in tool_args:
                    result = validate_command_safety(tool_args["command"])
                    validations.append(result)
                
                elif check_name == "validate_theme_compliance" and "content" in tool_args:
                    file_path = tool_args.get("file_path", "")
                    result = validate_theme_compliance(file_path, tool_args["content"])
                    validations.append(result)
                
                elif check_name == "check_imports" and "content" in tool_args:
                    file_path = tool_args.get("file_path", "")
                    result = check_imports(file_path, tool_args["content"])
                    validations.append(result)
        
        # Check file protection for edit/write operations
        if tool_name in ["Edit", "Write", "MultiEdit"] and "file_path" in tool_args:
            result = validate_file_protection(tool_args["file_path"])
            validations.append(result)
        
        # Determine if operation should be blocked
        blocked = any(v.get("allowed") == False for v in validations)
        warnings = [v.get("warning") for v in validations if v.get("warning")]
        
        if blocked:
            # Find the blocking reason
            blocking_reason = next(
                v.get("reason") for v in validations 
                if v.get("allowed") == False
            )
            suggestion = next(
                v.get("suggestion", "") for v in validations 
                if v.get("allowed") == False
            )
            
            print(json.dumps({
                "error": "Operation blocked by safety hook",
                "reason": blocking_reason,
                "suggestion": suggestion,
                "tool": tool_name
            }))
            sys.exit(1)  # Block the operation
        
        # Output warnings if any
        if warnings:
            print(json.dumps({
                "warnings": warnings,
                "tool": tool_name,
                "status": "continuing with warnings"
            }))
        
        # Allow the operation
        sys.exit(0)
        
    except Exception as e:
        # On error, allow operation but log
        print(json.dumps({
            "error": f"Hook error: {str(e)}",
            "status": "allowing operation due to hook error"
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()
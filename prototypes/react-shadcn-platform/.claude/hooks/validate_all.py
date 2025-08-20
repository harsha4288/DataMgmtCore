#!/usr/bin/env python3
"""
Validation script for all Claude Code hooks
Tests hook functionality and ensures proper operation
"""

import json
import sys
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Tuple
import importlib.util

def load_hook_module(hook_path: Path):
    """Dynamically load a hook module"""
    spec = importlib.util.spec_from_file_location(hook_path.stem, hook_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def validate_hook_structure(hook_path: Path) -> Tuple[bool, List[str]]:
    """Validate hook has required structure"""
    errors = []
    
    if not hook_path.exists():
        errors.append(f"Hook file does not exist: {hook_path}")
        return False, errors
    
    content = hook_path.read_text()
    
    # Check for shebang
    if not content.startswith("#!/usr/bin/env python3"):
        errors.append(f"Missing or incorrect shebang in {hook_path.name}")
    
    # Check for main function
    if "def main():" not in content:
        errors.append(f"Missing main() function in {hook_path.name}")
    
    # Check for sys.exit calls
    if "sys.exit(" not in content:
        errors.append(f"Missing sys.exit() calls in {hook_path.name}")
    
    # Check for JSON input/output
    if "json.loads(sys.stdin.read())" not in content:
        errors.append(f"Hook doesn't read JSON from stdin in {hook_path.name}")
    
    if "json.dumps(" not in content:
        errors.append(f"Hook doesn't output JSON in {hook_path.name}")
    
    return len(errors) == 0, errors

def test_pre_tool_use_hook() -> Tuple[bool, str]:
    """Test the pre_tool_use hook"""
    hook_path = Path(".claude/hooks/pre_tool_use.py")
    
    # Test dangerous command blocking
    test_cases = [
        {
            "input": {
                "tool": "Bash",
                "args": {"command": "rm -rf /"}
            },
            "expected_exit": 1,
            "description": "Block dangerous rm command"
        },
        {
            "input": {
                "tool": "Bash",
                "args": {"command": "ls -la"}
            },
            "expected_exit": 0,
            "description": "Allow safe ls command"
        },
        {
            "input": {
                "tool": "Edit",
                "args": {
                    "file_path": ".env",
                    "content": "SECRET_KEY=test"
                }
            },
            "expected_exit": 1,
            "description": "Block protected file edit"
        }
    ]
    
    for test in test_cases:
        try:
            result = subprocess.run(
                ["python3", str(hook_path)],
                input=json.dumps(test["input"]),
                capture_output=True,
                text=True
            )
            
            if result.returncode != test["expected_exit"]:
                return False, f"Failed: {test['description']} - Expected exit {test['expected_exit']}, got {result.returncode}"
        except Exception as e:
            return False, f"Error testing pre_tool_use: {str(e)}"
    
    return True, "All pre_tool_use tests passed"

def test_user_prompt_submit_hook() -> Tuple[bool, str]:
    """Test the user_prompt_submit hook"""
    hook_path = Path(".claude/hooks/user_prompt_submit.py")
    
    test_cases = [
        {
            "input": {"user_prompt": "implement a new feature"},
            "should_enhance": True,
            "description": "Enhance development prompts"
        },
        {
            "input": {"user_prompt": "2 + 2"},
            "should_enhance": False,
            "description": "Skip simple math"
        }
    ]
    
    for test in test_cases:
        try:
            result = subprocess.run(
                ["python3", str(hook_path)],
                input=json.dumps(test["input"]),
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                return False, f"user_prompt_submit failed with exit code {result.returncode}"
            
            output = json.loads(result.stdout)
            enhanced = output["user_prompt"] != test["input"]["user_prompt"]
            
            if enhanced != test["should_enhance"]:
                return False, f"Failed: {test['description']}"
        except Exception as e:
            return False, f"Error testing user_prompt_submit: {str(e)}"
    
    return True, "All user_prompt_submit tests passed"

def test_post_tool_use_hook() -> Tuple[bool, str]:
    """Test the post_tool_use hook"""
    hook_path = Path(".claude/hooks/post_tool_use.py")
    
    test_input = {
        "tool": "Edit",
        "args": {
            "file_path": "src/components/Test.tsx",
            "content": "export const Test = () => <div>Test</div>"
        },
        "result": {"success": True}
    }
    
    try:
        result = subprocess.run(
            ["python3", str(hook_path)],
            input=json.dumps(test_input),
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            return False, f"post_tool_use failed with exit code {result.returncode}"
        
        output = json.loads(result.stdout)
        if "status" not in output or output["status"] != "success":
            return False, "post_tool_use didn't return success status"
        
    except Exception as e:
        return False, f"Error testing post_tool_use: {str(e)}"
    
    return True, "post_tool_use test passed"

def validate_all_hooks() -> Dict[str, Any]:
    """Validate all hooks in the hooks directory"""
    results = {
        "valid": True,
        "hooks": {},
        "summary": {
            "total": 0,
            "passed": 0,
            "failed": 0
        }
    }
    
    hooks_dir = Path(".claude/hooks")
    hook_files = list(hooks_dir.glob("*.py"))
    
    # Exclude this validation script
    hook_files = [h for h in hook_files if h.name != "validate_all.py"]
    
    results["summary"]["total"] = len(hook_files)
    
    for hook_path in hook_files:
        hook_name = hook_path.stem
        hook_result = {
            "path": str(hook_path),
            "structure_valid": False,
            "tests_passed": False,
            "errors": []
        }
        
        # Validate structure
        structure_valid, structure_errors = validate_hook_structure(hook_path)
        hook_result["structure_valid"] = structure_valid
        if not structure_valid:
            hook_result["errors"].extend(structure_errors)
        
        # Run specific tests for known hooks
        if hook_name == "pre_tool_use":
            test_passed, test_msg = test_pre_tool_use_hook()
            hook_result["tests_passed"] = test_passed
            if not test_passed:
                hook_result["errors"].append(test_msg)
        elif hook_name == "user_prompt_submit":
            test_passed, test_msg = test_user_prompt_submit_hook()
            hook_result["tests_passed"] = test_passed
            if not test_passed:
                hook_result["errors"].append(test_msg)
        elif hook_name == "post_tool_use":
            test_passed, test_msg = test_post_tool_use_hook()
            hook_result["tests_passed"] = test_passed
            if not test_passed:
                hook_result["errors"].append(test_msg)
        else:
            # For other hooks, just check structure
            hook_result["tests_passed"] = structure_valid
        
        # Update summary
        if hook_result["structure_valid"] and hook_result["tests_passed"]:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
            results["valid"] = False
        
        results["hooks"][hook_name] = hook_result
    
    return results

def main():
    """Main validation entry point"""
    print("🔍 Validating Claude Code Hooks...")
    print("-" * 50)
    
    results = validate_all_hooks()
    
    # Print results
    for hook_name, hook_result in results["hooks"].items():
        status = "✅" if (hook_result["structure_valid"] and hook_result["tests_passed"]) else "❌"
        print(f"{status} {hook_name}")
        
        if not hook_result["structure_valid"]:
            print(f"   Structure issues:")
            for error in hook_result["errors"]:
                if error in hook_result["errors"][:3]:  # Show first 3 structure errors
                    print(f"   - {error}")
        
        if not hook_result["tests_passed"] and hook_result["structure_valid"]:
            print(f"   Test failures:")
            for error in hook_result["errors"]:
                if "Failed:" in error or "Error" in error:
                    print(f"   - {error}")
    
    print("-" * 50)
    print(f"Summary: {results['summary']['passed']}/{results['summary']['total']} hooks validated successfully")
    
    if not results["valid"]:
        print("\n⚠️  Some hooks have issues. Please fix them before using.")
        sys.exit(1)
    else:
        print("\n✅ All hooks validated successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
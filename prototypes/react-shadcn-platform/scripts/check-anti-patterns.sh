#!/bin/bash

# Master Anti-Pattern Detection Script
# Runs all anti-pattern checks in sequence

echo "🚀 Running comprehensive anti-pattern analysis..."
echo "================================================"
echo ""

# Make scripts executable
chmod +x scripts/*.sh

# 1. Theme System Check
echo "1️⃣  THEME SYSTEM ANALYSIS"
echo "------------------------"
npm run validate:theme
echo ""

# 2. Component Architecture Check
echo "2️⃣  COMPONENT ARCHITECTURE ANALYSIS"
echo "-----------------------------------"
./scripts/find-large-components.sh
echo ""

# 3. Performance Check
echo "3️⃣  PERFORMANCE ANALYSIS"
echo "------------------------"
./scripts/find-performance-issues.sh
echo ""

# 4. Accessibility Check
echo "4️⃣  ACCESSIBILITY ANALYSIS"
echo "--------------------------"
./scripts/find-accessibility-issues.sh
echo ""

# 5. Code Quality Summary
echo "5️⃣  CODE QUALITY SUMMARY"
echo "------------------------"

# Count total files
total_files=$(find src/ -name "*.tsx" -o -name "*.ts" | wc -l)
component_files=$(find src/components -name "*.tsx" | wc -l)

echo "📊 Project Statistics:"
echo "   Total files: $total_files"
echo "   Component files: $component_files"
echo ""

# Check for common issues
hardcoded_colors=$(grep -r "backgroundColor.*#\|color.*hsl(" src/ | wc -l)
large_components=$(find src/components -name "*.tsx" -exec wc -l {} + | awk '$1 > 500' | wc -l)
console_logs=$(grep -r "console\." src/ | wc -l)
inline_functions=$(grep -r "onClick={() =>" src/ | wc -l)

echo "🎯 Issue Summary:"
echo "   Hardcoded colors: $hardcoded_colors"
echo "   Large components (>500 lines): $large_components"
echo "   Console statements: $console_logs"
echo "   Inline arrow functions: $inline_functions"
echo ""

# Overall health score
total_issues=$((hardcoded_colors + large_components + console_logs + inline_functions))
if [ "$total_issues" -eq 0 ]; then
  echo "✅ Code quality: EXCELLENT (0 issues found)"
elif [ "$total_issues" -lt 5 ]; then
  echo "🟡 Code quality: GOOD ($total_issues minor issues)"
elif [ "$total_issues" -lt 10 ]; then
  echo "🟠 Code quality: NEEDS ATTENTION ($total_issues issues)"
else
  echo "🔴 Code quality: NEEDS IMPROVEMENT ($total_issues issues)"
fi

echo ""
echo "================================================"
echo "✅ Anti-pattern analysis complete!"
echo ""

# Recommendations based on findings
if [ "$hardcoded_colors" -gt 0 ]; then
  echo "💡 Run: npm run validate:theme --fix"
fi

if [ "$large_components" -gt 0 ]; then
  echo "💡 Consider splitting large components using composition"
fi

if [ "$console_logs" -gt 0 ]; then
  echo "💡 Remove console statements before production"
fi

if [ "$inline_functions" -gt 0 ]; then
  echo "💡 Move inline functions to useCallback or component level"
fi

echo ""
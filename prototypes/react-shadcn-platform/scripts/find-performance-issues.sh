#!/bin/bash

# Performance Anti-Pattern Detection Script
# Finds common performance issues in React components

echo "🔍 Scanning for performance anti-patterns..."
echo ""

# Check for inline arrow functions in JSX (causes re-renders)
echo "🎯 Checking for inline arrow functions..."
inline_functions=$(grep -rn "onClick={() =>" src/ | wc -l)
if [ "$inline_functions" -gt 0 ]; then
  echo "❌ Found $inline_functions inline arrow functions:"
  grep -rn "onClick={() =>" src/ | head -5
  echo "   💡 Use useCallback or move functions outside render"
  echo ""
fi

# Check for inline styles without memoization
echo "🎯 Checking for inline styles..."
inline_styles=$(grep -rn "style={{" src/ | grep -v "useMemo\|useCallback" | wc -l)
if [ "$inline_styles" -gt 0 ]; then
  echo "❌ Found $inline_styles inline styles without memoization:"
  grep -rn "style={{" src/ | grep -v "useMemo\|useCallback" | head -5
  echo "   💡 Use useMemo for inline styles or move to CSS classes"
  echo ""
fi

# Check for missing keys in mapped elements
echo "🎯 Checking for missing keys in lists..."
maps_without_keys=$(grep -rn "\.map(" src/ | grep -v "key=" | wc -l)
if [ "$maps_without_keys" -gt 0 ]; then
  echo "❌ Found $maps_without_keys .map() calls without keys:"
  grep -rn "\.map(" src/ | grep -v "key=" | head -5
  echo "   💡 Add unique key prop to mapped elements"
  echo ""
fi

# Check for object/array dependencies in useEffect
echo "🎯 Checking for object dependencies in useEffect..."
object_deps=$(grep -A 3 -B 1 "useEffect" src/ | grep -E "\[.*\{.*\]|\[.*\[.*\]" | wc -l)
if [ "$object_deps" -gt 0 ]; then
  echo "❌ Found potential object/array dependencies in useEffect"
  echo "   💡 Use useMemo/useCallback for object dependencies"
  echo ""
fi

# Check for expensive operations without memoization
echo "🎯 Checking for expensive operations..."
expensive_ops=$(grep -rn "\.filter(\|\.sort(\|\.reduce(" src/ | grep -v "useMemo" | wc -l)
if [ "$expensive_ops" -gt 0 ]; then
  echo "⚠️  Found $expensive_ops array operations that might benefit from memoization"
  echo "   💡 Consider useMemo for expensive array operations"
  echo ""
fi

# Check for missing React.memo on components
echo "🎯 Checking for missing React.memo..."
components=$(find src/components -name "*.tsx" | wc -l)
memoized=$(grep -rn "React\.memo\|memo(" src/components | wc -l)
memo_ratio=$((memoized * 100 / components))
if [ "$memo_ratio" -lt 30 ]; then
  echo "⚠️  Only $memo_ratio% of components use React.memo"
  echo "   💡 Consider wrapping pure components with React.memo"
  echo ""
fi

# Check for console.log statements (performance impact in production)
echo "🎯 Checking for console statements..."
console_logs=$(grep -rn "console\." src/ | wc -l)
if [ "$console_logs" -gt 0 ]; then
  echo "⚠️  Found $console_logs console statements"
  echo "   💡 Remove console statements before production"
  echo ""
fi

echo "✅ Performance analysis complete"
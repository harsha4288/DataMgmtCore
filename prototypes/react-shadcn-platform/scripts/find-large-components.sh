#!/bin/bash

# Find Large Components Script
# Detects components over 500 lines that should be split

echo "🔍 Finding components larger than 500 lines..."
echo ""

found_large=false

find src/components -name "*.tsx" -o -name "*.ts" | while read file; do
  lines=$(wc -l < "$file" 2>/dev/null || echo "0")
  if [ "$lines" -gt 500 ]; then
    echo "❌ $file: $lines lines (exceeds 500 line limit)"
    found_large=true
  elif [ "$lines" -gt 400 ]; then
    echo "⚠️  $file: $lines lines (approaching limit)"
  fi
done

# Also check for other signs of god components
echo ""
echo "🔍 Checking for other component complexity indicators..."

# Multiple useState hooks (sign of complex state)
grep -rn "useState" src/components/ | cut -d: -f1 | uniq -c | while read count file; do
  if [ "$count" -gt 10 ]; then
    echo "⚠️  $file: $count useState hooks (consider state management)"
  fi
done

# Multiple useEffect hooks (sign of mixed concerns)
grep -rn "useEffect" src/components/ | cut -d: -f1 | uniq -c | while read count file; do
  if [ "$count" -gt 5 ]; then
    echo "⚠️  $file: $count useEffect hooks (consider splitting concerns)"
  fi
done

echo ""
echo "✅ Component size analysis complete"
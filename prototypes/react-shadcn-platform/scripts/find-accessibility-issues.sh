#!/bin/bash

# Accessibility Anti-Pattern Detection Script
# Finds common a11y issues in React components

echo "🔍 Scanning for accessibility anti-patterns..."
echo ""

# Check for clickable divs (should be buttons)
echo "🎯 Checking for clickable divs..."
clickable_divs=$(grep -rn "<div.*onClick" src/ | wc -l)
if [ "$clickable_divs" -gt 0 ]; then
  echo "❌ Found $clickable_divs clickable divs:"
  grep -rn "<div.*onClick" src/ | head -3
  echo "   💡 Use <button> or add role='button' and keyboard handling"
  echo ""
fi

# Check for inputs without labels
echo "🎯 Checking for inputs without labels..."
inputs_no_labels=$(grep -rn "<input" src/ | grep -v "aria-label\|aria-labelledby\|id=.*label" | wc -l)
if [ "$inputs_no_labels" -gt 0 ]; then
  echo "❌ Found $inputs_no_labels inputs without proper labels:"
  grep -rn "<input" src/ | grep -v "aria-label\|aria-labelledby" | head -3
  echo "   💡 Add aria-label, aria-labelledby, or associated <label>"
  echo ""
fi

# Check for images without alt text
echo "🎯 Checking for images without alt text..."
images_no_alt=$(grep -rn "<img" src/ | grep -v "alt=" | wc -l)
if [ "$images_no_alt" -gt 0 ]; then
  echo "❌ Found $images_no_alt images without alt text:"
  grep -rn "<img" src/ | grep -v "alt=" | head -3
  echo "   💡 Add alt attribute or alt='' for decorative images"
  echo ""
fi

# Check for buttons without type or aria attributes
echo "🎯 Checking for buttons missing accessibility..."
buttons_no_type=$(grep -rn "<Button\|<button" src/ | grep -v "type=\|aria-" | wc -l)
if [ "$buttons_no_type" -gt 0 ]; then
  echo "⚠️  Found $buttons_no_type buttons that might need type or aria attributes"
  echo "   💡 Add type='button|submit|reset' and aria-label if needed"
  echo ""
fi

# Check for links that open in new tab without warning
echo "🎯 Checking for links opening in new tab..."
target_blank=$(grep -rn "target=['\"]_blank['\"]" src/ | grep -v "aria-label.*new\|rel.*noopener" | wc -l)
if [ "$target_blank" -gt 0 ]; then
  echo "⚠️  Found $target_blank links opening in new tab without proper warning"
  echo "   💡 Add aria-label indicating new tab and rel='noopener'"
  echo ""
fi

# Check for missing heading hierarchy
echo "🎯 Checking for heading structure..."
h1_count=$(grep -rn "<h1\|<H1" src/ | wc -l)
h2_count=$(grep -rn "<h2\|<H2" src/ | wc -l)
h3_count=$(grep -rn "<h3\|<H3" src/ | wc -l)

echo "   📊 Heading distribution: H1($h1_count) H2($h2_count) H3($h3_count)"
if [ "$h1_count" -eq 0 ]; then
  echo "⚠️  No H1 headings found - ensure proper heading hierarchy"
fi

# Check for form elements without fieldset/legend
echo "🎯 Checking for form accessibility..."
forms=$(grep -rn "<form" src/ | wc -l)
fieldsets=$(grep -rn "<fieldset" src/ | wc -l)
if [ "$forms" -gt 0 ] && [ "$fieldsets" -eq 0 ]; then
  echo "⚠️  Found $forms forms but no fieldsets - consider grouping related fields"
  echo ""
fi

# Check for missing focus management
echo "🎯 Checking for focus management..."
autofocus=$(grep -rn "autoFocus\|autofocus" src/ | wc -l)
focus_calls=$(grep -rn "\.focus()" src/ | wc -l)
if [ "$autofocus" -eq 0 ] && [ "$focus_calls" -eq 0 ]; then
  echo "⚠️  No focus management detected - consider adding for better UX"
  echo ""
fi

# Check for color-only information
echo "🎯 Checking for color-only indicators..."
color_only=$(grep -rn "bg-red\|bg-green\|text-red\|text-green" src/ | grep -v "aria-\|title=\|Icon" | wc -l)
if [ "$color_only" -gt 0 ]; then
  echo "⚠️  Found $color_only potential color-only indicators"
  echo "   💡 Ensure information isn't conveyed by color alone"
  echo ""
fi

# Check for missing skip links
echo "🎯 Checking for skip navigation..."
skip_links=$(grep -rn "skip.*main\|skip.*content" src/ | wc -l)
if [ "$skip_links" -eq 0 ]; then
  echo "⚠️  No skip navigation links found"
  echo "   💡 Add skip links for keyboard users"
  echo ""
fi

# Check for tables without proper headers
echo "🎯 Checking for table accessibility..."
tables=$(grep -rn "<table\|<Table" src/ | wc -l)
table_headers=$(grep -rn "<th\|scope=" src/ | wc -l)
if [ "$tables" -gt 0 ] && [ "$table_headers" -eq 0 ]; then
  echo "⚠️  Found $tables tables but no proper headers"
  echo "   💡 Add <th> elements and scope attributes"
  echo ""
fi

echo "✅ Accessibility analysis complete"
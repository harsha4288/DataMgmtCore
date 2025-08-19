# Anti-Pattern Detection & Fix Guide

> **Purpose:** Comprehensive guide to find and fix common anti-patterns in React/shadcn/ui projects  
> **Scope:** Theme systems, component architecture, performance, and maintainability  
> **Last Updated:** 2025-01-19

## 🔍 **Detection Methods & Tools**

### **1. Automated Detection Scripts**

#### **Theme System Violations**
```bash
# Use our smart validator
npm run validate:theme

# Or manually search for patterns
grep -r "backgroundColor.*hsl(" src/
grep -r "color.*#[0-9a-fA-F]" src/
grep -r "--muted:\s*\d" src/
```

#### **Component Anti-Patterns**
```bash
# Large components (>500 lines)
find src/ -name "*.tsx" -exec wc -l {} + | awk '$1 > 500'

# Hardcoded styling
grep -r "style={{.*px" src/
grep -r "className.*w-\[" src/

# Duplicate logic
grep -r "useState.*loading" src/ | wc -l
grep -r "\.map.*key=" src/ | grep -v "key={.*\.id"
```

### **2. Code Quality Analysis**

#### **ESLint Rules for Anti-Patterns**
```json
// .eslintrc.js - Add these rules
{
  "rules": {
    // Prevent hardcoded colors
    "no-hardcoded-colors": "error",
    
    // Prevent large components
    "max-lines-per-function": ["error", 100],
    "max-lines": ["error", 500],
    
    // Prevent prop drilling
    "react/prop-types": "error",
    "react/no-unused-prop-types": "error"
  }
}
```

#### **TypeScript Strict Checks**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true
  }
}
```

## 🚨 **Common Anti-Patterns & Fixes**

### **1. Theme System Anti-Patterns**

#### **❌ Anti-Pattern: Hardcoded Colors**
```typescript
// ❌ WRONG - Breaks theme switching
<div style={{ backgroundColor: '#1f2937' }}>
<Badge style={{ color: 'hsl(210, 40%, 15%)' }}>
```

#### **✅ Fix: Use Theme Variables**
```typescript
// ✅ CORRECT - Respects theme system
<div style={{ backgroundColor: 'hsl(var(--background))' }}>
<Badge className="bg-destructive text-destructive-foreground">
```

#### **Detection Script:**
```bash
#!/bin/bash
# find-hardcoded-colors.sh
echo "🔍 Searching for hardcoded colors..."
grep -rn "backgroundColor.*['\"]#" src/ && echo "❌ Found hardcoded HEX colors"
grep -rn "color.*['\"]hsl(" src/ && echo "❌ Found hardcoded HSL colors"
grep -rn "style={{.*rgb(" src/ && echo "❌ Found hardcoded RGB colors"
```

### **2. Component Architecture Anti-Patterns**

#### **❌ Anti-Pattern: God Components**
```typescript
// ❌ WRONG - 800+ line component doing everything
export function MassiveDataTable() {
  // 800 lines of mixed concerns
  const [data, setData] = useState()
  const [filters, setFilters] = useState()
  const [sorting, setSorting] = useState()
  const [pagination, setPagination] = useState()
  // ... hundreds more lines
}
```

#### **✅ Fix: Composition & Separation**
```typescript
// ✅ CORRECT - Split into focused components
export function DataTableContainer() {
  return (
    <div>
      <DataTableFilters />
      <DataTable />
      <DataTablePagination />
    </div>
  )
}

// Each component <100 lines, single responsibility
export function DataTableFilters() { /* focused logic */ }
export function DataTable() { /* focused logic */ }
```

#### **Detection Script:**
```bash
#!/bin/bash
# find-large-components.sh
echo "🔍 Finding components >500 lines..."
find src/components -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ $lines -gt 500 ]; then
    echo "❌ $file: $lines lines (too large)"
  fi
done
```

### **3. Performance Anti-Patterns**

#### **❌ Anti-Pattern: Unnecessary Re-renders**
```typescript
// ❌ WRONG - Creates new objects on every render
function ExpensiveComponent() {
  const config = { sort: 'name', filter: 'active' } // New object every render
  const handlers = { onClick: () => {}, onHover: () => {} } // New functions
  
  return <DataTable config={config} handlers={handlers} />
}
```

#### **✅ Fix: Memoization & Stable References**
```typescript
// ✅ CORRECT - Stable references and memoization
function OptimizedComponent() {
  const config = useMemo(() => ({ sort: 'name', filter: 'active' }), [])
  const handlers = useMemo(() => ({
    onClick: () => {},
    onHover: () => {}
  }), [])
  
  return <DataTable config={config} handlers={handlers} />
}
```

#### **Detection Script:**
```bash
#!/bin/bash
# find-performance-issues.sh
echo "🔍 Finding potential performance issues..."
grep -rn "style={{" src/ | grep -v "useMemo\|useCallback" && echo "❌ Inline styles without memoization"
grep -rn "onClick={() =>" src/ && echo "❌ Inline arrow functions in JSX"
grep -rn "\.map(" src/ | grep -v "key=" && echo "❌ Missing keys in mapped elements"
```

### **4. State Management Anti-Patterns**

#### **❌ Anti-Pattern: Props Drilling**
```typescript
// ❌ WRONG - Passing props through multiple levels
function App() {
  const [user, setUser] = useState()
  return <Layout user={user} setUser={setUser} />
}

function Layout({ user, setUser }) {
  return <Header user={user} setUser={setUser} />
}

function Header({ user, setUser }) {
  return <UserMenu user={user} setUser={setUser} />
}
```

#### **✅ Fix: Context or State Management**
```typescript
// ✅ CORRECT - Context for shared state
const UserContext = createContext()

function App() {
  const [user, setUser] = useState()
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Layout />
    </UserContext.Provider>
  )
}

function UserMenu() {
  const { user, setUser } = useContext(UserContext)
  return <div>{user.name}</div>
}
```

#### **Detection Script:**
```bash
#!/bin/bash
# find-prop-drilling.sh
echo "🔍 Finding potential prop drilling..."
grep -rn "props\." src/ | wc -l | awk '{if($1>50) print "⚠️ High prop usage detected"}'
grep -rn "setUser\|setData\|setConfig" src/ | grep "props" && echo "❌ State setters passed as props"
```

### **5. Accessibility Anti-Patterns**

#### **❌ Anti-Pattern: Missing Accessibility**
```typescript
// ❌ WRONG - No accessibility attributes
<div onClick={handleClick}>Click me</div>
<input placeholder="Search" />
<Button>Submit</Button>
```

#### **✅ Fix: Proper Accessibility**
```typescript
// ✅ CORRECT - Proper accessibility
<button onClick={handleClick} aria-label="Submit form">Click me</button>
<label htmlFor="search">Search</label>
<input id="search" placeholder="Search" />
<Button type="submit" aria-describedby="submit-help">Submit</Button>
```

#### **Detection Script:**
```bash
#!/bin/bash
# find-accessibility-issues.sh
echo "🔍 Finding accessibility issues..."
grep -rn "<div.*onClick" src/ && echo "❌ Clickable divs (use buttons)"
grep -rn "<input" src/ | grep -v "aria-\|id=" && echo "❌ Inputs without labels"
grep -rn "<Button" src/ | grep -v "aria-\|type=" && echo "❌ Buttons missing accessibility"
```

## 🛠 **Automated Fix Scripts**

### **1. Theme System Auto-Fix**
```bash
#!/bin/bash
# auto-fix-theme-issues.sh
echo "🔧 Auto-fixing theme issues..."

# Replace common hardcoded colors
sed -i 's/backgroundColor: ['\''"][#][0-9a-fA-F]*['\''"]/backgroundColor: '\''hsl(var(--background))'\''/g' src/**/*.tsx
sed -i 's/color: ['\''"]hsl([^)]*)['\'"]/color: '\''hsl(var(--foreground))'\''/g' src/**/*.tsx

# Replace common hardcoded classes
sed -i 's/bg-gray-100/bg-muted/g' src/**/*.tsx
sed -i 's/text-gray-900/text-foreground/g' src/**/*.tsx

echo "✅ Theme fixes applied"
```

### **2. Component Size Auto-Fix**
```bash
#!/bin/bash
# split-large-components.sh
find src/components -name "*.tsx" | while read file; do
  lines=$(wc -l < "$file")
  if [ $lines -gt 500 ]; then
    echo "⚠️ $file has $lines lines - consider splitting"
    # Could implement automatic component extraction here
  fi
done
```

## 📋 **Anti-Pattern Checklist**

### **Pre-Commit Checklist**
```bash
#!/bin/bash
# pre-commit-anti-pattern-check.sh
echo "🔍 Running anti-pattern checks..."

# Theme system
npm run validate:theme || echo "❌ Theme violations found"

# Component size
./find-large-components.sh

# Performance
./find-performance-issues.sh

# Accessibility
./find-accessibility-issues.sh

echo "✅ Anti-pattern check complete"
```

### **Code Review Checklist**

#### **Theme & Styling**
- [ ] No hardcoded colors in style props
- [ ] Uses semantic theme variables (`var(--muted)`, etc.)
- [ ] Responsive design with Tailwind classes
- [ ] Consistent spacing using theme values

#### **Component Architecture**
- [ ] Components <500 lines
- [ ] Single responsibility principle
- [ ] Proper prop types/interfaces
- [ ] No prop drilling (>3 levels)

#### **Performance**
- [ ] Memoized expensive calculations
- [ ] Stable references for objects/functions
- [ ] Proper keys in mapped elements
- [ ] Lazy loading for large components

#### **Accessibility**
- [ ] Semantic HTML elements
- [ ] Proper ARIA attributes
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility

## 🎯 **Prevention Strategies**

### **1. Development Setup**
```json
// package.json scripts
{
  "scripts": {
    "check:all": "npm run lint && npm run type-check && npm run validate:theme && npm run test",
    "check:anti-patterns": "./pre-commit-anti-pattern-check.sh",
    "fix:theme": "./auto-fix-theme-issues.sh",
    "analyze:size": "./find-large-components.sh"
  }
}
```

### **2. Git Hooks**
```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run check:anti-patterns
if [ $? -ne 0 ]; then
  echo "❌ Anti-pattern checks failed. Fix issues before committing."
  exit 1
fi
```

### **3. IDE Integration**

#### **VS Code Settings**
```json
// .vscode/settings.json
{
  "editor.rulers": [100, 500],
  "eslint.workingDirectories": ["src"],
  "typescript.preferences.strictOptionalProperties": true,
  "files.associations": {
    "*.tsx": "typescriptreact"
  }
}
```

#### **VS Code Extensions**
- **ESLint** - Catch anti-patterns in real-time
- **Prettier** - Consistent formatting
- **Error Lens** - Inline error display
- **Auto Rename Tag** - Prevent HTML/JSX mismatches

## 📚 **Common Anti-Pattern Categories**

### **1. Theme System Violations**
- Hardcoded colors
- CSS variable overrides
- Inconsistent spacing
- Non-responsive design

### **2. Component Architecture Issues**
- God components (>500 lines)
- Mixed concerns
- Prop drilling
- Circular dependencies

### **3. Performance Problems**
- Unnecessary re-renders
- Missing memoization
- Large bundle sizes
- Memory leaks

### **4. Accessibility Failures**
- Missing ARIA attributes
- Poor keyboard navigation
- Non-semantic HTML
- Missing labels

### **5. TypeScript/Type Safety**
- Any types
- Missing error handling
- Unsafe type assertions
- Inconsistent interfaces

## 🚀 **Quick Start**

1. **Set up validation:**
   ```bash
   npm run validate:theme
   ./find-large-components.sh
   ```

2. **Fix immediate issues:**
   ```bash
   ./auto-fix-theme-issues.sh
   npm run format
   ```

3. **Add to workflow:**
   ```bash
   # Add to package.json
   "check:anti-patterns": "./pre-commit-anti-pattern-check.sh"
   
   # Add git hook
   echo "npm run check:anti-patterns" > .git/hooks/pre-commit
   chmod +x .git/hooks/pre-commit
   ```

4. **Regular maintenance:**
   ```bash
   # Weekly checks
   npm run check:all
   npm run analyze:size
   ```

---

**Remember: Prevention is better than cure. Set up these checks early and run them regularly to maintain code quality.**
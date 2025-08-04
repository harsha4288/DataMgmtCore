# Phase 3.1A: Global Theme Foundation & Style Audit

## 📋 Overview

**Goal**: Establish centralized theme architecture by auditing current styling approach and creating comprehensive CSS variable system.

**Status**: 🔄 **PENDING**  
**Priority**: Critical foundation for all subsequent phases

---

## 🕵️ Style Audit Strategy

### **Component Ecosystem to Audit**

#### **Primary Components (DataTable Dependencies)**
- `src/components/behaviors/DataTable.tsx`
- `src/components/behaviors/VirtualizedDataTable.tsx` 
- `src/components/behaviors/UnifiedInlineEditor.tsx`

#### **UI Foundation Components**
- `src/components/ui/Button.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Input.tsx`

#### **Audit Checklist for Each Component**
```typescript
// ❌ Find hardcoded styles like:
'bg-blue-50'           // Fixed background colors
'text-slate-800'       // Fixed text colors  
'border-slate-300'     // Fixed border colors
'shadow-xl'            // Fixed shadow values

// ✅ Replace with semantic classes:
'bg-card'              // Theme-aware backgrounds
'text-foreground'      // Theme-aware text
'border-border'        // Theme-aware borders
'shadow-lg'            // Semantic shadow levels
```

---

## 🎨 CSS Variable System Design

### **Core Theme Structure**

#### **Color Palette**
```css
/* src/styles/theme.css */
:root {
  /* Backgrounds */
  --background: #ffffff;
  --card: #ffffff;
  --muted: #f1f5f9;
  
  /* Borders */
  --border: #e2e8f0;
  --input: #e2e8f0;
  
  /* Text */
  --foreground: #0f172a;
  --muted-foreground: #64748b;
  
  /* Interactive */
  --primary: #3b82f6;
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;
}

.dark {
  /* Dark theme overrides */
  --background: #0f172a;
  --card: #1e293b;
  --muted: #334155;
  --border: #475569;
  --foreground: #f8fafc;
  --muted-foreground: #94a3b8;
}
```

#### **Typography Scale**
```css
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
}
```

#### **Spacing & Shadows**
```css
:root {
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

---

## 🔄 Migration Strategy

### **Phase 1: Audit & Document**
1. **Scan all components** for hardcoded Tailwind classes
2. **Catalog hardcoded styles** in spreadsheet/checklist
3. **Identify semantic patterns** (e.g., all table headers use same color)

### **Phase 2: CSS Variable Creation**
1. **Create comprehensive theme.css** with all required variables
2. **Map hardcoded values** to semantic variable names
3. **Test variable inheritance** in browser dev tools

### **Phase 3: Gradual Migration**
1. **Start with leaf components** (Button, Badge, Input)
2. **Test each component** in isolation
3. **Validate theme switching** works correctly

---

## ✅ Success Criteria

### **Audit Completion**
- [ ] All hardcoded styles documented
- [ ] Complete CSS variable system created
- [ ] Migration priority order established

### **Foundation Validation**
- [ ] Theme variables work in both light/dark modes
- [ ] No visual regression in existing components
- [ ] Clear semantic naming convention established

---

## 📋 Implementation Checklist

### **Pre-Implementation**
- [ ] Create `src/styles/theme.css` if not exists
- [ ] Set up CSS variable testing environment
- [ ] Create before/after screenshot protocol

### **Component Audit**
- [ ] DataTable.tsx - identify hardcoded styles
- [ ] Button.tsx - catalog fixed colors/spacing  
- [ ] Badge.tsx - document variant styles
- [ ] Input.tsx - audit border/background styles
- [ ] UnifiedInlineEditor.tsx - review styling approach

### **CSS Variable System**
- [ ] Color palette variables defined
- [ ] Typography scale established
- [ ] Spacing system created
- [ ] Shadow system implemented
- [ ] Dark theme overrides complete

---

_Next Phase: [Phase 3.1B: Component Decoupling](phase-3.1b-component-decouple.md)_
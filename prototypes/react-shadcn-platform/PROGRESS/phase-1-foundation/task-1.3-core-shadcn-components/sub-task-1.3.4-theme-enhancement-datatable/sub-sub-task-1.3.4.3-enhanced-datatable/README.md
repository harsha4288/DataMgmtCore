# Sub-sub-task 1.3.4.3: DataTable Feature Extension

> **Sub-sub-task Type:** Component Extension
> **Parent Sub-task:** 1.3.4 - Theme Enhancement & DataTable Features
> **Priority:** High
> **Estimated Duration:** 0.5 days
> **Status:** Not Started 🟡

## 📋 Overview

This sub-sub-task focuses on extending the existing Table component with the specific features shown in the inspiration screenshots, based on the proven patterns from `VolunteerDashboard.tsx`. The goal is to add selection checkboxes, group headers, and frozen columns to match the reference implementation.

## 🎯 Objectives

### Primary Goals
- [ ] Extend existing Table component with selection checkboxes
- [ ] Add group header support using proven patterns
- [ ] Implement frozen columns for name and selection columns
- [ ] Add enhanced hover states and interactions

### Success Criteria
- [ ] Selection system with checkboxes (individual and select-all)
- [ ] Group headers with proper styling and spacing
- [ ] Frozen columns for name/selection columns
- [ ] All features work seamlessly across existing 4 themes
- [ ] Performance maintained (no regressions)

## 📚 Reference Implementation (VolunteerDashboard.tsx)

### Proven DataTable Features Already Working

The reference implementation shows all required features:

```typescript
// Selection system with checkboxes
const [selectedRows, setSelectedRows] = useState<any[]>([]);

// Group headers with proper styling
<thead>
  <tr>
    <th colSpan={2} className="table-group-header">Personal Information</th>
    <th colSpan={3} className="table-group-header">Role & Status</th>
    <th colSpan={2} className="table-group-header">Preferences</th>
  </tr>
</thead>

// Frozen columns with sticky positioning
<th className="sticky left-0 z-10 bg-table-header">
  <Checkbox />
</th>
<th className="sticky left-12 z-10 bg-table-header">Name</th>

// Badge system integration
<Badge variant={getRoleBadgeVariant(volunteer.role)}>
  {volunteer.role}
</Badge>
```

### Key Patterns to Copy
1. **Selection State Management** - useState for selected rows
2. **Group Headers** - colspan with proper CSS classes
3. **Frozen Columns** - sticky positioning with z-index
4. **Badge Integration** - Using existing grade variants
5. **Hover States** - CSS classes for row highlighting

## 🔧 Implementation Plan (Simple Extension)

### Step 1: Add Selection Support (15 minutes)

Extend existing Table component with selection:

```typescript
// src/components/ui/enhanced-table.tsx
interface EnhancedTableProps extends React.ComponentProps<typeof Table> {
  data: any[];
  columns: ColumnDef[];
  selection?: {
    enabled: boolean;
    selectedRows: any[];
    onSelectionChange: (rows: any[]) => void;
  };
}

// Add selection column
const SelectionColumn: ColumnDef = {
  id: 'selection',
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  ),
};
```

### Step 2: Add Group Headers (15 minutes)

Copy group header patterns from VolunteerDashboard.tsx:

```typescript
// Group header support
interface GroupHeader {
  label: string;
  colSpan: number;
  className?: string;
}

// Add to table header
<thead>
  {groupHeaders && (
    <tr>
      {groupHeaders.map((group, index) => (
        <th key={index} colSpan={group.colSpan} className="table-group-header">
          {group.label}
        </th>
      ))}
    </tr>
  )}
  <tr>
    {/* Regular column headers */}
  </tr>
</thead>
```

### Step 3: Add Frozen Columns (15 minutes)

Implement sticky positioning for first columns:

```typescript
// Frozen column styling
const getFrozenColumnStyle = (index: number) => {
  if (index === 0) return "sticky left-0 z-10 bg-table-header";
  if (index === 1) return "sticky left-12 z-10 bg-table-header";
  return "";
};

// Apply to table headers and cells
<th className={getFrozenColumnStyle(columnIndex)}>
  {column.header}
</th>
## ✅ Success Criteria

### DataTable Extension Complete When:
- [ ] Selection checkboxes added to existing Table component
- [ ] Group headers implemented with proper colspan
- [ ] Frozen columns working with sticky positioning
- [ ] Hover states and row highlighting functional
- [ ] All features tested across all 4 themes
- [ ] Performance maintained (no regressions)

## 📁 Files to Update

### Required Files (Minimal Changes)
- `src/components/ui/enhanced-table.tsx` - Extend existing Table component
- `src/lib/utils/table-helpers.ts` - Helper functions for selection and grouping
- `src/components/ui/index.ts` - Export enhanced table

### CSS Updates
- Add table-specific CSS classes for frozen columns
- Add group header styling
- Add selection and hover state styles

### Testing Files
- Component showcase - Test enhanced table features
- Theme switching - Validate across all themes

---

*This approach extends the existing excellent Table component with proven patterns from VolunteerDashboard.tsx.*

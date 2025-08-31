# Task 5.8.3.2: Entity ID Collision Resolution

> **Status:** 🟡 Planning  
> **Priority:** High  
> **Estimated Time:** 1-2 days  
> **Parent Task:** [Task 5.8.3: Advanced Dashboard Functionality](./task-5.8.3-advanced-dashboard-functionality.md)  
> **Dependencies:** Analysis of current ID system completed  
> **Created:** August 31, 2025  
> **Updated:** December 31, 2025  
> **Type:** Task

## 🎯 Objective

Resolve the entity ID collision problem in the GraphQL/database system that prevents documents from being properly associated with specific tasks and subtasks, particularly affecting the document viewer functionality.

## 🚨 Problem Statement

### Core Issue
The current system generates non-unique entity IDs, causing document association failures and UI confusion:

- Multiple tasks generate subtasks with identical IDs (`subtask-0`, `subtask-1`)
- Documents associated with `subtask-0` appear for ALL tasks' first subtasks
- Tasks like `task-5.8.3.1-navigation-flow-architecture-redesign` show "No documents found" because no documents exist with matching entity IDs

### Real Examples from System

#### Current ID Generation Pattern:
```javascript
// GraphQL server generates:
Task 0.1: subtasks = [subtask-0, subtask-1, subtask-2, ...]
Task 5.8.3: subtasks = [subtask-0, subtask-1]  // COLLISION!
Task 2.1: subtasks = [subtask-0, subtask-1, ...]  // COLLISION!
```

#### Document Visibility Issues:
1. **Document shows correctly for:**
   - Task 0.1's first subtask ("Create README.md") ✅
   - Task 5.8.3's first subtask ("Initialize project") ✅

2. **Document missing for:**
   - Task 5.8.3.1 ("Navigation Flow Architecture Redesign") ❌
   - All other subtasks that aren't the first in their parent task ❌

#### Database Current State:
```sql
-- Document exists with:
entity_id = 'subtask-0'
entity_type = 'subtask'

-- But requested by frontend:
entity_id = 'task-5.8.3.1-navigation-flow-architecture-redesign'
entity_type = 'task'
-- Result: No match found
```

## 📊 System Architecture Analysis

### Current Hierarchy Structure:
```
Phase 5: Development Infrastructure
├── Task 5.8: Universal Project Management System
│   ├── Task 5.8.1: Foundation Infrastructure Fixes
│   ├── Task 5.8.2: Universal Configuration Management  
│   ├── Task 5.8.3: Advanced Dashboard Functionality
│   │   ├── Subtask 5.8.3.1: Navigation Flow Architecture Redesign
│   │   └── (Potential future subtasks 5.8.3.2, 5.8.3.3...)
│   ├── Task 5.8.4: Entity Interconnection Architecture
│   └── Task 5.8.5: Quality Pipeline Modernization
```

### GraphQL Server ID Generation Logic:
```javascript
// Current implementation in graphql-server.cjs:
const parseSubtasks = (tasksText) => {
  return tasksText.split('\n').map((line, index) => {
    return {
      id: `subtask-${index}`,  // ❌ Non-unique across tasks
      name,
      description: '',
      completed
    };
  });
};
```

### Frontend Request Pattern:
```typescript
// DocumentContentViewer.tsx makes this query:
query GetDocumentsByEntity($entityId: ID!, $entityType: EntityTypeEnum!) {
  getDocumentsByEntity(entityId: $entityId, entityType: $entityType) {
    id title content type status entityId entityType author lastModified markdown
  }
}

// Called with:
entityId: "task-5.8.3.1-navigation-flow-architecture-redesign"
entityType: "task"
```

## 🔍 Impact Assessment

### User Experience Impact:
- **Confusion**: Users see documents in unexpected places
- **Missing Content**: Important tasks show as having no documentation
- **Inconsistent Behavior**: Same action (clicking on subtask) produces different results

### Development Impact:
- **Debugging Difficulty**: Hard to trace which document belongs where
- **Maintenance Issues**: Adding/reordering tasks breaks document associations
- **Data Integrity**: Risk of documents being associated with wrong entities

### System Scalability Issues:
- **Non-deterministic**: System behavior changes when tasks are added/removed
- **Testing Complexity**: Hard to write reliable tests with unstable IDs
- **Future Features**: Blocks implementation of advanced document management

## 💡 Recommended Solution: JIRA-Style Board Prefixes

### **The Industry Approach (JIRA Model)**

**What JIRA does:**
- **Project Boards:** `PET-123`, `GWP-456`, `OG-789` - Simple board prefixes
- **User-defined:** Teams create their own board identifiers
- **Auto-increment:** System handles the numbering

### **Our Solution: User-Defined Board Prefixes** ⭐

```javascript
// User-defined board prefixes (NOT hardcoded)
const boards = new Map(); // Dynamically created by users

// Users create boards as needed:
// Work boards: PET, GWP, OG (like your workplace)
// Our granular boards: CORE.UI, ALUMNI.DB, SGS.DEVOPS
// Personal: RAJ.WORK, RAJ.PERS
// Client projects: ABC, XYZ, DATTA

// Generate unique IDs per board
function generateEntityId(boardPrefix) {
  // Get next number for this board
  const counter = await getNextCounter(boardPrefix);
  return `${boardPrefix}-${counter}`;
}

// Results in JIRA-style IDs:
"PET-1"           // Work project
"CORE.UI-123"     // UI components board
"ALUMNI.DB-456"   // Alumni database tasks
"RAJ.PERS-789"    // Personal tasks
```

### **Key Benefits**

1. **Exactly Like JIRA**
   - Users create boards with custom prefixes
   - Each board has its own counter
   - No reinventing the wheel

2. **Simple Fix for Our Issue**
   - Replace `subtask-0` with `BOARD-123` format
   - Leverages existing unified entity system
   - No complex hierarchy needed

3. **User-Controlled**
   - Create boards: SGS, CORE.UI, ALUMNI.DB, RAJ.WORK
   - More granular than typical JIRA (PET, GWP, OG)
   - But same proven concept

4. **No New Issues**
   - JIRA has proven this works at scale
   - Simple counter per board prefix
   - IDs are just database keys

5. **Minimal Changes Required**
   - We already have unified entity management
   - Just need to fix ID generation in graphql-server.cjs
   - No architecture changes needed

### **Implementation Comparison**

| Aspect | Current Problem | JIRA-Style Solution |
|--------|---------------|------------------------|
| ID Format | `subtask-0`, `subtask-1` (collisions) | `CORE.UI-123`, `ALUMNI.DB-456` |
| Uniqueness | ❌ Duplicate IDs across tasks | ✅ Unique per board |
| Simplicity | ❌ Complex due to collisions | ✅ Simple counter per prefix |
| User Control | ❌ System generates `subtask-N` | ✅ User defines board prefixes |
| JIRA Compatibility | ❌ Custom format | ✅ Exact JIRA pattern |
| Changes Needed | - | ✅ Just fix ID generation |

## 🎯 Implementation Plan

### Phase 1: Simple Database Update

1. **Add board tracking table**
   ```sql
   -- Simple board/prefix tracking (like JIRA projects)
   CREATE TABLE IF NOT EXISTS boards (
     prefix VARCHAR(50) PRIMARY KEY,  -- PET, CORE.UI, ALUMNI.DB, etc.
     current_counter INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **No changes to entities table needed**
   ```sql
   -- We already have unified entity management
   -- Just need to ensure entity_id is unique
   -- The existing structure already supports this
   ```

### Phase 2: Simple GraphQL Server Fix

1. **Fix the ID generation (the actual problem)**
   ```javascript
   // graphql-server.cjs - SIMPLE FIX
   
   // Add board-based ID generation
   async function generateUniqueId(boardPrefix) {
     // User provides board prefix or we use a default
     const prefix = boardPrefix || 'TASK';
     
     // Get next number for this board
     const result = await db.get(
       'SELECT current_counter FROM boards WHERE prefix = ?',
       [prefix]
     );
     
     const nextNum = (result?.current_counter || 0) + 1;
     
     // Update counter
     await db.run(
       'INSERT OR REPLACE INTO boards (prefix, current_counter) VALUES (?, ?)',
       [prefix, nextNum]
     );
     
     return `${prefix}-${nextNum}`;
   }
   ```

2. **Fix the problematic parseSubtasks function**
   ```javascript
   // BEFORE (PROBLEM):
   parseSubtasks(content, parentBoard) {
     return subtasks.map((match, index) => ({
       id: `subtask-${index}`,  // ❌ COLLISION!
       name,
       completed
     }));
   }
   
   // AFTER (FIXED):
   async parseSubtasks(content, parentBoard) {
     const board = parentBoard || 'TASK';
     return Promise.all(subtasks.map(async (match) => ({
       id: await generateUniqueId(board),  // ✅ UNIQUE!
       name,
       completed
     })));
   }
   ```

### Phase 3: Simple Data Migration

1. **Migration script**
   ```javascript
   // migrate-entity-ids.js
   async function migrateEntityIds() {
     // Map old IDs to new format
     const migrations = [
       { old: 'subtask-0', new: 'DASH-1', type: 'dashboard' },
       { old: 'task-5.8.3.1-navigation...', new: 'DASH-2' },
       // ... more mappings
     ];
     
     for (const m of migrations) {
       await db.query(
         'UPDATE entities SET entity_key = ? WHERE entity_id = ?',
         [m.new, m.old]
       );
       await db.query(
         'UPDATE documents SET entity_id = ? WHERE entity_id = ?',
         [m.new, m.old]
       );
     }
   }
   ```

2. **Update existing documents**
   ```sql
   -- Update document associations
   UPDATE documents SET entity_id = 
     CASE 
       WHEN entity_id = 'subtask-0' THEN 'DASH-1'
       WHEN entity_id = 'subtask-1' THEN 'DASH-2'
       -- ... more mappings
     END
   WHERE entity_id IN ('subtask-0', 'subtask-1', ...);
   ```

### Phase 4: Testing & Validation

1. **Automated tests**
   ```javascript
   describe('Entity ID Generation', () => {
     test('generates unique IDs per prefix', () => {
       const id1 = generateEntityId('DASH');
       const id2 = generateEntityId('DASH');
       expect(id1).toBe('DASH-1');
       expect(id2).toBe('DASH-2');
     });
     
     test('different prefixes have independent counters', () => {
       const dashId = generateEntityId('DASH');
       const authId = generateEntityId('AUTH');
       expect(dashId).toMatch(/^DASH-\d+$/);
       expect(authId).toMatch(/^AUTH-\d+$/);
     });
   });
   ```

2. **Manual validation checklist**
   - [ ] All documents appear for correct entities
   - [ ] No ID collisions in database
   - [ ] Frontend displays correct IDs
   - [ ] Cross-references work properly

## 🔧 Technical Implementation Details

### Files to Modify:

1. **Database Schema** (`src/lib/database/schema.sql`):
   ```sql
   -- Add entity_prefixes table for configuration
   -- Update entities table with prefix columns
   -- Add virtual column for entity_key generation
   ```

2. **GraphQL Server** (`scripts/graphql-server.cjs`):
   ```javascript
   // Add prefix configuration loading
   // Implement generateEntityId(prefix) function
   // Update all entity creation to use new IDs
   // Maintain prefix counters in memory/database
   ```

3. **Configuration File** (`config/entity-prefixes.json`):
   ```json
   {
     "prefixes": {
       "SGS": { "name": "SGS Core", "description": "Main project" },
       "DASH": { "name": "Dashboard", "description": "Dashboard module" },
       "AUTH": { "name": "Authentication", "description": "Auth system" },
       "API": { "name": "API Services", "description": "Backend APIs" }
     }
   }
   ```

4. **Migration Script** (`scripts/migrate-entity-ids.js`):
   ```javascript
   // Load old-to-new ID mappings
   // Update all entity references
   // Update all document associations
   // Verify data integrity
   ```

5. **Frontend Components**:
   ```typescript
   // No changes needed - components use entityId as-is
   // IDs will now be human-readable (DASH-123 vs subtask-0)
   ```

### Configuration Management:

1. **Adding New Projects/Modules**:
   ```sql
   INSERT INTO entity_prefixes (prefix, name, description) 
   VALUES ('REPORT', 'Reporting Module', 'Reports and analytics');
   ```

2. **Prefix Naming Conventions**:
   - 3-10 characters, uppercase
   - Meaningful abbreviations
   - Avoid numbers in prefix
   - Examples: `AUTH`, `DASH`, `API`, `USER`, `ADMIN`

3. **Board Examples (Like JIRA)**:
   ```javascript
   // Just like JIRA boards (PET, GWP, OG at your work)
   // But more granular if desired:
   "CORE.UI-123"     // UI components board
   "ALUMNI.DB-456"   // Alumni database board
   "SGS.DEVOPS-789"  // DevOps tasks board
   "RAJ.WORK-101"    // Personal work board
   "ABC-202"         // Client project board
   
   // Simple, familiar, no new concepts
   ```

## 📈 Success Metrics

### Immediate Goals:
- ✅ Every entity has a globally unique, readable ID (e.g., `DASH-123`)
- ✅ Documents correctly associate with their entities
- ✅ No ID collisions across any modules or projects
- ✅ Task 5.8.3.1 and all other entities show proper documents

### System Improvements:
- ✅ **Developer Experience**: IDs like `AUTH-456` are self-documenting
- ✅ **Debugging**: Can instantly identify module from ID
- ✅ **Scalability**: Add new projects/modules without conflicts
- ✅ **Industry Standard**: Follows Jira/Linear patterns

### Technical Validation:
```sql
-- Check for uniqueness
SELECT entity_key, COUNT(*) FROM entities 
GROUP BY entity_key HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Verify all documents have valid entities
SELECT d.* FROM documents d
LEFT JOIN entities e ON d.entity_id = e.entity_key
WHERE e.entity_key IS NULL;
-- Should return 0 rows
```

## 🔄 Future Enhancements

### Advanced Features:

1. **Cross-Project References**
   ```javascript
   // Link entities across projects
   "DASH-123 depends on API-456"
   "AUTH-789 blocks DASH-124"
   ```

2. **Smart Prefix Assignment**
   ```javascript
   // Auto-detect prefix from context
   if (path.includes('dashboard')) return 'DASH';
   if (path.includes('auth')) return 'AUTH';
   if (entity.type === 'api_endpoint') return 'API';
   ```

3. **Prefix Analytics**
   ```sql
   -- Track entity distribution
   SELECT prefix, COUNT(*) as total,
          COUNT(CASE WHEN status='completed' THEN 1 END) as completed
   FROM entities GROUP BY prefix;
   ```

4. **Integration Possibilities**
   - Export to Jira with ID mapping
   - Import from Linear preserving prefixes
   - GitHub issue synchronization
   - Slack notifications with readable IDs

### Simple Board Management:

```javascript
// Users create boards as needed (like JIRA)
// No complex configuration required

// In UI:
"Create New Board"
Prefix: [CORE.UI    ]
Description: [UI Components]

// That's it! System handles the rest
// IDs become: CORE.UI-1, CORE.UI-2, etc.
```

## 📝 Next Steps

### For Review:
1. **Confirm prefix strategy**: Review proposed prefixes (DASH, AUTH, API, etc.)
2. **Multi-project approach**: Decide on project separation strategy
3. **Migration timing**: Schedule migration window

### Ready to Implement:
1. **Database schema changes** - Add prefix tables and columns
2. **GraphQL server updates** - Implement ID generation
3. **Data migration** - Convert existing IDs
4. **Testing & validation** - Ensure zero collisions
5. **Documentation** - Update API docs with new ID format

### Why This Solution Works:
- ✅ **It's just JIRA boards**: No new concepts to learn
- ✅ **Fixes the actual problem**: Replaces duplicate `subtask-0` IDs
- ✅ **Uses existing system**: We already have unified entity management
- ✅ **User-controlled**: Create any board prefix you want
- ✅ **Simple implementation**: Just fix ID generation in one file
- ✅ **No new issues**: JIRA has proven this pattern for decades
- ✅ **AI Pattern Recognition**: Prefixes help AI understand context and suggest relevant board codes

### AI Integration Benefits:
```javascript
// AI can recognize patterns and suggest board codes:
"Setting up authentication" → AI suggests: "AUTH" or "CORE.AUTH"
"Database migration for alumni" → AI suggests: "ALUMNI.DB" 
"React component work" → AI suggests: "CORE.UI"
"DevOps pipeline setup" → AI suggests: "DEVOPS" or "SGS.DEVOPS"
"Personal learning task" → AI suggests: "LEARN" or "RAJ.PERS"

// AI can also analyze existing boards:
Most used: CORE.UI (45 tasks), ALUMNI.DB (23 tasks)
Suggested for new UI work: "CORE.UI" (high confidence)
Suggested for new alumni feature: "ALUMNI.DB" (medium confidence)
```

---

*This solution simply copies JIRA's board system - users create boards with prefixes (like PET, GWP at work), we can be more granular (CORE.UI, ALUMNI.DB), and the system generates unique IDs per board. We're not inventing anything new, just fixing the duplicate ID problem using a proven pattern.*
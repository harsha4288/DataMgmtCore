# PROJECT CONTEXT - CRITICAL REMINDERS

## 🎯 **CORE OBJECTIVE - NEVER FORGET**

**WE ARE ELIMINATING .md FILES, NOT INTEGRATING WITH THEM**

From task-5.8-universal-project-management-system.md:
- ✅ **Success Criteria:** Zero .md file dependencies (except single CLAUDE.md)
- ❌ **NOT:** Syncing with docs/progress/ files
- ✅ **YES:** Replacing entire markdown system with GraphQL database

## 🔥 **ANTI-PATTERNS TO AVOID**

### ❌ **Wrong Approaches:**
- "Let's read from existing .md files"
- "We'll sync database with markdown files" 
- "Parse docs/progress/ for real data"
- "Two-way sync between files and database"

### ✅ **Correct Approaches:**
- "Replace mock data with database persistence"
- "Store everything in SQLite/PostgreSQL" 
- "Eliminate docs/progress/ folder entirely"
- "Only CLAUDE.md remains for core instructions"

## 🎯 **WHAT WE'RE ACTUALLY BUILDING**

### Current Task 5.8.2 Status:
- ✅ **UI Complete** - Full configuration management interface
- ✅ **GraphQL Schema** - All resolvers and types defined  
- ✅ **Database Schema** - SQLite tables created
- 🟡 **In Progress** - Connect UI to real database (NOT mock data)

### Next Steps:
- Replace ALL mock arrays with database queries
- Test real CRUD operations  
- Verify persistence works
- NO .md file integration

## 🧠 **CONTEXT PRESERVATION RULES**

### Before Making ANY Suggestion:
1. **Read this file first** - Check if approach contradicts core objective
2. **Ask:** Does this eliminate or create .md dependencies?
3. **Verify:** Are we replacing mock data with real persistence?
4. **Confirm:** Does this move us toward zero .md files?

### When Confused About Direction:
- **Default Answer:** "Store in database, not files"
- **When in Doubt:** "Eliminate .md dependencies"
- **Always Ask:** "Does this align with zero .md file goal?"

## 🔄 **MISTAKE PREVENTION SYSTEM**

### Pattern Recognition:
- **If suggesting .md integration** → STOP and re-read this file
- **If proposing file syncing** → Wrong direction, use database only
- **If talking about parsing docs/** → Contradicts core objective

### Quick Validation Questions:
1. Will this reduce or increase .md file usage? (Should reduce)
2. Are we moving toward database-only persistence? (Should be YES)
3. Does this align with "Zero .md dependencies" goal? (Should be YES)

## 📊 **SUCCESS METRICS REMINDER**

- ✅ **End Goal:** Universal GraphQL-driven project management
- ✅ **Data Storage:** SQLite/PostgreSQL database only
- ✅ **File Dependencies:** Only CLAUDE.md remains
- ❌ **NO MORE:** docs/progress/ folder maintenance
- ❌ **NO MORE:** Markdown file syncing/parsing

## 🚀 **CURRENT PRIORITY**

**Replace mock data with real database persistence:**
1. Connect useConfiguration hooks to GraphQL
2. Test real CRUD operations in UI
3. Verify SQLite database operations work
4. Eliminate all mock arrays from components

**DO NOT:**
- Integrate with existing .md files
- Create file parsing systems  
- Build sync mechanisms
- Reference docs/progress/ content

---

**Remember: Every decision should move us closer to ZERO .md files (except CLAUDE.md)**
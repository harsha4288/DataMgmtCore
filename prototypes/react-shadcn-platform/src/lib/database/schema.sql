-- Universal Configuration Management Database Schema
-- Purpose: Replace .md file dependencies with real database persistence

-- User Instructions Repository
CREATE TABLE IF NOT EXISTS user_instructions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_types TEXT NOT NULL, -- JSON array
    context TEXT NOT NULL, -- JSON array  
    tags TEXT NOT NULL, -- JSON array
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    version TEXT NOT NULL DEFAULT '1.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tool Configurations
CREATE TABLE IF NOT EXISTS tool_configurations (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('development_tools', 'testing_frameworks', 'build_systems', 'quality_tools', 'integration_tools')),
    environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production', 'testing')),
    configuration TEXT NOT NULL, -- JSON object
    user_types TEXT NOT NULL, -- JSON array
    validation_rules TEXT NOT NULL DEFAULT '[]', -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Templates
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('task_template', 'issue_template', 'review_template', 'report_template', 'communication_template')),
    content TEXT NOT NULL,
    variables TEXT NOT NULL DEFAULT '[]', -- JSON array
    conditions TEXT NOT NULL DEFAULT '[]', -- JSON array
    output_formats TEXT NOT NULL, -- JSON array
    user_types TEXT NOT NULL, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quality Standards
CREATE TABLE IF NOT EXISTS quality_standards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('code_quality', 'documentation_quality', 'process_quality', 'output_quality', 'communication_quality')),
    description TEXT NOT NULL,
    rules TEXT NOT NULL, -- JSON array
    user_types TEXT NOT NULL, -- JSON array
    enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Legacy tasks table removed

-- Legacy phases table removed

-- Legacy issues table removed

-- Documents (Replacing .md files entirely - Phase 2.1)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Full markdown content
    type TEXT NOT NULL CHECK (type IN ('requirements', 'technical', 'implementation', 'all')) DEFAULT 'technical',
    status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'approved', 'archived')) DEFAULT 'draft',
    entity_id TEXT NOT NULL, -- task-5.8.3.1, phase-5, etc.
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'phase', 'subtask', 'issue')),
    author TEXT DEFAULT 'Development Team',
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_instructions_priority ON user_instructions(priority);
CREATE INDEX IF NOT EXISTS idx_user_instructions_updated_at ON user_instructions(updated_at);
CREATE INDEX IF NOT EXISTS idx_tool_configurations_category ON tool_configurations(category);
CREATE INDEX IF NOT EXISTS idx_tool_configurations_environment ON tool_configurations(environment);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_quality_standards_category ON quality_standards(category);
CREATE INDEX IF NOT EXISTS idx_quality_standards_enabled ON quality_standards(enabled);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_phases_status ON phases(status);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_type ON issues(type);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
-- idx_entities_parent removed - now using entity_relationships
CREATE INDEX IF NOT EXISTS idx_entities_board ON entities(board_id);
-- idx_entities_hierarchy removed - now using entity_relationships
-- idx_entities_level removed - level calculated dynamically
CREATE INDEX IF NOT EXISTS idx_entities_priority ON entities(priority);
CREATE INDEX IF NOT EXISTS idx_entities_assignee ON entities(assignee);
CREATE INDEX IF NOT EXISTS idx_entities_completion ON entities(completion_date);

-- Indexes for entity relationships table
CREATE INDEX IF NOT EXISTS idx_relationships_source ON entity_relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON entity_relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON entity_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_active ON entity_relationships(is_active);
CREATE INDEX IF NOT EXISTS idx_relationships_strength ON entity_relationships(strength);
CREATE INDEX IF NOT EXISTS idx_relationships_created ON entity_relationships(created_at);

-- Indexes for working context table
CREATE INDEX IF NOT EXISTS idx_working_context_user ON working_context(user_id);
CREATE INDEX IF NOT EXISTS idx_working_context_entity ON working_context(current_entity_id);
CREATE INDEX IF NOT EXISTS idx_working_context_activity ON working_context(last_activity);

-- Board prefixes for unique entity ID generation (JIRA-style)
CREATE TABLE IF NOT EXISTS boards (
    prefix VARCHAR(50) PRIMARY KEY,         -- PET, CORE.UI, ALUMNI.DB, RAJ.WORK, etc.
    name TEXT NOT NULL,                     -- "UI Components", "Alumni Database"
    description TEXT,                       -- Board purpose and scope
    current_counter INTEGER DEFAULT 0,      -- Next ID number to assign
    default_entity_type TEXT DEFAULT 'task', -- Default type for new entities
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,            -- Whether board is currently in use
    
    -- Constraints
    CHECK (default_entity_type IN ('project', 'phase', 'task', 'subtask', 'issue', 'epic', 'specification', 'quality_report', 'review', 'approval'))
);

-- Unified entities table (replaces tasks and phases tables)
-- This is the foundation for Task 5.8.4 Entity Interconnection Architecture
CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,                    -- TASK-1459, phase-5, ISSUE-123, etc.
    entity_type TEXT NOT NULL,              -- 'project', 'phase', 'task', 'subtask', 'issue', 'epic', 'specification', 'quality_report', 'review', 'approval'
    -- parent_id removed - now using entity_relationships table
    board_id TEXT NOT NULL,                 -- Board prefix used for this entity
    title TEXT NOT NULL,                    -- Display title
    description TEXT,                       -- Full description/content
    status TEXT NOT NULL,                   -- 'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
    priority TEXT,                          -- 'low', 'medium', 'high', 'critical'
    -- level and hierarchy_path removed - now calculated dynamically from entity_relationships
    sort_order INTEGER,                     -- Display ordering within parent
    
    -- Enhanced metadata and attributes
    metadata TEXT DEFAULT '{}',             -- JSON blob for entity-specific data
    attributes TEXT DEFAULT '{}',           -- JSON blob for custom fields per entity type
    
    -- Progress and lifecycle
    progress INTEGER DEFAULT 0,             -- 0-100 completion percentage (calculated, not hardcoded)
    estimated_hours REAL,                   -- Time estimates
    actual_hours REAL,                      -- Actual time spent
    start_date DATE,                        -- Entity start date
    due_date DATE,                          -- Entity due date
    completion_date DATE,                   -- When entity was completed
    
    -- Assignment and tracking
    assignee TEXT,                          -- Who is responsible
    labels TEXT DEFAULT '[]',               -- JSON array of labels/tags
    dependencies TEXT DEFAULT '[]',         -- JSON array of dependency IDs
    
    -- Audit trail
    created_by TEXT DEFAULT 'system',       -- Who created this entity
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT DEFAULT 'system',       -- Who last updated this entity
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (progress >= 0 AND progress <= 100),
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
    CHECK (entity_type IN ('project', 'phase', 'task', 'subtask', 'issue', 'epic', 'specification', 'quality_report', 'review', 'approval')),
    -- Constraints adjusted for simplified schema
    -- Foreign key relationships
    FOREIGN KEY (board_id) REFERENCES boards(prefix) ON DELETE RESTRICT
);

-- Entity Relationships table - The heart of Task 5.8.4 Entity Interconnection Architecture
CREATE TABLE IF NOT EXISTS entity_relationships (
    id TEXT PRIMARY KEY,                    -- Unique relationship ID
    source_entity_id TEXT NOT NULL,        -- Entity that starts the relationship
    target_entity_id TEXT NOT NULL,        -- Entity that receives the relationship
    relationship_type TEXT NOT NULL,       -- Type of relationship
    
    -- Relationship metadata
    strength REAL DEFAULT 0.5,             -- Confidence/strength of relationship (0-1)
    is_auto_generated BOOLEAN DEFAULT 0,   -- Whether relationship was auto-generated
    validated_by TEXT,                     -- Who validated this relationship
    validated_at DATETIME,                 -- When relationship was validated
    impact_score REAL DEFAULT 0.5,         -- How much one entity affects the other (0-1)
    
    -- Lifecycle management
    is_active BOOLEAN DEFAULT 1,           -- Whether relationship is currently active
    created_by TEXT DEFAULT 'system',      -- Who created the relationship
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT DEFAULT 'system',      -- Who last updated the relationship
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Bidirectional support
    is_bidirectional BOOLEAN DEFAULT 0,    -- Whether relationship works both ways
    reverse_type TEXT,                     -- Type when viewed from target to source
    
    -- Additional context
    context TEXT DEFAULT '{}',             -- JSON metadata for relationship context
    tags TEXT DEFAULT '[]',                -- JSON array of relationship tags
    notes TEXT,                            -- Human-readable notes about the relationship
    
    -- Constraints
    CHECK (strength >= 0 AND strength <= 1),
    CHECK (impact_score >= 0 AND impact_score <= 1),
    CHECK (relationship_type IN ('depends_on', 'blocks', 'relates_to', 'implements', 'tests', 'resolves', 'references', 'derived_from', 'supersedes', 'validates', 'generates', 'parent_of', 'child_of', 'duplicate_of', 'similar_to')),
    CHECK (source_entity_id != target_entity_id), -- Prevent self-references
    
    -- Foreign key relationships
    FOREIGN KEY (source_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (target_entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate relationships
    UNIQUE (source_entity_id, target_entity_id, relationship_type)
);

-- Working Context table - Track current user focus and context
CREATE TABLE IF NOT EXISTS working_context (
    id TEXT PRIMARY KEY,                    -- Context session ID
    user_id TEXT DEFAULT 'default',        -- User identifier (for multi-user support)
    current_entity_id TEXT NOT NULL,       -- Entity currently being worked on
    context_breadcrumb TEXT NOT NULL,      -- JSON array of breadcrumb path
    focus_start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Context metadata
    work_type TEXT,                        -- 'implementation', 'review', 'planning', etc.
    context_notes TEXT,                    -- Notes about current work context
    session_metadata TEXT DEFAULT '{}',    -- JSON blob for session-specific data
    
    -- Activity tracking
    time_spent_minutes INTEGER DEFAULT 0,  -- Time spent on this entity
    activity_count INTEGER DEFAULT 0,      -- Number of activities in this context
    last_checkpoint DATETIME,              -- Last major progress checkpoint
    
    FOREIGN KEY (current_entity_id) REFERENCES entities(id) ON DELETE CASCADE
);

-- Initial seed data for demonstration
INSERT OR IGNORE INTO user_instructions (id, title, content, user_types, context, tags, priority) VALUES 
('inst-1', 'Theme System Usage Guidelines', 'Always use CSS variables from the theme system. Never hardcode colors in components. Use `hsl(var(--variable))` format.', '["human_developer", "ai_agent"]', '[{"id": "ctx-1", "name": "React Development", "category": "tech_stack", "conditions": {"framework": "react", "hasTheme": true}}]', '["theme", "css", "styling", "best-practices"]', 'high'),
('inst-2', 'Quality Gate Requirements', 'Before marking any task complete: 1) Run `npm run lint` 2) Run `npm run type-check` 3) Get manual testing approval from user', '["ai_agent", "qa_tester"]', '[{"id": "ctx-2", "name": "Task Completion", "category": "task_type", "conditions": {"phase": "any", "requiresApproval": true}}]', '["quality", "testing", "workflow"]', 'critical'),
('inst-3', 'Component Reusability Standards', 'Aim for >85% component reusability. Create shared components in /components/ui/ for common patterns.', '["human_developer"]', '[{"id": "ctx-3", "name": "Component Development", "category": "complexity", "conditions": {"complexity": "medium", "isSharedComponent": true}}]', '["components", "reusability", "architecture"]', 'medium');

INSERT OR IGNORE INTO tool_configurations (id, tool_name, category, environment, configuration, user_types) VALUES 
('tool-1', 'ESLint', 'development_tools', 'development', '{"extends": ["@typescript-eslint/recommended"], "rules": {"@typescript-eslint/no-unused-vars": "error", "@typescript-eslint/no-explicit-any": "warn"}, "parserOptions": {"ecmaVersion": 2022, "sourceType": "module"}}', '["human_developer", "ai_agent"]'),
('tool-2', 'Vitest', 'testing_frameworks', 'testing', '{"testMatch": ["**/__tests__/**/*.test.{js,ts,tsx}"], "setupFilesAfterEnv": ["<rootDir>/src/setupTests.ts"], "coverage": {"threshold": {"global": {"branches": 80, "functions": 80, "lines": 80, "statements": 80}}}}', '["human_developer", "qa_tester", "ai_agent"]'),
('tool-3', 'Vite', 'build_systems', 'development', '{"plugins": ["@vitejs/plugin-react"], "resolve": {"alias": {"@": "/src"}}, "server": {"port": 5173, "open": true}}', '["human_developer"]'),
('tool-4', 'SonarQube', 'quality_tools', 'production', '{"sonar.projectKey": "react-shadcn-platform", "sonar.sources": "src", "sonar.tests": "src", "sonar.test.inclusions": "**/*.test.ts,**/*.test.tsx", "sonar.typescript.lcov.reportPaths": "coverage/lcov.info", "sonar.coverage.exclusions": "**/*.test.ts,**/*.test.tsx"}', '["qa_tester", "project_manager"]');

INSERT OR IGNORE INTO templates (id, name, type, content, variables, conditions, output_formats, user_types) VALUES 
('tpl-1', 'Task Creation Template', 'task_template', '# Task {{taskId}}: {{taskName}}\n\n> **Status:** {{status}}  \n> **Priority:** {{priority}}  \n> **Estimated Time:** {{estimatedHours}} hours  \n\n## 🎯 Objective\n\n{{description}}\n\n## 📋 Sub-Tasks\n\n{{#subtasks}}\n- [ ] {{name}}: {{description}}\n{{/subtasks}}\n\n## ✅ Success Criteria\n\n{{successCriteria}}\n\n---\n*Generated on {{date}} using Configuration Management System*', '[{"name": "taskId", "type": "string", "required": true}, {"name": "taskName", "type": "string", "required": true}, {"name": "status", "type": "string", "required": false, "defaultValue": "pending"}, {"name": "priority", "type": "string", "required": false, "defaultValue": "medium"}, {"name": "estimatedHours", "type": "number", "required": false, "defaultValue": 0}, {"name": "description", "type": "string", "required": true}, {"name": "subtasks", "type": "array", "required": false, "defaultValue": []}, {"name": "successCriteria", "type": "string", "required": true}, {"name": "date", "type": "string", "required": false, "defaultValue": "today"}]', '[]', '["markdown", "json", "html"]', '["ai_agent", "project_manager", "human_developer"]'),
('tpl-2', 'Issue Report Template', 'issue_template', '# Issue Report: {{title}}\n\n**Type:** {{type}}  \n**Severity:** {{severity}}  \n**Reported by:** {{reporter}}  \n**Date:** {{date}}\n\n## 📝 Description\n\n{{description}}\n\n## 🔄 Steps to Reproduce\n\n{{#steps}}\n{{index}}. {{description}}\n{{/steps}}\n\n## ✅ Expected Behavior\n\n{{expectedBehavior}}\n\n## ❌ Actual Behavior\n\n{{actualBehavior}}\n\n## 💻 Environment\n\n- **Browser:** {{browser}}\n- **OS:** {{os}}\n- **Version:** {{version}}\n\n## 📎 Additional Context\n\n{{additionalContext}}', '[{"name": "title", "type": "string", "required": true}, {"name": "type", "type": "string", "required": false, "defaultValue": "bug"}, {"name": "severity", "type": "string", "required": false, "defaultValue": "medium"}, {"name": "reporter", "type": "string", "required": true}, {"name": "date", "type": "string", "required": false, "defaultValue": "today"}, {"name": "description", "type": "string", "required": true}, {"name": "steps", "type": "array", "required": false}, {"name": "expectedBehavior", "type": "string", "required": true}, {"name": "actualBehavior", "type": "string", "required": true}, {"name": "browser", "type": "string", "required": false}, {"name": "os", "type": "string", "required": false}, {"name": "version", "type": "string", "required": false}, {"name": "additionalContext", "type": "string", "required": false}]', '[]', '["markdown", "json", "html"]', '["qa_tester", "human_developer", "project_manager"]'),
('tpl-3', 'Code Review Template', 'review_template', '# Code Review: {{pullRequestTitle}}\n\n**Reviewer:** {{reviewer}}  \n**Author:** {{author}}  \n**Date:** {{date}}\n\n## 📊 Summary\n\n{{summary}}\n\n## ✅ Checklist\n\n- [ ] Code follows project style guidelines\n- [ ] Self-review of the code has been performed\n- [ ] Code is well-commented, particularly hard-to-understand areas\n- [ ] No new warnings introduced\n- [ ] Tests added/updated for new functionality\n- [ ] All tests passing\n- [ ] Documentation updated if needed\n\n## 🔍 Review Notes\n\n{{reviewNotes}}\n\n## 🎯 Action Items\n\n{{#actionItems}}\n- [ ] {{description}} - {{assignee}}\n{{/actionItems}}\n\n## ✅ Approval\n\n{{approvalStatus}}', '[{"name": "pullRequestTitle", "type": "string", "required": true}, {"name": "reviewer", "type": "string", "required": true}, {"name": "author", "type": "string", "required": true}, {"name": "date", "type": "string", "required": false, "defaultValue": "today"}, {"name": "summary", "type": "string", "required": true}, {"name": "reviewNotes", "type": "string", "required": false}, {"name": "actionItems", "type": "array", "required": false}, {"name": "approvalStatus", "type": "string", "required": false, "defaultValue": "pending"}]', '[]', '["markdown", "json"]', '["human_developer", "qa_tester", "project_manager"]');

INSERT OR IGNORE INTO quality_standards (id, name, category, description, rules, user_types, enabled) VALUES 
('qstd-1', 'Theme System Compliance', 'code_quality', 'Ensures all UI components use the theme system correctly without hardcoded colors', '[{"name": "no_hardcoded_colors", "description": "No hardcoded color values allowed", "automated": true, "severity": "error", "parameters": {"allowedExceptions": ["rgba for shadows", "transparent"]}}, {"name": "theme_compliance", "description": "Must use hsl(var(--variable)) format", "automated": true, "severity": "error", "parameters": {"requiredPattern": "hsl\\(var\\(--[\\w-]+\\)\\)"}}]', '["human_developer", "ai_agent"]', 1),
('qstd-2', 'Component Reusability Standards', 'code_quality', 'Ensures components are built for reusability with proper prop interfaces', '[{"name": "component_reusability", "description": "Components should have proper prop interfaces", "automated": true, "severity": "warning", "parameters": {"minReusabilityScore": 85}}, {"name": "prop_validation", "description": "All props should be typed", "automated": true, "severity": "error", "parameters": {}}]', '["human_developer"]', 1),
('qstd-3', 'Documentation Quality', 'documentation_quality', 'Ensures code is properly documented and maintainable', '[{"name": "documentation_completeness", "description": "Public functions and components must be documented", "automated": true, "severity": "warning", "parameters": {"requireJSDoc": true}}, {"name": "comment_quality", "description": "Comments should be meaningful and up-to-date", "automated": false, "severity": "info", "parameters": {}}]', '["human_developer", "ai_agent", "qa_tester"]', 1),
('qstd-4', 'Quality Gate Process', 'process_quality', 'Defines the quality gates that must pass before task completion', '[{"name": "lint_check", "description": "ESLint must pass with 0 errors", "automated": true, "severity": "critical", "parameters": {"command": "npm run lint"}}, {"name": "type_check", "description": "TypeScript compilation must succeed", "automated": true, "severity": "critical", "parameters": {"command": "npm run type-check"}}, {"name": "manual_testing", "description": "Manual testing approval required", "automated": false, "severity": "critical", "parameters": {"requiresUserApproval": true}}]', '["ai_agent", "qa_tester", "project_manager"]', 1);

-- Sample document data (Phase 2.1) - replaces .md files
INSERT OR IGNORE INTO documents (id, title, content, type, status, entity_id, entity_type, author) VALUES 
('doc-subtask-0', 'Express.js Server Setup with WebSocket Support', '# Subtask 0: Express.js Server Setup with WebSocket Support

> **Status:** 🔄 In Progress  
> **Priority:** Critical  
> **Parent Task:** Task 5.4: Real-Time Dashboard  

## 🎯 Objective

**Primary Goal:** Set up Express.js server with WebSocket support for real-time dashboard functionality.

**Specific Focus:**
- Configure Express.js server foundation
- Implement WebSocket connections for real-time updates
- Set up proper error handling and connection management
- Prepare for dashboard metrics integration

**Key Principle:** Robust real-time communication foundation for dashboard metrics.

## ✅ Current Progress

### PHASE 1: Server Foundation ✅ COMPLETED
- ✅ **DONE**: Express.js server configuration
- ✅ **DONE**: Basic routing structure
- ✅ **DONE**: Error handling middleware

### PHASE 2: WebSocket Integration 🔄 IN PROGRESS
- **Phase 2.1**: ✅ COMPLETED - WebSocket server setup
- **Phase 2.2**: ❌ PENDING - Real-time metrics broadcasting

## 🚀 Next Steps

1. **Complete Phase 2.2**: Real-time metrics broadcasting
2. **Phase 3**: Dashboard client integration
3. **Phase 4**: Performance optimization

---
*Document stored in SQLite database via GraphQL API*', 'technical', 'review', 'subtask-0', 'subtask', 'Development Team'),

('doc-phase-5', 'Universal Project Management Phase', '# Phase 5: Universal Project Management

> **Status:** 🔄 In Progress  
> **Progress:** 70%  
> **Estimated Completion:** December 2024  

## 📖 Overview

This phase focuses on creating a universal project management system that integrates advanced dashboard functionality, entity interconnection, and quality gates.

## 🎯 Key Objectives

1. **Advanced Dashboard Functionality** - Complete interactive dashboard with real-time updates
2. **Entity Interconnection System** - Link tasks, phases, issues, and documents
3. **Quality Gate Implementation** - Automated quality checks and approvals
4. **Performance Optimization** - Ensure scalable and fast performance

## 📋 Tasks

- **Task 5.8.1**: Foundation Infrastructure ✅ COMPLETED
- **Task 5.8.3**: Advanced Dashboard ⚡ IN PROGRESS
- **Task 5.8.4**: Entity Interconnection ⏳ PENDING
- **Task 5.8.5**: Quality Gates ⏳ PENDING

## ✅ Success Metrics

- 100% component reusability achieved
- Zero hardcoded values (theme compliance)
- All quality gates passing
- Manual testing approval from stakeholders

---
*Document managed via Configuration Management System*', 'requirements', 'approved', 'phase-5', 'phase', 'Project Manager');
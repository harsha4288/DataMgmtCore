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

-- Tasks (Replacing .md files in docs/progress/)
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    phase_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')) DEFAULT 'pending',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    estimated_hours REAL,
    actual_hours REAL,
    assignee TEXT,
    labels TEXT NOT NULL DEFAULT '[]', -- JSON array
    dependencies TEXT NOT NULL DEFAULT '[]', -- JSON array
    subtasks TEXT NOT NULL DEFAULT '[]', -- JSON array
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completion_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Phases (Replacing phase .md files)
CREATE TABLE IF NOT EXISTS phases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    completion_date DATE,
    total_estimated_hours REAL,
    total_actual_hours REAL,
    dependencies TEXT NOT NULL DEFAULT '[]', -- JSON array
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Issues (Quality assurance and bug tracking)
CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'qa', 'uat')) DEFAULT 'qa',
    status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    related_tasks TEXT NOT NULL DEFAULT '[]', -- JSON array
    resolution_attempts TEXT NOT NULL DEFAULT '[]', -- JSON array
    resolved_date DATE,
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
/**
 * GraphQL Server for Documentation System
 * Runs on port 3004, provides GraphQL API and GraphiQL playground
 */

const { createYoga, createSchema } = require('graphql-yoga');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Database setup for configuration management
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../src/lib/database/database.db');

// Initialize database with proper error handling and connection management
let db;
const initializeDatabase = () => {
  try {
    // Ensure database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(dbPath);
    
    // Configure database for better performance and crash prevention
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma('foreign_keys = ON');
    
    // Create tables if they don't exist
    const schemaPath = path.join(__dirname, '../src/lib/database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      // Execute schema in transaction to prevent partial failures
      db.transaction(() => {
        db.exec(schema);
      })();
    }
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    // Create an in-memory database as fallback
    console.log('Falling back to in-memory database');
    return new Database(':memory:');
  }
};

// Initialize database with retry logic
let dbInitRetries = 0;
const initWithRetry = () => {
  try {
    return initializeDatabase();
  } catch (error) {
    dbInitRetries++;
    if (dbInitRetries < 3) {
      console.log(`Database init retry ${dbInitRetries}/3`);
      setTimeout(initWithRetry, 1000);
    } else {
      throw error;
    }
  }
};

db = initWithRetry();

// Import TypeScript files (they'll be transpiled on the fly in a real setup)
// For now, we'll include the schema and resolvers directly

const typeDefs = `
  # Core types
  type Task {
    id: ID!
    name: String!
    description: String!
    phase_id: String!
    status: TaskStatusEnum!
    progress: Float!
    completion_date: String
    subtasks: [SubTask!]!
    metadata: TaskMetadata!
    created_at: String!
    updated_at: String!
  }

  type SubTask {
    id: ID!
    name: String!
    description: String
    completed: Boolean!
    completion_date: String
  }

  type TaskMetadata {
    status: TaskStatusEnum!
    priority: PriorityEnum!
    assignee: String
    labels: [String!]!
    dependencies: [String!]!
    estimated_hours: Float
    actual_hours: Float
  }

  type Phase {
    id: ID!
    name: String!
    description: String!
    status: PhaseStatusEnum!
    progress: Float!
    tasks: [Task!]!
    metadata: PhaseMetadata!
  }

  type PhaseMetadata {
    start_date: String
    end_date: String
    completion_date: String
    total_estimated_hours: Float
    total_actual_hours: Float
    dependencies: [String!]!
  }

  type Issue {
    id: ID!
    title: String!
    description: String!
    type: IssueTypeEnum!
    status: IssueStatusEnum!
    severity: SeverityEnum!
    related_tasks: [String!]!
    resolution_attempts: [ResolutionAttempt!]!
    created_date: String!
    resolved_date: String
  }

  type ResolutionAttempt {
    id: ID!
    approach: String!
    outcome: OutcomeEnum!
    details: String!
    lessons_learned: [String!]!
    timestamp: String!
    tokens_used: Int
  }

  # Enums
  enum TaskStatusEnum {
    pending
    in_progress
    completed
    blocked
    cancelled
  }

  enum PhaseStatusEnum {
    pending
    in_progress
    completed
  }

  enum PriorityEnum {
    low
    medium
    high
    critical
  }

  enum IssueTypeEnum {
    bug
    feature
    improvement
    qa
    uat
  }

  enum IssueStatusEnum {
    open
    in_progress
    resolved
    closed
  }

  enum SeverityEnum {
    low
    medium
    high
    critical
  }

  enum OutcomeEnum {
    success
    failure
    partial
  }

  # Input types
  input TaskInput {
    id: String!
    name: String!
    description: String!
    phase_id: String!
    metadata: TaskMetadataInput!
    subtasks: [SubTaskInput!]!
  }

  input TaskMetadataInput {
    status: TaskStatusEnum = pending
    priority: PriorityEnum = medium
    assignee: String
    labels: [String!] = []
    dependencies: [String!] = []
    estimated_hours: Float
  }

  input SubTaskInput {
    name: String!
    description: String
    completed: Boolean = false
  }

  input PhaseInput {
    id: String!
    name: String!
    description: String!
    metadata: PhaseMetadataInput
  }

  input PhaseMetadataInput {
    start_date: String
    end_date: String
    total_estimated_hours: Float
    dependencies: [String!] = []
  }

  input IssueInput {
    title: String!
    description: String!
    type: IssueTypeEnum = qa
    severity: SeverityEnum = medium
    related_tasks: [String!] = []
    resolution_attempts: [ResolutionAttemptInput!] = []
  }

  input ResolutionAttemptInput {
    approach: String!
    outcome: OutcomeEnum!
    details: String!
    lessons_learned: [String!] = []
    tokens_used: Int
  }

  # Documentation output types
  type MarkdownOutput {
    content: String!
    metadata: OutputMetadata!
  }

  type OutputMetadata {
    generated_at: String!
    source: String!
    consumer: String!
  }

  # Response types
  type TaskResponse {
    task: Task
    success: Boolean!
    error: String
    markdown: String
  }

  type PhaseResponse {
    phase: Phase
    success: Boolean!
    error: String
    markdown: String
  }

  type IssueResponse {
    issue: Issue
    success: Boolean!
    error: String
    markdown: String
  }

  # Query types
  type Query {
    # Get all data
    getAllPhases: [Phase!]!
    getAllTasks: [Task!]!
    getAllIssues: [Issue!]!
    
    # Get by ID
    getPhase(id: ID!): Phase
    getTask(id: ID!): Task
    getIssue(id: ID!): Issue
    
    # Get by status
    getTasksByStatus(status: TaskStatusEnum!): [Task!]!
    getPhasesByStatus(status: PhaseStatusEnum!): [Phase!]!
    getIssuesByStatus(status: IssueStatusEnum!): [Issue!]!
    
    # Search and filter
    searchTasks(query: String!): [Task!]!
    getTasksByPhase(phase_id: String!): [Task!]!
    getRelatedTasks(task_id: ID!): [Task!]!
    
    # Generate markdown
    generateTaskMarkdown(id: ID!, consumer: String = "human"): MarkdownOutput
    generatePhaseMarkdown(id: ID!, consumer: String = "human"): MarkdownOutput
    generateIssueMarkdown(id: ID!, consumer: String = "human"): MarkdownOutput
    
    # Statistics
    getProjectStats: ProjectStats!

    # Configuration Management Queries
    getUserInstructions(userType: String, context: String): [UserInstruction!]!
    getUserInstruction(id: ID!): UserInstruction
    searchUserInstructions(query: String!, userType: String): [UserInstruction!]!
    
    getToolConfigurations(category: String, environment: String, userType: String): [ToolConfiguration!]!
    getToolConfiguration(id: ID!): ToolConfiguration
    
    getTemplates(type: String, userType: String): [Template!]!
    getTemplate(id: ID!): Template
    
    getQualityStandards(category: String, userType: String): [QualityStandard!]!
    getQualityStandard(id: ID!): QualityStandard
  }

  type ProjectStats {
    total_phases: Int!
    total_tasks: Int!
    total_issues: Int!
    completed_tasks: Int!
    in_progress_tasks: Int!
    blocked_tasks: Int!
    completion_percentage: Float!
    avg_task_completion_time: Float
  }

  # JSON scalar type (define first to avoid conflicts)
  scalar JSON

  # Configuration Management Types
  type UserInstruction {
    id: ID!
    title: String!
    content: String!
    userTypes: [String!]!
    context: JSON
    tags: [String!]!
    priority: String!
    lastUpdated: String!
    version: String!
  }

  type ToolConfiguration {
    id: ID!
    toolName: String!
    category: String!
    environment: String!
    configuration: JSON!
    userTypes: [String!]!
    validationRules: [String!]!
    lastUpdated: String!
  }

  type Template {
    id: ID!
    name: String!
    type: String!
    content: String!
    variables: [TemplateVariable!]!
    conditions: [String!]!
    outputFormats: [String!]!
    userTypes: [String!]!
    lastUpdated: String!
  }

  type TemplateVariable {
    name: String!
    type: String!
    required: Boolean!
    defaultValue: JSON
  }

  type QualityStandard {
    id: ID!
    name: String!
    category: String!
    description: String!
    rules: [QualityRule!]!
    userTypes: [String!]!
    enabled: Boolean!
    lastUpdated: String!
  }

  type QualityRule {
    name: String!
    description: String!
    automated: Boolean!
    severity: String!
    parameters: JSON
  }

  # Mutation types
  type Mutation {
    # Create operations
    createTask(input: TaskInput!): TaskResponse!
    createPhase(input: PhaseInput!): PhaseResponse!
    createIssue(input: IssueInput!): IssueResponse!
    
    # Update operations
    updateTaskStatus(id: ID!, status: TaskStatusEnum!): TaskResponse!
    updateTaskProgress(id: ID!, progress: Float!): TaskResponse!
    completeSubtask(task_id: ID!, subtask_index: Int!): TaskResponse!
    
    # Issue operations
    addResolutionAttempt(issue_id: ID!, attempt: ResolutionAttemptInput!): IssueResponse!
    resolveIssue(id: ID!): IssueResponse!
    
    # File operations
    saveTaskToFile(id: ID!): TaskResponse!
    savePhaseToFile(id: ID!): PhaseResponse!
    saveIssueToFile(id: ID!): IssueResponse!

    # Configuration Management Mutations
    createUserInstruction(input: UserInstructionInput!): UserInstructionResponse!
    updateUserInstruction(id: ID!, input: UserInstructionInput!): UserInstructionResponse!
    deleteUserInstruction(id: ID!): UserInstructionResponse!
    
    createToolConfiguration(input: ToolConfigurationInput!): ToolConfigurationResponse!
    updateToolConfiguration(id: ID!, input: ToolConfigurationInput!): ToolConfigurationResponse!
    deleteToolConfiguration(id: ID!): ToolConfigurationResponse!
    
    createTemplate(input: TemplateInput!): TemplateResponse!
    updateTemplate(id: ID!, input: TemplateInput!): TemplateResponse!
    deleteTemplate(id: ID!): TemplateResponse!
    
    createQualityStandard(input: QualityStandardInput!): QualityStandardResponse!
    updateQualityStandard(id: ID!, input: QualityStandardInput!): QualityStandardResponse!
    deleteQualityStandard(id: ID!): QualityStandardResponse!
  }

  input UserInstructionInput {
    title: String!
    content: String!
    userTypes: [String!]!
    context: String
    tags: [String!]
    priority: String!
  }

  input ToolConfigurationInput {
    toolName: String!
    category: String!
    environment: String!
    configuration: String!
    userTypes: [String!]!
    validationRules: [String!]
  }

  input TemplateInput {
    name: String!
    type: String!
    content: String!
    variables: [TemplateVariableInput!]
    conditions: [String!]
    outputFormats: [String!]!
    userTypes: [String!]!
  }

  input TemplateVariableInput {
    name: String!
    type: String!
    required: Boolean!
    defaultValue: JSON
  }

  input QualityStandardInput {
    name: String!
    category: String!
    description: String!
    rules: [QualityRuleInput!]!
    userTypes: [String!]!
    enabled: Boolean!
  }

  input QualityRuleInput {
    name: String!
    description: String!
    automated: Boolean!
    severity: String!
    parameters: JSON
  }

  type UserInstructionResponse {
    success: Boolean!
    error: String
    userInstruction: UserInstruction
  }

  type ToolConfigurationResponse {
    success: Boolean!
    error: String
    toolConfiguration: ToolConfiguration
  }

  type TemplateResponse {
    success: Boolean!
    error: String
    template: Template
  }

  type QualityStandardResponse {
    success: Boolean!
    error: String
    qualityStandard: QualityStandard
  }
`;

// Data Sources Implementation
class DocumentationDataSources {
  constructor(basePath = '../docs/progress') {
    this.basePath = path.resolve(__dirname, basePath);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getAllPhases() {
    const cacheKey = 'all_phases';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const phases = [];
      if (!fs.existsSync(this.basePath)) {
        return [];
      }
      
      const phaseDirs = fs.readdirSync(this.basePath)
        .filter(dir => dir.startsWith('phase-'))
        .sort();

      for (const phaseDir of phaseDirs) {
        const phasePath = path.join(this.basePath, phaseDir);
        const phase = await this.parsePhaseDirectory(phasePath, phaseDir);
        if (phase) {
          phases.push(phase);
        }
      }

      this.setCache(cacheKey, phases);
      return phases;
    } catch (error) {
      console.error('Error loading phases:', error);
      return [];
    }
  }

  async getAllTasks() {
    const phases = await this.getAllPhases();
    const tasks = [];
    for (const phase of phases) {
      tasks.push(...phase.tasks);
    }
    return tasks;
  }

  async getAllIssues() {
    const cacheKey = 'all_issues';
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const issues = [];
      const issuesPath = path.join(path.dirname(this.basePath), 'issues');
      
      if (fs.existsSync(issuesPath)) {
        const issueFiles = fs.readdirSync(issuesPath)
          .filter(file => file.endsWith('.md'))
          .sort();

        for (const file of issueFiles) {
          const filePath = path.join(issuesPath, file);
          const issue = await this.parseIssueFile(filePath);
          if (issue) {
            issues.push(issue);
          }
        }
      }

      this.setCache(cacheKey, issues);
      return issues;
    } catch (error) {
      console.error('Error loading issues:', error);
      return [];
    }
  }

  async getPhase(id) {
    const phases = await this.getAllPhases();
    return phases.find(phase => phase.id === id) || null;
  }

  async getTask(id) {
    const tasks = await this.getAllTasks();
    return tasks.find(task => task.id === id) || null;
  }

  async getIssue(id) {
    const issues = await this.getAllIssues();
    return issues.find(issue => issue.id === id) || null;
  }

  async searchTasks(query) {
    const tasks = await this.getAllTasks();
    const lowercaseQuery = query.toLowerCase();
    
    return tasks.filter(task => 
      task.name.toLowerCase().includes(lowercaseQuery) ||
      task.description.toLowerCase().includes(lowercaseQuery) ||
      task.metadata.labels.some(label => label.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getProjectStats() {
    const phases = await this.getAllPhases();
    const tasks = await this.getAllTasks();
    const issues = await this.getAllIssues();
    
    const completedTasks = tasks.filter(t => t.metadata.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.metadata.status === 'in_progress');
    const blockedTasks = tasks.filter(t => t.metadata.status === 'blocked');
    
    return {
      total_phases: phases.length,
      total_tasks: tasks.length,
      total_issues: issues.length,
      completed_tasks: completedTasks.length,
      in_progress_tasks: inProgressTasks.length,
      blocked_tasks: blockedTasks.length,
      completion_percentage: tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0
    };
  }

  async parsePhaseDirectory(phasePath, phaseDir) {
    try {
      const phaseNumber = phaseDir.replace('phase-', '');
      const readmePath = path.join(phasePath, 'README.md');
      
      if (!fs.existsSync(readmePath)) {
        return null;
      }

      const content = fs.readFileSync(readmePath, 'utf-8');
      const tasks = await this.parseTasksInPhase(phasePath, phaseDir);
      
      const nameMatch = content.match(/^# (.+)$/m);
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);
      
      return {
        id: phaseDir,
        name: nameMatch ? nameMatch[1] : `Phase ${phaseNumber}`,
        description: this.extractDescription(content),
        status: this.parsePhaseStatus(statusMatch ? statusMatch[1] : 'Pending'),
        progress: this.calculatePhaseProgress(tasks),
        tasks,
        metadata: {
          dependencies: []
        }
      };
    } catch (error) {
      console.error(`Error parsing phase ${phaseDir}:`, error);
      return null;
    }
  }

  async parseTasksInPhase(phasePath, phaseId) {
    const tasks = [];
    
    try {
      const files = fs.readdirSync(phasePath).filter(f => f.endsWith('.md') && f !== 'README.md');
      
      for (const file of files) {
        const filePath = path.join(phasePath, file);
        const task = await this.parseTaskFile(filePath, phaseId);
        if (task) {
          tasks.push(task);
        }
      }
    } catch (error) {
      console.error(`Error parsing tasks in ${phaseId}:`, error);
    }

    return tasks;
  }

  async parseTaskFile(filePath, phaseId) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      
      const nameMatch = content.match(/^# (.+)$/m);
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);
      const progressMatch = content.match(/\*\*Progress:\*\* (\d+)% \((\d+)\/(\d+)\)/);
      
      return {
        id: filename,
        name: nameMatch ? nameMatch[1] : filename,
        description: this.extractDescription(content),
        phase_id: phaseId,
        status: this.parseTaskStatus(statusMatch ? statusMatch[1] : 'Pending'),
        progress: progressMatch ? parseInt(progressMatch[1]) : 0,
        subtasks: this.parseSubtasks(content),
        metadata: {
          status: this.parseTaskStatus(statusMatch ? statusMatch[1] : 'Pending'),
          priority: 'medium',
          labels: [],
          dependencies: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error parsing task file ${filePath}:`, error);
      return null;
    }
  }

  async parseIssueFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const filename = path.basename(filePath, '.md');
      
      const titleMatch = content.match(/^# Issue: (.+)$/m);
      const typeMatch = content.match(/\*\*Type:\*\* (.+)$/m);
      const severityMatch = content.match(/\*\*Severity:\*\* (.+)$/m);
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);
      const createdDateMatch = content.match(/\*\*Created Date:\*\* (.+)$/m);
      const resolvedDateMatch = content.match(/\*\*Resolved Date:\*\* (.+)$/m);
      
      // Extract related tasks from the content
      const relatedTasksMatch = content.match(/\*\*Related Tasks:\*\*([\s\S]*?)(?=\*\*|$)/);
      const relatedTasks = relatedTasksMatch 
        ? relatedTasksMatch[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('- task-'))
            .map(line => line.replace('- ', ''))
        : [];
      
      // Parse resolution attempts
      const resolutionAttemptsMatch = content.match(/\*\*Resolution Attempts:\*\*([\s\S]*?)(?=\*\*|$)/);
      const resolutionAttempts = resolutionAttemptsMatch
        ? this.parseResolutionAttempts(resolutionAttemptsMatch[1])
        : [];
      
      return {
        id: filename,
        title: titleMatch ? titleMatch[1] : filename,
        description: this.extractDescription(content),
        type: this.parseIssueType(typeMatch ? typeMatch[1] : 'qa'),
        status: this.parseIssueStatus(statusMatch ? statusMatch[1] : 'open'),
        severity: this.parseSeverity(severityMatch ? severityMatch[1] : 'medium'),
        related_tasks: relatedTasks,
        resolution_attempts: resolutionAttempts,
        created_date: createdDateMatch ? createdDateMatch[1] : new Date().toISOString(),
        resolved_date: resolvedDateMatch ? resolvedDateMatch[1] : null
      };
    } catch (error) {
      console.error(`Error parsing issue file ${filePath}:`, error);
      return null;
    }
  }

  extractDescription(content) {
    const overviewMatch = content.match(/## (?:Overview|Description)\s*\n(.+?)(?=\n## |\n\n|$)/s);
    return overviewMatch ? overviewMatch[1].trim() : '';
  }

  parseSubtasks(content) {
    const subtaskMatches = content.match(/- \[(x| )\] (.+)/g);
    return subtaskMatches ? subtaskMatches.map((match, index) => {
      const completed = match.includes('[x]');
      const name = match.replace(/- \[(x| )\] /, '');
      return {
        id: `subtask-${index}`,
        name,
        description: '',
        completed
      };
    }) : [];
  }

  parseTaskStatus(status) {
    const statusMap = {
      'Complete': 'completed',
      'In Progress': 'in_progress',
      'Blocked': 'blocked',
      'Cancelled': 'cancelled',
      'Pending': 'pending'
    };
    
    const cleanStatus = status.replace(/[^\w\s]/g, '').trim();
    return statusMap[cleanStatus] || 'pending';
  }

  parsePhaseStatus(status) {
    const cleanStatus = status.replace(/[^\w\s]/g, '').trim();
    return cleanStatus === 'Complete' ? 'completed' : 
           cleanStatus === 'In Progress' ? 'in_progress' : 'pending';
  }

  parseIssueType(type) {
    const cleanType = type.toLowerCase().replace(/[^\w]/g, '');
    const types = ['bug', 'feature', 'improvement', 'qa', 'uat'];
    return types.includes(cleanType) ? cleanType : 'qa';
  }

  parseSeverity(severity) {
    const cleanSeverity = severity.toLowerCase().replace(/[^\w]/g, '');
    const severities = ['low', 'medium', 'high', 'critical'];
    return severities.includes(cleanSeverity) ? cleanSeverity : 'medium';
  }

  parseIssueStatus(status) {
    const cleanStatus = status.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const statusMap = {
      'open': 'open',
      'in progress': 'in_progress',
      'resolved': 'resolved',
      'closed': 'closed'
    };
    return statusMap[cleanStatus] || 'open';
  }

  parseResolutionAttempts(content) {
    const attempts = [];
    const lines = content.split('\n');
    let currentAttempt = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^\d+\./)) {
        // New attempt
        if (currentAttempt) {
          attempts.push(currentAttempt);
        }
        currentAttempt = {
          id: `attempt-${attempts.length + 1}`,
          approach: trimmedLine.replace(/^\d+\.\s*/, ''),
          outcome: 'partial',
          details: '',
          lessons_learned: [],
          timestamp: new Date().toISOString(),
          tokens_used: 0
        };
      } else if (currentAttempt && trimmedLine) {
        // Add to current attempt details
        currentAttempt.details += (currentAttempt.details ? '\n' : '') + trimmedLine;
      }
    }
    
    if (currentAttempt) {
      attempts.push(currentAttempt);
    }
    
    return attempts;
  }

  calculatePhaseProgress(tasks) {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return totalProgress / tasks.length;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  generateMarkdownOutput(data, type, consumer = 'human') {
    const content = consumer === 'ai' ? 
      JSON.stringify(data, null, 2) : 
      this.transformToMarkdown(data, type);
    
    return {
      content,
      metadata: {
        generated_at: new Date().toISOString(),
        source: `${type}:${data.id}`,
        consumer
      }
    };
  }

  transformToMarkdown(data, type) {
    // Simple markdown generation - in a real system this would be more sophisticated
    switch (type) {
      case 'task':
        return '# ' + data.name + '\n\n' +
               '**Status:** ' + data.metadata.status + '\n' +
               '**Progress:** ' + data.progress + '%\n' +
               '**Phase:** ' + data.phase_id + '\n\n' +
               '## Description\n' +
               data.description + '\n\n' +
               '## Sub-tasks\n' +
               data.subtasks.map(st => '- [' + (st.completed ? 'x' : ' ') + '] ' + st.name).join('\n');

      case 'phase':
        return '# ' + data.name + '\n\n' +
               '**Status:** ' + data.status + '\n' +
               '**Progress:** ' + data.progress + '%\n\n' +
               '## Description\n' +
               data.description + '\n\n' +
               '## Tasks\n' +
               data.tasks.map(t => '- ' + t.name + ' (' + t.metadata.status + ')').join('\n');

      case 'issue':
        return '# Issue: ' + data.title + '\n\n' +
               '**Type:** ' + data.type + '\n' +
               '**Severity:** ' + data.severity + '\n' +
               '**Status:** ' + data.status + '\n\n' +
               '## Description\n' +
               data.description;

      default:
        return JSON.stringify(data, null, 2);
    }
  }
}

// Error handling wrapper to prevent crashes
const withErrorHandler = (resolverFn, operationName) => {
  return async (...args) => {
    try {
      return await resolverFn(...args);
    } catch (error) {
      console.error(`GraphQL ${operationName} error:`, error);
      // Return appropriate error response instead of crashing
      if (operationName.includes('create') || operationName.includes('update') || operationName.includes('delete')) {
        return {
          success: false,
          error: `${operationName} failed: ${error.message}`,
          data: null
        };
      }
      return null; // For queries, return null instead of crashing
    }
  };
};

// Resolvers with crash prevention
const resolvers = {
  // JSON scalar resolver
  JSON: {
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => {
      if (ast.kind === 'StringValue') {
        try {
          return JSON.parse(ast.value);
        } catch {
          return ast.value;
        }
      }
      return null;
    }
  },

  Query: {
    getAllPhases: async (_, __, context) => {
      return await context.dataSources.getAllPhases();
    },
    getAllTasks: async (_, __, context) => {
      return await context.dataSources.getAllTasks();
    },
    getAllIssues: async (_, __, context) => {
      return await context.dataSources.getAllIssues();
    },
    getPhase: async (_, { id }, context) => {
      return await context.dataSources.getPhase(id);
    },
    getTask: async (_, { id }, context) => {
      return await context.dataSources.getTask(id);
    },
    getIssue: async (_, { id }, context) => {
      return await context.dataSources.getIssue(id);
    },
    getTasksByStatus: async (_, { status }, context) => {
      const tasks = await context.dataSources.getAllTasks();
      return tasks.filter(task => task.metadata.status === status);
    },
    getPhasesByStatus: async (_, { status }, context) => {
      const phases = await context.dataSources.getAllPhases();
      return phases.filter(phase => phase.status === status);
    },
    getIssuesByStatus: async (_, { status }, context) => {
      const issues = await context.dataSources.getAllIssues();
      return issues.filter(issue => issue.status === status);
    },
    searchTasks: async (_, { query }, context) => {
      return await context.dataSources.searchTasks(query);
    },
    getTasksByPhase: async (_, { phase_id }, context) => {
      const phase = await context.dataSources.getPhase(phase_id);
      return phase ? phase.tasks : [];
    },
    getRelatedTasks: async (_, { task_id }, context) => {
      const task = await context.dataSources.getTask(task_id);
      if (!task || !task.metadata.dependencies.length) return [];
      
      const allTasks = await context.dataSources.getAllTasks();
      return allTasks.filter(t => 
        task.metadata.dependencies.includes(t.id) || 
        t.metadata.dependencies.includes(task_id)
      );
    },
    generateTaskMarkdown: async (_, { id, consumer }, context) => {
      const task = await context.dataSources.getTask(id);
      if (!task) return null;
      
      return context.dataSources.generateMarkdownOutput(task, 'task', consumer);
    },
    generatePhaseMarkdown: async (_, { id, consumer }, context) => {
      const phase = await context.dataSources.getPhase(id);
      if (!phase) return null;
      
      return context.dataSources.generateMarkdownOutput(phase, 'phase', consumer);
    },
    generateIssueMarkdown: async (_, { id, consumer }, context) => {
      const issue = await context.dataSources.getIssue(id);
      if (!issue) return null;
      
      return context.dataSources.generateMarkdownOutput(issue, 'issue', consumer);
    },
    getProjectStats: async (_, __, context) => {
      return await context.dataSources.getProjectStats();
    },

    // Configuration Management Resolvers
    getUserInstructions: withErrorHandler(async (_, { userType, context: ctx }, context) => {
      let query = 'SELECT * FROM user_instructions';
      const params = [];
      
      if (userType || ctx) {
        const conditions = [];
        if (userType) {
          conditions.push('user_types LIKE ?');
          params.push(`%${userType}%`);
        }
        if (ctx) {
          conditions.push('context = ?');
          params.push(ctx);
        }
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      const stmt = db.prepare(query);
      const rows = stmt.all(...params);
      
      return rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        userTypes: JSON.parse(row.user_types || '[]'),
        context: JSON.parse(row.context || '[]'),
        tags: JSON.parse(row.tags || '[]'),
        priority: row.priority,
        lastUpdated: row.updated_at,
        version: row.version
      }));
    }, 'getUserInstructions'),
    getUserInstruction: async (_, { id }, context) => {
      return null;
    },
    searchUserInstructions: async (_, { query, userType }, context) => {
      return [];
    },
    getToolConfigurations: async (_, { category, environment, userType }, context) => {
      try {
        let query = 'SELECT * FROM tool_configurations';
        const params = [];
        
        if (category || environment || userType) {
          const conditions = [];
          if (category) {
            conditions.push('category = ?');
            params.push(category);
          }
          if (environment) {
            conditions.push('environment = ?');
            params.push(environment);
          }
          if (userType) {
            conditions.push('user_types LIKE ?');
            params.push(`%${userType}%`);
          }
          query += ' WHERE ' + conditions.join(' AND ');
        }
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params);
        
        return rows.map(row => ({
          id: row.id,
          toolName: row.tool_name,
          category: row.category,
          environment: row.environment,
          configuration: JSON.parse(row.configuration || '{}'),
          userTypes: JSON.parse(row.user_types || '[]'),
          validationRules: JSON.parse(row.validation_rules || '[]'),
          lastUpdated: row.updated_at
        }));
      } catch (error) {
        console.error('Error fetching tool configurations:', error);
        return [];
      }
    },
    getToolConfiguration: async (_, { id }, context) => {
      try {
        const stmt = db.prepare('SELECT * FROM tool_configurations WHERE id = ?');
        const row = stmt.get(id);
        
        if (!row) return null;
        
        return {
          id: row.id,
          toolName: row.tool_name,
          category: row.category,
          environment: row.environment,
          configuration: JSON.parse(row.configuration || '{}'),
          userTypes: JSON.parse(row.user_types || '[]'),
          validationRules: JSON.parse(row.validation_rules || '[]'),
          lastUpdated: row.updated_at
        };
      } catch (error) {
        console.error('Error fetching tool configuration:', error);
        return null;
      }
    },

    // Templates Queries
    getTemplates: async (_, { type, userType }, context) => {
      try {
        return await context.dataSources.templates.getTemplates(type, userType);
      } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
      }
    },
    getTemplate: async (_, { id }, context) => {
      try {
        const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
        const row = stmt.get(id);
        
        if (!row) return null;
        
        return {
          id: row.id,
          name: row.name,
          type: row.type,
          content: row.content,
          variables: JSON.parse(row.variables || '[]'),
          conditions: JSON.parse(row.conditions || '[]'),
          outputFormats: JSON.parse(row.output_formats || '["markdown"]'),
          userTypes: JSON.parse(row.user_types || '[]'),
          lastUpdated: row.updated_at
        };
      } catch (error) {
        console.error('Error fetching template:', error);
        return null;
      }
    },

    // Quality Standards Queries
    getQualityStandards: async (_, { category, userType }, context) => {
      try {
        return await context.dataSources.qualityStandards.getStandards(category, userType);
      } catch (error) {
        console.error('Error fetching quality standards:', error);
        return [];
      }
    },
    getQualityStandard: async (_, { id }, context) => {
      try {
        const stmt = db.prepare('SELECT * FROM quality_standards WHERE id = ?');
        const row = stmt.get(id);
        
        if (!row) return null;
        
        return {
          id: row.id,
          name: row.name,
          category: row.category,
          description: row.description,
          rules: JSON.parse(row.rules || '[]'),
          userTypes: JSON.parse(row.user_types || '[]'),
          enabled: row.enabled === 1,
          lastUpdated: row.updated_at
        };
      } catch (error) {
        console.error('Error fetching quality standard:', error);
        return null;
      }
    }
  },
  
  Mutation: {
    createTask: async (_, { input }, context) => {
      // For now, return a mock response - in real implementation this would create files
      const task = {
        id: input.id,
        name: input.name,
        description: input.description,
        phase_id: input.phase_id,
        status: input.metadata.status,
        progress: 0,
        subtasks: input.subtasks.map((st, index) => ({
          id: input.id + '.' + (index + 1),
          name: st.name,
          description: st.description,
          completed: st.completed || false
        })),
        metadata: input.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const markdown = context.dataSources.transformToMarkdown(task, 'task');
      
      return {
        task,
        success: true,
        error: null,
        markdown
      };
    },
    
    createPhase: async (_, { input }, context) => {
      const phase = {
        id: input.id,
        name: input.name,
        description: input.description,
        status: 'pending',
        progress: 0,
        tasks: [],
        metadata: input.metadata || { dependencies: [] }
      };

      const markdown = context.dataSources.transformToMarkdown(phase, 'phase');
      
      return {
        phase,
        success: true,
        error: null,
        markdown
      };
    },
    
    createIssue: async (_, { input }, context) => {
      const issue = {
        id: 'issue-' + Date.now(),
        title: input.title,
        description: input.description,
        type: input.type,
        status: 'open',
        severity: input.severity,
        related_tasks: input.related_tasks || [],
        resolution_attempts: input.resolution_attempts || [],
        created_date: new Date().toISOString()
      };

      const markdown = context.dataSources.transformToMarkdown(issue, 'issue');
      
      return {
        issue,
        success: true,
        error: null,
        markdown
      };
    },
    
    // Add other mutation resolvers as needed
    updateTaskStatus: async (_, { id, status }, context) => {
      const task = await context.dataSources.getTask(id);
      if (!task) {
        return {
          task: null,
          success: false,
          error: 'Task ' + id + ' not found',
          markdown: null
        };
      }

      task.metadata.status = status;
      task.updated_at = new Date().toISOString();
      
      if (status === 'completed') {
        task.progress = 100;
        task.completion_date = new Date().toISOString().split('T')[0];
      }

      const markdown = context.dataSources.transformToMarkdown(task, 'task');
      
      return {
        task,
        success: true,
        error: null,
        markdown
      };
    },

    // Configuration Management Mutations
    createUserInstruction: async (_, { input }, context) => {
      try {
        const id = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        const stmt = db.prepare(`
          INSERT INTO user_instructions (
            id, title, content, user_types, context, tags, priority, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          id,
          input.title,
          input.content,
          JSON.stringify(input.userTypes || []),
          JSON.stringify(input.context || []),
          JSON.stringify(input.tags || []),
          input.priority || 'medium',
          '1.0'
        );
        
        // Fetch the created record
        const selectStmt = db.prepare('SELECT * FROM user_instructions WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          userInstruction: {
            id: row.id,
            title: row.title,
            content: row.content,
            userTypes: JSON.parse(row.user_types || '[]'),
            context: JSON.parse(row.context || '[]'),
            tags: JSON.parse(row.tags || '[]'),
            priority: row.priority,
            lastUpdated: row.updated_at,
            version: row.version
          }
        };
      } catch (error) {
        console.error('Error creating user instruction:', error);
        return {
          success: false,
          error: error.message,
          userInstruction: null
        };
      }
    },
    updateUserInstruction: async (_, { id, input }, context) => {
      try {
        const stmt = db.prepare(`
          UPDATE user_instructions 
          SET title = ?, content = ?, user_types = ?, context = ?, tags = ?, priority = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        
        const result = stmt.run(
          input.title,
          input.content,
          JSON.stringify(input.userTypes || []),
          JSON.stringify(input.context || []),
          JSON.stringify(input.tags || []),
          input.priority || 'medium',
          id
        );
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'User instruction not found',
            userInstruction: null
          };
        }
        
        // Fetch the updated record
        const selectStmt = db.prepare('SELECT * FROM user_instructions WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          userInstruction: {
            id: row.id,
            title: row.title,
            content: row.content,
            userTypes: JSON.parse(row.user_types || '[]'),
            context: JSON.parse(row.context || '[]'),
            tags: JSON.parse(row.tags || '[]'),
            priority: row.priority,
            lastUpdated: row.updated_at,
            version: row.version
          }
        };
      } catch (error) {
        console.error('Error updating user instruction:', error);
        return {
          success: false,
          error: error.message,
          userInstruction: null
        };
      }
    },
    deleteUserInstruction: async (_, { id }, context) => {
      try {
        const instruction = db.prepare('SELECT * FROM user_instructions WHERE id = ?').get(id);
        
        if (!instruction) {
          return {
            success: false,
            error: 'User instruction not found',
            userInstruction: null
          };
        }
        
        const stmt = db.prepare('DELETE FROM user_instructions WHERE id = ?');
        const result = stmt.run(id);
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Failed to delete user instruction',
            userInstruction: null
          };
        }
        
        return {
          success: true,
          error: null,
          userInstruction: {
            id: instruction.id,
            title: instruction.title,
            content: instruction.content,
            userTypes: JSON.parse(instruction.user_types || '[]'),
            context: JSON.parse(instruction.context || '[]'),
            tags: JSON.parse(instruction.tags || '[]'),
            priority: instruction.priority,
            lastUpdated: instruction.updated_at,
            version: instruction.version
          }
        };
      } catch (error) {
        console.error('Error deleting user instruction:', error);
        return {
          success: false,
          error: error.message,
          userInstruction: null
        };
      }
    },
    createToolConfiguration: async (_, { input }, context) => {
      try {
        const id = `tc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        const stmt = db.prepare(`
          INSERT INTO tool_configurations (
            id, tool_name, category, environment, configuration, user_types, validation_rules
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          id,
          input.toolName,
          input.category,
          input.environment,
          JSON.stringify(input.configuration || {}),
          JSON.stringify(input.userTypes || []),
          JSON.stringify(input.validationRules || [])
        );
        
        // Fetch the created record
        const selectStmt = db.prepare('SELECT * FROM tool_configurations WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          toolConfiguration: {
            id: row.id,
            toolName: row.tool_name,
            category: row.category,
            environment: row.environment,
            configuration: JSON.parse(row.configuration || '{}'),
            userTypes: JSON.parse(row.user_types || '[]'),
            validationRules: JSON.parse(row.validation_rules || '[]'),
            lastUpdated: row.updated_at
          }
        };
      } catch (error) {
        console.error('Error creating tool configuration:', error);
        return {
          success: false,
          error: error.message,
          toolConfiguration: null
        };
      }
    },
    updateToolConfiguration: async (_, { id, input }, context) => {
      try {
        const stmt = db.prepare(`
          UPDATE tool_configurations 
          SET tool_name = ?, category = ?, environment = ?, configuration = ?, user_types = ?, validation_rules = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        
        const result = stmt.run(
          input.toolName,
          input.category,
          input.environment,
          JSON.stringify(input.configuration || {}),
          JSON.stringify(input.userTypes || []),
          JSON.stringify(input.validationRules || []),
          id
        );
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Tool configuration not found',
            toolConfiguration: null
          };
        }
        
        // Fetch the updated record
        const selectStmt = db.prepare('SELECT * FROM tool_configurations WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          toolConfiguration: {
            id: row.id,
            toolName: row.tool_name,
            category: row.category,
            environment: row.environment,
            configuration: JSON.parse(row.configuration || '{}'),
            userTypes: JSON.parse(row.user_types || '[]'),
            validationRules: JSON.parse(row.validation_rules || '[]'),
            lastUpdated: row.updated_at
          }
        };
      } catch (error) {
        console.error('Error updating tool configuration:', error);
        return {
          success: false,
          error: error.message,
          toolConfiguration: null
        };
      }
    },
    deleteToolConfiguration: async (_, { id }, context) => {
      try {
        const config = db.prepare('SELECT * FROM tool_configurations WHERE id = ?').get(id);
        
        if (!config) {
          return {
            success: false,
            error: 'Tool configuration not found',
            toolConfiguration: null
          };
        }
        
        const stmt = db.prepare('DELETE FROM tool_configurations WHERE id = ?');
        const result = stmt.run(id);
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Failed to delete tool configuration',
            toolConfiguration: null
          };
        }
        
        return {
          success: true,
          error: null,
          toolConfiguration: {
            id: config.id,
            toolName: config.tool_name,
            category: config.category,
            environment: config.environment,
            configuration: JSON.parse(config.configuration || '{}'),
            userTypes: JSON.parse(config.user_types || '[]'),
            validationRules: JSON.parse(config.validation_rules || '[]'),
            lastUpdated: config.updated_at
          }
        };
      } catch (error) {
        console.error('Error deleting tool configuration:', error);
        return {
          success: false,
          error: error.message,
          toolConfiguration: null
        };
      }
    },

    // Template Mutations
    createTemplate: async (_, { input }, context) => {
      try {
        const id = `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const stmt = db.prepare(`
          INSERT INTO templates (
            id, name, type, content, variables, conditions, output_formats, user_types
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          id,
          input.name,
          input.type,
          input.content,
          JSON.stringify(input.variables || []),
          JSON.stringify(input.conditions || []),
          JSON.stringify(input.outputFormats || ['markdown']),
          JSON.stringify(input.userTypes || [])
        );
        
        // Fetch the created record
        const selectStmt = db.prepare('SELECT * FROM templates WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          template: {
            id: row.id,
            name: row.name,
            type: row.type,
            content: row.content,
            variables: JSON.parse(row.variables || '[]'),
            conditions: JSON.parse(row.conditions || '[]'),
            outputFormats: JSON.parse(row.output_formats || '["markdown"]'),
            userTypes: JSON.parse(row.user_types || '[]'),
            lastUpdated: row.updated_at
          }
        };
      } catch (error) {
        console.error('Error creating template:', error);
        return {
          success: false,
          error: error.message,
          template: null
        };
      }
    },
    updateTemplate: async (_, { id, input }, context) => {
      try {
        const stmt = db.prepare(`
          UPDATE templates 
          SET name = ?, type = ?, content = ?, variables = ?, conditions = ?, output_formats = ?, user_types = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        
        const result = stmt.run(
          input.name,
          input.type,
          input.content,
          JSON.stringify(input.variables || []),
          JSON.stringify(input.conditions || []),
          JSON.stringify(input.outputFormats || ['markdown']),
          JSON.stringify(input.userTypes || []),
          id
        );
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Template not found',
            template: null
          };
        }
        
        // Fetch the updated record
        const selectStmt = db.prepare('SELECT * FROM templates WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          template: {
            id: row.id,
            name: row.name,
            type: row.type,
            content: row.content,
            variables: JSON.parse(row.variables || '[]'),
            conditions: JSON.parse(row.conditions || '[]'),
            outputFormats: JSON.parse(row.output_formats || '["markdown"]'),
            userTypes: JSON.parse(row.user_types || '[]'),
            lastUpdated: row.updated_at
          }
        };
      } catch (error) {
        console.error('Error updating template:', error);
        return {
          success: false,
          error: error.message,
          template: null
        };
      }
    },
    deleteTemplate: async (_, { id }, context) => {
      try {
        const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);
        
        if (!template) {
          return {
            success: false,
            error: 'Template not found',
            template: null
          };
        }
        
        const stmt = db.prepare('DELETE FROM templates WHERE id = ?');
        const result = stmt.run(id);
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Failed to delete template',
            template: null
          };
        }
        
        return {
          success: true,
          error: null,
          template: {
            id: template.id,
            name: template.name,
            type: template.type,
            content: template.content,
            variables: JSON.parse(template.variables || '[]'),
            conditions: JSON.parse(template.conditions || '[]'),
            outputFormats: JSON.parse(template.output_formats || '["markdown"]'),
            userTypes: JSON.parse(template.user_types || '[]'),
            lastUpdated: template.updated_at
          }
        };
      } catch (error) {
        console.error('Error deleting template:', error);
        return {
          success: false,
          error: error.message,
          template: null
        };
      }
    },

    // Quality Standard Mutations
    createQualityStandard: async (_, { input }, context) => {
      try {
        const id = `qs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const stmt = db.prepare(`
          INSERT INTO quality_standards (
            id, name, category, description, rules, user_types, enabled
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
          id,
          input.name,
          input.category,
          input.description,
          JSON.stringify(input.rules || []),
          JSON.stringify(input.userTypes || []),
          input.enabled ? 1 : 0
        );
        
        // Fetch the created record
        const selectStmt = db.prepare('SELECT * FROM quality_standards WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          qualityStandard: {
            id: row.id,
            name: row.name,
            category: row.category,
            description: row.description,
            rules: JSON.parse(row.rules || '[]'),
            userTypes: JSON.parse(row.user_types || '[]'),
            enabled: row.enabled === 1,
            lastUpdated: row.updated_at
          }
        };
      } catch (error) {
        console.error('Error creating quality standard:', error);
        return {
          success: false,
          error: error.message,
          qualityStandard: null
        };
      }
    },
    updateQualityStandard: async (_, { id, input }, context) => {
      try {
        const stmt = db.prepare(`
          UPDATE quality_standards 
          SET name = ?, category = ?, description = ?, rules = ?, user_types = ?, enabled = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        
        const result = stmt.run(
          input.name,
          input.category,
          input.description,
          JSON.stringify(input.rules || []),
          JSON.stringify(input.userTypes || []),
          input.enabled ? 1 : 0,
          id
        );
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Quality standard not found',
            qualityStandard: null
          };
        }
        
        // Fetch the updated record
        const selectStmt = db.prepare('SELECT * FROM quality_standards WHERE id = ?');
        const row = selectStmt.get(id);
        
        return {
          success: true,
          error: null,
          qualityStandard: {
            id: row.id,
            name: row.name,
            category: row.category,
            description: row.description,
            rules: JSON.parse(row.rules || '[]'),
            userTypes: JSON.parse(row.user_types || '[]'),
            enabled: row.enabled === 1,
            lastUpdated: row.updated_at
          }
        };
      } catch (error) {
        console.error('Error updating quality standard:', error);
        return {
          success: false,
          error: error.message,
          qualityStandard: null
        };
      }
    },
    deleteQualityStandard: async (_, { id }, context) => {
      try {
        const standard = db.prepare('SELECT * FROM quality_standards WHERE id = ?').get(id);
        
        if (!standard) {
          return {
            success: false,
            error: 'Quality standard not found',
            qualityStandard: null
          };
        }
        
        const stmt = db.prepare('DELETE FROM quality_standards WHERE id = ?');
        const result = stmt.run(id);
        
        if (result.changes === 0) {
          return {
            success: false,
            error: 'Failed to delete quality standard',
            qualityStandard: null
          };
        }
        
        return {
          success: true,
          error: null,
          qualityStandard: {
            id: standard.id,
            name: standard.name,
            category: standard.category,
            description: standard.description,
            rules: JSON.parse(standard.rules || '[]'),
            userTypes: JSON.parse(standard.user_types || '[]'),
            enabled: standard.enabled === 1,
            lastUpdated: standard.updated_at
          }
        };
      } catch (error) {
        console.error('Error deleting quality standard:', error);
        return {
          success: false,
          error: error.message,
          qualityStandard: null
        };
      }
    }
  }
};

// Create GraphQL schema
const schema = createSchema({
  typeDefs,
  resolvers
});

// Create Yoga server with enhanced context for Configuration Management
const yoga = createYoga({
  schema,
  context: () => {
    const docDataSources = new DocumentationDataSources();
    
    // Add Configuration Management methods to the data sources
    docDataSources.userInstructions = {
      getInstructions: async (userType, context) => {
        const stmt = db.prepare(`
          SELECT * FROM user_instructions 
          WHERE (? IS NULL OR JSON_EXTRACT(user_types, "$") LIKE ('%' || ? || '%'))
          AND (? IS NULL OR JSON_EXTRACT(context, "$") LIKE ('%' || ? || '%'))
          ORDER BY updated_at DESC
        `);
        const rows = stmt.all(userType, userType, context, context);
        return rows.map(row => ({
          ...row,
          userTypes: JSON.parse(row.user_types || '[]'),
          context: JSON.parse(row.context || '[]'),
          tags: JSON.parse(row.tags || '[]'),
          lastUpdated: row.updated_at
        }));
      }
    };
    
    docDataSources.toolConfigurations = {
      getConfigurations: async (category, environment, userType) => {
        let query = 'SELECT * FROM tool_configurations WHERE 1=1';
        const params = [];
        
        if (category) {
          query += ' AND category = ?';
          params.push(category);
        }
        if (environment) {
          query += ' AND environment = ?';
          params.push(environment);
        }
        if (userType) {
          query += ' AND JSON_EXTRACT(user_types, "$") LIKE ?';
          params.push(`%"${userType}"%`);
        }
        
        query += ' ORDER BY updated_at DESC';
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params);
        
        return rows.map(row => ({
          ...row,
          toolName: row.tool_name,
          configuration: JSON.parse(row.configuration || '{}'),
          userTypes: JSON.parse(row.user_types || '[]'),
          validationRules: JSON.parse(row.validation_rules || '[]'),
          lastUpdated: row.updated_at
        }));
      }
    };
    
    docDataSources.templates = {
      getTemplates: async (type, userType) => {
        let query = 'SELECT * FROM templates WHERE 1=1';
        const params = [];
        
        if (type) {
          query += ' AND type = ?';
          params.push(type);
        }
        if (userType) {
          query += ' AND JSON_EXTRACT(user_types, "$") LIKE ?';
          params.push(`%"${userType}"%`);
        }
        
        query += ' ORDER BY updated_at DESC';
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params);
        
        return rows.map(row => ({
          ...row,
          variables: JSON.parse(row.variables || '[]'),
          conditions: JSON.parse(row.conditions || '[]'),
          outputFormats: JSON.parse(row.output_formats || '["markdown"]'),
          userTypes: JSON.parse(row.user_types || '[]'),
          lastUpdated: row.updated_at
        }));
      }
    };
    
    docDataSources.qualityStandards = {
      getStandards: async (category, userType) => {
        let query = 'SELECT * FROM quality_standards WHERE 1=1';
        const params = [];
        
        if (category) {
          query += ' AND category = ?';
          params.push(category);
        }
        if (userType) {
          query += ' AND JSON_EXTRACT(user_types, "$") LIKE ?';
          params.push(`%"${userType}"%`);
        }
        
        query += ' ORDER BY updated_at DESC';
        
        const stmt = db.prepare(query);
        const rows = stmt.all(...params);
        
        return rows.map(row => ({
          ...row,
          rules: JSON.parse(row.rules || '[]'),
          userTypes: JSON.parse(row.user_types || '[]'),
          lastUpdated: row.updated_at
        }));
      }
    };
    
    return {
      dataSources: docDataSources
    };
  },
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
  },
  graphiql: {
    title: 'Documentation System GraphQL API'
  }
});

// Create HTTP server
const server = createServer(yoga);

const PORT = process.env.PORT || 3004;

// Graceful shutdown handling to prevent crashes and memory leaks
const gracefulShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    // Close database connection
    if (db) {
      try {
        db.close();
        console.log('Database connection closed');
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
    
    console.log('Server shut down gracefully');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle various shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

server.listen(PORT, () => {
  console.log('🚀 GraphQL Server running at http://localhost:' + PORT + '/graphql');
  console.log('📊 GraphiQL playground available at http://localhost:' + PORT + '/graphql');
  console.log('📁 Serving documentation from: ../docs/progress');
  console.log('🛡️ Crash prevention measures enabled');
});
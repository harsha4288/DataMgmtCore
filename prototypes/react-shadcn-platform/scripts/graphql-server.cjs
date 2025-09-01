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
const EntityManager = require('../src/lib/database/entity-manager.cjs');
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

// Initialize Entity Manager for enhanced entity operations
const entityManager = new EntityManager(dbPath);

// Unique ID generation using board prefixes (JIRA-style)
async function generateUniqueId(boardPrefix = 'TASK') {
  try {
    // Get current counter for this board prefix
    const result = db.prepare('SELECT current_counter FROM boards WHERE prefix = ?').get(boardPrefix);
    const nextNum = (result?.current_counter || 0) + 1;
    
    // Update or insert the counter
    db.prepare('INSERT OR REPLACE INTO boards (prefix, current_counter) VALUES (?, ?)')
      .run(boardPrefix, nextNum);
    
    return `${boardPrefix}-${nextNum}`;
  } catch (error) {
    console.error('Error generating unique ID:', error);
    // Fallback to timestamp-based ID if database fails
    return `${boardPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  }
}

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
    documents: [ProjectDocument!]!
    relationships: [EntityRelationship!]!
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

  # Document types for Phase 2.1
  type Document {
    id: ID!
    title: String!
    content: String!
    type: DocumentTypeEnum!
    status: DocumentStatusEnum!
    entityId: String!
    entityType: EntityTypeEnum!
    author: String
    lastModified: String!
    filePath: String!
    markdown: String!
  }

  enum DocumentTypeEnum {
    requirements
    technical
    implementation
    all
  }

  enum DocumentStatusEnum {
    draft
    review
    approved
    archived
  }

  enum EntityTypeEnum {
    task
    phase
    subtask
    issue
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

  # Enhanced Entity System Types (Task 5.8.4: Entity Interconnection Architecture)
  type Entity {
    id: ID!
    entityType: EntityTypeEnum!
    parentId: String
    boardId: String!
    title: String!
    description: String
    status: String!
    priority: String
    level: Int!
    hierarchyPath: String!
    sortOrder: Int
    progress: Int!
    estimatedHours: Float
    actualHours: Float
    startDate: String
    dueDate: String
    completionDate: String
    assignee: String
    labels: [String!]!
    dependencies: [String!]!
    metadata: String
    attributes: String
    createdBy: String
    createdAt: String!
    updatedBy: String
    updatedAt: String!
    
    # Computed fields
    children: [Entity!]!
    relationships: [EntityRelationship!]!
    parent: Entity
    board: Board
  }

  type EntityRelationship {
    id: ID!
    sourceEntityId: String!
    targetEntityId: String!
    relationshipType: String!
    strength: Float!
    isAutoGenerated: Boolean!
    validatedBy: String
    validatedAt: String
    impactScore: Float!
    isActive: Boolean!
    isBidirectional: Boolean!
    reverseType: String
    context: String
    tags: [String!]!
    notes: String
    createdBy: String!
    createdAt: String!
    updatedBy: String!
    updatedAt: String!
    
    # Related entities
    sourceEntity: Entity!
    targetEntity: Entity!
  }

  type Board {
    prefix: String!
    name: String!
    description: String
    currentCounter: Int!
    defaultEntityType: String!
    createdAt: String!
    isActive: Boolean!
    
    # Statistics
    stats: BoardStats
  }

  type BoardStats {
    totalEntities: Int!
    completed: Int!
    inProgress: Int!
    pending: Int!
    blocked: Int!
    avgProgress: Float!
    totalEstimatedHours: Float
    totalActualHours: Float
    completionRate: Float!
  }

  type WorkingContext {
    id: ID!
    userId: String!
    currentEntityId: String!
    contextBreadcrumb: [String!]!
    focusStartTime: String!
    lastActivity: String!
    workType: String
    contextNotes: String
    sessionMetadata: String
    timeSpentMinutes: Int!
    activityCount: Int!
    lastCheckpoint: String
    
    # Related entity
    currentEntity: Entity!
  }

  type ProjectDocument {
    id: ID!
    taskId: String!
    title: String!
    documentType: String!
    filePath: String
    content: String
    metadata: JSON
    version: String!
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  enum RelationshipType {
    DEPENDS_ON
    BLOCKS
    RELATES_TO
    IMPLEMENTS
    TESTS
    RESOLVES
    REFERENCES
    DERIVED_FROM
    SUPERSEDES
    VALIDATES
    GENERATES
    PARENT_OF
    CHILD_OF
    DUPLICATE_OF
    SIMILAR_TO
    DOCUMENTS
  }

  input CreateEntityInput {
    entityType: String!
    title: String!
    description: String
    parentId: String
    boardPrefix: String
    status: String
    priority: String
    assignee: String
    estimatedHours: Float
    metadata: String
    attributes: String
    labels: [String!]
    dependencies: [String!]
  }

  input CreateRelationshipInput {
    sourceEntityId: String!
    targetEntityId: String!
    relationshipType: String!
    strength: Float
    impactScore: Float
    isBidirectional: Boolean
    context: String
    notes: String
  }

  input UpdateEntityInput {
    title: String
    description: String
    status: String
    priority: String
    assignee: String
    progress: Int
    estimatedHours: Float
    actualHours: Float
    startDate: String
    dueDate: String
    completionDate: String
    metadata: String
    attributes: String
    labels: [String!]
    dependencies: [String!]
  }

  input EntitySearchInput {
    text: String
    entityType: String
    status: String
    boardPrefix: String
    assignee: String
    priority: String
    limit: Int
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
    
    # Document queries for Phase 2.1
    getDocumentsByEntity(entityId: ID!, entityType: EntityTypeEnum!): [Document!]!
    getDocument(id: ID!): Document
    getDocumentContent(entityId: ID!, entityType: EntityTypeEnum!): Document
    
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

    # Enhanced Entity System Queries (Task 5.8.4)
    # Entity queries
    getEntity(id: ID!): Entity
    getEntities(input: EntitySearchInput): [Entity!]!
    getEntityChildren(id: ID!): [Entity!]!
    getEntityHierarchy(id: ID!): [Entity!]!
    
    # Relationship queries
    getEntityRelationships(entityId: ID!, direction: String, relationshipType: String): [EntityRelationship!]!
    getRelationship(id: ID!): EntityRelationship
    
    # Board queries
    getBoard(prefix: String!): Board
    getBoards(activeOnly: Boolean): [Board!]!
    getBoardStats(prefix: String!): BoardStats
    
    # Context queries
    getWorkingContext(userId: String): WorkingContext
    getActiveClaudeContext: ClaudeContext
    
    # Advanced entity operations
    calculateEntityProgress(id: ID!): Int!
    searchEntitiesByRelationship(entityId: ID!, relationshipType: String, depth: Int): [Entity!]!
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

  # Claude Context Types
  type ClaudeContext {
    activeEntity: String
    entityId: String
    entityType: String
    title: String
    description: String
    status: String
    priority: String
    assignedTo: String
    relatedEntities: [ClaudeRelatedEntity!]!
    documents: [ClaudeDocument!]!
    lastUpdated: String
    workingContext: ClaudeWorkingContext!
  }

  type ClaudeRelatedEntity {
    id: String!
    type: String!
    title: String!
    relationship: String!
  }

  type ClaudeDocument {
    id: String!
    title: String!
    type: String!
    path: String!
  }

  type ClaudeWorkingContext {
    breadcrumb: [ClaudeBreadcrumb!]!
    currentBoard: String
    recentActivity: [ClaudeActivity!]!
  }

  type ClaudeBreadcrumb {
    id: String!
    title: String!
    type: String!
  }

  type ClaudeActivity {
    action: String!
    entityId: String!
    timestamp: String!
    details: String!
  }

  type ClaudeContextResponse {
    success: Boolean!
    error: String
    context: ClaudeContext
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

    # Enhanced Entity System Mutations (Task 5.8.4)
    # Entity operations
    createEntity(input: CreateEntityInput!): Entity!
    updateEntity(id: ID!, input: UpdateEntityInput!): Entity!
    updateEntityStatus(id: ID!, status: String!, progress: Int, actualHours: Float): Entity!
    deleteEntity(id: ID!): Boolean!
    
    # Relationship operations  
    createRelationship(input: CreateRelationshipInput!): EntityRelationship!
    updateRelationship(id: ID!, strength: Float, impactScore: Float, notes: String): EntityRelationship!
    deleteRelationship(id: ID!): Boolean!
    
    # Board operations
    createBoard(prefix: String!, name: String!, description: String, defaultEntityType: String): Board!
    updateBoard(prefix: String!, name: String, description: String, isActive: Boolean): Board!
    
    # Context operations
    setWorkingContext(entityId: ID!, workType: String, notes: String): WorkingContext!
    updateWorkingContext(id: ID!, workType: String, notes: String, timeSpentMinutes: Int): WorkingContext!
    
    # Claude Context operations
    setActiveClaudeContext(entityId: ID!, relatedEntityIds: [ID!]): ClaudeContextResponse!
    clearActiveClaudeContext: ClaudeContextResponse!
    getActiveClaudeContext: ClaudeContext
    
    # Bulk operations
    bulkCreateEntities(entities: [CreateEntityInput!]!): [Entity!]!
    bulkCreateRelationships(relationships: [CreateRelationshipInput!]!): [EntityRelationship!]!
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
      // NEW: Use entities table instead of reading .md files
      if (!db) {
        console.error('Database not available, falling back to file system');
        return await this.getAllPhasesFromFiles();
      }

      const stmt = db.prepare(`
        SELECT * FROM entities 
        WHERE entity_type = 'phase' 
        ORDER BY id
      `);
      const phaseRows = stmt.all();
      
      const phases = [];
      for (const row of phaseRows) {
        // Get tasks for this phase
        const taskStmt = db.prepare(`
          SELECT * FROM entities 
          WHERE entity_type IN ('task', 'subtask') 
          AND (parent_id = ? OR hierarchy_path LIKE ?)
          ORDER BY level, sort_order
        `);
        const taskRows = taskStmt.all(row.id, `${row.hierarchy_path}%`);
        
        const tasks = taskRows.map(taskRow => ({
          id: taskRow.id,
          name: taskRow.title,
          description: taskRow.description || '',
          phase_id: row.id,
          status: taskRow.status,
          progress: taskRow.progress || 0,
          completion_date: taskRow.updated_at ? taskRow.updated_at.split('T')[0] : null,
          subtasks: [], // Will be populated by parseSubtasksFromDB if needed
          metadata: {
            status: taskRow.status,
            priority: taskRow.priority || 'medium',
            assignee: taskRow.assignee,
            labels: taskRow.labels ? JSON.parse(taskRow.labels) : [],
            dependencies: taskRow.dependencies ? JSON.parse(taskRow.dependencies) : [],
            estimated_hours: taskRow.estimated_hours,
            actual_hours: taskRow.actual_hours
          },
          created_at: taskRow.created_at,
          updated_at: taskRow.updated_at
        }));

        const phase = {
          id: row.id,
          name: row.title,
          description: row.description || '',
          status: this.parsePhaseStatus(row.status),
          progress: this.calculatePhaseProgressFromTasks(tasks),
          tasks,
          metadata: {
            start_date: row.metadata ? JSON.parse(row.metadata).start_date : null,
            end_date: row.metadata ? JSON.parse(row.metadata).end_date : null,
            completion_date: row.status === 'completed' ? (row.updated_at ? row.updated_at.split('T')[0] : null) : null,
            total_estimated_hours: row.estimated_hours,
            total_actual_hours: row.actual_hours,
            dependencies: row.dependencies ? JSON.parse(row.dependencies) : []
          }
        };
        
        phases.push(phase);
      }

      this.setCache(cacheKey, phases);
      return phases;
    } catch (error) {
      console.error('Error loading phases from database:', error);
      // Fallback to file system
      return await this.getAllPhasesFromFiles();
    }
  }

  async getAllTasks() {
    try {
      // NEW: Use entities table directly instead of going through phases
      if (!db) {
        console.error('Database not available, falling back to file system');
        const phases = await this.getAllPhasesFromFiles();
        const tasks = [];
        for (const phase of phases) {
          tasks.push(...phase.tasks);
        }
        return tasks;
      }

      const stmt = db.prepare(`
        SELECT * FROM entities 
        WHERE entity_type IN ('task', 'subtask')
        ORDER BY hierarchy_path, level, sort_order
      `);
      const taskRows = stmt.all();
      
      const tasks = taskRows.map(row => ({
        id: row.id,
        name: row.title,
        description: row.description || '',
        phase_id: row.parent_id || row.hierarchy_path.split('/')[0], // Extract phase from hierarchy
        status: row.status,
        progress: row.progress || 0,
        completion_date: row.status === 'completed' ? (row.updated_at ? row.updated_at.split('T')[0] : null) : null,
        subtasks: [], // Could be populated if needed
        metadata: {
          status: row.status,
          priority: row.priority || 'medium',
          assignee: row.assignee,
          labels: row.labels ? JSON.parse(row.labels) : [],
          dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
          estimated_hours: row.estimated_hours,
          actual_hours: row.actual_hours
        },
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      return tasks;
    } catch (error) {
      console.error('Error loading tasks from database:', error);
      // Fallback to file system
      const phases = await this.getAllPhasesFromFiles();
      const tasks = [];
      for (const phase of phases) {
        tasks.push(...phase.tasks);
      }
      return tasks;
    }
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
        subtasks: await this.parseSubtasks(content),
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

  async parseSubtasks(content) {
    const subtaskMatches = content.match(/- \[(x| )\] (.+)/g);
    if (!subtaskMatches) return [];
    
    // Simple approach: All entities use TASK prefix for now
    // Later can manually replace with CORE, CORE.THEME, ALUMNI.UI, etc.
    const boardPrefix = 'TASK';
    
    const subtasks = [];
    for (const match of subtaskMatches) {
      const completed = match.includes('[x]');
      const name = match.replace(/- \[(x| )\] /, '');
      const uniqueId = await generateUniqueId(boardPrefix);
      
      subtasks.push({
        id: uniqueId,
        name,
        description: '',
        completed
      });
    }
    
    return subtasks;
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

  // Helper method for database-based phase progress calculation
  calculatePhaseProgressFromTasks(tasks) {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return totalProgress / tasks.length;
  }

  // Fallback method to read phases from files (original implementation)
  async getAllPhasesFromFiles() {
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

      return phases;
    } catch (error) {
      console.error('Error loading phases from files:', error);
      return [];
    }
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

  // Document methods - Updated to use project_documents table (Task 5.8.4)
  async getDocumentsByEntity(entityId, entityType) {
    try {
      // Use global db variable to query project_documents table
      if (!db) {
        console.error('Database not available');
        return [];
      }

      console.log(`[getDocumentsByEntity] Fetching documents for entity: ${entityId} (${entityType})`);
      
      let rows = [];
      
      // For tasks, query project_documents table directly by task_id
      if (entityType === 'task' || entityType === 'TASK') {
        const taskDocsStmt = db.prepare(`
          SELECT id, task_id, title, document_type, content, version, 
                 created_at, updated_at, metadata, file_path
          FROM project_documents 
          WHERE task_id = ? AND is_active = 1 
          ORDER BY updated_at DESC
        `);
        const taskDocs = taskDocsStmt.all(entityId);
        rows = rows.concat(taskDocs);
        console.log(`[getDocumentsByEntity] Found ${taskDocs.length} documents in project_documents for task ${entityId}`);
      }
      
      // If no documents found and it's a task, try fallback to old documents table for compatibility
      if (rows.length === 0 && (entityType === 'task' || entityType === 'TASK')) {
        console.log(`[getDocumentsByEntity] No documents in project_documents, checking old documents table for compatibility...`);
        const oldDocsStmt = db.prepare('SELECT * FROM documents WHERE entity_id = ? ORDER BY updated_at DESC');
        const oldDocs = oldDocsStmt.all(entityId);
        console.log(`[getDocumentsByEntity] Found ${oldDocs.length} documents in old documents table`);
        
        // Map old document structure to new format for compatibility
        const mappedOldDocs = oldDocs.map(row => ({
          id: row.id,
          task_id: row.entity_id,
          title: row.title,
          document_type: row.type,
          content: row.content,
          version: row.version?.toString() || '1.0.0',
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: null,
          file_path: null,
          // Keep track this came from old table
          _source: 'documents_table'
        }));
        rows = rows.concat(mappedOldDocs);
      }
      
      console.log(`[getDocumentsByEntity] Found ${rows.length} total documents for ${entityId}`);
      
      // Transform to GraphQL Document format
      return rows.map(row => {
        let metadata = null;
        try {
          metadata = row.metadata ? JSON.parse(row.metadata) : null;
        } catch (e) {
          console.warn(`Failed to parse metadata for document ${row.id}:`, e);
        }
        
        return {
          id: row.id,
          title: row.title,
          content: row.content || '',
          type: row.document_type || 'technical',
          status: metadata?.status || 'approved', // Default to approved for project documents
          entityId: row.task_id || row.entity_id, // Support both formats
          entityType: 'task', // Project documents are always task-related
          author: metadata?.author || 'Development Team',
          lastModified: row.updated_at,
          filePath: row.file_path || null,
          markdown: row.content || ''
        };
      });
    } catch (error) {
      console.error('[getDocumentsByEntity] Error getting documents from database:', error);
      return [];
    }
  }

  async getDocument(id) {
    try {
      if (!db) {
        console.error('Database not available');
        return null;
      }

      const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
      const row = stmt.get(id);
      
      if (!row) return null;
      
      return {
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type,
        status: row.status,
        entityId: row.entity_id,
        entityType: row.entity_type,
        author: row.author || 'Development Team',
        lastModified: row.updated_at,
        filePath: null, // No file path since we're using database
        markdown: row.content
      };
    } catch (error) {
      console.error('Error getting document by id from database:', error);
      return null;
    }
  }

  async getDocumentContent(entityId, entityType) {
    try {
      const documents = await this.getDocumentsByEntity(entityId, entityType);
      return documents[0] || null;
    } catch (error) {
      console.error('Error getting document content from database:', error);
      return null;
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

    // Document resolvers for Phase 2.1
    getDocumentsByEntity: async (_, { entityId, entityType }, context) => {
      return await context.dataSources.getDocumentsByEntity(entityId, entityType);
    },
    getDocument: async (_, { id }, context) => {
      return await context.dataSources.getDocument(id);
    },
    getDocumentContent: async (_, { entityId, entityType }, context) => {
      return await context.dataSources.getDocumentContent(entityId, entityType);
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
    },

    // Enhanced Entity System Resolvers (Task 5.8.4: Entity Interconnection Architecture)
    getEntity: async (_, { id }) => {
      try {
        const entity = entityManager.getEntity(id);
        return entity;
      } catch (error) {
        console.error('Error fetching entity:', error);
        return null;
      }
    },

    getEntities: async (_, { input }) => {
      try {
        const entities = entityManager.searchEntities(input || {});
        return entities;
      } catch (error) {
        console.error('Error searching entities:', error);
        return [];
      }
    },

    getEntityChildren: async (_, { id }) => {
      try {
        const children = entityManager.getEntityChildren(id);
        return children;
      } catch (error) {
        console.error('Error fetching entity children:', error);
        return [];
      }
    },

    getEntityHierarchy: async (_, { id }) => {
      try {
        const hierarchy = entityManager.getEntityHierarchy(id);
        return hierarchy;
      } catch (error) {
        console.error('Error fetching entity hierarchy:', error);
        return [];
      }
    },

    getEntityRelationships: async (_, { entityId, direction, relationshipType }) => {
      try {
        const relationships = entityManager.getEntityRelationships(entityId, {
          direction: direction || 'both',
          relationshipType,
          isActive: true
        });
        return relationships;
      } catch (error) {
        console.error('Error fetching entity relationships:', error);
        return [];
      }
    },

    getRelationship: async (_, { id }) => {
      try {
        const relationship = db.prepare(`
          SELECT r.*, 
            se.title as source_title, se.entity_type as source_entity_type,
            te.title as target_title, te.entity_type as target_entity_type
          FROM entity_relationships r
          JOIN entities se ON r.source_entity_id = se.id
          JOIN entities te ON r.target_entity_id = te.id
          WHERE r.id = ?
        `).get(id);
        
        if (relationship) {
          relationship.context = JSON.parse(relationship.context || '{}');
          relationship.tags = JSON.parse(relationship.tags || '[]');
        }
        
        return relationship;
      } catch (error) {
        console.error('Error fetching relationship:', error);
        return null;
      }
    },

    getBoard: async (_, { prefix }) => {
      try {
        const board = db.prepare('SELECT * FROM boards WHERE prefix = ?').get(prefix);
        return board;
      } catch (error) {
        console.error('Error fetching board:', error);
        return null;
      }
    },

    getBoards: async (_, { activeOnly }) => {
      try {
        let query = 'SELECT * FROM boards';
        const params = [];
        
        if (activeOnly) {
          query += ' WHERE is_active = ?';
          params.push(1);
        }
        
        query += ' ORDER BY prefix';
        
        const boards = db.prepare(query).all(...params);
        return boards;
      } catch (error) {
        console.error('Error fetching boards:', error);
        return [];
      }
    },

    getBoardStats: async (_, { prefix }) => {
      try {
        const stats = entityManager.getBoardStats(prefix);
        return stats;
      } catch (error) {
        console.error('Error fetching board stats:', error);
        return null;
      }
    },

    getWorkingContext: async (_, { userId }) => {
      try {
        const context = db.prepare(`
          SELECT * FROM working_context 
          WHERE user_id = ? 
          ORDER BY last_activity DESC 
          LIMIT 1
        `).get(userId || 'default');
        
        if (context) {
          context.contextBreadcrumb = JSON.parse(context.context_breadcrumb || '[]');
          context.sessionMetadata = JSON.parse(context.session_metadata || '{}');
        }
        
        return context;
      } catch (error) {
        console.error('Error fetching working context:', error);
        return null;
      }
    },

    calculateEntityProgress: async (_, { id }) => {
      try {
        const progress = entityManager.calculateEntityProgress(id);
        return progress;
      } catch (error) {
        console.error('Error calculating entity progress:', error);
        return 0;
      }
    },

    searchEntitiesByRelationship: async (_, { entityId, relationshipType, depth }) => {
      try {
        // Get direct relationships
        const relationships = entityManager.getEntityRelationships(entityId, {
          relationshipType,
          isActive: true
        });
        
        // Get related entities
        const relatedEntityIds = relationships.map(rel => 
          rel.source_entity_id === entityId ? rel.target_entity_id : rel.source_entity_id
        );
        
        const relatedEntities = relatedEntityIds
          .map(id => entityManager.getEntity(id))
          .filter(entity => entity);
        
        return relatedEntities;
      } catch (error) {
        console.error('Error searching entities by relationship:', error);
        return [];
      }
    },

    // Claude Context queries
    getActiveClaudeContext: async () => {
      try {
        const ClaudeContextManager = require('../src/lib/context/claude-context-manager.cjs');
        const contextManager = new ClaudeContextManager();
        
        const context = await contextManager.getActiveContext();
        
        if (!context.activeEntity) {
          return null;
        }
        
        return {
          ...context,
          relatedEntities: context.relatedEntities || [],
          documents: context.documents || [],
          workingContext: {
            breadcrumb: context.workingContext?.breadcrumb || [],
            currentBoard: context.workingContext?.currentBoard,
            recentActivity: context.workingContext?.recentActivity || []
          }
        };
      } catch (error) {
        console.error('Error getting active Claude context:', error);
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
    },

    // Enhanced Entity System Mutations (Task 5.8.4: Entity Interconnection Architecture)
    createEntity: async (_, { input }) => {
      try {
        const entity = await entityManager.createEntity({
          entityType: input.entityType,
          title: input.title,
          description: input.description || '',
          parentId: input.parentId,
          boardPrefix: input.boardPrefix,
          status: input.status || 'pending',
          priority: input.priority || 'medium',
          assignee: input.assignee,
          estimatedHours: input.estimatedHours,
          metadata: input.metadata ? JSON.parse(input.metadata) : {},
          attributes: input.attributes ? JSON.parse(input.attributes) : {},
          labels: input.labels || [],
          dependencies: input.dependencies || []
        });
        
        return entity;
      } catch (error) {
        console.error('Error creating entity:', error);
        throw new Error(`Failed to create entity: ${error.message}`);
      }
    },

    updateEntity: async (_, { id, input }) => {
      try {
        const updateFields = [];
        const params = [];
        
        if (input.title) {
          updateFields.push('title = ?');
          params.push(input.title);
        }
        
        if (input.description !== undefined) {
          updateFields.push('description = ?');
          params.push(input.description);
        }
        
        if (input.status) {
          updateFields.push('status = ?');
          params.push(input.status);
        }
        
        if (input.priority) {
          updateFields.push('priority = ?');
          params.push(input.priority);
        }
        
        if (input.assignee !== undefined) {
          updateFields.push('assignee = ?');
          params.push(input.assignee);
        }
        
        if (input.progress !== undefined) {
          updateFields.push('progress = ?');
          params.push(input.progress);
        }
        
        if (input.estimatedHours !== undefined) {
          updateFields.push('estimated_hours = ?');
          params.push(input.estimatedHours);
        }
        
        if (input.actualHours !== undefined) {
          updateFields.push('actual_hours = ?');
          params.push(input.actualHours);
        }
        
        if (input.startDate !== undefined) {
          updateFields.push('start_date = ?');
          params.push(input.startDate);
        }
        
        if (input.dueDate !== undefined) {
          updateFields.push('due_date = ?');
          params.push(input.dueDate);
        }
        
        if (input.completionDate !== undefined) {
          updateFields.push('completion_date = ?');
          params.push(input.completionDate);
        }
        
        if (input.metadata) {
          updateFields.push('metadata = ?');
          params.push(input.metadata);
        }
        
        if (input.attributes) {
          updateFields.push('attributes = ?');
          params.push(input.attributes);
        }
        
        if (input.labels) {
          updateFields.push('labels = ?');
          params.push(JSON.stringify(input.labels));
        }
        
        if (input.dependencies) {
          updateFields.push('dependencies = ?');
          params.push(JSON.stringify(input.dependencies));
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP', 'updated_by = ?');
        params.push('system', id);
        
        const query = `UPDATE entities SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = db.prepare(query).run(...params);
        
        if (result.changes === 0) {
          throw new Error('Entity not found or no changes made');
        }
        
        return entityManager.getEntity(id);
      } catch (error) {
        console.error('Error updating entity:', error);
        throw new Error(`Failed to update entity: ${error.message}`);
      }
    },

    updateEntityStatus: async (_, { id, status, progress, actualHours }) => {
      try {
        const success = entityManager.updateEntityStatus(id, status, {
          progress,
          actualHours
        });
        
        if (!success) {
          throw new Error('Failed to update entity status');
        }
        
        return entityManager.getEntity(id);
      } catch (error) {
        console.error('Error updating entity status:', error);
        throw new Error(`Failed to update entity status: ${error.message}`);
      }
    },

    deleteEntity: async (_, { id }) => {
      try {
        const result = db.prepare('DELETE FROM entities WHERE id = ?').run(id);
        return result.changes > 0;
      } catch (error) {
        console.error('Error deleting entity:', error);
        return false;
      }
    },

    createRelationship: async (_, { input }) => {
      try {
        const relationshipId = await entityManager.createRelationship(
          input.sourceEntityId,
          input.targetEntityId,
          input.relationshipType,
          {
            strength: input.strength,
            impactScore: input.impactScore,
            isBidirectional: input.isBidirectional,
            context: input.context ? JSON.parse(input.context) : {},
            notes: input.notes,
            createdBy: 'system'
          }
        );
        
        // Return the created relationship
        const relationship = db.prepare(`
          SELECT r.*, 
            se.title as source_title, se.entity_type as source_entity_type,
            te.title as target_title, te.entity_type as target_entity_type
          FROM entity_relationships r
          JOIN entities se ON r.source_entity_id = se.id
          JOIN entities te ON r.target_entity_id = te.id
          WHERE r.id = ?
        `).get(relationshipId);
        
        if (relationship) {
          relationship.context = JSON.parse(relationship.context || '{}');
          relationship.tags = JSON.parse(relationship.tags || '[]');
        }
        
        return relationship;
      } catch (error) {
        console.error('Error creating relationship:', error);
        throw new Error(`Failed to create relationship: ${error.message}`);
      }
    },

    updateRelationship: async (_, { id, strength, impactScore, notes }) => {
      try {
        const updateFields = [];
        const params = [];
        
        if (strength !== undefined) {
          updateFields.push('strength = ?');
          params.push(strength);
        }
        
        if (impactScore !== undefined) {
          updateFields.push('impact_score = ?');
          params.push(impactScore);
        }
        
        if (notes !== undefined) {
          updateFields.push('notes = ?');
          params.push(notes);
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP', 'updated_by = ?');
        params.push('system', id);
        
        const query = `UPDATE entity_relationships SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = db.prepare(query).run(...params);
        
        if (result.changes === 0) {
          throw new Error('Relationship not found');
        }
        
        // Return updated relationship
        const relationship = db.prepare(`
          SELECT r.*, 
            se.title as source_title, se.entity_type as source_entity_type,
            te.title as target_title, te.entity_type as target_entity_type
          FROM entity_relationships r
          JOIN entities se ON r.source_entity_id = se.id
          JOIN entities te ON r.target_entity_id = te.id
          WHERE r.id = ?
        `).get(id);
        
        if (relationship) {
          relationship.context = JSON.parse(relationship.context || '{}');
          relationship.tags = JSON.parse(relationship.tags || '[]');
        }
        
        return relationship;
      } catch (error) {
        console.error('Error updating relationship:', error);
        throw new Error(`Failed to update relationship: ${error.message}`);
      }
    },

    deleteRelationship: async (_, { id }) => {
      try {
        const result = db.prepare('DELETE FROM entity_relationships WHERE id = ?').run(id);
        return result.changes > 0;
      } catch (error) {
        console.error('Error deleting relationship:', error);
        return false;
      }
    },

    createBoard: async (_, { prefix, name, description, defaultEntityType }) => {
      try {
        const insertBoard = db.prepare(`
          INSERT INTO boards (prefix, name, description, default_entity_type, is_active)
          VALUES (?, ?, ?, ?, 1)
        `);
        
        const result = insertBoard.run(prefix, name, description, defaultEntityType || 'task');
        
        if (result.changes === 0) {
          throw new Error('Failed to create board');
        }
        
        return db.prepare('SELECT * FROM boards WHERE prefix = ?').get(prefix);
      } catch (error) {
        console.error('Error creating board:', error);
        throw new Error(`Failed to create board: ${error.message}`);
      }
    },

    updateBoard: async (_, { prefix, name, description, isActive }) => {
      try {
        const updateFields = [];
        const params = [];
        
        if (name) {
          updateFields.push('name = ?');
          params.push(name);
        }
        
        if (description !== undefined) {
          updateFields.push('description = ?');
          params.push(description);
        }
        
        if (isActive !== undefined) {
          updateFields.push('is_active = ?');
          params.push(isActive ? 1 : 0);
        }
        
        params.push(prefix);
        
        const query = `UPDATE boards SET ${updateFields.join(', ')} WHERE prefix = ?`;
        const result = db.prepare(query).run(...params);
        
        if (result.changes === 0) {
          throw new Error('Board not found');
        }
        
        return db.prepare('SELECT * FROM boards WHERE prefix = ?').get(prefix);
      } catch (error) {
        console.error('Error updating board:', error);
        throw new Error(`Failed to update board: ${error.message}`);
      }
    },

    setWorkingContext: async (_, { entityId, workType, notes }) => {
      try {
        const contextId = `ctx-${Date.now()}`;
        const entity = entityManager.getEntity(entityId);
        
        if (!entity) {
          throw new Error('Entity not found');
        }
        
        // Build breadcrumb from entity hierarchy
        const breadcrumb = entity.hierarchy_path.split('/');
        
        const insertContext = db.prepare(`
          INSERT OR REPLACE INTO working_context (
            id, user_id, current_entity_id, context_breadcrumb,
            work_type, context_notes, session_metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertContext.run(
          contextId,
          'default',
          entityId,
          JSON.stringify(breadcrumb),
          workType,
          notes,
          JSON.stringify({})
        );
        
        if (result.changes === 0) {
          throw new Error('Failed to set working context');
        }
        
        const context = db.prepare('SELECT * FROM working_context WHERE id = ?').get(contextId);
        context.contextBreadcrumb = JSON.parse(context.context_breadcrumb || '[]');
        context.sessionMetadata = JSON.parse(context.session_metadata || '{}');
        
        return context;
      } catch (error) {
        console.error('Error setting working context:', error);
        throw new Error(`Failed to set working context: ${error.message}`);
      }
    },

    updateWorkingContext: async (_, { id, workType, notes, timeSpentMinutes }) => {
      try {
        const updateFields = [];
        const params = [];
        
        if (workType) {
          updateFields.push('work_type = ?');
          params.push(workType);
        }
        
        if (notes) {
          updateFields.push('context_notes = ?');
          params.push(notes);
        }
        
        if (timeSpentMinutes !== undefined) {
          updateFields.push('time_spent_minutes = ?');
          params.push(timeSpentMinutes);
        }
        
        updateFields.push('last_activity = CURRENT_TIMESTAMP', 'activity_count = activity_count + 1');
        params.push(id);
        
        const query = `UPDATE working_context SET ${updateFields.join(', ')} WHERE id = ?`;
        const result = db.prepare(query).run(...params);
        
        if (result.changes === 0) {
          throw new Error('Working context not found');
        }
        
        const context = db.prepare('SELECT * FROM working_context WHERE id = ?').get(id);
        context.contextBreadcrumb = JSON.parse(context.context_breadcrumb || '[]');
        context.sessionMetadata = JSON.parse(context.session_metadata || '{}');
        
        return context;
      } catch (error) {
        console.error('Error updating working context:', error);
        throw new Error(`Failed to update working context: ${error.message}`);
      }
    },

    bulkCreateEntities: async (_, { entities }) => {
      try {
        const results = [];
        
        for (const entityInput of entities) {
          const entity = await entityManager.createEntity({
            entityType: entityInput.entityType,
            title: entityInput.title,
            description: entityInput.description || '',
            parentId: entityInput.parentId,
            boardPrefix: entityInput.boardPrefix,
            status: entityInput.status || 'pending',
            priority: entityInput.priority || 'medium',
            assignee: entityInput.assignee,
            estimatedHours: entityInput.estimatedHours,
            metadata: entityInput.metadata ? JSON.parse(entityInput.metadata) : {},
            attributes: entityInput.attributes ? JSON.parse(entityInput.attributes) : {},
            labels: entityInput.labels || [],
            dependencies: entityInput.dependencies || []
          });
          
          results.push(entity);
        }
        
        return results;
      } catch (error) {
        console.error('Error bulk creating entities:', error);
        throw new Error(`Failed to bulk create entities: ${error.message}`);
      }
    },

    bulkCreateRelationships: async (_, { relationships }) => {
      try {
        const results = [];
        
        for (const relationshipInput of relationships) {
          const relationshipId = await entityManager.createRelationship(
            relationshipInput.sourceEntityId,
            relationshipInput.targetEntityId,
            relationshipInput.relationshipType,
            {
              strength: relationshipInput.strength,
              impactScore: relationshipInput.impactScore,
              isBidirectional: relationshipInput.isBidirectional,
              context: relationshipInput.context ? JSON.parse(relationshipInput.context) : {},
              notes: relationshipInput.notes,
              createdBy: 'system'
            }
          );
          
          const relationship = db.prepare(`
            SELECT r.*, 
              se.title as source_title, se.entity_type as source_entity_type,
              te.title as target_title, te.entity_type as target_entity_type
            FROM entity_relationships r
            JOIN entities se ON r.source_entity_id = se.id
            JOIN entities te ON r.target_entity_id = te.id
            WHERE r.id = ?
          `).get(relationshipId);
          
          if (relationship) {
            relationship.context = JSON.parse(relationship.context || '{}');
            relationship.tags = JSON.parse(relationship.tags || '[]');
          }
          
          results.push(relationship);
        }
        
        return results;
      } catch (error) {
        console.error('Error bulk creating relationships:', error);
        throw new Error(`Failed to bulk create relationships: ${error.message}`);
      }
    },

    // Claude Context Mutations
    setActiveClaudeContext: async (_, { entityId, relatedEntityIds = [] }) => {
      try {
        const ClaudeContextManager = require('../src/lib/context/claude-context-manager.cjs');
        const contextManager = new ClaudeContextManager();
        
        // Get entity details
        const entity = await entityManager.getEntity(entityId);
        if (!entity) {
          throw new Error('Entity not found');
        }

        // Get related entities
        const relatedEntities = [];
        for (const relatedId of relatedEntityIds) {
          const relatedEntity = await entityManager.getEntity(relatedId);
          if (relatedEntity) {
            relatedEntities.push({
              ...relatedEntity,
              relationship: 'related'
            });
          }
        }

        await contextManager.setActiveEntity(entity, relatedEntities);
        const context = await contextManager.getActiveContext();

        return {
          success: true,
          error: null,
          context: {
            ...context,
            relatedEntities: context.relatedEntities || [],
            documents: context.documents || [],
            workingContext: {
              breadcrumb: context.workingContext?.breadcrumb || [],
              currentBoard: context.workingContext?.currentBoard,
              recentActivity: context.workingContext?.recentActivity || []
            }
          }
        };
      } catch (error) {
        console.error('Error setting active Claude context:', error);
        return {
          success: false,
          error: error.message,
          context: null
        };
      }
    },

    clearActiveClaudeContext: async () => {
      try {
        const ClaudeContextManager = require('../src/lib/context/claude-context-manager.cjs');
        const contextManager = new ClaudeContextManager();
        
        await contextManager.clearActiveEntity();
        
        return {
          success: true,
          error: null,
          context: null
        };
      } catch (error) {
        console.error('Error clearing active Claude context:', error);
        return {
          success: false,
          error: error.message,
          context: null
        };
      }
    }
  },

  // Field resolvers
  Task: {
    documents: async (parent, _args, _context) => {
      try {
        // Query documents table for documents linked to this task
        const stmt = db.prepare(`
          SELECT id, entity_id as taskId, title, type as documentType, 
                 '' as filePath, content, '{}' as metadata, version, 
                 CASE WHEN status != 'archived' THEN 1 ELSE 0 END as isActive,
                 created_at as createdAt, updated_at as updatedAt
          FROM documents 
          WHERE entity_id = ? AND status != 'archived'
          ORDER BY created_at DESC
        `);
        const rows = stmt.all(parent.id);
        
        return rows.map(row => ({
          ...row,
          metadata: row.metadata ? JSON.parse(row.metadata) : {}
        }));
      } catch (error) {
        console.error('Error fetching task documents:', error);
        return [];
      }
    },
    
    relationships: async (parent, _args, _context) => {
      try {
        // Query entity_relationships table for relationships involving this task
        const stmt = db.prepare(`
          SELECT r.*, 
            se.title as source_title, se.entity_type as source_entity_type,
            te.title as target_title, te.entity_type as target_entity_type
          FROM entity_relationships r
          JOIN entities se ON r.source_entity_id = se.id
          JOIN entities te ON r.target_entity_id = te.id
          WHERE r.source_entity_id = ? OR r.target_entity_id = ?
          ORDER BY r.created_at DESC
        `);
        const rows = stmt.all(parent.id, parent.id);
        
        return rows.map(row => ({
          id: row.id,
          sourceEntityId: row.source_entity_id,
          targetEntityId: row.target_entity_id,
          relationshipType: row.relationship_type,
          strength: row.strength || 0.0,
          isAutoGenerated: Boolean(row.is_auto_generated),
          validatedBy: row.validated_by || null,
          validatedAt: row.validated_at || null,
          impactScore: row.impact_score || 0.0,
          isActive: Boolean(row.is_active !== 0),
          isBidirectional: Boolean(row.is_bidirectional),
          reverseType: row.reverse_type || null,
          context: row.context || null,
          tags: row.tags ? JSON.parse(row.tags) : [],
          notes: row.notes || null
        }));
      } catch (error) {
        console.error('Error fetching task relationships:', error);
        return [];
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
    origin: [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:5175',
      // Allow network access from any IP on port 5173
      /^http:\/\/192\.168\.\d+\.\d+:5173$/
    ],
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
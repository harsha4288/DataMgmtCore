/**
 * GraphQL Schema - Modular type definitions
 * Exported from the monolithic graphql-server.cjs for better maintainability
 */

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

module.exports = { typeDefs };
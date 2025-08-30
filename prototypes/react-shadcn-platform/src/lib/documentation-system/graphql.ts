/**
 * GraphQL schema and resolvers for the documentation system
 */

// import { createSchema } from 'graphql-yoga';

export const typeDefs = `
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

  # Universal Configuration Management Types (Task 5.8.2)
  type UserInstruction {
    id: ID!
    title: String!
    content: String!
    userTypes: [String!]!
    context: [InstructionContext!]!
    tags: [String!]!
    priority: String!
    lastUpdated: String!
    version: String!
  }

  type InstructionContext {
    id: String
    name: String!
    category: String!
    conditions: JSON
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

  # JSON scalar type
  scalar JSON

  # Configuration Management Input Types (Task 5.8.2)
  input UserInstructionInput {
    title: String!
    content: String!
    userTypes: [String!]!
    context: [InstructionContextInput!]
    tags: [String!]
    priority: String!
    version: String
  }

  input InstructionContextInput {
    id: String
    name: String!
    category: String!
    conditions: JSON
  }

  input ToolConfigurationInput {
    toolName: String!
    category: String!
    environment: String!
    configuration: JSON!
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

  # Configuration Management Response Types
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

    # Universal Configuration Management Queries (Task 5.8.2)
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

    # Configuration Management Mutations (Task 5.8.2)
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
`;

export interface GraphQLContext {
  dataSources: {
    tasks: any;
    phases: any;
    issues: any;
    // Configuration Management Data Sources
    userInstructions: any;
    toolConfigurations: any;
    templates: any;
    qualityStandards: any;
  };
}
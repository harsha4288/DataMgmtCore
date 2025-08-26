/**
 * GraphQL Server for Documentation System
 * Runs on port 3004, provides GraphQL API and GraphiQL playground
 */

const { createYoga, createSchema } = require('graphql-yoga');
const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

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

// Resolvers
const resolvers = {
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
    }
  }
};

// Create GraphQL schema
const schema = createSchema({
  typeDefs,
  resolvers
});

// Create Yoga server
const yoga = createYoga({
  schema,
  context: () => ({
    dataSources: new DocumentationDataSources()
  }),
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },
  graphiql: {
    title: 'Documentation System GraphQL API'
  }
});

// Create HTTP server
const server = createServer(yoga);

const PORT = process.env.PORT || 3004;

server.listen(PORT, () => {
  console.log('🚀 GraphQL Server running at http://localhost:' + PORT + '/graphql');
  console.log('📊 GraphiQL playground available at http://localhost:' + PORT + '/graphql');
  console.log('📁 Serving documentation from: ../docs/progress');
});
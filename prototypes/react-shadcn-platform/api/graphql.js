/**
 * Serverless GraphQL API Handler for Vercel
 * Handles GraphQL queries for production deployment
 */

const { ApolloServer } = require('apollo-server-micro');
const { readFileSync } = require('fs');
const { join } = require('path');

// Import database connection
let db;
try {
  // Try to import database module if available
  const dbModule = require('../dist/lib/database/index.js');
  db = new dbModule.DatabaseManager();
} catch (error) {
  console.warn('Database module not available in serverless environment, using mock data');
  db = null;
}

// GraphQL Schema
const typeDefs = `
  type UserInstruction {
    id: ID!
    title: String!
    content: String!
    userTypes: [String!]!
    context: [ProjectContext!]!
    tags: [String!]!
    priority: String!
    lastUpdated: String!
    version: String!
  }

  type ProjectContext {
    id: String!
    name: String!
    category: String!
    conditions: String
  }

  type ToolConfiguration {
    id: ID!
    toolName: String!
    category: String!
    environment: String!
    configuration: String
    userTypes: [String!]!
    validationRules: [String!]!
    lastUpdated: String!
  }

  type Query {
    getUserInstructions: [UserInstruction!]!
    getUserInstruction(id: ID!): UserInstruction
    getToolConfigurations: [ToolConfiguration!]!
    getToolConfiguration(id: ID!): ToolConfiguration
    health: String!
  }

  type Mutation {
    createUserInstruction(input: UserInstructionInput!): MutationResult!
    updateUserInstruction(id: ID!, input: UserInstructionInput!): MutationResult!
    deleteUserInstruction(id: ID!): MutationResult!
    createToolConfiguration(input: ToolConfigurationInput!): MutationResult!
    updateToolConfiguration(id: ID!, input: ToolConfigurationInput!): MutationResult!
    deleteToolConfiguration(id: ID!): MutationResult!
  }

  input UserInstructionInput {
    title: String!
    content: String!
    userTypes: [String!]!
    tags: [String!]!
    priority: String!
  }

  input ToolConfigurationInput {
    toolName: String!
    category: String!
    environment: String!
    configuration: String
    userTypes: [String!]!
    validationRules: [String!]!
  }

  type MutationResult {
    success: Boolean!
    error: String
  }
`;

// Mock data for when database is not available
const mockUserInstructions = [
  {
    id: 'inst-1',
    title: 'Theme System Usage Guidelines',
    content: 'Always use CSS variables from the theme system. Never hardcode colors in components.',
    userTypes: ['HUMAN_DEVELOPER', 'AI_AGENT'],
    context: [],
    tags: ['theme', 'css', 'styling'],
    priority: 'high',
    lastUpdated: '2024-12-19',
    version: '1.2'
  },
  {
    id: 'inst-2',
    title: 'Quality Gate Requirements',
    content: 'Before marking any task complete: 1) Run npm run lint 2) Run npm run type-check 3) Get manual testing approval',
    userTypes: ['AI_AGENT'],
    context: [],
    tags: ['quality', 'testing', 'workflow'],
    priority: 'critical',
    lastUpdated: '2024-12-19',
    version: '1.0'
  }
];

const mockToolConfigurations = [
  {
    id: 'tool-1',
    toolName: 'ESLint',
    category: 'Quality Tools',
    environment: 'Development',
    configuration: '{}',
    userTypes: ['HUMAN_DEVELOPER'],
    validationRules: [],
    lastUpdated: '2024-12-19'
  },
  {
    id: 'tool-2',
    toolName: 'Vitest',
    category: 'Testing',
    environment: 'Development',
    configuration: '{}',
    userTypes: ['HUMAN_DEVELOPER'],
    validationRules: [],
    lastUpdated: '2024-12-19'
  }
];

// Resolvers
const resolvers = {
  Query: {
    getUserInstructions: async () => {
      if (db) {
        return db.getAllUserInstructions();
      }
      return mockUserInstructions;
    },
    
    getUserInstruction: async (_, { id }) => {
      if (db) {
        return db.getUserInstructionById(id);
      }
      return mockUserInstructions.find(inst => inst.id === id);
    },
    
    getToolConfigurations: async () => {
      if (db) {
        return db.getAllToolConfigurations();
      }
      return mockToolConfigurations;
    },
    
    getToolConfiguration: async (_, { id }) => {
      if (db) {
        return db.getToolConfigurationById(id);
      }
      return mockToolConfigurations.find(config => config.id === id);
    },
    
    health: () => 'GraphQL API is healthy!'
  },
  
  Mutation: {
    createUserInstruction: async (_, { input }) => {
      if (db) {
        return db.createUserInstruction(input);
      }
      return { success: false, error: 'Database not available in serverless environment' };
    },
    
    updateUserInstruction: async (_, { id, input }) => {
      if (db) {
        return db.updateUserInstruction(id, input);
      }
      return { success: false, error: 'Database not available in serverless environment' };
    },
    
    deleteUserInstruction: async (_, { id }) => {
      if (db) {
        return db.deleteUserInstruction(id);
      }
      return { success: false, error: 'Database not available in serverless environment' };
    },
    
    createToolConfiguration: async (_, { input }) => {
      if (db) {
        return db.createToolConfiguration(input);
      }
      return { success: false, error: 'Database not available in serverless environment' };
    },
    
    updateToolConfiguration: async (_, { id, input }) => {
      if (db) {
        return db.updateToolConfiguration(id, input);
      }
      return { success: false, error: 'Database not available in serverless environment' };
    },
    
    deleteToolConfiguration: async (_, { id }) => {
      if (db) {
        return db.deleteToolConfiguration(id);
      }
      return { success: false, error: 'Database not available in serverless environment' };
    }
  }
};

// Create Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  playground: process.env.NODE_ENV !== 'production'
});

const startServer = apolloServer.start();

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await startServer;
  await apolloServer.createHandler({ path: '/api/graphql' })(req, res);
}
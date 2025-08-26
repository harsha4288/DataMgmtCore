/**
 * Simple GraphQL Server Test
 */

const { createServer } = require('node:http');
const { createYoga } = require('graphql-yoga');
const { buildSchema } = require('graphql');

// Simple schema for testing
const typeDefs = `
  type Query {
    hello: String
    health: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL server!',
    health: () => 'OK'
  }
};

const schema = buildSchema(typeDefs);

const yoga = createYoga({
  schema,
  resolvers,
  graphqlEndpoint: '/graphql'
});

// Create server
const server = createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', service: 'GraphQL Server' }));
    return;
  }
  
  // Pass to GraphQL
  yoga(req, res);
});

const PORT = 3004;

server.listen(PORT, () => {
  console.log(`✅ GraphQL server running on port ${PORT}`);
  console.log(`🚀 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down GraphQL server...');
  server.close(() => {
    console.log('✅ GraphQL server stopped');
    process.exit(0);
  });
});
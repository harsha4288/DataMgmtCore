const DocumentationDataSources = require('./src/lib/graphql/datasources/DocumentationDataSources.cjs');
const Database = require('better-sqlite3');

console.log('=== TESTING DOCUMENTATION DATA SOURCES ===');

// Create database connection
const db = new Database('./src/lib/database/database.db');
console.log('✅ Database connection established');

// Create data source
const dataSources = new DocumentationDataSources('../docs/progress', db);
console.log('✅ DocumentationDataSources created');

// Test getAllTasks
console.log('\n=== TESTING getAllTasks() ===');
dataSources.getAllTasks().then(tasks => {
  console.log(`Found ${tasks.length} tasks:`);
  tasks.slice(0, 5).forEach(task => {
    console.log(`- ${task.id}: ${task.name} (${task.status})`);
  });
  
  // Check if any tasks have subtasks
  const tasksWithSubtasks = tasks.filter(t => t.subtasks && t.subtasks.length > 0);
  console.log(`\nTasks with subtasks: ${tasksWithSubtasks.length}`);
  
  db.close();
}).catch(error => {
  console.error('❌ Error in getAllTasks:', error);
  db.close();
});
const Database = require('better-sqlite3');

// Check what's in the WRONG database (the one GraphQL is using)
const wrongDbPath = './sgs_data_management.db';
const rightDbPath = './src/lib/database/database.db';

console.log('=== WRONG DATABASE (sgs_data_management.db) ===');
try {
  const wrongDb = new Database(wrongDbPath);
  const wrongTasks = wrongDb.prepare(`
    SELECT id, title, status, entity_type 
    FROM entities 
    WHERE entity_type = 'task' 
    ORDER BY id 
    LIMIT 5
  `).all();
  
  console.log('Tasks in wrong database:');
  wrongTasks.forEach(task => {
    console.log(`- ${task.id}: ${task.title} (${task.status})`);
  });
  wrongDb.close();
} catch (error) {
  console.log('Error accessing wrong database:', error.message);
}

console.log('\n=== RIGHT DATABASE (src/lib/database/database.db) ===');
try {
  const rightDb = new Database(rightDbPath);
  const rightTasks = rightDb.prepare(`
    SELECT id, title, status, entity_type 
    FROM entities 
    WHERE entity_type = 'task' 
    ORDER BY id 
    LIMIT 5
  `).all();
  
  console.log('Tasks in right database:');
  rightTasks.forEach(task => {
    console.log(`- ${task.id}: ${task.title} (${task.status})`);
  });
  rightDb.close();
} catch (error) {
  console.log('Error accessing right database:', error.message);
}
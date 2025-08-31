const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'src/lib/database/database.db');
const db = new Database(dbPath);

console.log('=== CURRENT DATABASE STATE ===\n');

console.log('All documents with their entity IDs:');
const docs = db.prepare('SELECT id, title, entity_id, entity_type FROM documents ORDER BY entity_id').all();
docs.forEach(d => console.log(`  ${d.id}: "${d.title}" -> ${d.entity_id} (${d.entity_type})`));

console.log('\nTesting the specific queries that frontend makes:');

console.log('\n1. Query: task-5.8.3-advanced-dashboard-functionality');
const dashDocs = db.prepare('SELECT id, title FROM documents WHERE entity_id = ? AND entity_type = ?')
  .all('task-5.8.3-advanced-dashboard-functionality', 'task');
console.log(`   Found ${dashDocs.length} document(s):`);
dashDocs.forEach(d => console.log(`   - ${d.id}: "${d.title}"`));

console.log('\n2. Query: task-5.8.3.1-navigation-flow-architecture-redesign');  
const navDocs = db.prepare('SELECT id, title FROM documents WHERE entity_id = ? AND entity_type = ?')
  .all('task-5.8.3.1-navigation-flow-architecture-redesign', 'task');
console.log(`   Found ${navDocs.length} document(s):`);
navDocs.forEach(d => console.log(`   - ${d.id}: "${d.title}"`));

console.log('\n3. Query: TASK-1301 (subtask)');
const taskDocs = db.prepare('SELECT id, title FROM documents WHERE entity_id = ? AND entity_type = ?')
  .all('TASK-1301', 'subtask');
console.log(`   Found ${taskDocs.length} document(s):`);
taskDocs.forEach(d => console.log(`   - ${d.id}: "${d.title}"`));

db.close();
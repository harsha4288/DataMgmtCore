const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'src/lib/database/database.db');
const db = new Database(dbPath);

console.log('=== MIGRATING ALL IDs TO TASK-N FORMAT ===\n');

// Generate next TASK-N ID
function getNextTaskId() {
  // Get current TASK counter and increment
  const result = db.prepare('SELECT current_counter FROM boards WHERE prefix = ?').get('TASK');
  const nextNum = (result?.current_counter || 0) + 1;
  
  // Update counter
  db.prepare('INSERT OR REPLACE INTO boards (prefix, current_counter) VALUES (?, ?)')
    .run('TASK', nextNum);
  
  return `TASK-${nextNum}`;
}

console.log('Current documents:');
const currentDocs = db.prepare('SELECT id, title, entity_id, entity_type FROM documents ORDER BY entity_id').all();
currentDocs.forEach(d => console.log(`  ${d.entity_id} (${d.entity_type}): "${d.title}"`));

console.log('\nCreating migration plan...');

// Create a clean mapping of old entity IDs to new TASK-N IDs
const migrations = [
  // Keep phase-5 as is (phases don't need TASK- prefix)
  { 
    old: 'phase-5', 
    new: 'phase-5', 
    type: 'phase', 
    action: 'keep',
    description: 'Phase ID - keep as is'
  },
  
  // Migrate all task and subtask entities to TASK-N format
  {
    old: 'task-5.8.3-advanced-dashboard-functionality',
    new: getNextTaskId(), // This will be TASK-1459 or next available
    type: 'task',
    action: 'migrate',
    description: 'Dashboard functionality task'
  },
  
  {
    old: 'task-5.8.3.1-navigation-flow-architecture-redesign', 
    new: getNextTaskId(), 
    type: 'task',
    action: 'migrate',
    description: 'Navigation architecture task'
  },
  
  {
    old: 'task-5.8.3.1',
    new: 'DELETE', // This seems to be a duplicate
    type: 'task',
    action: 'delete',
    description: 'Duplicate task - remove'
  },
  
  // Subtasks already using TASK-N format, keep them
  {
    old: 'TASK-1',
    new: 'TASK-1',
    type: 'subtask', 
    action: 'keep',
    description: 'Already in correct format'
  },
  
  {
    old: 'TASK-1301',
    new: 'TASK-1301', 
    type: 'subtask',
    action: 'keep', 
    description: 'Already in correct format'
  }
];

console.log('\nMigration plan:');
migrations.forEach(m => {
  if (m.action === 'migrate') {
    console.log(`  ${m.old} -> ${m.new} (${m.type}) - ${m.description}`);
  } else if (m.action === 'delete') {
    console.log(`  ${m.old} -> DELETE (${m.type}) - ${m.description}`);
  } else {
    console.log(`  ${m.old} -> KEEP (${m.type}) - ${m.description}`);
  }
});

console.log('\nExecuting migration...');

const transaction = db.transaction((migrations) => {
  for (const migration of migrations) {
    if (migration.action === 'migrate') {
      console.log(`Migrating: ${migration.old} -> ${migration.new}`);
      
      const result = db.prepare(
        'UPDATE documents SET entity_id = ? WHERE entity_id = ? AND entity_type = ?'
      ).run(migration.new, migration.old, migration.type);
      
      console.log(`  Updated ${result.changes} document(s)`);
      
    } else if (migration.action === 'delete') {
      console.log(`Deleting: ${migration.old}`);
      
      const result = db.prepare(
        'DELETE FROM documents WHERE entity_id = ? AND entity_type = ?'
      ).run(migration.old, migration.type);
      
      console.log(`  Deleted ${result.changes} document(s)`);
    }
  }
});

try {
  transaction(migrations);
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  throw error;
}

// Show final state
console.log('\nFinal state:');
const finalDocs = db.prepare('SELECT entity_id, entity_type, COUNT(*) as count FROM documents GROUP BY entity_id, entity_type ORDER BY entity_id').all();
finalDocs.forEach(d => console.log(`  ${d.entity_id} (${d.entity_type}) - ${d.count} document(s)`));

db.close();
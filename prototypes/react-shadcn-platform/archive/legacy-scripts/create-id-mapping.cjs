const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'src/lib/database/database.db');
const db = new Database(dbPath);

console.log('=== CREATING ID MAPPING TABLE ===\n');

// Create entity_id_mapping table 
db.exec(`
  CREATE TABLE IF NOT EXISTS entity_id_mapping (
    old_id TEXT PRIMARY KEY,
    new_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Created entity_id_mapping table');

// Insert mappings based on our recent migration
const mappings = [
  {
    old_id: 'task-5.8.3-advanced-dashboard-functionality',
    new_id: 'TASK-2431', 
    entity_type: 'task'
  },
  {
    old_id: 'task-5.8.3.1-navigation-flow-architecture-redesign',
    new_id: 'TASK-2432',
    entity_type: 'task'  
  },
  {
    old_id: 'subtask-0',  // Map any old subtask collisions
    new_id: 'TASK-1',
    entity_type: 'subtask'
  },
  // Add more mappings as needed
];

console.log('\nInserting mappings:');

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO entity_id_mapping (old_id, new_id, entity_type) 
  VALUES (?, ?, ?)
`);

const transaction = db.transaction((mappings) => {
  for (const mapping of mappings) {
    console.log(`  ${mapping.old_id} -> ${mapping.new_id} (${mapping.entity_type})`);
    insertStmt.run(mapping.old_id, mapping.new_id, mapping.entity_type);
  }
});

transaction(mappings);

console.log('\n✅ ID mapping table created and populated');

// Verify mappings
console.log('\nCreated mappings:');
const allMappings = db.prepare('SELECT * FROM entity_id_mapping ORDER BY old_id').all();
allMappings.forEach(m => console.log(`  ${m.old_id} -> ${m.new_id} (${m.entity_type})`));

db.close();
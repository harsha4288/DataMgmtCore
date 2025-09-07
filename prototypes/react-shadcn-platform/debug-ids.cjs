const Database = require('better-sqlite3');

const db = new Database('./src/lib/database/database.db');

console.log('=== ACTUAL DATABASE IDs ===');
const rows = db.prepare(`
  SELECT id, title, parent_id, entity_type, hierarchy_path 
  FROM entities 
  WHERE entity_type IN ('phase', 'task', 'subtask') 
  ORDER BY hierarchy_path 
  LIMIT 15
`).all();

rows.forEach(row => {
  console.log(`${row.id} | ${row.entity_type} | parent: ${row.parent_id} | ${row.title}`);
});

console.log('\n=== PHASE-5 HIERARCHY ===');
const phase5Rows = db.prepare(`
  SELECT id, title, parent_id, entity_type, level
  FROM entities 
  WHERE hierarchy_path = 'phase-5' OR hierarchy_path LIKE 'phase-5/%'
  ORDER BY level, hierarchy_path
  LIMIT 10
`).all();

phase5Rows.forEach(row => {
  console.log(`${row.id} | level ${row.level} | ${row.entity_type} | ${row.title}`);
});

db.close();
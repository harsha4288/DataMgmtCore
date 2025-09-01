const Database = require('better-sqlite3');
const db = new Database('src/lib/database/database.db');

console.log('=== ENTITY RELATIONSHIPS FOR TASK-1482 ===');
const relationships = db.prepare(`
  SELECT 
    er.id,
    er.relationship_type,
    er.source_entity_id, 
    er.target_entity_id,
    er.strength,
    er.notes
  FROM entity_relationships er
  WHERE er.source_entity_id = 'TASK-1482' OR er.target_entity_id = 'TASK-1482'
  ORDER BY er.created_at
`).all();

console.log('Found relationships:', relationships.length);
relationships.forEach(r => {
  console.log(`- ${r.id}: ${r.relationship_type}`);
  console.log(`  ${r.source_entity_id} -> ${r.target_entity_id}`);
  console.log(`  ${r.notes}\n`);
});

console.log('=== DOCUMENTS FOR TASK-1482 ===');
const docs = db.prepare(`
  SELECT id, title, status
  FROM documents 
  WHERE entity_id = 'TASK-1482'
`).all();

console.log('Found documents:', docs.length);
docs.forEach(d => console.log(`- ${d.id}: ${d.title} (${d.status})`));

console.log('=== PROJECT_DOCUMENTS FOR TASK-1482 ===');
// Check if project_documents table exists and has data
try {
  const projDocs = db.prepare(`
    SELECT id, title, status
    FROM project_documents 
    WHERE entity_id = 'TASK-1482'
  `).all();
  console.log('Found project_documents:', projDocs.length);
  projDocs.forEach(d => console.log(`- ${d.id}: ${d.title} (${d.status})`));
} catch(e) {
  console.log('project_documents table not found or error:', e.message);
}

db.close();
const Database = require('better-sqlite3');
const db = new Database('src/lib/database/database.db');

console.log('Creating practical relationships for TASK-1482...');

const createRel = db.prepare(`
  INSERT OR REPLACE INTO entity_relationships (id, source_entity_id, target_entity_id, relationship_type, strength, is_auto_generated, impact_score, notes, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Valid entity relationships
createRel.run('REL-10', 'TASK-2436', 'TASK-1482', 'tests', 0.8, 0, 0.7, 'Enhanced Entity System Test validates the interconnection architecture', 'system');
createRel.run('REL-11', 'TASK-1483', 'TASK-1482', 'depends_on', 0.9, 0, 0.8, 'Quality Pipeline depends on entity interconnection system', 'system'); 
createRel.run('REL-12', 'TASK-1482', 'phase-5', 'implements', 0.95, 0, 1.0, 'Task implements Phase 5 universal project management', 'system');
createRel.run('REL-13', 'TASK-1482', 'TASK-1481', 'resolves', 0.9, 0, 0.85, 'Entity Interconnection resolves ID collision issues', 'system');
createRel.run('REL-14', 'TASK-1479', 'TASK-1482', 'relates_to', 0.7, 0, 0.6, 'Advanced Dashboard relates to Entity Interconnection system', 'system');

console.log('✅ Created 5 practical entity relationships');

// Show relationship count
const count = db.prepare('SELECT COUNT(*) as count FROM entity_relationships').get();
console.log('Total relationships in system:', count.count);

// Show relationships for TASK-1482
const relationships = db.prepare(`
  SELECT 
    er.id,
    er.relationship_type,
    er.source_entity_id, 
    er.target_entity_id,
    er.strength,
    er.notes,
    e1.title as source_title,
    e2.title as target_title
  FROM entity_relationships er
  LEFT JOIN entities e1 ON er.source_entity_id = e1.id  
  LEFT JOIN entities e2 ON er.target_entity_id = e2.id
  WHERE er.source_entity_id = 'TASK-1482' OR er.target_entity_id = 'TASK-1482'
  ORDER BY er.created_at
`).all();

console.log('\n=== TASK-1482 RELATIONSHIPS ===');
relationships.forEach(r => {
  if (r.source_entity_id === 'TASK-1482') {
    console.log(` ➡️  TASK-1482 ${r.relationship_type} ${r.target_entity_id}`);
    console.log(`    "${r.source_title}" ${r.relationship_type} "${r.target_title}"`);
  } else {
    console.log(` ⬅️  ${r.source_entity_id} ${r.relationship_type} TASK-1482`);  
    console.log(`    "${r.source_title}" ${r.relationship_type} "${r.target_title}"`);
  }
  console.log(`    Strength: ${r.strength} | ${r.notes}\n`);
});

console.log('✅ TASK-1482 now has practical relationship examples!');
db.close();
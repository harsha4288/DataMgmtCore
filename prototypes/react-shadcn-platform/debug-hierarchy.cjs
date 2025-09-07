const Database = require('better-sqlite3');

const db = new Database('./src/lib/database/database.db');

console.log('Testing hierarchy building...');

// Get Phase 5 tasks 
const entityRows = db.prepare(`
  SELECT * FROM entities 
  WHERE hierarchy_path LIKE 'phase-5/%'
  ORDER BY level, sort_order, hierarchy_path
`).all();

console.log('Found entities:', entityRows.length);
console.log('Sample entities:');
entityRows.slice(0, 5).forEach(row => {
  console.log(`- ${row.id}: ${row.title} (parent: ${row.parent_id}, level: ${row.level})`);
});

// Test the hierarchy building logic
function buildEntityHierarchy(entityRows, parentId = null) {
  console.log(`Building hierarchy for parent: ${parentId}`);
  
  // Group entities by parent
  const entitiesByParent = new Map();
  
  // First pass: group by parent
  entityRows.forEach(row => {
    const parent = row.parent_id || parentId;
    if (!entitiesByParent.has(parent)) {
      entitiesByParent.set(parent, []);
    }
    entitiesByParent.get(parent).push({
      id: row.id,
      name: row.title || '',
      status: row.status || 'pending',
      entity_type: row.entity_type,
      level: row.level
    });
  });
  
  console.log('Entities by parent:');
  for (const [parent, children] of entitiesByParent.entries()) {
    console.log(`  ${parent}: ${children.length} children`);
  }
  
  // Get top-level tasks (direct children of phase-5)
  const topLevelTasks = entitiesByParent.get('phase-5') || [];
  console.log('Top level tasks:', topLevelTasks.length);
  
  return topLevelTasks.filter(entity => entity.entity_type === 'task').map(task => {
    const children = entitiesByParent.get(task.id) || [];
    return {
      ...task,
      subtasks: children.map(child => ({
        id: child.id,
        name: child.name,
        completed: child.status === 'completed'
      }))
    };
  });
}

const result = buildEntityHierarchy(entityRows, 'phase-5');
console.log('\nFinal result:');
console.log(JSON.stringify(result.slice(0, 2), null, 2));

db.close();
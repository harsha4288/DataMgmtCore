const Database = require('better-sqlite3');
const db = new Database('src/lib/database/database.db');

console.log('Checking data issues before migration...\n');

// Check priority values
const priorities = db.prepare('SELECT priority, COUNT(*) as count FROM entities GROUP BY priority').all();
console.log('Priority values:');
priorities.forEach(r => {
  console.log(`  ${r.priority || 'NULL'}: ${r.count} entities`);
});

// Check for NULL values in required fields
const requiredFields = ['entity_type', 'board_id', 'title', 'status', 'priority'];
console.log('\nNULL value check:');
requiredFields.forEach(field => {
  const nullCount = db.prepare(`SELECT COUNT(*) as count FROM entities WHERE ${field} IS NULL`).get();
  if (nullCount.count > 0) {
    console.log(`  ${field}: ${nullCount.count} NULL values`);
  }
});

// Show some sample data with NULL priority
const nullPriorities = db.prepare('SELECT id, title, priority FROM entities WHERE priority IS NULL LIMIT 5').all();
if (nullPriorities.length > 0) {
  console.log('\nSample entities with NULL priority:');
  nullPriorities.forEach(e => {
    console.log(`  ${e.id}: ${e.title} (priority: ${e.priority})`);
  });
}

db.close();
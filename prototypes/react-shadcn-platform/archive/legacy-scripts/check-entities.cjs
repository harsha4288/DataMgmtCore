const Database = require('better-sqlite3');
const db = new Database('src/lib/database/database.db');

console.log('=== TOP 50 ACTUAL ENTITY IDs ===\n');

try {
  const entities = db.prepare('SELECT entity_id, entity_type, title, status FROM entities ORDER BY entity_id LIMIT 50').all();
  
  console.log(`Found ${entities.length} entities:\n`);
  
  entities.forEach((e, i) => {
    const num = String(i + 1).padStart(2, ' ');
    const title = e.title || 'No title';
    const status = e.status || 'unknown';
    console.log(`${num}. ${e.entity_id} (${e.entity_type}) - ${title} [${status}]`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
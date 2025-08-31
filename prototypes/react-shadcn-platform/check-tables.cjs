const Database = require('better-sqlite3');
const db = new Database('src/lib/database/database.db');

console.log('=== DATABASE TABLES ===\n');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  console.log(`Found ${tables.length} tables:\n`);
  
  tables.forEach(t => console.log('- ' + t.name));
  
  console.log('\n=== TABLE STRUCTURES ===\n');
  
  for (const table of tables) {
    console.log(`\n--- ${table.name} ---`);
    const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.pk ? '(PK)' : ''} ${col.notnull ? '(NOT NULL)' : ''}`);
    });
    
    // Show sample data
    try {
      const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`).all();
      if (sample.length > 0) {
        console.log(`  Sample data (${sample.length} rows):`);
        sample.forEach((row, i) => {
          const keys = Object.keys(row).slice(0, 3); // Show first 3 columns
          const preview = keys.map(k => `${k}:${row[k]}`).join(', ');
          console.log(`    ${i+1}. ${preview}...`);
        });
      }
    } catch (e) {
      console.log('  (No data or error reading samples)');
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
#!/usr/bin/env node

const path = require('path');
const Database = require('better-sqlite3');

// Initialize database
const dbPath = path.join(__dirname, 'src/lib/database/database.db');
const db = new Database(dbPath);

console.log('Cleaning up duplicate subtasks under TASK-1483...\n');

// Get all subtasks under TASK-1483
const subtasks = db.prepare(`
  SELECT id, title, estimated_hours, created_at
  FROM entities 
  WHERE parent_id = 'TASK-1483'
  ORDER BY created_at
`).all();

console.log(`Found ${subtasks.length} subtasks under TASK-1483`);

// Group by title to find duplicates
const tasksByTitle = {};
subtasks.forEach(task => {
  if (!tasksByTitle[task.title]) {
    tasksByTitle[task.title] = [];
  }
  tasksByTitle[task.title].push(task);
});

// Keep the first occurrence of each title, delete the rest
const toDelete = [];
Object.entries(tasksByTitle).forEach(([title, tasks]) => {
  if (tasks.length > 1) {
    console.log(`\n🔍 Found ${tasks.length} duplicates for: ${title}`);
    // Keep the first one (oldest), mark others for deletion
    for (let i = 1; i < tasks.length; i++) {
      toDelete.push(tasks[i].id);
      console.log(`   ❌ Marking for deletion: ${tasks[i].id}`);
    }
    console.log(`   ✅ Keeping: ${tasks[0].id}`);
  }
});

// Delete duplicates
if (toDelete.length > 0) {
  console.log(`\n🗑️  Deleting ${toDelete.length} duplicate subtasks...`);
  const deleteStmt = db.prepare('DELETE FROM entities WHERE id = ?');
  
  toDelete.forEach(id => {
    deleteStmt.run(id);
    console.log(`   ✅ Deleted ${id}`);
  });
} else {
  console.log('\n✅ No duplicates found to delete');
}

// Verify final state
const finalSubtasks = db.prepare(`
  SELECT id, title, estimated_hours
  FROM entities 
  WHERE parent_id = 'TASK-1483'
  ORDER BY id
`).all();

console.log(`\n📊 Final state: ${finalSubtasks.length} subtasks under TASK-1483:`);
finalSubtasks.forEach(task => {
  console.log(`   ${task.id} - ${task.title} (${task.estimated_hours}h)`);
});

const totalHours = finalSubtasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
console.log(`\n⏱️  Total estimated effort: ${totalHours} hours`);

// Update parent task with correct total
const updateParentStmt = db.prepare(`
  UPDATE entities 
  SET estimated_hours = ?, updated_at = ? 
  WHERE id = ?
`);
updateParentStmt.run(totalHours, new Date().toISOString(), 'TASK-1483');

console.log('✅ Parent task updated with corrected total estimated hours');

db.close();
console.log('\n🎉 Cleanup completed successfully!');
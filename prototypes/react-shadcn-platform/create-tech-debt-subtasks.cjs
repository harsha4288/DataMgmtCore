#!/usr/bin/env node

const path = require('path');
const Database = require('better-sqlite3');

// Initialize database
const dbPath = path.join(__dirname, 'src/lib/database/database.db');
const db = new Database(dbPath);

console.log('Creating tech debt cleanup subtasks under TASK-1483...\n');

// Verify parent task exists
const parentTask = db.prepare('SELECT * FROM entities WHERE id = ?').get('TASK-1483');
if (!parentTask) {
  console.error('❌ Parent task TASK-1483 not found!');
  process.exit(1);
}

console.log(`✅ Found parent task: ${parentTask.title}`);
console.log(`   Status: ${parentTask.status}, Level: ${parentTask.level}\n`);

// Get current counter for TASK board
const boardResult = db.prepare('SELECT current_counter FROM boards WHERE prefix = ?').get('TASK');
let nextCounter = (boardResult?.current_counter || 0) + 1;

// Define subtasks
const subtasks = [
  {
    title: "GraphQL Server Refactoring (3562→500 lines)",
    description: "Split monolithic graphql-server.cjs into modules, remove duplicate schemas and resolvers, consolidate database operations, remove file-based data sources (use DB only)",
    estimatedHours: 8
  },
  {
    title: "Root Directory Cleanup (26→5 files)", 
    description: "Move test-*.cjs files to tests/ directory, archive migration scripts to scripts/archive/, delete temporary debug files, keep only essential configs in root",
    estimatedHours: 4
  },
  {
    title: "Component Size Optimization",
    description: "Split components >800 lines, extract reusable logic to hooks, separate test utilities from test cases, reduce test file duplication",
    estimatedHours: 12
  },
  {
    title: "Database Access Layer",
    description: "Centralize all DB operations in src/lib/database/, single initialization point, remove 81 scattered DB access points, consistent error handling", 
    estimatedHours: 6
  },
  {
    title: "Scripts Consolidation",
    description: "Merge duplicate API servers, unify dev server configurations, archive old migration scripts, reduce scripts/ from 42 to ~15 files",
    estimatedHours: 5
  }
];

// Create each subtask
const createdSubtasks = [];
for (const subtask of subtasks) {
  const taskId = `TASK-${nextCounter}`;
  const hierarchyPath = `${parentTask.hierarchy_path}/${taskId}`;
  const now = new Date().toISOString();
  
  try {
    // Insert the entity
    const insertStmt = db.prepare(`
      INSERT INTO entities (
        id, entity_type, parent_id, board_id, title, description, status,
        priority, level, hierarchy_path, sort_order, progress, estimated_hours,
        assignee, labels, dependencies, created_by, created_at, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      taskId,                    // id
      'subtask',                 // entity_type
      parentTask.id,             // parent_id
      'TASK',                    // board_id
      subtask.title,             // title
      subtask.description,       // description
      'pending',                 // status
      'medium',                  // priority
      parentTask.level + 1,      // level (parent level + 1)
      hierarchyPath,             // hierarchy_path
      nextCounter,               // sort_order
      0,                         // progress
      subtask.estimatedHours,    // estimated_hours
      null,                      // assignee
      '[]',                      // labels (empty JSON array)
      '[]',                      // dependencies (empty JSON array)
      'system',                  // created_by
      now,                       // created_at
      'system',                  // updated_by
      now                        // updated_at
    );

    // Update board counter
    db.prepare('INSERT OR REPLACE INTO boards (prefix, current_counter, name, description, default_entity_type, created_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('TASK', nextCounter, 'Task Board', 'General task management', 'task', now, 1);

    createdSubtasks.push({
      id: taskId,
      title: subtask.title,
      estimatedHours: subtask.estimatedHours
    });

    console.log(`✅ Created subtask: ${taskId} - ${subtask.title}`);
    console.log(`   Estimated hours: ${subtask.estimatedHours}h`);
    console.log(`   Level: ${parentTask.level + 1}, Parent: ${parentTask.id}\n`);

    nextCounter++;
  } catch (error) {
    console.error(`❌ Failed to create subtask ${taskId}:`, error.message);
  }
}

// Verify creation
console.log('\n📊 Verification:');
const verifyStmt = db.prepare(`
  SELECT id, title, status, level, estimated_hours 
  FROM entities 
  WHERE parent_id = ? 
  ORDER BY sort_order
`);
const createdTasks = verifyStmt.all('TASK-1483');

console.log(`\n✅ Successfully created ${createdTasks.length} subtasks under ${parentTask.id}:`);
createdTasks.forEach(task => {
  console.log(`   ${task.id} - ${task.title} (${task.estimated_hours}h)`);
});

const totalHours = createdTasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0);
console.log(`\n⏱️  Total estimated effort: ${totalHours} hours`);

// Update parent task progress calculation
console.log('\n🔄 Updating parent task...');
const updateParentStmt = db.prepare(`
  UPDATE entities 
  SET estimated_hours = ?, updated_at = ? 
  WHERE id = ?
`);
updateParentStmt.run(totalHours, new Date().toISOString(), 'TASK-1483');

console.log('✅ Parent task updated with total estimated hours');

db.close();
console.log('\n🎉 Tech debt cleanup subtasks created successfully!');
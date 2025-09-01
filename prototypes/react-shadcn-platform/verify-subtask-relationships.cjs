#!/usr/bin/env node

const path = require('path');
const Database = require('better-sqlite3');

// Initialize database  
const dbPath = path.join(__dirname, 'src/lib/database/database.db');
const db = new Database(dbPath);

console.log('🔍 Verifying subtask relationships for TASK-1483...\n');

// Get parent task details
const parent = db.prepare(`
  SELECT id, title, status, level, estimated_hours, hierarchy_path
  FROM entities 
  WHERE id = ?
`).get('TASK-1483');

if (!parent) {
  console.error('❌ Parent task TASK-1483 not found!');
  process.exit(1);
}

console.log('👨‍💼 Parent Task:');
console.log(`   ID: ${parent.id}`);
console.log(`   Title: ${parent.title}`);
console.log(`   Status: ${parent.status}`);
console.log(`   Level: ${parent.level}`);
console.log(`   Estimated Hours: ${parent.estimated_hours}h`);
console.log(`   Hierarchy Path: ${parent.hierarchy_path}`);

// Get all child subtasks
const children = db.prepare(`
  SELECT id, title, status, level, estimated_hours, hierarchy_path, description
  FROM entities 
  WHERE parent_id = ?
  ORDER BY id
`).all('TASK-1483');

console.log(`\n👶 Child Subtasks (${children.length}):`);
children.forEach((child, index) => {
  console.log(`\n   ${index + 1}. ${child.id} - ${child.title}`);
  console.log(`      Status: ${child.status}`);
  console.log(`      Level: ${child.level} (Parent: ${parent.level})`);
  console.log(`      Hours: ${child.estimated_hours}h`);
  console.log(`      Description: ${child.description.substring(0, 80)}...`);
  console.log(`      Hierarchy: ${child.hierarchy_path}`);
});

// Verify hierarchy integrity
console.log('\n🔗 Hierarchy Integrity Check:');
const hierarchyIssues = [];

children.forEach(child => {
  // Check level is parent level + 1
  if (child.level !== parent.level + 1) {
    hierarchyIssues.push(`${child.id}: Wrong level (${child.level}, should be ${parent.level + 1})`);
  }
  
  // Check hierarchy path starts with parent path
  if (!child.hierarchy_path.startsWith(parent.hierarchy_path)) {
    hierarchyIssues.push(`${child.id}: Hierarchy path doesn't start with parent path`);
  }
});

if (hierarchyIssues.length === 0) {
  console.log('✅ All hierarchy relationships are correct');
} else {
  console.log('❌ Hierarchy issues found:');
  hierarchyIssues.forEach(issue => console.log(`   ${issue}`));
}

// Summary
const totalEstimated = children.reduce((sum, child) => sum + (child.estimated_hours || 0), 0);
console.log(`\n📊 Summary:`);
console.log(`   Parent Task: ${parent.id} (${parent.estimated_hours}h estimated)`);
console.log(`   Child Tasks: ${children.length} subtasks (${totalEstimated}h total)`);
console.log(`   Hierarchy Levels: ${parent.level} → ${parent.level + 1}`);
console.log(`   Status Distribution:`);

const statusCounts = children.reduce((acc, child) => {
  acc[child.status] = (acc[child.status] || 0) + 1;
  return acc;
}, {});

Object.entries(statusCounts).forEach(([status, count]) => {
  console.log(`     ${status}: ${count} tasks`);
});

db.close();
console.log('\n✅ Verification completed!');
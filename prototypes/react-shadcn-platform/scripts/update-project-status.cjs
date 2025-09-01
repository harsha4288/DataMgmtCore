/**
 * Update Project Status Script
 * Updates task statuses in database based on project progress
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../src/lib/database/database.db');

function updateProjectStatus() {
  console.log('🔄 Starting project status update...');
  
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database not found at:', dbPath);
    return;
  }

  const db = new Database(dbPath);
  
  try {
    // Query current status
    console.log('\n📊 Current status in database:');
    
    // Check entities table
    const entities = db.prepare('SELECT id, entity_type, title, status FROM entities ORDER BY entity_type, id').all();
    console.log(`Found ${entities.length} entities:`);
    
    entities.forEach(entity => {
      console.log(`  ${entity.id} (${entity.entity_type}): ${entity.status} - ${entity.title}`);
    });
    
    // Check phases table if it exists
    try {
      const phases = db.prepare('SELECT id, name, status FROM phases ORDER BY id').all();
      if (phases.length > 0) {
        console.log(`\nFound ${phases.length} phases:`);
        phases.forEach(phase => {
          console.log(`  ${phase.id}: ${phase.status} - ${phase.name}`);
        });
      }
    } catch (e) {
      console.log('No phases table found');
    }
    
    // Check tasks table if it exists
    try {
      const tasks = db.prepare('SELECT id, name, status, phase_id FROM tasks ORDER BY phase_id, id').all();
      if (tasks.length > 0) {
        console.log(`\nFound ${tasks.length} tasks:`);
        tasks.forEach(task => {
          console.log(`  ${task.id} (phase: ${task.phase_id}): ${task.status} - ${task.name}`);
        });
      }
    } catch (e) {
      console.log('No tasks table found');
    }

    console.log('\n🔧 Applying status updates...');

    // Phase 0, 1, 2: Set to completed
    const completedPhases = ['phase-0', 'phase-1', 'phase-2'];
    completedPhases.forEach(phaseId => {
      const result = db.prepare('UPDATE entities SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND entity_type = ?')
        .run('completed', phaseId, 'phase');
      if (result.changes > 0) {
        console.log(`✅ Updated ${phaseId} to completed`);
      }
    });

    // Phase 3, 4: Set to on hold (assuming they exist)
    const onHoldPhases = ['phase-3', 'phase-4'];
    onHoldPhases.forEach(phaseId => {
      const result = db.prepare('UPDATE entities SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND entity_type = ?')
        .run('blocked', phaseId, 'phase'); // Using 'blocked' as closest to 'on hold'
      if (result.changes > 0) {
        console.log(`⏸️ Updated ${phaseId} to blocked (on hold)`);
      }
    });

    // Phase 5: Set to in_progress
    const result5 = db.prepare('UPDATE entities SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND entity_type = ?')
      .run('in_progress', 'phase-5', 'phase');
    if (result5.changes > 0) {
      console.log(`🔄 Updated phase-5 to in_progress`);
    }

    // Phase 6: Set to pending (not started)
    const result6 = db.prepare('UPDATE entities SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND entity_type = ?')
      .run('pending', 'phase-6', 'phase');
    if (result6.changes > 0) {
      console.log(`⏳ Updated phase-6 to pending`);
    }

    // Update specific Phase 5 tasks
    // Tasks 5.8.1, 5.8.2, 5.8.3: All completed (including GraphQL SQLite migration)
    const completedTasks = ['5.8.1', '5.8.2', '5.8.3'];
    completedTasks.forEach(taskNum => {
      const result = db.prepare('UPDATE entities SET status = ?, progress = 100, updated_at = CURRENT_TIMESTAMP WHERE id LIKE ? AND entity_type = ?')
        .run('completed', `%${taskNum}%`, 'task');
      if (result.changes > 0) {
        console.log(`✅ Updated ${result.changes} Task ${taskNum} related tasks to completed`);
      }
    });

    // Tasks 5.1, 5.2, 5.3, 5.6: On hold
    const onHoldTasks = ['5.1', '5.2', '5.3', '5.6'];
    onHoldTasks.forEach(taskNum => {
      const result = db.prepare('UPDATE entities SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id LIKE ? AND entity_type = ?')
        .run('blocked', `%${taskNum}%`, 'task');
      if (result.changes > 0) {
        console.log(`⏸️ Updated ${result.changes} Task ${taskNum} related tasks to blocked (on hold)`);
      }
    });

    // Task 5.8.4: Ready to start - Entity Interconnection Architecture
    const task584 = db.prepare('UPDATE entities SET status = ?, progress = 0, updated_at = CURRENT_TIMESTAMP WHERE id LIKE ? AND entity_type = ?')
      .run('pending', '%5.8.4%', 'task');
    if (task584.changes > 0) {
      console.log(`🔄 Updated ${task584.changes} Task 5.8.4 related tasks to pending (ready to start)`);
    }

    // Remaining Phase 5 tasks: Still pending
    const pendingTasks = ['5.8.5', '5.8.7'];
    pendingTasks.forEach(taskNum => {
      const result = db.prepare('UPDATE entities SET status = ?, progress = 0, updated_at = CURRENT_TIMESTAMP WHERE id LIKE ? AND entity_type = ?')
        .run('pending', `%${taskNum}%`, 'task');
      if (result.changes > 0) {
        console.log(`⏳ Updated ${result.changes} Task ${taskNum} related tasks to pending`);
      }
    });

    // Update all tasks under completed phases to completed
    completedPhases.forEach(phaseId => {
      const taskUpdate = db.prepare('UPDATE entities SET status = ?, progress = 100, updated_at = CURRENT_TIMESTAMP WHERE parent_id = ? OR hierarchy_path LIKE ?')
        .run('completed', phaseId, `${phaseId}%`);
      if (taskUpdate.changes > 0) {
        console.log(`✅ Updated ${taskUpdate.changes} tasks under ${phaseId} to completed`);
      }
    });

    // Update all tasks under blocked phases to blocked
    onHoldPhases.forEach(phaseId => {
      const taskUpdate = db.prepare('UPDATE entities SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE parent_id = ? OR hierarchy_path LIKE ?')
        .run('blocked', phaseId, `${phaseId}%`);
      if (taskUpdate.changes > 0) {
        console.log(`⏸️ Updated ${taskUpdate.changes} tasks under ${phaseId} to blocked`);
      }
    });

    console.log('\n📊 Updated status:');
    const updatedEntities = db.prepare('SELECT id, entity_type, title, status, progress FROM entities ORDER BY entity_type, id').all();
    updatedEntities.forEach(entity => {
      const progress = entity.progress ? ` (${entity.progress}%)` : '';
      console.log(`  ${entity.id} (${entity.entity_type}): ${entity.status}${progress} - ${entity.title}`);
    });

    console.log('\n✅ Project status update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating project status:', error);
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  updateProjectStatus();
}

module.exports = { updateProjectStatus };
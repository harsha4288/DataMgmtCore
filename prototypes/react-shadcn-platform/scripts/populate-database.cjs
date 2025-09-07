/**
 * Database Population Script
 * Populates the database with project phases and tasks from PROGRESS.md
 */

const Database = require('better-sqlite3');
const path = require('path');

class DatabasePopulator {
  constructor() {
    this.dbPath = path.resolve(__dirname, '../src/lib/database/database.db');
    this.db = null;
  }

  initDatabase() {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    console.log('✅ Database connection established for population');
  }

  createBoard() {
    // Delete existing board if it exists
    try {
      this.db.prepare('DELETE FROM boards WHERE prefix = ?').run('SGS-PROJECT-BOARD');
    } catch (e) {
      // Ignore if table doesn't exist or other errors
    }
    
    const insertBoard = this.db.prepare(`
      INSERT INTO boards (prefix, name, description, current_counter, default_entity_type, is_active)
      VALUES (?, ?, ?, 0, 'task', 1)
    `);
    
    insertBoard.run(
      'SGS-PROJECT-BOARD',
      'SGS Data Management Platform',
      'Main project board for SGS Data Management Core Platform development'
    );
  }

  // Map PROGRESS.md status values to database constraint values
  mapStatus(progressStatus, entityType = 'phase') {
    if (entityType === 'phase') {
      // PhaseStatusEnum only supports: pending, in_progress, completed
      const statusMap = {
        'completed': 'completed',
        'active': 'in_progress',
        'on_hold': 'pending', // Changed from 'blocked' to 'pending' for phases
        'next_priority': 'pending',
        'pending': 'pending'
      };
      return statusMap[progressStatus] || 'pending';
    } else {
      // TaskStatusEnum supports: pending, in_progress, completed, blocked, cancelled
      const statusMap = {
        'completed': 'completed',
        'active': 'in_progress',
        'on_hold': 'blocked',
        'next_priority': 'pending',
        'pending': 'pending'
      };
      return statusMap[progressStatus] || 'pending';
    }
  }

  populateData() {
    console.log('📊 Starting database population...');

    // Clear existing data
    this.db.prepare('DELETE FROM entity_relationships').run();
    this.db.prepare('DELETE FROM entities').run();
    console.log('🗑️ Cleared existing data');

    // Create board first
    this.createBoard();
    console.log('📋 Created project board');

    // Populate phases
    const phases = this.getPhases();
    const phaseIds = this.insertPhases(phases);
    console.log(`📋 Inserted ${phases.length} phases`);

    // Populate tasks for each phase
    let totalTasks = 0;
    for (const [phaseNum, phaseId] of phaseIds) {
      const tasks = this.getTasks(phaseNum);
      const taskIds = this.insertTasks(tasks, phaseNum);
      this.createPhaseTaskRelationships(phaseId, taskIds);
      totalTasks += tasks.length;
      console.log(`📝 Inserted ${tasks.length} tasks for Phase ${phaseNum}`);
    }

    console.log(`✅ Population complete: ${phases.length} phases, ${totalTasks} tasks`);
  }

  getPhases() {
    return [
      {
        id: 'PHASE-0',
        title: 'Phase 0: Planning & Documentation',
        status: 'completed',
        progress: 100,
        description: 'Comprehensive documentation structure and enhanced development workflow'
      },
      {
        id: 'PHASE-1', 
        title: 'Phase 1: Foundation Setup',
        status: 'on_hold',
        progress: 96,
        description: 'Project initialization with Vite + React + TypeScript and theme system'
      },
      {
        id: 'PHASE-2',
        title: 'Phase 2: Gita Alumni Connect UI', 
        status: 'completed',
        progress: 100,
        description: 'Complete authentication, role-based dashboards, and messaging system'
      },
      {
        id: 'PHASE-3',
        title: 'Phase 3: Multi-Domain Validation',
        status: 'on_hold', 
        progress: 0,
        description: 'Validate platform flexibility across different domains'
      },
      {
        id: 'PHASE-4',
        title: 'Phase 4: Advanced Features & Polish',
        status: 'on_hold',
        progress: 0, 
        description: 'Production optimization and advanced features'
      },
      {
        id: 'PHASE-5',
        title: 'Phase 5: Development Infrastructure & Automation',
        status: 'active',
        progress: 0,
        description: 'Tool-first workflow, parallel execution, knowledge management'
      },
      {
        id: 'PHASE-6',
        title: 'Phase 6: Alumni Production Implementation', 
        status: 'next_priority',
        progress: 0,
        description: 'Transform Alumni Mock UI to Production-ready with AWS & PostgreSQL'
      }
    ];
  }

  getTasks(phaseNum) {
    const tasksByPhase = {
      0: [
        {
          id: 'TASK-0.1',
          title: 'Documentation Structure',
          status: 'completed',
          progress: 100,
          description: 'Comprehensive documentation structure implementation'
        },
        {
          id: 'TASK-0.2', 
          title: 'Quality Assurance Framework',
          status: 'completed',
          progress: 100,
          description: 'Quality assurance framework establishment'
        }
      ],
      1: [
        {
          id: 'TASK-1.1',
          title: 'Project Initialization',
          status: 'completed', 
          progress: 100,
          description: 'Project initialization with Vite + React + TypeScript'
        },
        {
          id: 'TASK-1.2',
          title: 'Theme System Implementation',
          status: 'completed',
          progress: 100, 
          description: 'Complete theme system with <200ms switching'
        },
        {
          id: 'TASK-1.3',
          title: 'Core shadcn/ui Components Setup',
          status: 'completed',
          progress: 100,
          description: 'All shadcn/ui components installed and configured'
        },
        {
          id: 'TASK-1.3.1',
          title: 'UI Navigation Simplification', 
          status: 'completed',
          progress: 100,
          description: 'Enhanced DataTable with frozen columns and navigation improvements'
        },
        {
          id: 'TASK-1.4',
          title: 'Entity System Integration',
          status: 'on_hold',
          progress: 0,
          description: 'Entity system integration (on hold for infrastructure)'
        },
        {
          id: 'TASK-1.5',
          title: 'Basic CRUD Operations',
          status: 'on_hold', 
          progress: 0,
          description: 'Basic CRUD operations implementation (on hold)'
        }
      ],
      2: [
        {
          id: 'TASK-2.1',
          title: 'Authentication & Profile System',
          status: 'completed',
          progress: 100,
          description: 'Complete authentication and profile system'
        },
        {
          id: 'TASK-2.2',
          title: 'Role-Based Dashboards',
          status: 'completed',
          progress: 100,
          description: 'Role-based dashboards (Member, Moderator, Admin)'
        },
        {
          id: 'TASK-2.3',
          title: 'Preferences & Domain System',
          status: 'completed',
          progress: 100,
          description: 'Preferences and domain system implementation'
        },
        {
          id: 'TASK-2.4',
          title: 'Postings & Content Management',
          status: 'completed',
          progress: 100,
          description: 'Postings and content management features'
        },
        {
          id: 'TASK-2.5',
          title: 'Social Interaction Features',
          status: 'completed',
          progress: 100,
          description: 'Social interaction features implementation'
        },
        {
          id: 'TASK-2.6',
          title: 'Chat & Messaging System',
          status: 'completed',
          progress: 100,
          description: 'Professional messaging and chat system'
        },
        {
          id: 'TASK-2.7',
          title: 'Moderation Tools',
          status: 'completed',
          progress: 100,
          description: 'Moderation tools implementation'
        },
        {
          id: 'TASK-2.8',
          title: 'Analytics & Reporting',
          status: 'completed',
          progress: 100,
          description: 'Analytics and reporting features'
        },
        {
          id: 'TASK-2.9',
          title: 'Enhanced Alumni Directory Features',
          status: 'completed',
          progress: 100,
          description: 'Enhanced alumni directory features'
        },
        {
          id: 'TASK-2.10',
          title: 'CSS Architecture & Data Infrastructure',
          status: 'completed',
          progress: 100,
          description: 'CSS architecture and data infrastructure'
        },
        {
          id: 'TASK-2.11',
          title: 'Navigation & User Experience Enhancement',
          status: 'completed',
          progress: 100,
          description: 'Navigation and user experience enhancement'
        }
      ],
      5: [
        {
          id: 'TASK-5.1',
          title: 'Progress Sync & Dashboard',
          status: 'pending',
          progress: 0,
          description: 'Automated task file → PROGRESS.md synchronization'
        },
        {
          id: 'TASK-5.2',
          title: 'Git Worktrees Infrastructure',
          status: 'pending',
          progress: 0,
          description: 'Parallel Claude sessions with isolated filesystems'
        },
        {
          id: 'TASK-5.3',
          title: 'Quality Tools Pipeline',
          status: 'pending',
          progress: 0,
          description: 'ESLint, TypeScript, jscpd, SonarQube automation'
        },
        {
          id: 'TASK-5.4',
          title: 'Real-Time Dashboard',
          status: 'pending',
          progress: 0,
          description: 'Real-time progress visibility at localhost:3001'
        },
        {
          id: 'TASK-5.5',
          title: 'Knowledge Management System',
          status: 'pending',
          progress: 0,
          description: 'Searchable success/failure patterns'
        },
        {
          id: 'TASK-5.6',
          title: 'Multi-Session Orchestration',
          status: 'pending',
          progress: 0,
          description: 'Multi-session orchestration system'
        }
      ],
      6: [
        {
          id: 'TASK-6.1',
          title: 'Research & Architecture Planning',
          status: 'pending',
          progress: 0,
          description: 'Research and architecture planning for production implementation'
        },
        {
          id: 'TASK-6.2',
          title: 'Backend Architecture Setup',
          status: 'pending',
          progress: 0,
          description: 'Backend architecture setup and configuration'
        },
        {
          id: 'TASK-6.3',
          title: 'Database Design & Implementation',
          status: 'pending',
          progress: 0,
          description: 'PostgreSQL database design and implementation'
        },
        {
          id: 'TASK-6.4',
          title: 'API Development',
          status: 'pending',
          progress: 0,
          description: 'Backend API development for all Alumni features'
        },
        {
          id: 'TASK-6.5',
          title: 'Frontend Integration',
          status: 'pending',
          progress: 0,
          description: 'Frontend-backend integration'
        },
        {
          id: 'TASK-6.6',
          title: 'Authentication & Security',
          status: 'pending',
          progress: 0,
          description: 'Authentication and security implementation'
        },
        {
          id: 'TASK-6.7',
          title: 'AWS Deployment Infrastructure',
          status: 'pending',
          progress: 0,
          description: 'AWS deployment and infrastructure setup'
        },
        {
          id: 'TASK-6.8',
          title: 'Testing & Quality Assurance',
          status: 'pending',
          progress: 0,
          description: 'Testing and quality assurance implementation'
        },
        {
          id: 'TASK-6.9',
          title: 'Monitoring & Observability',
          status: 'pending',
          progress: 0,
          description: 'Monitoring and observability setup'
        },
        {
          id: 'TASK-6.10',
          title: 'Production Launch',
          status: 'pending',
          progress: 0,
          description: 'Production launch readiness'
        }
      ]
    };

    return tasksByPhase[phaseNum] || [];
  }

  insertPhases(phases) {
    const insertPhase = this.db.prepare(`
      INSERT INTO entities (
        id, title, entity_type, status, progress, description, 
        board_id, level, hierarchy_path, created_at, updated_at
      )
      VALUES (?, ?, 'phase', ?, ?, ?, 'SGS-PROJECT-BOARD', 1, ?, datetime('now'), datetime('now'))
    `);

    const phaseIds = new Map();
    
    for (const phase of phases) {
      try {
        const phaseNum = parseInt(phase.id.split('-')[1]);
        const hierarchyPath = `/phases/phase-${phaseNum}`;
        
        const result = insertPhase.run(
          phase.id,
          phase.title,
          this.mapStatus(phase.status, 'phase'),
          phase.progress,
          phase.description,
          hierarchyPath
        );
        phaseIds.set(phaseNum, result.lastInsertRowid);
      } catch (error) {
        console.error(`Error inserting phase ${phase.id}:`, error);
      }
    }

    return phaseIds;
  }

  insertTasks(tasks, phaseNum) {
    const insertTask = this.db.prepare(`
      INSERT INTO entities (
        id, title, entity_type, status, progress, description, 
        board_id, level, hierarchy_path, created_at, updated_at
      )
      VALUES (?, ?, 'task', ?, ?, ?, 'SGS-PROJECT-BOARD', 2, ?, datetime('now'), datetime('now'))
    `);

    const taskIds = [];
    
    for (const task of tasks) {
      try {
        const taskNum = task.id.split('-')[1];
        const hierarchyPath = `/phases/phase-${phaseNum}/tasks/${task.id.toLowerCase()}`;
        
        const result = insertTask.run(
          task.id,
          task.title,
          this.mapStatus(task.status, 'task'),
          task.progress,
          task.description,
          hierarchyPath
        );
        taskIds.push(result.lastInsertRowid);
      } catch (error) {
        console.error(`Error inserting task ${task.id}:`, error);
      }
    }

    return taskIds;
  }

  createPhaseTaskRelationships(phaseRowId, taskRowIds) {
    const insertRelation = this.db.prepare(`
      INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, created_at)
      VALUES (?, ?, 'parent_of', datetime('now'))
    `);

    for (const taskRowId of taskRowIds) {
      try {
        insertRelation.run(phaseRowId, taskRowId);
      } catch (error) {
        console.error(`Error creating relationship ${phaseRowId} -> ${taskRowId}:`, error);
      }
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      console.log('🔌 Database connection closed');
    }
  }

  run() {
    try {
      this.initDatabase();
      this.populateData();
      
      // Show final stats
      const stats = this.db.prepare(`
        SELECT 
          COUNT(CASE WHEN entity_type = 'phase' THEN 1 END) as phases,
          COUNT(CASE WHEN entity_type = 'task' THEN 1 END) as tasks,
          COUNT(*) as total
        FROM entities
      `).get();
      
      console.log('\n📊 Final Database Stats:');
      console.log(`- Phases: ${stats.phases}`);
      console.log(`- Tasks: ${stats.tasks}`);
      console.log(`- Total Entities: ${stats.total}`);
      
      const relationships = this.db.prepare('SELECT COUNT(*) as count FROM entity_relationships').get();
      console.log(`- Relationships: ${relationships.count}`);
      
    } catch (error) {
      console.error('❌ Population failed:', error);
    } finally {
      this.close();
    }
  }
}

// Run the population
const populator = new DatabasePopulator();
populator.run();
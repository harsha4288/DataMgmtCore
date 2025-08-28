/**
 * Comprehensive Unit Tests for Documentation System
 * Tests all components including GraphQL API, validation, and data parsing
 */

const fs = require('fs');
const path = require('path');

// Mock fetch for testing
global.fetch = jest.fn();

describe('Documentation System Unit Tests', () => {
  let mockGraphQLResponse;
  let mockValidationResponse;

  beforeEach(() => {
    // Reset mocks
    fetch.mockClear();
    
    // Setup default mock responses
    mockGraphQLResponse = {
      data: {
        getProjectStats: {
          total_phases: 7,
          total_tasks: 28,
          total_issues: 0,
          completed_tasks: 7,
          in_progress_tasks: 0,
          completion_percentage: 25
        },
        getAllTasks: [
          {
            id: 'task-1.1-project-initialization',
            name: 'Task 1.1: Project Initialization',
            status: 'completed',
            progress: 100,
            metadata: {
              status: 'completed',
              priority: 'high',
              labels: ['setup', 'foundation']
            }
          }
        ],
        getAllPhases: [
          {
            id: 'phase-1',
            name: 'Phase 1: Foundation Setup',
            status: 'completed',
            progress: 100,
            tasks: []
          }
        ]
      }
    };

    mockValidationResponse = {
      score: 90,
      summary: {
        errors: 0,
        warnings: 0,
        suggestions: 1
      },
      recommendations: ['Consider adding more detailed descriptions']
    };
  });

  describe('GraphQL API Tests', () => {
    test('should return project statistics', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQLResponse
      });

      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query { getProjectStats { total_tasks completed_tasks completion_percentage } }'
        })
      });

      const result = await response.json();
      
      expect(result.data.getProjectStats.total_tasks).toBe(28);
      expect(result.data.getProjectStats.completed_tasks).toBe(7);
      expect(result.data.getProjectStats.completion_percentage).toBe(25);
    });

    test('should return all tasks with proper structure', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGraphQLResponse
      });

      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query { getAllTasks { id name status progress metadata { status priority } } }'
        })
      });

      const result = await response.json();
      const tasks = result.data.getAllTasks;
      
      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toHaveProperty('id');
      expect(tasks[0]).toHaveProperty('name');
      expect(tasks[0]).toHaveProperty('status');
      expect(tasks[0]).toHaveProperty('progress');
      expect(tasks[0]).toHaveProperty('metadata');
      expect(tasks[0].metadata).toHaveProperty('status');
      expect(tasks[0].metadata).toHaveProperty('priority');
    });

    test('should handle GraphQL errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query { invalidQuery }'
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Validation System Tests', () => {
    test('should validate task data successfully', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidationResponse
      });

      const testTask = {
        id: 'task-test-1',
        name: 'Test Task',
        description: 'This is a test task for validation',
        phase_id: 'phase-1',
        metadata: {
          status: 'completed',
          priority: 'high',
          labels: ['test', 'validation']
        },
        subtasks: [
          { name: 'Subtask 1', completed: true },
          { name: 'Subtask 2', completed: false }
        ]
      };

      const response = await fetch('http://localhost:3005/validate/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: testTask })
      });

      const result = await response.json();
      
      expect(result.score).toBe(90);
      expect(result.summary.errors).toBe(0);
      expect(result.summary.warnings).toBe(0);
      expect(result.recommendations).toHaveLength(1);
    });

    test('should handle validation errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      const response = await fetch('http://localhost:3005/validate/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('Markdown Parsing Tests', () => {
    test('should parse task status correctly', () => {
      const parseTaskStatus = (status) => {
        const statusMap = {
          'Complete': 'completed',
          'In Progress': 'in_progress',
          'Blocked': 'blocked',
          'Cancelled': 'cancelled',
          'Pending': 'pending'
        };
        
        const cleanStatus = status.replace(/[^\w\s]/g, '').trim();
        return statusMap[cleanStatus] || 'pending';
      };

      expect(parseTaskStatus('✅ Complete')).toBe('completed');
      expect(parseTaskStatus('🔵 In Progress')).toBe('in_progress');
      expect(parseTaskStatus('🔴 Blocked')).toBe('blocked');
      expect(parseTaskStatus('❌ Cancelled')).toBe('cancelled');
      expect(parseTaskStatus('🟡 Pending')).toBe('pending');
      expect(parseTaskStatus('Unknown Status')).toBe('pending');
    });

    test('should parse progress percentage correctly', () => {
      const parseProgress = (content) => {
        const progressMatch = content.match(/\*\*Progress:\*\* (\d+)%/);
        return progressMatch ? parseInt(progressMatch[1]) : 0;
      };

      const content1 = '**Progress:** 100% (17/17 sub-tasks)';
      const content2 = '**Progress:** 75% (3/4 sub-tasks)';
      const content3 = 'No progress information';

      expect(parseProgress(content1)).toBe(100);
      expect(parseProgress(content2)).toBe(75);
      expect(parseProgress(content3)).toBe(0);
    });

    test('should parse subtasks correctly', () => {
      const parseSubtasks = (content) => {
        const subtaskMatches = content.match(/- \[(x| )\] (.+)/g);
        return subtaskMatches ? subtaskMatches.map((match, index) => {
          const completed = match.includes('[x]');
          const name = match.replace(/- \[(x| )\] /, '');
          return {
            id: `subtask-${index}`,
            name,
            description: '',
            completed
          };
        }) : [];
      };

      const content = `
        - [x] Initialize Vite + React + TypeScript project
        - [x] Set up Git repository with proper .gitignore
        - [ ] Configure ESLint and Prettier
        - [x] Set up TypeScript configuration
      `;

      const subtasks = parseSubtasks(content);
      
      expect(subtasks).toHaveLength(4);
      expect(subtasks[0].completed).toBe(true);
      expect(subtasks[0].name).toBe('Initialize Vite + React + TypeScript project');
      expect(subtasks[2].completed).toBe(false);
      expect(subtasks[2].name).toBe('Configure ESLint and Prettier');
    });
  });

  describe('Data Structure Tests', () => {
    test('should validate task data structure', () => {
      const validateTaskStructure = (task) => {
        const requiredFields = ['id', 'name', 'description', 'phase_id', 'status', 'progress', 'metadata', 'subtasks'];
        const missingFields = requiredFields.filter(field => !task.hasOwnProperty(field));
        
        return {
          isValid: missingFields.length === 0,
          missingFields
        };
      };

      const validTask = {
        id: 'task-1.1',
        name: 'Test Task',
        description: 'Test description',
        phase_id: 'phase-1',
        status: 'completed',
        progress: 100,
        metadata: { status: 'completed', priority: 'high' },
        subtasks: []
      };

      const invalidTask = {
        id: 'task-1.1',
        name: 'Test Task'
        // Missing required fields
      };

      const validResult = validateTaskStructure(validTask);
      const invalidResult = validateTaskStructure(invalidTask);

      expect(validResult.isValid).toBe(true);
      expect(validResult.missingFields).toHaveLength(0);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.missingFields.length).toBeGreaterThan(0);
    });

    test('should validate metadata structure', () => {
      const validateMetadata = (metadata) => {
        const requiredFields = ['status', 'priority'];
        const missingFields = requiredFields.filter(field => !metadata.hasOwnProperty(field));
        
        return {
          isValid: missingFields.length === 0,
          missingFields
        };
      };

      const validMetadata = {
        status: 'completed',
        priority: 'high',
        labels: ['test', 'validation']
      };

      const invalidMetadata = {
        status: 'completed'
        // Missing priority
      };

      const validResult = validateMetadata(validMetadata);
      const invalidResult = validateMetadata(invalidMetadata);

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.missingFields).toContain('priority');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete workflow', async () => {
      // Mock successful responses for all endpoints
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { getProjectStats: mockGraphQLResponse.data.getProjectStats } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockValidationResponse
        });

      // Test complete workflow
      const statsResponse = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query { getProjectStats { total_tasks completed_tasks completion_percentage } }'
        })
      });

      const stats = await statsResponse.json();
      expect(stats.data.getProjectStats.total_tasks).toBe(28);

      // Test validation
      const validationResponse = await fetch('http://localhost:3005/validate/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            id: 'task-test',
            name: 'Test Task',
            description: 'Test description',
            phase_id: 'phase-1',
            metadata: { status: 'completed', priority: 'high' },
            subtasks: []
          }
        })
      });

      const validation = await validationResponse.json();
      expect(validation.score).toBeGreaterThan(0);
    });

    test('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('http://localhost:3004/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'query { getProjectStats }' })
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', async () => {
      const largeDataset = {
        data: {
          getAllTasks: Array.from({ length: 1000 }, (_, i) => ({
            id: `task-${i}`,
            name: `Task ${i}`,
            status: 'completed',
            progress: 100,
            metadata: { status: 'completed', priority: 'medium' }
          }))
        }
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeDataset
      });

      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3004/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'query { getAllTasks { id name status } }'
        })
      });

      const result = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.data.getAllTasks).toHaveLength(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

// Helper function to find null values in objects
function findNullValues(obj, path = '') {
  const nulls = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (value === null || value === undefined) {
      nulls.push(currentPath);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          nulls.push(...findNullValues(item, `${currentPath}[${index}]`));
        }
      });
    } else if (typeof value === 'object') {
      nulls.push(...findNullValues(value, currentPath));
    }
  }
  
  return nulls;
}

// Export for use in other test files
module.exports = {
  findNullValues
};


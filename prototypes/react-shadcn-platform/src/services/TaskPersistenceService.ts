/**
 * Task Persistence Service
 * Handles writing task status changes back to individual .md files
 * Completes the bidirectional sync between web interface and file system
 */

// Conditional import for Node.js environment
const fs = typeof window === 'undefined' ? eval("require('fs')").promises : null;

export interface TaskStatusUpdate {
  taskId: string;
  newStatus: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'on_hold';
  filePath: string;
}

export class TaskPersistenceService {
  /**
   * Update task status in individual .md file
   * Modifies YAML front matter: Status field
   */
  static async updateTaskStatus(update: TaskStatusUpdate): Promise<boolean> {
    // Browser environment - use API endpoint to write files
    if (typeof window !== 'undefined' || !fs) {
      console.log(`🌐 Browser environment: Making API request to update task ${update.taskId} to ${update.newStatus}`);
      console.log(`📁 Target file: ${update.filePath}`);
      
      try {
        const response = await fetch('http://localhost:3002/api/task-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ API successfully updated task ${update.taskId}:`, result);
          return true;
        } else {
          console.error(`❌ API error updating task ${update.taskId}:`, response.status, response.statusText);
          return false;
        }
      } catch (error) {
        console.error(`❌ Failed to call API for task ${update.taskId}:`, error);
        return false;
      }
    }

    try {
      // Convert relative path to absolute path if needed
      const absolutePath = update.filePath.startsWith('/') 
        ? `C:\\React-Projects\\SGSDataMgmtCore\\prototypes\\react-shadcn-platform${update.filePath}`
        : update.filePath;

      console.log(`🔄 Updating task status for ${update.taskId} to ${update.newStatus}`);
      console.log(`📁 File path: ${absolutePath}`);
      
      // Read current file
      const fileContent = await fs.readFile(absolutePath, 'utf8');
      
      // Update YAML front matter status
      const updatedContent = this.updateYamlStatus(fileContent, update.newStatus);
      
      // Write back to file
      await fs.writeFile(absolutePath, updatedContent, 'utf8');
      
      console.log(`✅ Successfully updated task ${update.taskId} status to ${update.newStatus}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update task status for ${update.taskId}:`, error);
      return false;
    }
  }
  
  private static updateYamlStatus(content: string, newStatus: string): string {
    const statusEmoji = this.getStatusEmoji(newStatus);
    const formattedStatus = this.formatStatus(newStatus);
    
    // Replace status line in YAML front matter
    // More comprehensive pattern to handle various formats including spacing
    const patterns = [
      /^> \*\*Status:\*\* 🟡 [\w\s]+/m,
      /^> \*\*Status:\*\* 🔄 [\w\s]+/m,
      /^> \*\*Status:\*\* 🟢 [\w\s]+/m,
      /^> \*\*Status:\*\* 🔴 [\w\s]+/m,
      /^> \*\*Status:\*\* ⚫ [\w\s]+/m,
      /^> \*\*Status:\*\* [🟡🔄🟢🔴⚫] [\w\s]+/mu,
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return content.replace(
          pattern,
          `> **Status:** ${statusEmoji} ${formattedStatus}  `
        );
      }
    }
    
    // If no existing status pattern found, try to add after other YAML front matter
    const yamlSectionMatch = content.match(/^(> \*\*[^:]+:\*\* [^\n]+\n)/m);
    if (yamlSectionMatch) {
      const insertIndex = content.indexOf(yamlSectionMatch[0]) + yamlSectionMatch[0].length;
      return content.slice(0, insertIndex) + 
             `> **Status:** ${statusEmoji} ${formattedStatus}  \n` + 
             content.slice(insertIndex);
    }
    
    console.warn(`⚠️ Could not find status pattern in file content for update`);
    return content;
  }
  
  private static getStatusEmoji(status: string): string {
    switch (status) {
      case 'pending':
        return '🟡';
      case 'in_progress':
        return '🔄';
      case 'completed':
        return '🟢';
      case 'blocked':
        return '🔴';
      case 'on_hold':
        return '⚫';
      default:
        return '🟡';
    }
  }
  
  private static formatStatus(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'blocked':
        return 'Blocked';
      case 'on_hold':
        return 'On Hold';
      default:
        return 'Pending';
    }
  }
  
  /**
   * Validate that a file exists and can be written to
   */
  static async validateFilePath(filePath: string): Promise<boolean> {
    // Browser environment - always return true for demo purposes
    if (typeof window !== 'undefined' || !fs) {
      console.log(`🌐 Browser environment: Simulating file validation for ${filePath}`);
      return true;
    }

    try {
      const absolutePath = filePath.startsWith('/') 
        ? `C:\\React-Projects\\SGSDataMgmtCore\\prototypes\\react-shadcn-platform${filePath}`
        : filePath;
      
      await fs.access(absolutePath, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get absolute file path from relative project path
   */
  static getAbsolutePath(relativePath: string): string {
    return relativePath.startsWith('/') 
      ? `C:\\React-Projects\\SGSDataMgmtCore\\prototypes\\react-shadcn-platform${relativePath}`
      : relativePath;
  }
}

export default TaskPersistenceService;
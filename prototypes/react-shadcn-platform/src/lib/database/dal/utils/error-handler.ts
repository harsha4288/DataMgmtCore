/**
 * Database Error Handler
 * Centralized error handling and logging for database operations
 */

import { connectionManager } from '../connection-manager';

export enum DatabaseErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export interface DatabaseError extends Error {
  code: DatabaseErrorCode;
  operation: string;
  table?: string;
  entityId?: string;
  originalError?: Error;
  timestamp: string;
  context?: Record<string, any>;
}

export class DatabaseErrorHandler {
  private static errorLog: DatabaseError[] = [];
  private static maxLogSize = 1000;

  static createError(
    message: string,
    code: DatabaseErrorCode,
    operation: string,
    options: {
      table?: string;
      entityId?: string;
      originalError?: Error;
      context?: Record<string, any>;
    } = {}
  ): DatabaseError {
    const error = new Error(message) as DatabaseError;
    error.code = code;
    error.operation = operation;
    error.table = options.table;
    error.entityId = options.entityId;
    error.originalError = options.originalError;
    error.timestamp = new Date().toISOString();
    error.context = options.context;

    this.logError(error);
    return error;
  }

  static handleSQLiteError(
    sqliteError: any,
    operation: string,
    table?: string,
    entityId?: string
  ): DatabaseError {
    const message = sqliteError.message || sqliteError.toString();
    let code = DatabaseErrorCode.UNKNOWN;

    // Map SQLite error codes to our error codes
    if (message.includes('UNIQUE constraint failed')) {
      code = DatabaseErrorCode.DUPLICATE_ENTRY;
    } else if (message.includes('FOREIGN KEY constraint failed')) {
      code = DatabaseErrorCode.CONSTRAINT_VIOLATION;
    } else if (message.includes('NOT NULL constraint failed')) {
      code = DatabaseErrorCode.CONSTRAINT_VIOLATION;
    } else if (message.includes('no such table')) {
      code = DatabaseErrorCode.SCHEMA_ERROR;
    } else if (message.includes('database is locked')) {
      code = DatabaseErrorCode.TIMEOUT;
    } else if (message.includes('database disk image is malformed')) {
      code = DatabaseErrorCode.CONNECTION_FAILED;
    }

    return this.createError(message, code, operation, {
      table,
      entityId,
      originalError: sqliteError,
      context: {
        sqliteCode: sqliteError.code,
        errno: sqliteError.errno
      }
    });
  }

  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries = 3,
    retryDelay = 1000,
    table?: string,
    entityId?: string
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        const dbError = this.handleSQLiteError(error, operationName, table, entityId);
        
        // Don't retry for certain error types
        if ([
          DatabaseErrorCode.DUPLICATE_ENTRY,
          DatabaseErrorCode.NOT_FOUND,
          DatabaseErrorCode.SCHEMA_ERROR,
          DatabaseErrorCode.PERMISSION_DENIED
        ].includes(dbError.code)) {
          throw dbError;
        }

        if (attempt === maxRetries) {
          throw dbError;
        }

        console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Exponential backoff
        retryDelay *= 1.5;
      }
    }

    throw this.handleSQLiteError(lastError!, operationName, table, entityId);
  }

  static handleAsyncError<T>(
    promise: Promise<T>,
    operation: string,
    table?: string,
    entityId?: string
  ): Promise<T> {
    return promise.catch(error => {
      throw this.handleSQLiteError(error, operation, table, entityId);
    });
  }

  private static logError(error: DatabaseError): void {
    // Log to console
    console.error(`🚨 Database Error [${error.code}] in ${error.operation}:`, {
      message: error.message,
      table: error.table,
      entityId: error.entityId,
      timestamp: error.timestamp,
      context: error.context
    });

    // Add to in-memory log
    this.errorLog.push(error);
    
    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.splice(0, this.errorLog.length - this.maxLogSize);
    }

    // In production, you might want to send to external logging service
    this.sendToExternalLogging(error);
  }

  private static sendToExternalLogging(error: DatabaseError): void {
    // Placeholder for external logging (Sentry, CloudWatch, etc.)
    // In a real application, you would implement this
  }

  // Error recovery methods
  static async attemptRecovery(error: DatabaseError): Promise<boolean> {
    console.log(`🔧 Attempting recovery for error: ${error.code}`);

    try {
      switch (error.code) {
        case DatabaseErrorCode.CONNECTION_FAILED:
          return await this.recoverConnection();
        
        case DatabaseErrorCode.TIMEOUT:
          return await this.recoverFromTimeout();
        
        case DatabaseErrorCode.CONSTRAINT_VIOLATION:
          return await this.recoverFromConstraintViolation(error);
        
        default:
          console.log(`⚠️ No recovery strategy for error code: ${error.code}`);
          return false;
      }
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
      return false;
    }
  }

  private static async recoverConnection(): Promise<boolean> {
    try {
      await connectionManager.initialize();
      const health = await connectionManager.healthCheck();
      return health.connected;
    } catch (error) {
      return false;
    }
  }

  private static async recoverFromTimeout(): Promise<boolean> {
    try {
      // Clear any hanging transactions
      connectionManager.invalidateCache();
      
      // Test connection
      const health = await connectionManager.healthCheck();
      return health.connected;
    } catch (error) {
      return false;
    }
  }

  private static async recoverFromConstraintViolation(error: DatabaseError): Promise<boolean> {
    // For constraint violations, we typically can't auto-recover
    // but we can provide helpful information
    console.log('💡 Constraint violation detected. Check:');
    console.log('  - Foreign key references exist');
    console.log('  - Unique constraints are not violated');
    console.log('  - Required fields are provided');
    
    return false;
  }

  // Debugging and monitoring methods
  static getErrorLog(
    filters: {
      code?: DatabaseErrorCode;
      operation?: string;
      table?: string;
      entityId?: string;
      since?: Date;
    } = {}
  ): DatabaseError[] {
    let filtered = this.errorLog;

    if (filters.code) {
      filtered = filtered.filter(e => e.code === filters.code);
    }
    
    if (filters.operation) {
      filtered = filtered.filter(e => e.operation.includes(filters.operation));
    }
    
    if (filters.table) {
      filtered = filtered.filter(e => e.table === filters.table);
    }
    
    if (filters.entityId) {
      filtered = filtered.filter(e => e.entityId === filters.entityId);
    }
    
    if (filters.since) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= filters.since!);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static getErrorStats(): {
    total: number;
    byCode: Record<DatabaseErrorCode, number>;
    byOperation: Record<string, number>;
    byTable: Record<string, number>;
    recentErrors: number; // Last hour
  } {
    const total = this.errorLog.length;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const byCode: Record<DatabaseErrorCode, number> = {} as any;
    const byOperation: Record<string, number> = {};
    const byTable: Record<string, number> = {};
    let recentErrors = 0;

    for (const error of this.errorLog) {
      // Count by error code
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      
      // Count by operation
      byOperation[error.operation] = (byOperation[error.operation] || 0) + 1;
      
      // Count by table
      if (error.table) {
        byTable[error.table] = (byTable[error.table] || 0) + 1;
      }
      
      // Count recent errors
      if (new Date(error.timestamp) >= oneHourAgo) {
        recentErrors++;
      }
    }

    return {
      total,
      byCode,
      byOperation,
      byTable,
      recentErrors
    };
  }

  static clearErrorLog(): void {
    const count = this.errorLog.length;
    this.errorLog = [];
    console.log(`🧹 Cleared ${count} error log entries`);
  }

  // Health check for error handling system
  static healthCheck(): {
    isHealthy: boolean;
    errorLogSize: number;
    recentErrorRate: number; // Errors per minute in last hour
    criticalErrors: number; // Connection/schema errors
  } {
    const stats = this.getErrorStats();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const criticalErrors = (stats.byCode[DatabaseErrorCode.CONNECTION_FAILED] || 0) +
                          (stats.byCode[DatabaseErrorCode.SCHEMA_ERROR] || 0);
    
    const recentErrorRate = stats.recentErrors / 60; // Per minute
    
    const isHealthy = criticalErrors === 0 && recentErrorRate < 1; // Less than 1 error per minute
    
    return {
      isHealthy,
      errorLogSize: this.errorLog.length,
      recentErrorRate,
      criticalErrors
    };
  }
}
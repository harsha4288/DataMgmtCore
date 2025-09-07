/**
 * Transaction Utilities
 * High-performance transaction management with automatic retry and rollback
 */

import Database from 'better-sqlite3';
import { connectionManager } from '../connection-manager';
import { DatabaseErrorHandler, DatabaseErrorCode } from './error-handler';

export interface TransactionOptions {
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  onRetry?: (attempt: number, error: Error) => void;
  onRollback?: (error: Error) => void;
}

export interface TransactionContext {
  db: Database.Database;
  rollback: () => void;
  savepoint: (name: string) => void;
  releaseSavepoint: (name: string) => void;
  rollbackToSavepoint: (name: string) => void;
}

export class TransactionManager {
  private static activeSavepoints: Map<string, Set<string>> = new Map();

  /**
   * Execute a function within a database transaction with full error handling
   */
  static async execute<T>(
    operation: (ctx: TransactionContext) => Promise<T> | T,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000, // 30 seconds default
      retryAttempts = 3,
      retryDelay = 1000,
      onRetry,
      onRollback
    } = options;

    return DatabaseErrorHandler.handleWithRetry(
      async () => {
        const db = connectionManager.getConnection();
        const transactionId = this.generateTransactionId();
        
        return new Promise<T>((resolve, reject) => {
          const timeoutHandle = setTimeout(() => {
            reject(DatabaseErrorHandler.createError(
              'Transaction timeout',
              DatabaseErrorCode.TIMEOUT,
              'transaction',
              { context: { timeout, transactionId } }
            ));
          }, timeout);

          try {
            const result = db.transaction((db: Database.Database) => {
              const ctx = this.createTransactionContext(db, transactionId);
              
              try {
                const operationResult = operation(ctx);
                
                // Handle both sync and async operations
                if (operationResult instanceof Promise) {
                  throw new Error('Async operations not supported in SQLite transactions. Use executeAsync instead.');
                }
                
                return operationResult;
              } catch (error) {
                console.error(`🔄 Transaction ${transactionId} rolling back due to error:`, error);
                if (onRollback) {
                  onRollback(error as Error);
                }
                throw error;
              } finally {
                this.cleanupSavepoints(transactionId);
              }
            })();

            clearTimeout(timeoutHandle);
            console.log(`✅ Transaction ${transactionId} completed successfully`);
            resolve(result);

          } catch (error) {
            clearTimeout(timeoutHandle);
            reject(DatabaseErrorHandler.handleSQLiteError(
              error,
              'transaction',
              undefined,
              transactionId
            ));
          }
        });
      },
      'transaction_execute',
      retryAttempts,
      retryDelay
    );
  }

  /**
   * Execute async operations in a transaction-like manner with manual commit/rollback
   */
  static async executeAsync<T>(
    operation: (ctx: TransactionContext) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      retryAttempts = 3,
      retryDelay = 1000,
      onRetry,
      onRollback
    } = options;

    let attempt = 0;
    
    while (attempt < retryAttempts) {
      attempt++;
      const transactionId = this.generateTransactionId();
      const operations: Array<() => void> = []; // For manual rollback
      
      try {
        const db = connectionManager.getConnection();
        
        // Begin transaction
        db.exec('BEGIN IMMEDIATE');
        console.log(`🚀 Started async transaction ${transactionId} (attempt ${attempt})`);

        const ctx = this.createAsyncTransactionContext(db, transactionId, operations);
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(DatabaseErrorHandler.createError(
              'Async transaction timeout',
              DatabaseErrorCode.TIMEOUT,
              'async_transaction',
              { context: { timeout, transactionId, attempt } }
            ));
          }, timeout);
        });

        // Execute the operation with timeout
        const result = await Promise.race([
          operation(ctx),
          timeoutPromise
        ]);

        // Commit transaction
        db.exec('COMMIT');
        console.log(`✅ Async transaction ${transactionId} committed successfully`);
        
        this.cleanupSavepoints(transactionId);
        return result;

      } catch (error) {
        console.error(`🔄 Async transaction ${transactionId} failed (attempt ${attempt}):`, error);
        
        try {
          const db = connectionManager.getConnection();
          db.exec('ROLLBACK');
          console.log(`⏪ Async transaction ${transactionId} rolled back`);
        } catch (rollbackError) {
          console.error('❌ Rollback failed:', rollbackError);
        }

        if (onRollback) {
          onRollback(error as Error);
        }

        // Check if we should retry
        if (attempt >= retryAttempts) {
          this.cleanupSavepoints(transactionId);
          throw DatabaseErrorHandler.handleSQLiteError(
            error,
            'async_transaction',
            undefined,
            transactionId
          );
        }

        // Call retry callback if provided
        if (onRetry) {
          onRetry(attempt, error as Error);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        this.cleanupSavepoints(transactionId);
      }
    }

    throw new Error('Transaction retry loop ended unexpectedly');
  }

  /**
   * Execute multiple operations as a batch transaction
   */
  static async executeBatch<T>(
    operations: Array<(db: Database.Database) => T>,
    options: TransactionOptions = {}
  ): Promise<T[]> {
    return this.execute(
      (ctx) => {
        const results: T[] = [];
        
        for (let i = 0; i < operations.length; i++) {
          const savepointName = `batch_op_${i}`;
          
          try {
            ctx.savepoint(savepointName);
            const result = operations[i](ctx.db);
            results.push(result);
            ctx.releaseSavepoint(savepointName);
          } catch (error) {
            console.error(`❌ Batch operation ${i} failed:`, error);
            ctx.rollbackToSavepoint(savepointName);
            throw error;
          }
        }
        
        return results;
      },
      options
    );
  }

  /**
   * Create a transaction context for sync operations
   */
  private static createTransactionContext(
    db: Database.Database,
    transactionId: string
  ): TransactionContext {
    return {
      db,
      rollback: () => {
        throw new Error('Manual rollback requested');
      },
      savepoint: (name: string) => {
        this.createSavepoint(db, transactionId, name);
      },
      releaseSavepoint: (name: string) => {
        this.releaseSavepoint(db, transactionId, name);
      },
      rollbackToSavepoint: (name: string) => {
        this.rollbackToSavepoint(db, transactionId, name);
      }
    };
  }

  /**
   * Create a transaction context for async operations
   */
  private static createAsyncTransactionContext(
    db: Database.Database,
    transactionId: string,
    operations: Array<() => void>
  ): TransactionContext {
    return {
      db,
      rollback: () => {
        db.exec('ROLLBACK');
        throw new Error('Manual rollback requested');
      },
      savepoint: (name: string) => {
        this.createSavepoint(db, transactionId, name);
        operations.push(() => this.rollbackToSavepoint(db, transactionId, name));
      },
      releaseSavepoint: (name: string) => {
        this.releaseSavepoint(db, transactionId, name);
      },
      rollbackToSavepoint: (name: string) => {
        this.rollbackToSavepoint(db, transactionId, name);
      }
    };
  }

  /**
   * Savepoint management
   */
  private static createSavepoint(db: Database.Database, transactionId: string, name: string): void {
    const savepointName = `sp_${transactionId}_${name}`;
    db.exec(`SAVEPOINT ${savepointName}`);
    
    if (!this.activeSavepoints.has(transactionId)) {
      this.activeSavepoints.set(transactionId, new Set());
    }
    this.activeSavepoints.get(transactionId)!.add(savepointName);
    
    console.log(`📍 Created savepoint: ${savepointName}`);
  }

  private static releaseSavepoint(db: Database.Database, transactionId: string, name: string): void {
    const savepointName = `sp_${transactionId}_${name}`;
    db.exec(`RELEASE SAVEPOINT ${savepointName}`);
    
    const savepoints = this.activeSavepoints.get(transactionId);
    if (savepoints) {
      savepoints.delete(savepointName);
    }
    
    console.log(`✅ Released savepoint: ${savepointName}`);
  }

  private static rollbackToSavepoint(db: Database.Database, transactionId: string, name: string): void {
    const savepointName = `sp_${transactionId}_${name}`;
    db.exec(`ROLLBACK TO SAVEPOINT ${savepointName}`);
    console.log(`⏪ Rolled back to savepoint: ${savepointName}`);
  }

  private static cleanupSavepoints(transactionId: string): void {
    this.activeSavepoints.delete(transactionId);
  }

  private static generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Get current transaction statistics
   */
  static getTransactionStats(): {
    activeSavepointGroups: number;
    totalActiveSavepoints: number;
    savepointsByTransaction: Record<string, number>;
  } {
    let totalSavepoints = 0;
    const savepointsByTransaction: Record<string, number> = {};
    
    for (const [transactionId, savepoints] of this.activeSavepoints) {
      const count = savepoints.size;
      totalSavepoints += count;
      savepointsByTransaction[transactionId] = count;
    }
    
    return {
      activeSavepointGroups: this.activeSavepoints.size,
      totalActiveSavepoints: totalSavepoints,
      savepointsByTransaction
    };
  }

  /**
   * Utility method for common transaction patterns
   */
  static async createEntityWithRelationships<T>(
    entityCreator: (ctx: TransactionContext) => T,
    relationshipCreators: Array<(ctx: TransactionContext, entity: T) => any>,
    options: TransactionOptions = {}
  ): Promise<T> {
    return this.execute(
      (ctx) => {
        // Create the main entity
        const entity = entityCreator(ctx);
        
        // Create relationships
        for (let i = 0; i < relationshipCreators.length; i++) {
          const savepointName = `relationship_${i}`;
          
          try {
            ctx.savepoint(savepointName);
            relationshipCreators[i](ctx, entity);
            ctx.releaseSavepoint(savepointName);
          } catch (error) {
            console.error(`❌ Relationship creation ${i} failed:`, error);
            ctx.rollbackToSavepoint(savepointName);
            throw error;
          }
        }
        
        return entity;
      },
      options
    );
  }

  /**
   * Utility for bulk operations with progress tracking
   */
  static async executeBulkWithProgress<T, R>(
    items: T[],
    operation: (item: T, ctx: TransactionContext) => R,
    options: TransactionOptions & {
      batchSize?: number;
      onProgress?: (completed: number, total: number, currentBatch: R[]) => void;
    } = {}
  ): Promise<R[]> {
    const { batchSize = 100, onProgress } = options;
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchResults = await this.execute(
        (ctx) => {
          return batch.map((item, index) => {
            const savepointName = `bulk_item_${i + index}`;
            
            try {
              ctx.savepoint(savepointName);
              const result = operation(item, ctx);
              ctx.releaseSavepoint(savepointName);
              return result;
            } catch (error) {
              console.error(`❌ Bulk operation failed for item ${i + index}:`, error);
              ctx.rollbackToSavepoint(savepointName);
              throw error;
            }
          });
        },
        options
      );
      
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(results.length, items.length, batchResults);
      }
    }
    
    return results;
  }
}
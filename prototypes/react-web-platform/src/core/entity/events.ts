// Event System for Entity Engine

import type { EntityEvent } from '../../types/entity';

export class EventEmitter {
  private events: Map<string, Array<(event: EntityEvent) => void>> = new Map();

  /**
   * Register an event handler
   */
  on(eventName: string, handler: (event: EntityEvent) => void): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventName: string, handler: (event: EntityEvent) => void): void {
    const handlers = this.events.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  emit(eventName: string, event: EntityEvent): void {
    const handlers = this.events.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Remove all handlers for an event
   */
  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get all event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get handler count for an event
   */
  listenerCount(eventName: string): number {
    const handlers = this.events.get(eventName);
    return handlers ? handlers.length : 0;
  }
}
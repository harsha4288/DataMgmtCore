import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock CSS variables for testing
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => {
      // Mock CSS variable values
      const mockValues: Record<string, string> = {
        '--badge-grade-a': '#d1fae5',
        '--badge-grade-a-foreground': '#065f46',
        '--badge-grade-b': '#e0f2fe',
        '--badge-grade-b-foreground': '#0369a1',
        '--badge-grade-c': '#fef3c7',
        '--badge-grade-c-foreground': '#b45309',
        '--badge-grade-d': '#fed7aa',
        '--badge-grade-d-foreground': '#c2410c',
        '--badge-grade-f': '#fee2e2',
        '--badge-grade-f-foreground': '#dc2626',
        '--badge-neutral': '#f3f4f6',
        '--badge-neutral-foreground': '#374151',
      };
      return mockValues[prop] || '';
    },
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

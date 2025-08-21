import React from 'react'
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Badge } from '../badge';
import { ThemeProvider } from '@/lib/theme/provider';

// Mock theme provider for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="default">
    {children}
  </ThemeProvider>
);

describe('Badge Integration Tests - Real World Scenarios', () => {
  test('Technology badge renders correctly', () => {
    render(
      <TestWrapper>
        <Badge variant="outline">Technology</Badge>
      </TestWrapper>
    );
    
    const badge = screen.getByText('Technology');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-transparent', 'text-foreground');
  });

  test('Grade badges render with correct styling', () => {
    const grades = [
      { variant: 'grade-a', text: 'A+', expectedBg: 'bg-[var(--badge-grade-a)]' },
      { variant: 'grade-b', text: 'B', expectedBg: 'bg-[var(--badge-grade-b)]' },
      { variant: 'grade-c', text: 'C', expectedBg: 'bg-[var(--badge-grade-c)]' },
      { variant: 'grade-d', text: 'D', expectedBg: 'bg-[var(--badge-grade-d)]' },
      { variant: 'grade-f', text: 'F', expectedBg: 'bg-[var(--badge-grade-f)]' }
    ] as const;

    grades.forEach(({ variant, text, expectedBg }) => {
      render(
        <TestWrapper>
          <Badge variant={variant} data-testid={`grade-${variant}`}>
            {text}
          </Badge>
        </TestWrapper>
      );
      
      const badge = screen.getByTestId(`grade-${variant}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(text);
      expect(badge).toHaveClass(expectedBg);
    });
  });

  test('Domain expertise badges render correctly', () => {
    const domains = [
      'Software Engineering',
      'Artificial Intelligence', 
      'Data Science',
      'Product Management',
      'Design'
    ];

    domains.forEach((domain, index) => {
      render(
        <TestWrapper>
          <Badge variant="secondary" data-testid={`domain-${index}`}>
            {domain}
          </Badge>
        </TestWrapper>
      );
      
      const badge = screen.getByTestId(`domain-${index}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(domain);
      expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });
  });

  test('Count badges work correctly', () => {
    render(
      <TestWrapper>
        <Badge count={5} variant="destructive" data-testid="count-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('count-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
    expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
  });

  test('Content prop badges work correctly', () => {
    render(
      <TestWrapper>
        <Badge content="Expires in 5 days" variant="outline" data-testid="content-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('content-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Expires in 5 days');
  });

  test('Badge with max count displays correctly', () => {
    render(
      <TestWrapper>
        <Badge count={150} max={99} data-testid="max-count-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('max-count-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('99+');
  });

  test('Multiple badges render without interference', () => {
    render(
      <TestWrapper>
        <div>
          <Badge variant="grade-a">A+</Badge>
          <Badge variant="outline">Technology</Badge>
          <Badge count={12} variant="secondary" />
          <Badge content="Active" variant="default" />
        </div>
      </TestWrapper>
    );
    
    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('Badge does not render placeholder dashes', () => {
    render(
      <TestWrapper>
        <Badge variant="grade-a" data-testid="no-placeholder">Grade A</Badge>
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('no-placeholder');
    
    // Should not have placeholder dash classes
    expect(badge).not.toHaveClass('w-4', 'h-0.5');
    expect(badge).not.toHaveClass('w-5', 'h-1');
    expect(badge).not.toHaveClass('w-3', 'h-px');
    expect(badge).not.toHaveClass('bg-muted-foreground/30');
    
    // Should have proper badge classes
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    expect(badge).toHaveTextContent('Grade A');
  });

  test('Empty badge returns null', () => {
    const { container } = render(
      <TestWrapper>
        <Badge count={0} showZero={false} />
      </TestWrapper>
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('Badge with showZero displays zero', () => {
    render(
      <TestWrapper>
        <Badge count={0} showZero={true} data-testid="zero-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('zero-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('0');
  });
});

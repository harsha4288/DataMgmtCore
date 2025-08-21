import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Badge } from '../badge';
import { PlaceholderDash } from '../placeholder-dash';
import { ThemeProvider } from '@/lib/theme/provider';

// Mock theme provider for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider defaultTheme="default">
    {children}
  </ThemeProvider>
);

describe('Badge Component Rendering', () => {
  test('Badge renders with default variant', () => {
    render(
      <TestWrapper>
        <Badge>Test Badge</Badge>
      </TestWrapper>
    );
    
    const badge = screen.getByText('Test Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
  });

  test('Badge renders with grade variants', () => {
    const gradeVariants = ['grade-a', 'grade-b', 'grade-c', 'grade-d', 'grade-f'] as const;
    
    gradeVariants.forEach(variant => {
      render(
        <TestWrapper>
          <Badge variant={variant} data-testid={`badge-${variant}`}>
            {variant.toUpperCase()}
          </Badge>
        </TestWrapper>
      );
      
      const badge = screen.getByTestId(`badge-${variant}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(variant.toUpperCase());
    });
  });

  test('Badge with count prop renders correctly', () => {
    render(
      <TestWrapper>
        <Badge count={5} data-testid="count-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('count-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  test('Badge with content prop renders correctly', () => {
    render(
      <TestWrapper>
        <Badge content="Technology" data-testid="content-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('content-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Technology');
  });

  test('Badge returns null when no content and showZero is false', () => {
    const { container } = render(
      <TestWrapper>
        <Badge count={0} showZero={false} />
      </TestWrapper>
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('Badge shows zero when showZero is true', () => {
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

describe('PlaceholderDash Component', () => {
  test('PlaceholderDash renders with default variant', () => {
    render(<PlaceholderDash data-testid="placeholder" />);
    
    const placeholder = screen.getByTestId('placeholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveClass('bg-muted-foreground/30', 'inline-block');
  });

  test('PlaceholderDash renders with different variants', () => {
    const variants = ['default', 'thick', 'thin', 'dot'] as const;
    
    variants.forEach(variant => {
      render(<PlaceholderDash variant={variant} data-testid={`placeholder-${variant}`} />);
      
      const placeholder = screen.getByTestId(`placeholder-${variant}`);
      expect(placeholder).toBeInTheDocument();
    });
  });
});

describe('CSS Variables Integration', () => {
  test('Badge grade variants use CSS variables', () => {
    render(
      <TestWrapper>
        <Badge variant="grade-a" data-testid="grade-a-badge">Grade A</Badge>
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('grade-a-badge');
    const styles = window.getComputedStyle(badge);
    
    // Check if CSS variables are being applied
    expect(badge).toHaveClass('bg-[var(--badge-grade-a)]');
    expect(badge).toHaveClass('text-[var(--badge-grade-a-foreground)]');
  });

  test('CSS variables are injected into document root', () => {
    render(
      <TestWrapper>
        <div>Test</div>
      </TestWrapper>
    );
    
    const root = document.documentElement;
    const badgeGradeA = root.style.getPropertyValue('--badge-grade-a');
    const badgeGradeAForeground = root.style.getPropertyValue('--badge-grade-a-foreground');
    
    // These should be set by the theme provider
    expect(badgeGradeA).toBeTruthy();
    expect(badgeGradeAForeground).toBeTruthy();
  });
});

describe('Badge vs PlaceholderDash Rendering Issue', () => {
  test('Badge should not render PlaceholderDash when content is provided', () => {
    render(
      <TestWrapper>
        <Badge content="Technology" data-testid="tech-badge" />
      </TestWrapper>
    );
    
    const badge = screen.getByTestId('tech-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Technology');
    
    // Should not contain placeholder dash elements
    const placeholderElements = badge.querySelectorAll('.bg-muted-foreground\\/30');
    expect(placeholderElements).toHaveLength(0);
  });

  test('Badge should render actual content, not placeholder dashes', () => {
    const testCases = [
      { props: { children: 'Technology' }, expected: 'Technology' },
      { props: { content: 'Software Engineering' }, expected: 'Software Engineering' },
      { props: { count: 5 }, expected: '5' },
      { props: { variant: 'grade-a', children: 'A+' }, expected: 'A+' }
    ];

    testCases.forEach((testCase, index) => {
      render(
        <TestWrapper>
          <Badge {...testCase.props} data-testid={`badge-${index}`} />
        </TestWrapper>
      );
      
      const badge = screen.getByTestId(`badge-${index}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(testCase.expected);
      
      // Ensure it's not a placeholder dash
      expect(badge).not.toHaveClass('w-4', 'h-0.5');
      expect(badge).not.toHaveClass('w-5', 'h-1');
      expect(badge).not.toHaveClass('w-3', 'h-px');
    });
  });
});

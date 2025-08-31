import { render, screen as screenTest } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Avatar } from '../avatar';

describe('Avatar Component - Circle Bug Fix', () => {
  test('displays initials when name is provided', () => {
    render(
      <Avatar name="Dr. Sarah Chen" data-testid="avatar-with-name" />
    );
    
    const avatar = screenTest.getByTestId('avatar-with-name');
    expect(avatar).toBeInTheDocument();
    
    // Should show initials "DC" for "Dr. Sarah Chen"
    expect(avatar).toHaveTextContent('DC');
  });

  test('displays initials for single name', () => {
    render(
      <Avatar name="John" data-testid="avatar-single-name" />
    );
    
    const avatar = screenTest.getByTestId('avatar-single-name');
    expect(avatar).toBeInTheDocument();
    
    // Should show initial "J" for "John"
    expect(avatar).toHaveTextContent('J');
  });

  test('displays initials for multiple names', () => {
    render(
      <Avatar name="Priya Sharma Patel" data-testid="avatar-multiple-names" />
    );
    
    const avatar = screenTest.getByTestId('avatar-multiple-names');
    expect(avatar).toBeInTheDocument();
    
    // Should show "PP" (first and last name initials)
    expect(avatar).toHaveTextContent('PP');
  });

  test('does not show empty circle when name is provided', () => {
    render(
      <Avatar name="John Kumar" data-testid="avatar-no-empty-circle" />
    );
    
    const avatar = screenTest.getByTestId('avatar-no-empty-circle');
    
    // Should not have the empty circle fallback
    const emptyCircle = avatar.querySelector('.h-4.w-4.rounded-full.bg-muted-foreground\\/20');
    expect(emptyCircle).toBeNull();
    
    // Should show proper initials
    expect(avatar).toHaveTextContent('JK');
  });

  test('shows empty circle only when no name is provided', () => {
    render(
      <Avatar data-testid="avatar-no-name" />
    );
    
    const avatar = screenTest.getByTestId('avatar-no-name');
    expect(avatar).toBeInTheDocument();
    
    // Should have the empty circle fallback when no name
    const emptyCircle = avatar.querySelector('div[class*="h-4"][class*="w-4"][class*="rounded-full"]');
    expect(emptyCircle).toBeInTheDocument();
  });

  test('works with image src and name fallback', () => {
    render(
      <Avatar 
        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" 
        name="Sarah Chen" 
        data-testid="avatar-with-src" 
      />
    );
    
    const avatar = screenTest.getByTestId('avatar-with-src');
    expect(avatar).toBeInTheDocument();
    
    // Should have an img element or show initials as fallback
    const img = avatar.querySelector('img');
    if (img) {
      expect(img).toHaveAttribute('src');
    } else {
      // If image fails to load, should show initials
      expect(avatar).toHaveTextContent('SC');
    }
  });
});

// eslint-disable-next-line no-redeclare
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { Avatar, AvatarFallback, AvatarImage } from '../avatar';

describe('Avatar Legacy Pattern - Backward Compatibility', () => {
  test('AvatarFallback with full name string extracts initials', () => {
    render(
      <Avatar className="h-12 w-12" data-testid="legacy-avatar">
        <AvatarImage src="/fake-avatar.jpg" />
        <AvatarFallback>Dr. Sarah Chen</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('legacy-avatar');
    expect(avatar).toBeInTheDocument();
    
    // Should extract "DC" from "Dr. Sarah Chen"
    expect(avatar).toHaveTextContent('DC');
  });

  test('AvatarFallback with already formatted initials', () => {
    render(
      <Avatar className="h-12 w-12" data-testid="legacy-avatar-initials">
        <AvatarImage src="/fake-avatar.jpg" />
        <AvatarFallback>JK</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('legacy-avatar-initials');
    expect(avatar).toBeInTheDocument();
    
    // Should keep "JK" as-is
    expect(avatar).toHaveTextContent('JK');
  });

  test('AvatarFallback with name.split().map() pattern', () => {
    const name = "Priya Sharma";
    const initials = name.split(' ').map(n => n[0]).join('');
    
    render(
      <Avatar className="h-12 w-12" data-testid="legacy-avatar-split">
        <AvatarImage src="/fake-avatar.jpg" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('legacy-avatar-split');
    expect(avatar).toBeInTheDocument();
    
    // Should show "PS" 
    expect(avatar).toHaveTextContent('PS');
  });

  test('AvatarFallback with getInitials function pattern', () => {
    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
    
    render(
      <Avatar className="h-12 w-12" data-testid="legacy-avatar-function">
        <AvatarImage src="/fake-avatar.jpg" />
        <AvatarFallback>{getInitials("john kumar")}</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('legacy-avatar-function');
    expect(avatar).toBeInTheDocument();
    
    // Should show "JK" 
    expect(avatar).toHaveTextContent('JK');
  });

  test('AvatarFallback with empty content shows fallback circle', () => {
    render(
      <Avatar className="h-12 w-12" data-testid="legacy-avatar-empty">
        <AvatarImage src="/fake-avatar.jpg" />
        <AvatarFallback></AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('legacy-avatar-empty');
    expect(avatar).toBeInTheDocument();
    
    // Should have the empty circle fallback
    const emptyCircle = avatar.querySelector('div[class*="h-4"][class*="w-4"][class*="rounded-full"]');
    expect(emptyCircle).toBeInTheDocument();
  });

  test('Mentorship page pattern works correctly', () => {
    // Simulate the exact pattern from mentorship-platform.tsx
    const mentor = { name: "Dr. Sarah Chen", avatar: "/fake-avatar.jpg" };
    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
    
    render(
      <Avatar className="h-12 w-12" data-testid="mentorship-pattern">
        <AvatarImage src={mentor.avatar} alt={mentor.name} />
        <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
      </Avatar>
    );
    
    const avatar = screen.getByTestId('mentorship-pattern');
    expect(avatar).toBeInTheDocument();
    
    // Should show "DSC" (all initials from "Dr. Sarah Chen")
    expect(avatar).toHaveTextContent('DSC');
  });
});

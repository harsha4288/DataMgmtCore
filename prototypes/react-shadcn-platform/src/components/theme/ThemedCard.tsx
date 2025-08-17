import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { useTheme } from '../../lib/theme/hooks';
import { cn } from '../../lib/utils';

interface ThemedCardProps extends React.ComponentProps<typeof Card> {
  themeOverride?: {
    borderRadius?: string;
    padding?: string;
    shadow?: string;
  };
}

export function ThemedCard({ 
  className, 
  themeOverride,
  ...props 
}: ThemedCardProps) {
  const { theme } = useTheme();
  
  // Apply theme overrides
  const cardStyles = {
    borderRadius: themeOverride?.borderRadius || theme.componentOverrides?.card?.borderRadius,
    padding: themeOverride?.padding || theme.componentOverrides?.card?.padding,
    boxShadow: themeOverride?.shadow || theme.componentOverrides?.card?.shadow,
  };
  
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        className
      )}
      style={cardStyles}
      {...props}
    />
  );
}

// Export themed versions of card sub-components
export function ThemedCardHeader({ className, ...props }: React.ComponentProps<typeof CardHeader>) {
  return <CardHeader className={cn('transition-all duration-200', className)} {...props} />;
}

export function ThemedCardTitle({ className, ...props }: React.ComponentProps<typeof CardTitle>) {
  return <CardTitle className={cn('transition-all duration-200', className)} {...props} />;
}

export function ThemedCardDescription({ className, ...props }: React.ComponentProps<typeof CardDescription>) {
  return <CardDescription className={cn('transition-all duration-200', className)} {...props} />;
}

export function ThemedCardContent({ className, ...props }: React.ComponentProps<typeof CardContent>) {
  return <CardContent className={cn('transition-all duration-200', className)} {...props} />;
}

export function ThemedCardFooter({ className, ...props }: React.ComponentProps<typeof CardFooter>) {
  return <CardFooter className={cn('transition-all duration-200', className)} {...props} />;
}

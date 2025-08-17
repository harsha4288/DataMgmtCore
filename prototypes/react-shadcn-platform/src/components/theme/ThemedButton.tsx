import React from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../lib/theme/hooks';
import { cn } from '../../lib/utils';

interface ThemedButtonProps extends React.ComponentProps<typeof Button> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  themeOverride?: {
    borderRadius?: string;
    padding?: string;
    fontSize?: string;
  };
}

export function ThemedButton({ 
  className, 
  themeOverride,
  ...props 
}: ThemedButtonProps) {
  const { theme } = useTheme();
  
  // Apply theme overrides
  const buttonStyles = {
    borderRadius: themeOverride?.borderRadius || theme.componentOverrides?.button?.borderRadius,
    padding: themeOverride?.padding || theme.componentOverrides?.button?.padding,
    fontSize: themeOverride?.fontSize || theme.componentOverrides?.button?.fontSize,
  };
  
  return (
    <Button
      className={cn(
        'transition-all duration-200',
        className
      )}
      style={buttonStyles}
      {...props}
    />
  );
}

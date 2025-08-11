import { useTheme } from '../../lib/theme/provider';
import { Button } from './Button';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  return (
    <Button 
      onClick={toggleTheme}
      variant="outline"
      size="sm"
      className="h-8 w-8 p-0"
      title={`Current theme: ${theme} (${resolvedTheme})`}
    >
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}
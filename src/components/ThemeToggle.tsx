import { memo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import type { Theme } from '../theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

/** Switches between the light (Retro) and dark (Warm Dark Playful) fun themes.
 *  Shows the active theme's icon; the label names the one it switches to. */
export const ThemeToggle = memo(function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === 'light';
  return (
    <Button
      type="button"
      variant="3d"
      size="icon"
      onClick={onToggle}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      className="text-muted-foreground hover:text-foreground"
    >
      {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
});

import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../theme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

/** Switches between the light (Retro) and dark (Warm Dark Playful) fun themes.
 *  Shows the active theme's icon; the label names the one it switches to. */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isLight = theme === 'light';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      className="grid h-9 w-9 place-items-center rounded-full bg-card text-muted-foreground shadow-[0_3px_0_hsl(var(--shadow))] transition-all hover:text-foreground active:translate-y-[3px] active:shadow-none"
    >
      {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

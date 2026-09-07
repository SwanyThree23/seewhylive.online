import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'seewhy_theme';

function getInitial() {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // Respect OS preference on first visit; app is dark-first
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * ThemeToggle — flips the shadcn token surface between dark and light by
 * toggling the `theme-light` class on <html>. Only affects token-based
 * surfaces (bg-background, bg-card, text-foreground, border-border, …);
 * components using inline dark styles are intentionally untouched.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <button
      onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="flex items-center justify-center rounded-xl transition-all active:scale-95"
      style={{
        width: 44, height: 44, minWidth: 44,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      {isLight
        ? <Moon style={{ width: 18, height: 18, color: '#d4af37' }} />
        : <Sun style={{ width: 18, height: 18, color: 'rgba(255,255,255,0.5)' }} />}
    </button>
  );
}
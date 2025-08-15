import React from 'react';

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  // Honrar clase inicial puesta en index.html
  try {
    if (document.documentElement.classList.contains('dark')) return 'dark';
  } catch {}
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(getInitialTheme);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      type="button"
      className="btn-ghost px-1 sm:px-3 py-2"
      aria-label="Alternar tema oscuro"
      aria-pressed={theme === 'dark'}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}



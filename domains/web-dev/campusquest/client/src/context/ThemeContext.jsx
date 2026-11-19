import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const THEME_KEY = 'campusquest.theme';

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'system');
  const [resolved, setResolved] = useState(() => resolveTheme(localStorage.getItem(THEME_KEY) || 'system'));

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const next = resolveTheme(theme);
      setResolved(next);
      root.classList.toggle('dark', next === 'dark');
    };
    apply();
    localStorage.setItem(THEME_KEY, theme);
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      resolved,
      setTheme,
      toggle: () => setTheme((current) => (resolveTheme(current) === 'dark' ? 'light' : 'dark')),
    }),
    [theme, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

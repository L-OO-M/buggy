import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export function ThemeToggle({ compact = false }) {
  const { resolved, theme, toggle, setTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} theme`}
      >
        {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-white/10 dark:bg-white/5" role="group" aria-label="Theme">
      {[
        { key: 'light', icon: Sun, label: 'Light' },
        { key: 'system', icon: Monitor, label: 'System' },
        { key: 'dark', icon: Moon, label: 'Dark' },
      ].map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key)}
          title={label}
          aria-label={`${label} theme`}
          aria-pressed={theme === key}
          className={`rounded-lg p-2 transition ${
            theme === key
              ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200'
              : 'text-ink-400 hover:text-ink-700 dark:hover:text-white'
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

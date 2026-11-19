export function formatDate(value, options = {}) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatRelative(value) {
  if (!value) return '—';
  const diff = new Date(value).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units = [
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
  ];
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return formatter.format(Math.round(diff / 1000), 'second');
}

export function formatDay(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(new Date(value));
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function titleCase(value = '') {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const categoryStyle = {
  technology: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  sports: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  arts: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
  academic: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  service: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  wellness: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  entrepreneurship: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  culture: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  general: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
};

export const difficultyStyle = {
  easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  hard: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  elite: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
};

export const statusStyle = {
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  registered: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  draft: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  closed: 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400',
  checked_in: 'bg-mint/20 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  open: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  reviewing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  dismissed: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
  left: 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400',
  withdrawn: 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400',
};

export function percent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function roleLabel(role) {
  return { student: 'Student', organizer: 'Organizer', admin: 'Admin' }[role] || role;
}

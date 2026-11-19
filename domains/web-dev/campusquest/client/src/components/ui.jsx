import { useEffect } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RefreshCw, X } from 'lucide-react';
import { categoryStyle, difficultyStyle, initials, statusStyle, titleCase } from '../utils/format.js';

export function Spinner({ size = 18, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function Button({ variant = 'primary', size, loading, children, className = '', disabled, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  };
  return (
    <button
      type="button"
      className={`${variants[variant] || variants.primary} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={15} /> : null}
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'general', className = '' }) {
  const tones = {
    general: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  };
  return <span className={`badge ${tones[tone] || tones.general} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusStyle[status] || statusStyle.draft}`}>{titleCase(status || 'unknown')}</span>;
}

export function CategoryBadge({ category }) {
  return <span className={`badge ${categoryStyle[category] || categoryStyle.general}`}>{titleCase(category)}</span>;
}

export function DifficultyBadge({ difficulty }) {
  return <span className={`badge ${difficultyStyle[difficulty] || categoryStyle.general}`}>{titleCase(difficulty)}</span>;
}

export function Avatar({ name, src, size = 40, className = '' }) {
  const dimension = { width: size, height: size };
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        style={dimension}
        className={`shrink-0 rounded-full object-cover ring-2 ring-white/60 dark:ring-white/10 ${className}`}
      />
    );
  }
  const gradients = [
    'from-brand-500 to-fuchsia-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-indigo-500',
    'from-rose-500 to-pink-500',
  ];
  const seed = [...(name || '?')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      style={{ ...dimension, fontSize: Math.max(11, size * 0.36) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradients[seed % gradients.length]} font-bold text-white ${className}`}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  );
}

export function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag className={`surface p-5 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500 dark:text-ink-400">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', trend }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    danger: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
  };
  return (
    <div className="surface p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink-900 dark:text-white">{value}</p>
          {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
          {trend ? <p className="mt-2 text-xs font-medium text-mint">{trend}</p> : null}
        </div>
        {Icon ? (
          <span className={`inline-flex rounded-xl p-2.5 ${tones[tone] || tones.brand}`}>
            <Icon size={20} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Field({ label, error, hint, htmlFor, children, required }) {
  return (
    <div>
      {label ? (
        <label className="label" htmlFor={htmlFor}>
          {label} {required ? <span className="text-rose-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="mt-1.5 text-xs text-ink-400">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}

export function Input({ label, error, hint, id, className = '', required, ...props }) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} required={required}>
      <input id={inputId} className={`input ${className}`} aria-invalid={Boolean(error)} required={required} {...props} />
    </Field>
  );
}

export function Textarea({ label, error, hint, id, className = '', required, rows = 4, ...props }) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} required={required}>
      <textarea
        id={inputId}
        rows={rows}
        className={`input resize-y ${className}`}
        aria-invalid={Boolean(error)}
        required={required}
        {...props}
      />
    </Field>
  );
}

export function Select({ label, error, hint, id, className = '', children, required, ...props }) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId} required={required}>
      <select id={inputId} className={`input ${className}`} aria-invalid={Boolean(error)} required={required} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function ProgressBar({ value = 0, className = '', tone = 'brand', label }) {
  const tones = {
    brand: 'bg-brand-500',
    success: 'bg-mint',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1.5 flex justify-between text-xs text-ink-500 dark:text-ink-400">
          <span>{label}</span>
          <span className="font-semibold text-ink-700 dark:text-ink-200">{Math.round(value)}%</span>
        </div>
      ) : null}
      <div
        className="h-2 overflow-hidden rounded-full bg-ink-200/70 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${tones[tone] || tones.brand}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 px-6 py-14 text-center dark:border-white/10 ${className}`}>
      <span className="mb-4 inline-flex rounded-2xl bg-brand-50 p-3 text-brand-500 dark:bg-brand-500/10 dark:text-brand-300">
        <Icon size={24} />
      </span>
      <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{title}</h3>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="surface space-y-4 p-5">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  return (
    <div className={`grid gap-5 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'We could not load this page' }) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-10 text-center" role="alert">
      <span className="rounded-2xl bg-rose-50 p-3 text-rose-500 dark:bg-rose-500/10 dark:text-rose-300">
        <AlertTriangle size={24} />
      </span>
      <div>
        <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{title}</h3>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          {error?.friendlyMessage || error?.message || 'Please try again.'}
        </p>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || !meta.totalPages || meta.totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between gap-3 text-sm text-ink-500 dark:text-ink-400">
      <p>
        Page <span className="font-semibold text-ink-800 dark:text-white">{meta.page}</span> of {meta.totalPages}
        <span className="hidden sm:inline"> · {meta.total} results</span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!meta.hasPrev} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft size={15} /> Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={!meta.hasNext} onClick={() => onPage(meta.page + 1)}>
          Next <ChevronRight size={15} />
        </Button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${sizes[size] || sizes.md} animate-fade-in overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-ink-900`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-4 dark:border-white/10">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-ink-100 px-6 py-4 dark:border-white/10">{footer}</div> : null}
      </div>
    </div>
  );
}

export function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0 dark:border-white/5">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</span>
      <span className="text-right text-sm font-medium text-ink-700 dark:text-ink-200">{children}</span>
    </div>
  );
}

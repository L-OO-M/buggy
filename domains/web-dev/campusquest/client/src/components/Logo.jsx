import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function Logo({ compact = false, className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="CampusQuest home">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-600 to-fuchsia-600 text-white shadow-lg shadow-brand-600/30">
        <Compass size={19} strokeWidth={2.4} />
      </span>
      {!compact ? (
        <span className="font-display text-lg font-extrabold tracking-tight text-ink-900 dark:text-white">
          Campus<span className="text-brand-600 dark:text-brand-400">Quest</span>
        </span>
      ) : null}
    </Link>
  );
}

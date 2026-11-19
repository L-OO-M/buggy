import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="inline-flex rounded-2xl bg-brand-50 p-4 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
        <Compass size={32} />
      </span>
      <p className="mt-5 font-display text-5xl font-extrabold text-ink-900 dark:text-white">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-white">This quest does not exist</h1>
      <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
        The page may have moved, been cancelled, or the link might be incomplete.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn-primary"><Home size={15} /> Back home</Link>
        <Link to="/events" className="btn-secondary"><Compass size={15} /> Explore events</Link>
      </div>
      <Button variant="ghost" className="mt-3" onClick={() => window.history.back()}>Go back</Button>
    </div>
  );
}

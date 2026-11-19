import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { Avatar, Button } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationBell } from '../components/NotificationBell.jsx';

const links = [
  { to: '/events', label: 'Events' },
  { to: '/clubs', label: 'Clubs' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/leaderboards', label: 'Leaderboard' },
];

export default function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'organizer' ? '/organizer' : '/dashboard';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle compact />
            {user ? (
              <>
                <NotificationBell />
                <Link
                  to={dashboardLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-2.5 py-1.5 text-sm font-semibold text-ink-700 hover:border-brand-300 dark:border-white/10 dark:text-ink-200"
                >
                  <Avatar name={user.name} src={user.avatarUrl} size={26} />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Join CampusQuest <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-ink-600 md:hidden dark:text-ink-300"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-ink-200 bg-white px-4 py-4 md:hidden dark:border-white/10 dark:bg-ink-950">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/10"
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <ThemeToggle />
              {user ? (
                <Button onClick={() => (window.location.href = dashboardLink)}>Dashboard</Button>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                    Join
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-200/70 bg-white dark:border-white/10 dark:bg-ink-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <Logo />
            <p className="mt-3 max-w-sm text-sm text-ink-500 dark:text-ink-400">
              A student-built playground for campus events, clubs, teams, and challenges. Earn points, unlock badges, and
              make your campus count.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-500 dark:text-ink-400">
            <Link to="/events" className="hover:text-brand-600">Events</Link>
            <Link to="/clubs" className="hover:text-brand-600">Clubs</Link>
            <Link to="/challenges" className="hover:text-brand-600">Challenges</Link>
            <Link to="/leaderboards" className="hover:text-brand-600">Leaderboards</Link>
            <Link to="/login" className="hover:text-brand-600">Sign in</Link>
          </div>
        </div>
        <div className="border-t border-ink-100 py-4 text-center text-xs text-ink-400 dark:border-white/5">
          CampusQuest demo build · local educational project · no real student data
        </div>
      </footer>
    </div>
  );
}

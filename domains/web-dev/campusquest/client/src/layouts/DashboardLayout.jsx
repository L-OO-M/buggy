import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Compass,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Logo } from '../components/Logo.jsx';
import { Avatar, Button } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { NotificationBell } from '../components/NotificationBell.jsx';
import { roleLabel } from '../utils/format.js';

const studentSections = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Discover',
    items: [
      { to: '/events', label: 'Events', icon: CalendarDays },
      { to: '/clubs', label: 'Clubs', icon: Users },
      { to: '/challenges', label: 'Challenges', icon: Swords },
    ],
  },
  {
    label: 'My activity',
    items: [
      { to: '/registrations', label: 'Registrations', icon: CheckSquare },
      { to: '/teams', label: 'Teams', icon: ShieldCheck },
      { to: '/submissions', label: 'Submissions', icon: ClipboardList },
      { to: '/achievements', label: 'Achievements', icon: Award },
    ],
  },
  {
    label: 'Compete',
    items: [
      { to: '/leaderboards/individual', label: 'Individual board', icon: Trophy },
      { to: '/leaderboards/teams', label: 'Team board', icon: Users },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ],
  },
];

const organizerSections = [
  {
    label: 'Overview',
    items: [{ to: '/organizer', label: 'Organizer hub', icon: LayoutDashboard }],
  },
  {
    label: 'Manage',
    items: [
      { to: '/organizer/events', label: 'Events', icon: CalendarDays },
      { to: '/organizer/challenges', label: 'Challenges', icon: Swords },
      { to: '/organizer/submissions', label: 'Submissions', icon: ClipboardList },
      { to: '/organizer/attendance', label: 'Attendance', icon: CheckSquare },
      { to: '/organizer/clubs', label: 'Clubs', icon: Users },
    ],
  },
  {
    label: 'Grow',
    items: [
      { to: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/organizer/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/profile', label: 'Profile', icon: UserRound },
    ],
  },
];

const adminSections = [
  {
    label: 'Overview',
    items: [{ to: '/admin', label: 'Platform pulse', icon: LayoutDashboard }],
  },
  {
    label: 'Governance',
    items: [
      { to: '/admin/users', label: 'Users', icon: UserRound },
      { to: '/admin/clubs', label: 'Club approvals', icon: Users },
      { to: '/admin/events', label: 'Event moderation', icon: CalendarDays },
      { to: '/admin/challenges', label: 'Challenges', icon: Swords },
      { to: '/admin/submissions', label: 'Submissions', icon: ClipboardList },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/rewards', label: 'Rewards', icon: Sparkles },
      { to: '/admin/reports', label: 'Reports', icon: Flag },
      { to: '/admin/activity', label: 'Activity', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/profile', label: 'Profile', icon: UserRound }],
  },
];

function sectionsFor(role) {
  if (role === 'admin') return adminSections;
  if (role === 'organizer') return organizerSections;
  return studentSections;
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sections = sectionsFor(user?.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 scrollbar-thin" aria-label="Dashboard navigation">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard' || to === '/organizer' || to === '/admin'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                        : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div className="px-2 pt-2">
          <Link
            to="/events"
            className="flex items-center gap-2 rounded-xl border border-dashed border-ink-200 px-3 py-2.5 text-xs font-medium text-ink-500 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-ink-400"
          >
            <Compass size={15} /> Public campus site
          </Link>
        </div>
      </nav>
      <div className="border-t border-ink-200/70 p-3 dark:border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-3 dark:bg-white/5">
          <Avatar name={user?.name} src={user?.avatarUrl} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{user?.name}</p>
            <p className="text-[11px] text-ink-400">{roleLabel(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-white hover:text-rose-500 dark:hover:bg-white/10"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const homeLink = user?.role === 'admin' ? '/admin' : user?.role === 'organizer' ? '/organizer' : '/dashboard';

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <aside className="hidden w-64 shrink-0 border-r border-ink-200/70 bg-white lg:block dark:border-white/10 dark:bg-ink-900/40">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <aside className="relative h-full w-72 animate-fade-in bg-white shadow-2xl dark:bg-ink-900">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-ink-200/70 bg-white/80 px-4 backdrop-blur-xl sm:px-6 dark:border-white/10 dark:bg-ink-950/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl p-2 text-ink-600 lg:hidden dark:text-ink-300"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <Link to={homeLink} className="hidden text-sm font-semibold text-ink-500 hover:text-brand-600 sm:block dark:text-ink-400">
              {roleLabel(user?.role)} workspace
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle compact />
            <NotificationBell />
            <Link to="/profile" className="ml-1 flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-ink-100 dark:hover:bg-white/10">
              <Avatar name={user?.name} src={user?.avatarUrl} size={30} />
              <span className="hidden text-sm font-semibold text-ink-800 sm:block dark:text-ink-100">{user?.name?.split(' ')[0]}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              <LogOut size={15} /> Sign out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Compass,
  QrCode,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { challengesApi, clubsApi, eventsApi, leaderboardsApi } from '../../api/index.js';
import { Avatar, Skeleton } from '../../components/ui.jsx';
import { EventCard, ClubCard, ChallengeCard } from '../../components/cards.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const features = [
  {
    icon: CalendarDays,
    title: 'Find your next room to grow',
    body: 'Search workshops, tournaments, cultural nights, and service days by category, date, and capacity.',
  },
  {
    icon: Users,
    title: 'Clubs and teams that stick',
    body: 'Join approved campus clubs, request membership, and build a team for multi-person challenges.',
  },
  {
    icon: Swords,
    title: 'Challenges with a paper trail',
    body: 'Submit evidence, get organizer feedback, resubmit when allowed, and track every point you earn.',
  },
  {
    icon: QrCode,
    title: 'Check in without the clipboard',
    body: 'Organizers display a signed event QR. Students scan once, attendance and rewards are recorded instantly.',
  },
];

const roles = [
  { icon: Compass, title: 'Students', body: 'Discover what is happening, collect points, unlock badges, and build a campus track record.' },
  { icon: Sparkles, title: 'Organizers', body: 'Publish events and challenges, approve evidence, manage attendance, and see what actually works.' },
  { icon: Trophy, title: 'Admins', body: 'Keep the platform healthy with approvals, moderation, role management, and real analytics.' },
];

export default function Landing() {
  const { user } = useAuth();
  const { data, loading } = useApi(
    async () => {
      const [events, clubs, challenges, leaders] = await Promise.all([
        eventsApi.list({ limit: 3 }),
        clubsApi.list({ limit: 3 }),
        challengesApi.list({ limit: 3 }),
        leaderboardsApi.individual({ limit: 5 }),
      ]);
      return { events, clubs, challenges, leaders };
    },
    [],
  );

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'organizer' ? '/organizer' : '/dashboard';

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200/70 dark:border-white/10">
        <div className="absolute inset-0 hero-grid opacity-60 dark:opacity-30" aria-hidden="true" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700 dark:border-brand-400/30 dark:bg-brand-500/10 dark:text-brand-200">
              <Sparkles size={14} /> Campus life, leveled up
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-ink-950 dark:text-white sm:text-6xl">
              Do more on campus.
              <br />
              <span className="gradient-text">Earn proof you did.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-600 dark:text-ink-300 sm:text-lg">
              CampusQuest turns events, clubs, and challenges into a living student portfolio. Show up, form a team,
              submit your work, and watch your points and badges add up.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={user ? dashboardLink : '/register'} className="btn-primary px-6 py-3 text-base">
                {user ? 'Open your dashboard' : 'Start your quest'} <ArrowRight size={18} />
              </Link>
              <Link to="/challenges" className="btn-secondary px-5 py-3 text-base">
                Explore challenges
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500 dark:text-ink-400">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-mint" /> Real campus workflows</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-mint" /> QR event check-in</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-mint" /> Live leaderboards</span>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -right-4 -top-6 hidden rounded-2xl border border-white/40 bg-white/80 p-3 shadow-lift backdrop-blur lg:block dark:border-white/10 dark:bg-ink-900/80">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-700 dark:text-ink-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                  <Zap size={16} />
                </span>
                +120 pts
                <span className="text-ink-400">this week</span>
              </div>
            </div>
            <div className="surface relative overflow-hidden p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Live campus board</p>
                  <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Top students</h2>
                </div>
                <Link to="/leaderboards" className="text-xs font-semibold text-brand-600 dark:text-brand-300">View all</Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ol className="space-y-2">
                  {(data?.leaders?.data || []).map((entry, index) => (
                    <li key={entry.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-ink-50 dark:hover:bg-white/5">
                      <span className={`w-6 text-center font-display text-sm font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-ink-400' : index === 2 ? 'text-orange-500' : 'text-ink-400'}`}>
                        {index + 1}
                      </span>
                      <Avatar name={entry.name} src={entry.avatarUrl} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{entry.name}</p>
                        <p className="text-[11px] text-ink-400">{entry.levelTitle} · Level {entry.level}</p>
                      </div>
                      <span className="font-display text-sm font-bold text-brand-600 dark:text-brand-300">{entry.score}</span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="mt-5 rounded-xl bg-gradient-to-r from-brand-600 to-fuchsia-600 p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">This week&apos;s mission</p>
                <p className="mt-1 text-sm font-semibold">Join one challenge and one campus event before Sunday.</p>
                <Link to="/challenges" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/90 hover:text-white">
                  Pick a challenge <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Happening soon</p>
            <h2 className="section-title mt-2">Your campus is already moving</h2>
          </div>
          <Link to="/events" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">
            All events <ArrowRight size={14} className="inline" />
          </Link>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 w-full" />)
            : (data?.events?.data || []).map((event) => <EventCard key={event._id} event={event} />)}
        </div>
      </section>

      <section className="border-y border-ink-200/70 bg-white py-16 dark:border-white/10 dark:bg-ink-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">One place, full loop</p>
            <h2 className="section-title mt-2">From discovery to a verified campus record</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-ink-200/70 bg-ink-50/60 p-5 dark:border-white/10 dark:bg-white/5">
                <span className="inline-flex rounded-xl bg-brand-600 p-2.5 text-white shadow-lg shadow-brand-600/20">
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Clubs to know</p>
                <h2 className="section-title mt-2">Find your people</h2>
              </div>
              <Link to="/clubs" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">All clubs</Link>
            </div>
            <div className="mt-6 space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
                : (data?.clubs?.data || []).map((club) => <ClubCard key={club._id} club={club} />)}
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">Open now</p>
                <h2 className="section-title mt-2">Challenges worth doing</h2>
              </div>
              <Link to="/challenges" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-300">All challenges</Link>
            </div>
            <div className="mt-6 space-y-3">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)
                : (data?.challenges?.data || []).map((challenge) => (
                    <ChallengeCard key={challenge._id} challenge={challenge} compact />
                  ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-200/70 bg-gradient-to-b from-white to-ink-50 py-16 dark:border-white/10 dark:from-ink-900/40 dark:to-ink-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {roles.map(({ icon: Icon, title, body }) => (
              <div key={title} className="surface p-6">
                <Icon size={22} className="text-brand-600 dark:text-brand-300" />
                <h3 className="mt-3 font-display text-lg font-bold text-ink-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-12 sm:px-12">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <Award size={26} className="text-amber-300" />
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your campus story should be more than a transcript.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-300 sm:text-base">
              Join CampusQuest, pick your first event, and let every club meeting and challenge submission build a record
              you can actually show.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={user ? dashboardLink : '/register'} className="btn-primary bg-white text-brand-700 hover:bg-brand-50">
                {user ? 'Go to dashboard' : 'Create a student account'} <ArrowRight size={16} />
              </Link>
              <Link to="/leaderboards" className="btn border border-white/20 text-white hover:bg-white/10">
                See the leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

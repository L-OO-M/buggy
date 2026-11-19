import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Plus,
  QrCode,
  Swords,
  Users,
  Zap,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { challengesApi, clubsApi, eventsApi, submissionsApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDate, formatDateTime, formatRelative, percent } from '../../utils/format.js';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useApi(
    async () => {
      const [events, challenges, pending, approved, rejected, clubs] = await Promise.all([
        eventsApi.mine({ limit: 100 }),
        challengesApi.mine({ limit: 100 }),
        submissionsApi.reviewQueue({ status: 'pending', limit: 5 }),
        submissionsApi.reviewQueue({ status: 'approved', limit: 100 }),
        submissionsApi.reviewQueue({ status: 'rejected', limit: 100 }),
        clubsApi.mine(),
      ]);
      return { events, challenges, pending, approved, rejected, clubs };
    },
    [],
  );

  if (loading) {
    return <div className="space-y-5"><Skeleton className="h-32 w-full" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div><Skeleton className="h-64 w-full" /></div>;
  }
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const events = data.events.data;
  const challenges = data.challenges.data;
  const registrations = events.reduce((sum, event) => sum + event.registrationCount, 0);
  const upcoming = events.filter((event) => event.status === 'published' && new Date(event.startDate) > new Date()).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const nextEvent = upcoming[0];
  const participation = challenges.reduce((sum, challenge) => sum + challenge.participationCount, 0);
  const pending = data.pending;
  const approved = data.approved.data;
  const rejected = data.rejected.data;
  const reviewTotal = approved.length + rejected.length;
  const approvalRate = reviewTotal ? Math.round((approved.length / reviewTotal) * 100) : 0;

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-6 text-white sm:p-8">
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">Organizer hub</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Run the campus, {user.name.split(' ')[0]}.</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-300">
              {events.length} events and {challenges.length} challenges under your name. {pending.meta?.total || pending.data.length} submission{(pending.meta?.total || pending.data.length) === 1 ? '' : 's'} are waiting for review.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/organizer/events/new" className="btn bg-white text-ink-900 hover:bg-brand-50"><Plus size={15} /> New event</Link>
              <Link to="/organizer/challenges/new" className="btn border border-white/20 text-white hover:bg-white/10"><Plus size={15} /> New challenge</Link>
              <Link to="/organizer/submissions" className="btn border border-white/20 text-white hover:bg-white/10"><ClipboardList size={15} /> Review queue</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur"><p className="text-[10px] uppercase tracking-wider text-white/60">Registrations</p><p className="mt-1 font-display text-2xl font-bold">{registrations}</p></div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur"><p className="text-[10px] uppercase tracking-wider text-white/60">Participation</p><p className="mt-1 font-display text-2xl font-bold">{participation}</p></div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur"><p className="text-[10px] uppercase tracking-wider text-white/60">Approval rate</p><p className="mt-1 font-display text-2xl font-bold">{approvalRate}%</p></div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur"><p className="text-[10px] uppercase tracking-wider text-white/60">Clubs</p><p className="mt-1 font-display text-2xl font-bold">{data.clubs.length}</p></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Published events" value={events.filter((event) => event.status === 'published').length} hint={`${upcoming.length} upcoming`} icon={CalendarDays} tone="info" />
        <StatCard label="Open challenges" value={challenges.filter((challenge) => challenge.status === 'published').length} hint={`${participation} total participants`} icon={Swords} tone="brand" />
        <StatCard label="Pending reviews" value={pending.meta?.total ?? pending.data.length} hint="Submissions waiting on you" icon={ClipboardList} tone="warning" />
        <StatCard label="Approved submissions" value={approved.length} hint={`${rejected.length} rejected`} icon={Zap} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader title="Next event" action={<Link to="/organizer/events" className="text-xs font-semibold text-brand-600 dark:text-brand-300">Manage events</Link>} />
          {nextEvent ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-300">{formatDate(nextEvent.startDate, { weekday: 'long' })} · {formatDateTime(nextEvent.startDate)}</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-ink-900 dark:text-white">{nextEvent.title}</h3>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{nextEvent.venue}</p>
                </div>
                <StatusBadge status={nextEvent.status} />
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-ink-400">
                  <span>{nextEvent.registrationCount} registered</span>
                  <span>{nextEvent.capacity} capacity</span>
                </div>
                <ProgressBar value={percent(nextEvent.registrationCount, nextEvent.capacity)} tone="brand" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to={`/events/${nextEvent._id}`} className="btn-secondary btn-sm">Public page</Link>
                <Link to="/organizer/attendance" className="btn-secondary btn-sm"><QrCode size={14} /> Check-in desk</Link>
                <Link to={`/organizer/events/${nextEvent._id}/edit`} className="btn-primary btn-sm">Edit event</Link>
              </div>
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="No upcoming events" description="Publish an event to start collecting registrations." action={<Link to="/organizer/events/new" className="btn-primary btn-sm">Create event</Link>} />
          )}
        </Card>

        <Card>
          <SectionHeader title="Review queue" action={<Link to="/organizer/submissions" className="text-xs font-semibold text-brand-600 dark:text-brand-300">Open queue</Link>} />
          {pending.data.length ? (
            <ul className="space-y-2">
              {pending.data.map((submission) => (
                <li key={submission._id} className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{submission.challenge?.title}</p>
                  <p className="text-[11px] text-ink-400">{submission.submittedBy?.name} · {formatRelative(submission.createdAt)}</p>
                  <Link to="/organizer/submissions" className="mt-1 inline-block text-[11px] font-semibold text-brand-600 dark:text-brand-300">Review now</Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl bg-mint/10 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">Queue is clear</p>
              <p className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-300/70">New challenge evidence will appear here.</p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Event performance" description="Registration fill rate for your published events." action={<Link to="/organizer/analytics" className="text-xs font-semibold text-brand-600 dark:text-brand-300"><BarChart3 size={13} className="mr-1 inline" />Full analytics</Link>} />
        <div className="space-y-3">
          {events.filter((event) => event.status === 'published').slice(0, 5).map((event) => (
            <div key={event._id} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/events/${event._id}`} className="truncate text-sm font-medium text-ink-800 hover:text-brand-600 dark:text-ink-100">{event.title}</Link>
                  <span className="shrink-0 text-xs text-ink-400">{event.registrationCount}/{event.capacity}</span>
                </div>
                <ProgressBar className="mt-1" value={percent(event.registrationCount, event.capacity)} />
              </div>
            </div>
          ))}
          {!events.length ? <EmptyState icon={BarChart3} title="No event data yet" /> : null}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/organizer/events" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <CalendarDays size={20} className="text-brand-600 dark:text-brand-300" />
          <p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Events</p>
          <p className="text-xs text-ink-400">Create, edit, cancel</p>
        </Link>
        <Link to="/organizer/challenges" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <Swords size={20} className="text-brand-600 dark:text-brand-300" />
          <p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Challenges</p>
          <p className="text-xs text-ink-400">Rewards and deadlines</p>
        </Link>
        <Link to="/organizer/clubs" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <Users size={20} className="text-brand-600 dark:text-brand-300" />
          <p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Clubs</p>
          <p className="text-xs text-ink-400">Members and requests</p>
        </Link>
        <Link to="/organizer/announcements" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
          <ArrowRight size={20} className="text-brand-600 dark:text-brand-300" />
          <p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Announce</p>
          <p className="text-xs text-ink-400">Reach participants</p>
        </Link>
      </div>
    </div>
  );
}

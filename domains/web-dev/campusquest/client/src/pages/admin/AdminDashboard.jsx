import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ShieldCheck,
  Swords,
  Users,
  Zap,
} from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Card, ErrorState, ProgressBar, SectionHeader, Skeleton, StatCard, StatusBadge } from '../../components/ui.jsx';
import { formatDate, titleCase } from '../../utils/format.js';

export default function AdminDashboard() {
  const { data, loading, error, refresh } = useApi(() => adminApi.stats(), []);

  if (loading) return <div className="space-y-5"><Skeleton className="h-36 w-full" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div><Skeleton className="h-64 w-full" /></div>;
  if (error || !data) return <ErrorState error={error} onRetry={refresh} />;

  const maxWeekly = Math.max(1, ...data.weeklyRegistrations.map((entry) => entry.count));
  const totalSubmissions = data.submissions.pending + data.submissions.approved + data.submissions.rejected;

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl bg-ink-950 p-6 text-white sm:p-8">
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Platform control</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">CampusQuest is healthy.</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-300">
            {data.users.total} accounts, {data.clubs.active} live clubs, {data.events.published} published events, and {data.achievementsUnlocked} badges unlocked.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/admin/reports" className="btn bg-white text-ink-900 hover:bg-brand-50"><AlertTriangle size={15} /> {data.openReports} open reports</Link>
            <Link to="/admin/clubs" className="btn border border-white/20 text-white hover:bg-white/10"><ShieldCheck size={15} /> {data.clubs.pending} clubs awaiting review</Link>
            <Link to="/admin/submissions" className="btn border border-white/20 text-white hover:bg-white/10"><ClipboardCheck size={15} /> {data.submissions.pending} pending submissions</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={data.users.students} hint={`${data.users.organizers} organizers · ${data.users.admins} admins`} icon={Users} tone="brand" />
        <StatCard label="Event attendance" value={data.events.attendance} hint={`${data.events.registrations} active registrations`} icon={CalendarDays} tone="info" />
        <StatCard label="Challenge entries" value={data.challenges.participations} hint={`${data.challenges.total} challenges total`} icon={Swords} tone="warning" />
        <StatCard label="Points distributed" value={data.pointsDistributed.toLocaleString()} hint={`${data.achievementsUnlocked} achievements unlocked`} icon={Zap} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <SectionHeader title="Registrations this week" description={`${data.events.registrations} active registrations overall.`} />
          {data.weeklyRegistrations.length ? (
            <div className="flex h-40 items-end gap-2">
              {data.weeklyRegistrations.map((entry) => (
                <div key={entry._id} className="group flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-ink-400 opacity-0 transition group-hover:opacity-100">{entry.count}</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition hover:from-brand-500" style={{ height: `${Math.max(8, (entry.count / maxWeekly) * 120)}px` }} />
                  <span className="text-[9px] text-ink-400">{String(entry._id).slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink-500">No registrations in the last seven days.</p>}
        </Card>

        <Card>
          <SectionHeader title="Submission pipeline" action={<Link to="/admin/submissions" className="text-xs font-semibold text-brand-600 dark:text-brand-300">Monitor</Link>} />
          <div className="space-y-3">
            {['pending', 'approved', 'rejected'].map((status) => (
              <div key={status}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-ink-600 dark:text-ink-300">{titleCase(status)}</span>
                  <span className="text-ink-400">{data.submissions[status]} / {totalSubmissions}</span>
                </div>
                <ProgressBar value={totalSubmissions ? (data.submissions[status] / totalSubmissions) * 100 : 0} tone={status === 'approved' ? 'success' : status === 'pending' ? 'warning' : 'danger'} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-ink-50 p-3 text-xs dark:bg-white/5">
            <span className="text-ink-500 dark:text-ink-400">Unlocked badges</span>
            <span className="font-bold text-ink-900 dark:text-white">{data.achievementsUnlocked}</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionHeader title="Recent registrations" action={<Link to="/admin/activity" className="text-xs font-semibold text-brand-600 dark:text-brand-300"><Activity size={13} className="inline" /></Link>} />
          {data.activity.registrations.length ? (
            <ul className="space-y-2">
              {data.activity.registrations.map((entry) => (
                <li key={entry._id} className="border-b border-ink-100 pb-2 last:border-0 dark:border-white/5">
                  <p className="truncate text-xs font-medium text-ink-800 dark:text-ink-100">{entry.user?.name} → {entry.event?.title}</p>
                  <p className="text-[10px] text-ink-400">{formatDate(entry.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-ink-400">No registrations yet.</p>}
        </Card>
        <Card>
          <SectionHeader title="Recent submissions" />
          {data.activity.submissions.length ? (
            <ul className="space-y-2">
              {data.activity.submissions.map((entry) => (
                <li key={entry._id} className="border-b border-ink-100 pb-2 last:border-0 dark:border-white/5">
                  <p className="truncate text-xs font-medium text-ink-800 dark:text-ink-100">{entry.submittedBy?.name} → {entry.challenge?.title}</p>
                  <p className="text-[10px] text-ink-400">{titleCase(entry.status)} · {formatDate(entry.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-ink-400">No submissions yet.</p>}
        </Card>
        <Card>
          <SectionHeader title="Newest clubs" action={<Link to="/admin/clubs" className="text-xs font-semibold text-brand-600 dark:text-brand-300">Review</Link>} />
          {data.activity.clubs.length ? (
            <ul className="space-y-2">
              {data.activity.clubs.map((club) => (
                <li key={club._id} className="flex items-center justify-between gap-2 border-b border-ink-100 pb-2 last:border-0 dark:border-white/5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-800 dark:text-ink-100">{club.name}</p>
                    <p className="text-[10px] text-ink-400">{club.organizer?.name}</p>
                  </div>
                  <StatusBadge status={club.status} />
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-ink-400">No clubs yet.</p>}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/users" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift"><Users size={20} className="text-brand-600 dark:text-brand-300" /><p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Users</p></Link>
        <Link to="/admin/rewards" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift"><Award size={20} className="text-brand-600 dark:text-brand-300" /><p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Rewards</p></Link>
        <Link to="/admin/events" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift"><CalendarDays size={20} className="text-brand-600 dark:text-brand-300" /><p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Moderate events</p></Link>
        <Link to="/admin/challenges" className="surface p-4 transition hover:-translate-y-0.5 hover:shadow-lift"><BookOpenCheck size={20} className="text-brand-600 dark:text-brand-300" /><p className="mt-2 text-sm font-bold text-ink-900 dark:text-white">Moderate challenges</p></Link>
      </div>
    </div>
  );
}

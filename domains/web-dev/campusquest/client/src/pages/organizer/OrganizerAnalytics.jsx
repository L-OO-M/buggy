import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, Trophy, Users } from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { challengesApi, clubsApi, eventsApi, submissionsApi } from '../../api/index.js';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatCard,
} from '../../components/ui.jsx';
import { percent } from '../../utils/format.js';

export default function OrganizerAnalytics() {
  const { data, loading, error, refresh } = useApi(
    async () => {
      const [events, challenges, approved, rejected, pending, clubs] = await Promise.all([
        eventsApi.mine({ limit: 100 }),
        challengesApi.mine({ limit: 100 }),
        submissionsApi.reviewQueue({ status: 'approved', limit: 100 }),
        submissionsApi.reviewQueue({ status: 'rejected', limit: 100 }),
        submissionsApi.reviewQueue({ status: 'pending', limit: 100 }),
        clubsApi.mine(),
      ]);
      return { events, challenges, approved, rejected, pending, clubs };
    },
    [],
  );

  if (loading) return <div className="space-y-5"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const events = data.events.data;
  const challenges = data.challenges.data;
  const reviewed = data.approved.data.length + data.rejected.data.length;
  const approvalRate = reviewed ? Math.round((data.approved.data.length / reviewed) * 100) : 0;
  const totalRegistrations = events.reduce((sum, event) => sum + event.registrationCount, 0);
  const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
  const totalParticipation = challenges.reduce((sum, challenge) => sum + challenge.participationCount, 0);
  const topEvents = [...events].sort((a, b) => b.registrationCount - a.registrationCount).slice(0, 6);
  const topChallenges = [...challenges].sort((a, b) => b.participationCount - a.participationCount).slice(0, 6);

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Organizer analytics"
        description="Real numbers from your events, challenges, clubs, and review activity. No placeholder dashboards."
        actions={<Link to="/organizer/submissions" className="btn-secondary"><ClipboardList size={15} /> Review queue</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registrations" value={totalRegistrations} hint={`${percent(totalRegistrations, totalCapacity)}% of total capacity`} icon={Users} tone="info" />
        <StatCard label="Challenge participation" value={totalParticipation} hint={`${challenges.length} challenges created`} icon={Trophy} tone="brand" />
        <StatCard label="Approval rate" value={`${approvalRate}%`} hint={`${reviewed} reviewed submissions`} icon={BarChart3} tone="success" />
        <StatCard label="Pending reviews" value={data.pending.meta?.total ?? data.pending.data.length} hint="Needs organizer action" icon={ClipboardList} tone="warning" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Events by registration" description="Fill rate per event." />
          {topEvents.length ? (
            <div className="space-y-3">
              {topEvents.map((event) => (
                <div key={event._id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-ink-700 dark:text-ink-200">{event.title}</span>
                    <span className="shrink-0 text-ink-400">{event.registrationCount}/{event.capacity}</span>
                  </div>
                  <ProgressBar value={percent(event.registrationCount, event.capacity)} className="mt-1" tone={event.registrationCount / event.capacity > 0.85 ? 'success' : 'brand'} />
                </div>
              ))}
            </div>
          ) : <EmptyState icon={BarChart3} title="No event data yet" />}
        </Card>

        <Card>
          <SectionHeader title="Challenges by participation" description="How many students entered each challenge." />
          {topChallenges.length ? (
            <div className="space-y-3">
              {topChallenges.map((challenge) => (
                <div key={challenge._id}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-ink-700 dark:text-ink-200">{challenge.title}</span>
                    <span className="shrink-0 text-ink-400">{challenge.participationCount}/{challenge.maxParticipants}</span>
                  </div>
                  <ProgressBar value={percent(challenge.participationCount, challenge.maxParticipants)} className="mt-1" tone="warning" />
                </div>
              ))}
            </div>
          ) : <EmptyState icon={BarChart3} title="No challenge data yet" />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <SectionHeader title="Submission outcomes" description="Approved, rejected, and pending across your challenges." />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Approved</p>
              <p className="mt-1 font-display text-3xl font-bold text-emerald-700 dark:text-emerald-200">{data.approved.data.length}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4 dark:bg-rose-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">Rejected</p>
              <p className="mt-1 font-display text-3xl font-bold text-rose-700 dark:text-rose-200">{data.rejected.data.length}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Pending</p>
              <p className="mt-1 font-display text-3xl font-bold text-amber-700 dark:text-amber-200">{data.pending.meta?.total ?? data.pending.data.length}</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-ink-400"><span>Approval share</span><span>{approvalRate}%</span></div>
            <ProgressBar value={approvalRate} tone="success" />
          </div>
        </Card>

        <Card>
          <SectionHeader title="Club health" />
          {data.clubs.length ? (
            <ul className="space-y-2">
              {data.clubs.map((membership) => {
                const club = membership.club;
                if (!club) return null;
                return (
                <li key={membership._id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 dark:bg-white/5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{club.name}</p>
                    <p className="text-[11px] text-ink-400">{club.membersCount} members · {club.category}</p>
                  </div>
                  <span className={`badge ${club.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'}`}>{club.status}</span>
                </li>
                );
              })}
            </ul>
          ) : <EmptyState icon={Users} title="No clubs owned" description="Create a club to unlock membership management." />}
        </Card>
      </div>
    </div>
  );
}

import { Activity, CalendarDays, FileText, Users } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Card, ErrorState, PageHeader, ProgressBar, SectionHeader, Skeleton, StatCard, StatusBadge } from '../../components/ui.jsx';
import { formatDate, formatDateTime, titleCase } from '../../utils/format.js';

export default function AdminActivity() {
  const { data, loading, error, refresh } = useApi(() => adminApi.stats(), []);

  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (error || !data) return <ErrorState error={error} onRetry={refresh} />;

  const maxWeekly = Math.max(1, ...data.weeklyRegistrations.map((entry) => entry.count));
  const totalPoints = data.pointsByType.reduce((sum, entry) => sum + entry.total, 0);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Platform activity" description="A live pulse of registrations, submissions, clubs, and point distribution." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active registrations" value={data.events.registrations} hint={`${data.events.attendance} checked in`} icon={CalendarDays} tone="info" />
        <StatCard label="Submission volume" value={data.submissions.pending + data.submissions.approved + data.submissions.rejected} hint={`${data.submissions.pending} pending`} icon={FileText} tone="warning" />
        <StatCard label="Club memberships" value={data.clubs.active} hint={`${data.clubs.pending} pending approvals`} icon={Users} tone="brand" />
        <StatCard label="Points issued" value={data.pointsDistributed.toLocaleString()} hint="Positive ledger entries only" icon={Activity} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader title="Registration velocity" description="Daily registrations over the last seven days." />
          <div className="flex h-52 items-end gap-2">
            {data.weeklyRegistrations.length ? data.weeklyRegistrations.map((entry) => (
              <div key={entry._id} className="group flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-ink-400">{entry.count}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${Math.max(10, (entry.count / maxWeekly) * 150)}px` }} />
                <span className="text-[9px] text-ink-400">{String(entry._id).slice(5)}</span>
              </div>
            )) : <p className="text-sm text-ink-500">No registrations in the last seven days.</p>}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Points by source" />
          {data.pointsByType.length ? (
            <div className="space-y-3">
              {data.pointsByType.map((entry) => (
                <div key={entry._id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-ink-600 dark:text-ink-300">{titleCase(entry._id)}</span>
                    <span className="text-ink-400">{entry.total} pts · {entry.count}×</span>
                  </div>
                  <ProgressBar value={totalPoints ? (entry.total / totalPoints) * 100 : 0} tone="brand" />
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink-500">No point transactions yet.</p>}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionHeader title="Latest registrations" />
          <div className="space-y-3">
            {data.activity.registrations.map((entry) => (
              <div key={entry._id} className="border-b border-ink-100 pb-2 text-xs last:border-0 dark:border-white/5">
                <p className="font-semibold text-ink-800 dark:text-ink-100">{entry.user?.name}</p>
                <p className="truncate text-ink-400">{entry.event?.title}</p>
                <p className="text-[10px] text-ink-400">{formatDateTime(entry.createdAt)}</p>
              </div>
            ))}
            {!data.activity.registrations.length ? <p className="text-sm text-ink-500">No registrations yet.</p> : null}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Latest submissions" />
          <div className="space-y-3">
            {data.activity.submissions.map((entry) => (
              <div key={entry._id} className="border-b border-ink-100 pb-2 text-xs last:border-0 dark:border-white/5">
                <p className="font-semibold text-ink-800 dark:text-ink-100">{entry.submittedBy?.name}</p>
                <p className="truncate text-ink-400">{entry.challenge?.title}</p>
                <p className="text-[10px] text-ink-400">{titleCase(entry.status)} · {formatDateTime(entry.createdAt)}</p>
              </div>
            ))}
            {!data.activity.submissions.length ? <p className="text-sm text-ink-500">No submissions yet.</p> : null}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Newest clubs" />
          <div className="space-y-3">
            {data.activity.clubs.map((club) => (
              <div key={club._id} className="flex items-center justify-between gap-2 border-b border-ink-100 pb-2 text-xs last:border-0 dark:border-white/5">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-800 dark:text-ink-100">{club.name}</p>
                  <p className="text-[10px] text-ink-400">{club.organizer?.name} · {formatDate(club.createdAt)}</p>
                </div>
                <StatusBadge status={club.status} />
              </div>
            ))}
            {!data.activity.clubs.length ? <p className="text-sm text-ink-500">No clubs yet.</p> : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

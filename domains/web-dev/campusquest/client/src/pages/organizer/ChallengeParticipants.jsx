import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Users } from 'lucide-react';
import { challengesApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function ChallengeParticipants() {
  const { id } = useParams();
  const { data, loading, error, refresh } = useApi(() => challengesApi.participants(id), [id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (error || !data) return <ErrorState error={error} onRetry={refresh} />;

  const { challenge, participants } = data;
  const approved = participants.filter((entry) => entry.status === 'approved');
  const pending = participants.filter((entry) => ['submitted', 'pending'].includes(entry.status));
  const submitted = participants.reduce((sum, entry) => sum + entry.submissionCount, 0);

  return (
    <div>
      <Link to="/organizer/challenges" className="btn-ghost mb-3 -ml-3"><ArrowLeft size={16} /> All challenges</Link>
      <PageHeader
        eyebrow="Participants"
        title={challenge.title}
        description={`${challenge.type === 'team' ? 'Team' : 'Individual'} challenge · deadline ${formatDateTime(challenge.deadline)}`}
        actions={<Link to="/organizer/submissions" className="btn-secondary"><ClipboardList size={15} /> Review queue</Link>}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Participants" value={participants.length} hint={`${challenge.participationCount}/${challenge.maxParticipants} joined`} icon={Users} />
        <StatCard label="Approved" value={approved.length} hint="Completed challenge" icon={ClipboardList} tone="success" />
        <StatCard label="Awaiting review" value={pending.length} hint={`${submitted} submissions total`} icon={ClipboardList} tone="warning" />
      </div>

      <Card>
        <SectionHeader title="Participant roster" description="Team entries show the team size; individual entries show the student." />
        {participants.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-400 dark:border-white/10">
                  <th className="pb-2 pr-3">Participant</th>
                  <th className="pb-2 pr-3">Type</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2 pr-3">Submissions</th>
                  <th className="pb-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-white/5">
                {participants.map((entry) => (
                  <tr key={entry._id}>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={entry.team?.name || entry.user?.name} size={32} />
                        <div>
                          <p className="font-medium text-ink-900 dark:text-white">{entry.team?.name || entry.user?.name}</p>
                          <p className="text-[11px] text-ink-400">{entry.team ? `${entry.team.membersCount} members` : entry.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-xs text-ink-500 dark:text-ink-400">{entry.team ? 'Team' : 'Individual'}</td>
                    <td className="py-3 pr-3"><StatusBadge status={entry.status} /></td>
                    <td className="py-3 pr-3 font-semibold text-ink-700 dark:text-ink-200">{entry.submissionCount}</td>
                    <td className="py-3 text-xs text-ink-400">{formatDateTime(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={Users} title="No participants yet" description="Share the challenge link to get students involved." />}
      </Card>
    </div>
  );
}

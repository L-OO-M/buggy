import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Lock, Plus, Swords, Users } from 'lucide-react';
import { challengesApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Button,
  Card,
  DifficultyBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function OrganizerChallenges() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const { data, meta, loading, error, refresh } = useApi(() => challengesApi.mine({ page, limit: 12, status: status || undefined }), [page, status]);

  const close = async (challenge) => {
    setBusyId(challenge._id);
    try {
      await challengesApi.close(challenge._id);
      toast.success('Challenge closed. Submissions are frozen.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Organizer"
        title="Challenges"
        description="Design challenges, set rewards, and review evidence from one queue."
        actions={<Link to="/organizer/challenges/new" className="btn-primary"><Plus size={15} /> New challenge</Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={`chip ${!status ? 'chip-active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>All</button>
        {['draft', 'published', 'closed'].map((option) => (
          <button key={option} type="button" className={`chip ${status === option ? 'chip-active' : ''}`} onClick={() => { setStatus(option); setPage(1); }}>{option}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={Swords} title="No challenges here" description="Create a challenge with a clear evidence hint and point reward." action={<Link to="/organizer/challenges/new" className="btn-primary btn-sm">Create challenge</Link>} /> : null}

      <div className="space-y-3">
        {data?.map((challenge) => (
          <Card key={challenge._id} className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{challenge.title}</h3>
                  <StatusBadge status={challenge.status} />
                  <DifficultyBadge difficulty={challenge.difficulty} />
                  {challenge.type === 'team' ? <span className="badge bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">Team</span> : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                  <span>Deadline {formatDateTime(challenge.deadline)}</span>
                  <span>{challenge.participationCount}/{challenge.maxParticipants} joined</span>
                  <span>{challenge.rewardPoints} points reward</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/organizer/challenges/${challenge._id}/edit`} className="btn-secondary btn-sm"><Edit3 size={14} /> Edit</Link>
                <Link to={`/organizer/challenges/${challenge._id}/participants`} className="btn-secondary btn-sm"><Users size={14} /> Participants</Link>
                {challenge.status !== 'closed' ? (
                  <Button variant="ghost" size="sm" loading={busyId === challenge._id} onClick={() => close(challenge)}><Lock size={14} /> Close</Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

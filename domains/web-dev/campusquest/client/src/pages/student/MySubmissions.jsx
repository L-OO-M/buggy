import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { submissionsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatRelative } from '../../utils/format.js';

const tabs = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Awaiting review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Needs work' },
];

export default function MySubmissions() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refresh } = useApi(
    () => submissionsApi.mine({ status: status || undefined, page, limit: 10 }),
    [status, page],
  );

  return (
    <div>
      <PageHeader
        eyebrow="My activity"
        title="Challenge submissions"
        description="Track evidence, review feedback, and resubmit when a challenge allows it."
        actions={<Link to="/challenges" className="btn-primary"><ClipboardList size={16} /> Find a challenge</Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" className={`chip ${status === tab.key ? 'chip-active' : ''}`} onClick={() => { setStatus(tab.key); setPage(1); }}>{tab.label}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState icon={ClipboardList} title="No submissions in this view" description="Join a challenge, complete the requirements, and submit evidence to start your trail." action={<Link to="/challenges" className="btn-primary">Explore challenges</Link>} />
      ) : null}

      <div className="space-y-3">
        {data?.map((submission) => (
          <Card key={submission._id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={submission.status} />
                  <span className="text-[11px] text-ink-400">Attempt {submission.attempt} · {formatRelative(submission.createdAt)}</span>
                  {submission.team ? <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{submission.team.name}</span> : null}
                </div>
                <Link to={`/challenges/${submission.challenge?._id}`} className="mt-1.5 block font-display text-base font-bold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
                  {submission.challenge?.title}
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-ink-600 dark:text-ink-300">{submission.evidence?.note}</p>
                {submission.evidence?.url ? (
                  <a href={submission.evidence.url} target="_blank" rel="noreferrer" className="link mt-1 inline-flex items-center gap-1 text-xs">
                    View evidence <ExternalLink size={12} />
                  </a>
                ) : null}
                {submission.feedback ? (
                  <div className={`mt-3 rounded-lg p-3 text-xs ${submission.status === 'rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300' : 'bg-ink-50 text-ink-600 dark:bg-white/5 dark:text-ink-300'}`}>
                    <p className="font-semibold">Organizer feedback</p>
                    <p className="mt-0.5">{submission.feedback}</p>
                  </div>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-400">Reward on approval</p>
                <p className="font-display text-lg font-bold text-amber-600 dark:text-amber-300">{submission.challenge?.rewardPoints} pts</p>
                {submission.status === 'rejected' && submission.challenge?.allowResubmission ? (
                  <Link to={`/challenges/${submission.challenge._id}`} className="btn-secondary btn-sm mt-2">Resubmit</Link>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />
      {!loading && data?.length ? <div className="mt-4 text-center"><Button variant="ghost" size="sm" onClick={refresh}>Refresh status</Button></div> : null}
    </div>
  );
}

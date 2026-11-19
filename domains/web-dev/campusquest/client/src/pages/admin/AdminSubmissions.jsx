import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileSearch } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import {
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDateTime } from '../../utils/format.js';

const statuses = ['', 'pending', 'approved', 'rejected'];

export default function AdminSubmissions() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refresh } = useApi(() => adminApi.submissions({ status: status || undefined, page, limit: 20 }), [status, page]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Submission monitor" description="Read-only oversight of every challenge submission across the platform. Organizers make the decisions." />
      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((option) => (
          <button key={option || 'all'} type="button" className={`chip ${status === option ? 'chip-active' : ''}`} onClick={() => { setStatus(option); setPage(1); }}>{option || 'All'}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={FileSearch} title="No submissions match these filters" /> : null}

      <div className="space-y-3">
        {data?.map((submission) => (
          <Card key={submission._id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/challenges/${submission.challenge?._id}`} className="font-display text-sm font-bold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">{submission.challenge?.title}</Link>
              <StatusBadge status={submission.status} />
              {submission.team ? <span className="badge bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">{submission.team.name}</span> : null}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-ink-400">
              <Avatar name={submission.submittedBy?.name} size={24} />
              <span>{submission.submittedBy?.name} · {submission.submittedBy?.email} · {formatDateTime(submission.createdAt)}</span>
            </div>
            <div className="mt-2 rounded-xl bg-ink-50 p-3 dark:bg-white/5">
              <p className="whitespace-pre-wrap text-xs text-ink-600 dark:text-ink-300">{submission.evidence?.note}</p>
              {submission.evidence?.url ? <a href={submission.evidence.url} target="_blank" rel="noreferrer" className="link mt-1 inline-flex items-center gap-1 text-[11px]"><ExternalLink size={11} /> Evidence link</a> : null}
            </div>
            {submission.feedback ? <p className="mt-2 text-xs italic text-ink-500 dark:text-ink-400">Organizer feedback: {submission.feedback}</p> : null}
            {submission.status === 'approved' ? <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">{submission.pointsAwarded} points awarded</p> : null}
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

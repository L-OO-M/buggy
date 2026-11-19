import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ClipboardList, ExternalLink, RotateCcw, X } from 'lucide-react';
import { submissionsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { formatRelative, titleCase } from '../../utils/format.js';

const tabs = ['pending', 'approved', 'rejected'];

export default function ReviewSubmissions() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, meta, loading, error, refresh } = useApi(() => submissionsApi.reviewQueue({ status, page, limit: 15 }), [status, page]);

  const openAction = (submission, decision) => {
    setAction({ submission, decision });
    setFeedback(decision === 'approved' ? '' : "Please explain what evidence is missing so the student can improve.");
  };

  const submit = async () => {
    if (!action) return;
    if (action.decision === 'rejected' && feedback.trim().length < 5) {
      toast.error('Rejection feedback needs at least 5 characters.');
      return;
    }
    setBusy(true);
    try {
      await submissionsApi.review(action.submission._id, { decision: action.decision, feedback });
      toast.success(action.decision === 'approved' ? 'Submission approved. Points awarded.' : 'Submission rejected with feedback.');
      setAction(null);
      setFeedback('');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (submission) => {
    setBusy(true);
    try {
      await submissionsApi.revoke(submission._id, 'Approval revoked after organizer review.');
      toast.info('Approval revoked. Points and achievements reconciled.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Organizer"
        title="Submission review"
        description="Approve strong evidence, reject with actionable feedback, and revoke approvals when needed."
        actions={<Link to="/organizer/challenges" className="btn-secondary"><ClipboardList size={15} /> Challenges</Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab} type="button" className={`chip ${status === tab ? 'chip-active' : ''}`} onClick={() => { setStatus(tab); setPage(1); }}>
            {titleCase(tab)}
          </button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={ClipboardList} title={`No ${status} submissions`} description={status === 'pending' ? 'You are all caught up.' : 'Submissions will appear here after review.'} /> : null}

      <div className="space-y-3">
        {data?.map((submission) => (
          <Card key={submission._id} className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/challenges/${submission.challenge?._id}`} className="font-display text-base font-bold text-ink-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-300">{submission.challenge?.title}</Link>
                  <StatusBadge status={submission.status} />
                  {submission.team ? <span className="badge bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">{submission.team.name} · {submission.team.membersCount} members</span> : null}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar name={submission.submittedBy?.name} src={submission.submittedBy?.avatarUrl} size={28} />
                  <p className="text-xs text-ink-500 dark:text-ink-400">{submission.submittedBy?.name} · attempt {submission.attempt} · {formatRelative(submission.createdAt)}</p>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-ink-50 p-3 text-sm text-ink-700 dark:bg-white/5 dark:text-ink-200">{submission.evidence?.note}</p>
                {submission.evidence?.url ? (
                  <a href={submission.evidence.url} target="_blank" rel="noreferrer" className="link mt-2 inline-flex items-center gap-1 text-xs"><ExternalLink size={12} /> Open evidence link</a>
                ) : null}
                {submission.feedback ? <p className="mt-2 text-xs italic text-ink-500 dark:text-ink-400">Feedback: {submission.feedback}</p> : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                {submission.status === 'pending' ? (
                  <>
                    <Button size="sm" onClick={() => openAction(submission, 'approved')}><Check size={14} /> Approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => openAction(submission, 'rejected')}><X size={14} /> Reject</Button>
                  </>
                ) : null}
                {submission.status === 'approved' ? (
                  <Button size="sm" variant="danger" loading={busy} onClick={() => revoke(submission)}><RotateCcw size={14} /> Revoke</Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={action?.decision === 'approved' ? 'Approve submission' : 'Reject submission'}
        description={action?.decision === 'approved' ? `Award ${action.submission.challenge?.rewardPoints} points to each recipient and mark the challenge complete.` : 'The student will see this feedback and can resubmit if the challenge allows it.'}
        footer={<><Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button><Button variant={action?.decision === 'approved' ? 'primary' : 'danger'} loading={busy} onClick={submit}>{action?.decision === 'approved' ? 'Approve' : 'Reject'}</Button></>}
      >
        <Textarea label={action?.decision === 'approved' ? 'Note (optional)' : 'Feedback'} value={feedback} onChange={(event) => setFeedback(event.target.value)} required={action?.decision === 'rejected'} />
      </Modal>
    </div>
  );
}

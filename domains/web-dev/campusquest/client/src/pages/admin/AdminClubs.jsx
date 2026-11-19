import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShieldCheck, X } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
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
import { formatDate } from '../../utils/format.js';

const statuses = ['pending', 'approved', 'rejected'];

export default function AdminClubs() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, meta, loading, error, refresh } = useApi(() => adminApi.clubs({ status, page, limit: 20 }), [status, page]);

  const review = async (club, decision, rejectionReason) => {
    setBusy(true);
    try {
      await adminApi.reviewClub(club._id, decision, rejectionReason);
      toast.success(decision === 'approved' ? `${club.name} is now live.` : `${club.name} rejected.`);
      setRejecting(null);
      setReason('');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Club approvals" description="Review new clubs before they appear in discovery. Organizers are notified of every decision." />
      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((option) => (
          <button key={option} type="button" className={`chip ${status === option ? 'chip-active' : ''}`} onClick={() => { setStatus(option); setPage(1); }}>{option}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={ShieldCheck} title={`No ${status} clubs`} description="Nothing needs your attention here." /> : null}

      <div className="space-y-3">
        {data?.map((club) => (
          <Card key={club._id} className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" /> : <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 font-display text-xl font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{club.name.slice(0, 1)}</span>}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{club.name}</h3>
                    <StatusBadge status={club.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-400">Organizer {club.organizer?.name} · {club.organizer?.email} · requested {formatDate(club.createdAt)}</p>
                  <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-300">{club.tagline || club.description}</p>
                  {club.rejectionReason ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">Reason: {club.rejectionReason}</p> : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {club.status === 'approved' ? <Link to={`/clubs/${club.slug}`} className="btn-secondary btn-sm">View public page</Link> : null}
                {club.status !== 'approved' ? <Button size="sm" loading={busy} onClick={() => review(club, 'approved')}><Check size={14} /> Approve</Button> : null}
                {club.status !== 'rejected' ? <Button size="sm" variant="secondary" onClick={() => setRejecting(club)}><X size={14} /> Reject</Button> : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={Boolean(rejecting)}
        onClose={() => setRejecting(null)}
        title="Reject club"
        description="The organizer will receive this reason in their notifications."
        footer={<><Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" loading={busy} onClick={() => review(rejecting, 'rejected', reason)}>Reject club</Button></>}
      >
        <Textarea label="Rejection reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
      </Modal>
    </div>
  );
}

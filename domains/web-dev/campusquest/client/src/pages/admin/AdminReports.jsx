import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldQuestion } from 'lucide-react';
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
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { formatDate, titleCase } from '../../utils/format.js';

const statuses = ['open', 'reviewing', 'resolved', 'dismissed'];

export default function AdminReports() {
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [resolving, setResolving] = useState(null);
  const [decision, setDecision] = useState('resolved');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, meta, loading, error, refresh } = useApi(() => adminApi.reports({ status, page, limit: 20 }), [status, page]);

  const resolve = async () => {
    if (!resolving) return;
    setBusy(true);
    try {
      await adminApi.resolveReport(resolving._id, { status: decision, resolutionNote: note });
      toast.success(`Report ${decision}.`);
      setResolving(null);
      setNote('');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const targetLink = (report) => {
    if (report.targetType === 'user') return `/profile/${report.targetId}`;
    if (report.targetType === 'event') return `/events/${report.targetId}`;
    if (report.targetType === 'challenge') return `/challenges/${report.targetId}`;
    return null;
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Reports" description="Triage reports from students and organizers. Close the loop with a clear resolution note." />
      <div className="mb-5 flex flex-wrap gap-2">
        {statuses.map((option) => (
          <button key={option} type="button" className={`chip ${status === option ? 'chip-active' : ''}`} onClick={() => { setStatus(option); setPage(1); }}>{option}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={ShieldQuestion} title={`No ${status} reports`} description="The queue is clear." /> : null}

      <div className="space-y-3">
        {data?.map((report) => {
          const link = targetLink(report);
          return (
            <Card key={report._id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <p className="text-sm font-bold text-ink-900 dark:text-white">{report.reason}</p>
                    <StatusBadge status={report.status} />
                    <span className="badge bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300">{titleCase(report.targetType)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">Reported by {report.reporter?.name} ({report.reporter?.email}) · {formatDate(report.createdAt)}</p>
                  {report.details ? <p className="mt-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-600 dark:bg-white/5 dark:text-ink-300">{report.details}</p> : null}
                  {report.resolutionNote ? <p className="mt-2 text-xs italic text-ink-500 dark:text-ink-400">Resolution: {report.resolutionNote}</p> : null}
                  <p className="mt-1 break-all text-[10px] text-ink-400">Target ID: {report.targetId}{link ? <Link to={link} className="link ml-2 inline-flex items-center gap-0.5">Open <ExternalLink size={10} /></Link> : null}</p>
                </div>
                {['open', 'reviewing'].includes(report.status) ? (
                  <Button size="sm" variant="secondary" onClick={() => { setResolving(report); setDecision('resolved'); setNote(''); }}><CheckCircle2 size={14} /> Resolve</Button>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={Boolean(resolving)}
        onClose={() => setResolving(null)}
        title="Resolve report"
        description={resolving?.reason}
        footer={<><Button variant="secondary" onClick={() => setResolving(null)}>Cancel</Button><Button loading={busy} onClick={resolve}>Save decision</Button></>}
      >
        <div className="space-y-4">
          <Select label="Decision" value={decision} onChange={(event) => setDecision(event.target.value)}>
            <option value="reviewing">Mark as reviewing</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </Select>
          <Textarea label="Resolution note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What action did you take?" />
        </div>
      </Modal>
    </div>
  );
}

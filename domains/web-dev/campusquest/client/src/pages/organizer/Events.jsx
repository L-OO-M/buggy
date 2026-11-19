import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Edit3, MapPin, Plus, QrCode, Users, XCircle } from 'lucide-react';
import { eventsApi } from '../../api/index.js';
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
import { formatDateTime } from '../../utils/format.js';
import { EVENT_STATUS_OPTIONS } from '../../utils/constants.js';

export default function OrganizerEvents() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, meta, loading, error, refresh } = useApi(() => eventsApi.mine({ page, limit: 12, status: status || undefined }), [page, status]);

  const cancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try {
      await eventsApi.cancel(cancelling._id, reason || 'Cancelled by organizer');
      toast.success('Event cancelled and attendees notified.');
      setCancelling(null);
      setReason('');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (event) => {
    try {
      await eventsApi.update(event._id, { status: event.status === 'published' ? 'draft' : 'published' });
      toast.success(event.status === 'published' ? 'Event moved to draft.' : 'Event published.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Organizer"
        title="Events"
        description="Draft, publish, and operate your campus events from one workspace."
        actions={<Link to="/organizer/events/new" className="btn-primary"><Plus size={15} /> New event</Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" className={`chip ${!status ? 'chip-active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>All</button>
        {EVENT_STATUS_OPTIONS.map((option) => (
          <button key={option} type="button" className={`chip ${status === option ? 'chip-active' : ''}`} onClick={() => { setStatus(option); setPage(1); }}>{option}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={CalendarDays} title="No events here" description="Start with a draft, then publish when the details are ready." action={<Link to="/organizer/events/new" className="btn-primary btn-sm">Create event</Link>} /> : null}

      <div className="space-y-3">
        {data?.map((event) => (
          <Card key={event._id} className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {event.coverUrl ? <img src={event.coverUrl} alt="" className="h-20 w-full rounded-xl object-cover sm:w-32" /> : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{event.title}</h3>
                  <StatusBadge status={event.status} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                  <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {formatDateTime(event.startDate)}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={12} /> {event.venue}</span>
                  <span className="inline-flex items-center gap-1"><Users size={12} /> {event.registrationCount}/{event.capacity} registered</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/organizer/events/${event._id}/edit`} className="btn-secondary btn-sm"><Edit3 size={14} /> Edit</Link>
                <Link to="/organizer/attendance" className="btn-secondary btn-sm"><QrCode size={14} /> Desk</Link>
                <Button variant="ghost" size="sm" onClick={() => togglePublish(event)}>
                  {event.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                {event.status !== 'cancelled' ? (
                  <Button variant="ghost" size="sm" className="text-rose-600 dark:text-rose-300" onClick={() => setCancelling(event)}><XCircle size={14} /> Cancel</Button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        title="Cancel event?"
        description="Every registered attendee will receive a cancellation notification."
        footer={<><Button variant="secondary" onClick={() => setCancelling(null)}>Keep event</Button><Button variant="danger" loading={busy} onClick={cancel}>Cancel event</Button></>}
      >
        <Textarea label="Reason shared with attendees" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Venue issue, weather, scheduling conflict..." />
      </Modal>
    </div>
  );
}

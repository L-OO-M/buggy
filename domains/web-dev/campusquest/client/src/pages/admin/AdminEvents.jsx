import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ExternalLink, MessageSquare, Search, XCircle } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function AdminEvents() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [noteTarget, setNoteTarget] = useState(null);
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState(null);
  const search = useDebounced(q, 300);
  const { data, meta, loading, error, refresh } = useApi(() => adminApi.events({ status: status || undefined, q: search || undefined, page, limit: 20 }), [status, search, page]);

  const moderate = async (event, nextStatus) => {
    setBusyId(event._id);
    try {
      await adminApi.moderateEvent(event._id, { status: nextStatus });
      toast.success(`Event moved to ${nextStatus}.`);
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusyId(null);
    }
  };

  const saveNote = async () => {
    if (!noteTarget) return;
    setBusyId(noteTarget._id);
    try {
      await adminApi.moderateEvent(noteTarget._id, { moderationNote: note });
      toast.success('Moderation note saved.');
      setNoteTarget(null);
      setNote('');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Event moderation" description="Take down unsafe or misleading events and leave an auditable moderation note." />
      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} className="input pl-9" placeholder="Search event title" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`chip ${!status ? 'chip-active' : ''}`} onClick={() => { setStatus(''); setPage(1); }}>All</button>
            {['draft', 'published', 'cancelled'].map((option) => (
              <button key={option} type="button" className={`chip ${status === option ? 'chip-active' : ''}`} onClick={() => { setStatus(option); setPage(1); }}>{option}</button>
            ))}
          </div>
        </div>
      </Card>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? <EmptyState icon={CalendarDays} title="No events match these filters" /> : null}

      <div className="space-y-2">
        {data?.map((event) => (
          <Card key={event._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-display text-sm font-bold text-ink-900 dark:text-white">{event.title}</h3>
                <StatusBadge status={event.status} />
              </div>
              <p className="text-xs text-ink-400">{event.organizer?.name} · {formatDateTime(event.startDate)} · {event.venue} · {event.registrationCount}/{event.capacity}</p>
              {event.moderationNote ? <p className="mt-1 text-xs italic text-amber-600 dark:text-amber-300">Note: {event.moderationNote}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/events/${event._id}`} className="btn-secondary btn-sm"><ExternalLink size={13} /> View</Link>
              <Button size="sm" variant="ghost" onClick={() => { setNoteTarget(event); setNote(event.moderationNote || ''); }}><MessageSquare size={13} /> Note</Button>
              {event.status === 'published' ? <Button size="sm" variant="danger" loading={busyId === event._id} onClick={() => moderate(event, 'cancelled')}><XCircle size={13} /> Take down</Button> : <Button size="sm" variant="secondary" loading={busyId === event._id} onClick={() => moderate(event, 'published')}>Publish</Button>}
            </div>
          </Card>
        ))}
      </div>
      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={Boolean(noteTarget)}
        onClose={() => setNoteTarget(null)}
        title="Moderation note"
        description={noteTarget?.title}
        footer={<><Button variant="secondary" onClick={() => setNoteTarget(null)}>Cancel</Button><Button loading={busyId === noteTarget?._id} onClick={saveNote}>Save note</Button></>}
      >
        <Input label="Internal note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why this event needs attention..." />
      </Modal>
    </div>
  );
}

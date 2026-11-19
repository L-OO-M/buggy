import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, MapPin, QrCode, Ticket, XCircle } from 'lucide-react';
import { registrationsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDate, formatDateTime } from '../../utils/format.js';

const tabs = [
  { key: '', label: 'All' },
  { key: 'registered', label: 'Upcoming' },
  { key: 'checked_in', label: 'Attended' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function MyRegistrations() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refresh } = useApi(
    () => registrationsApi.mine({ status: status || undefined, page, limit: 10 }),
    [status, page],
  );
  const [busy, setBusy] = useState(null);

  const cancel = async (eventId) => {
    setBusy(eventId);
    try {
      await registrationsApi.cancel(eventId);
      toast.info('Registration cancelled.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="My activity"
        title="Event registrations"
        description="Everything you signed up for, with check-in status and quick actions."
        actions={<Link to="/events" className="btn-primary"><CalendarDays size={16} /> Find events</Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" className={`chip ${status === tab.key ? 'chip-active' : ''}`} onClick={() => { setStatus(tab.key); setPage(1); }}>
            {tab.label}
          </button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState icon={Ticket} title="No registrations here" description="When you register for an event it will show up in this list." action={<Link to="/events" className="btn-primary">Browse events</Link>} />
      ) : null}

      {!loading && data?.length ? (
        <div className="space-y-3">
          {data.map((registration) => {
            const event = registration.event;
            if (!event) return null;
            return (
              <Card key={registration._id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    <span className="text-[10px] font-bold uppercase">{formatDate(event.startDate, { month: 'short' })}</span>
                    <span className="font-display text-lg font-bold leading-none">{new Date(event.startDate).getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={event.category} />
                      <StatusBadge status={registration.status} />
                      {event.status === 'cancelled' ? <StatusBadge status="cancelled" /> : null}
                    </div>
                    <Link to={`/events/${event._id}`} className="mt-1.5 block truncate font-display text-base font-bold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">
                      {event.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                      <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatDateTime(event.startDate)}</span>
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {event.venue}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {registration.status === 'checked_in' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-mint/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 size={14} /> Checked in
                      </span>
                    ) : registration.status === 'registered' ? (
                      <>
                        <Link to={`/checkin?event=${event._id}`} className="btn-secondary btn-sm"><QrCode size={14} /> Check in</Link>
                        <Button variant="ghost" size="sm" loading={busy === event._id} onClick={() => cancel(event._id)}>
                          <XCircle size={14} /> Cancel
                        </Button>
                      </>
                    ) : null}
                    <Link to={`/events/${event._id}`} className="btn-secondary btn-sm">Details</Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

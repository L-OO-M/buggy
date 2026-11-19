import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flag,
  MapPin,
  QrCode,
  ShieldCheck,
  Ticket,
  Users,
  Zap,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import { eventsApi, registrationsApi, reportsApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorState,
  InfoRow,
  Input,
  Modal,
  ProgressBar,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { formatDate, formatDateTime, percent } from '../../utils/format.js';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => eventsApi.get(id), [id]);
  const [busy, setBusy] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInToken, setCheckInToken] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ reason: '', details: '' });

  const event = data?.event;
  const registration = data?.registration;
  const siteBase = `${window.location.origin}/checkin?event=${id}`;

  const register = async () => {
    if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
    setBusy(true);
    try {
      await registrationsApi.register(id);
      toast.success('Registration confirmed. You earned 5 points.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    setBusy(true);
    try {
      await registrationsApi.cancel(id);
      toast.info('Registration cancelled.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const checkIn = async () => {
    if (!checkInToken.trim()) return toast.warning('Paste the check-in code from the organizer QR.');
    setBusy(true);
    try {
      await registrationsApi.checkIn(checkInToken.trim());
      toast.success('Checked in. Points added to your account.');
      setCheckInOpen(false);
      setCheckInToken('');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async () => {
    if (report.reason.trim().length < 3) return toast.warning('Add a short reason.');
    setBusy(true);
    try {
      await reportsApi.create({ targetType: 'event', targetId: id, reason: report.reason, details: report.details });
      toast.success('Report sent to campus admins.');
      setReportOpen(false);
      setReport({ reason: '', details: '' });
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !event) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState error={error} onRetry={refresh} /></div>;
  }

  const isCheckedIn = data?.attendance || registration?.status === 'checked_in';
  const isRegistered = registration && registration.status !== 'cancelled';
  const canManage = user && (user.role === 'admin' || String(event.organizer?._id) === String(user._id) || String(event.club?.organizer) === String(user._id));
  const fill = percent(event.registrationCount, event.capacity);
  const ended = new Date(event.endDate) < new Date();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="surface overflow-hidden">
        <div className="relative h-56 bg-gradient-to-br from-brand-600 via-indigo-600 to-fuchsia-600 sm:h-72">
          <div className="absolute inset-0 hero-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
            <div className="flex flex-wrap gap-2">
              <CategoryBadge category={event.category} />
              <StatusBadge status={event.status} />
            </div>
            <h1 className="mt-3 max-w-3xl font-display text-2xl font-extrabold text-white sm:text-4xl">{event.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} /> {formatDate(event.startDate, { weekday: 'long' })}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {formatDate(event.startDate, { hour: 'numeric', minute: '2-digit' })}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={15} /> {event.venue}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">About this event</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-600 dark:text-ink-300">{event.description}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Host</p>
                <div className="mt-2 flex items-center gap-2.5">
                  <Avatar name={event.organizer?.name} src={event.organizer?.avatarUrl} size={34} />
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{event.organizer?.name}</p>
                    <p className="text-xs text-ink-400">{event.club?.name || 'Campus organizer'}</p>
                  </div>
                </div>
              </div>
              <div className="surface-muted p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Reward</p>
                <p className="mt-2 inline-flex items-center gap-1.5 font-display text-xl font-bold text-amber-600 dark:text-amber-300">
                  <Zap size={18} /> {event.points} points
                </p>
                <p className="mt-0.5 text-xs text-ink-400">Awarded on verified check-in</p>
              </div>
            </div>

            <div className="mt-7">
              <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Event details</h2>
              <div className="mt-2">
                <InfoRow label="Starts">{formatDateTime(event.startDate)}</InfoRow>
                <InfoRow label="Ends">{formatDateTime(event.endDate)}</InfoRow>
                <InfoRow label="Venue">{event.venue}</InfoRow>
                <InfoRow label="Category">{event.category}</InfoRow>
                <InfoRow label="Capacity">{event.registrationCount} of {event.capacity} seats claimed</InfoRow>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {user ? (
                <Button variant="ghost" onClick={() => setReportOpen(true)}><Flag size={15} /> Report event</Button>
              ) : null}
              {canManage ? (
                <>
                  <Link to="/organizer/events" className="btn-secondary"><ShieldCheck size={15} /> Manage event</Link>
                  <Link to="/organizer/attendance" className="btn-secondary"><QrCode size={15} /> Check-in desk</Link>
                </>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Registration</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500"><Users size={13} /> {event.registrationCount}/{event.capacity}</span>
              </div>
              <ProgressBar value={fill} className="mt-3" tone={fill >= 90 ? 'danger' : fill >= 65 ? 'warning' : 'brand'} />
              <p className="mt-2 text-xs text-ink-400">{Math.max(0, event.capacity - event.registrationCount)} seats left</p>

              <div className="mt-5 space-y-2">
                {!user ? (
                  <Link to="/login" state={{ from: `/events/${id}` }} className="btn-primary w-full">Sign in to register</Link>
                ) : isCheckedIn ? (
                  <div className="rounded-xl bg-mint/15 p-3 text-center">
                    <CheckCircle2 size={20} className="mx-auto text-emerald-600 dark:text-emerald-300" />
                    <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-200">Checked in</p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-300/70">{formatDateTime(data.attendance?.checkedInAt || registration?.checkedInAt)}</p>
                  </div>
                ) : ended ? (
                  <p className="rounded-xl bg-ink-100 p-3 text-center text-sm text-ink-500 dark:bg-white/5 dark:text-ink-400">This event has ended.</p>
                ) : isRegistered ? (
                  <>
                    <Button variant="secondary" className="w-full" onClick={() => setCheckInOpen(true)}>
                      <QrCode size={16} /> Check in with code
                    </Button>
                    <Button variant="ghost" className="w-full text-rose-600 dark:text-rose-300" loading={busy} onClick={cancel}>
                      Cancel registration
                    </Button>
                  </>
                ) : (
                  <Button className="w-full" loading={busy} onClick={register} disabled={event.status !== 'published' || fill >= 100}>
                    <Ticket size={16} /> {event.status !== 'published' ? 'Registration closed' : fill >= 100 ? 'Event full' : 'Register for this event'}
                  </Button>
                )}
              </div>
              {registration ? (
                <p className="mt-3 text-center text-[11px] text-ink-400">
                  Your status: <StatusBadge status={registration.status} />
                </p>
              ) : null}
            </Card>

            <div className="surface-muted p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-ink-600 dark:text-ink-300"><QrCode size={14} /> Have a check-in code?</p>
              <p className="mt-1 text-xs text-ink-400">Organizers display a QR at the door. Scan or paste the code after registering.</p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setCheckInOpen(true)} disabled={!isRegistered || isCheckedIn}>
                Enter check-in code
              </Button>
            </div>
          </div>
        </div>
      </div>

      {!event ? (
        <EmptyState title="Event unavailable" />
      ) : null}

      <Modal
        open={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        title="Event check-in"
        description="Paste the code from the organizer's QR screen. Codes are signed and expire after the event."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCheckInOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={checkIn}>Confirm check-in</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Check-in code" value={checkInToken} onChange={(event) => setCheckInToken(event.target.value)} placeholder="eyJldmVudElk..." />
          <div className="rounded-xl border border-dashed border-ink-200 p-3 text-xs text-ink-500 dark:border-white/10 dark:text-ink-400">
            <p className="font-semibold text-ink-700 dark:text-ink-200">Demo shortcut</p>
            <p className="mt-1">Open the organizer attendance desk in another browser as the host to copy a live code, or load this demo check-in link:</p>
            <Link className="link mt-1 block break-all" to={`/checkin?event=${id}`}>{siteBase}</Link>
          </div>
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this event"
        description="Reports go to campus admins. Use this for misleading listings, safety concerns, or policy issues."
        footer={
          <>
            <Button variant="secondary" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={submitReport}>Send report</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Reason" value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })} placeholder="Misleading venue information" />
          <Textarea label="Details" value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} placeholder="What should the admin know?" />
        </div>
      </Modal>
    </div>
  );
}

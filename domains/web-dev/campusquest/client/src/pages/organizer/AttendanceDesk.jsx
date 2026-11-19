import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Copy, Link2, QrCode, RefreshCw, Search, ToggleLeft, ToggleRight, UserCheck } from 'lucide-react';
import { eventsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  SectionHeader,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDateTime } from '../../utils/format.js';

export default function AttendanceDesk() {
  const toast = useToast();
  const { data: events, loading: eventsLoading, error: eventsError, refresh: refreshEvents } = useApi(() => eventsApi.mine({ limit: 100 }), []);
  const [selectedId, setSelectedId] = useState('');
  const [code, setCode] = useState(null);
  const [participants, setParticipants] = useState(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');

  const selected = useMemo(() => events?.find((event) => event._id === selectedId), [events, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    setCode(null);
    setParticipants(null);
    Promise.all([eventsApi.checkInCode(selectedId), eventsApi.participants(selectedId)])
      .then(([codeResult, participantResult]) => {
        setCode(codeResult);
        setParticipants(participantResult);
      })
      .catch((error) => toast.error(error.friendlyMessage));
  }, [selectedId, toast]);

  const rotate = async () => {
    setBusy(true);
    try {
      const result = await eventsApi.rotateCheckInCode(selectedId);
      const codeResult = await eventsApi.checkInCode(selectedId);
      setCode({ ...codeResult, ...result });
      toast.success('QR code rotated. Old codes no longer work.');
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const toggleOpen = async () => {
    setBusy(true);
    try {
      await eventsApi.checkInSettings(selectedId, { open: !code?.checkInOpen });
      const result = await eventsApi.checkInCode(selectedId);
      setCode((current) => ({ ...current, ...result }));
      toast.success(result.checkInOpen ? 'Check-in desk is open.' : 'Check-in desk is paused.');
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!code?.checkInUrl) return;
    try {
      await navigator.clipboard.writeText(code.checkInUrl);
      toast.success('Check-in link copied.');
    } catch {
      toast.error('Could not copy. Select the link manually.');
    }
  };

  const manualCheckIn = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await eventsApi.manualCheckIn(selectedId, { email: email.trim() });
      toast.success('Manual check-in recorded.');
      setEmail('');
      const result = await eventsApi.participants(selectedId);
      setParticipants(result);
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (eventsLoading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (eventsError) return <ErrorState error={eventsError} onRetry={refreshEvents} />;

  const filtered = (participants?.participants || []).filter((entry) => {
    const term = search.toLowerCase();
    return !term || entry.user?.name?.toLowerCase().includes(term) || entry.user?.email?.toLowerCase().includes(term);
  });
  const checkedIn = participants?.participants?.filter((entry) => entry.checkedInAt || entry.status === 'checked_in').length || 0;

  return (
    <div>
      <PageHeader eyebrow="Organizer" title="Check-in desk" description="Display the live QR code, rotate it if it leaks, and manually check in late arrivals." />

      <Card className="mb-6">
        <SectionHeader title="Choose an event" description="Only events you manage appear here." />
        {events?.length ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <button
                key={event._id}
                type="button"
                onClick={() => setSelectedId(event._id)}
                className={`rounded-xl border p-3 text-left transition ${selectedId === event._id ? 'border-brand-400 bg-brand-50 dark:border-brand-400/50 dark:bg-brand-500/10' : 'border-ink-100 hover:border-brand-200 dark:border-white/10'}`}
              >
                <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{event.title}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{formatDateTime(event.startDate)} · {event.registrationCount} registered</p>
              </button>
            ))}
          </div>
        ) : <EmptyState icon={QrCode} title="No events to manage" description="Create and publish an event first." />}
      </Card>

      {selected ? (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Live check-in</p>
                  <p className="font-display text-lg font-bold text-ink-900 dark:text-white">{selected.title}</p>
                </div>
                <StatusBadge status={code?.checkInOpen ? 'active' : 'closed'} />
              </div>

              {code ? (
                <>
                  <div className="mt-4 rounded-2xl bg-white p-4 shadow-inner">
                    <QRCodeSVG value={code.token} size={264} level="M" className="mx-auto h-auto w-full max-w-[264px]" />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-ink-400">Version {code.version} · students scan with the CampusQuest scanner</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={copy}><Copy size={14} /> Copy link</Button>
                    <Button variant="secondary" size="sm" loading={busy} onClick={rotate}><RefreshCw size={14} /> Rotate</Button>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-1 w-full" loading={busy} onClick={toggleOpen}>
                    {code.checkInOpen ? <ToggleRight size={16} /> : <ToggleLeft size={16} />} {code.checkInOpen ? 'Pause check-in' : 'Open check-in'}
                  </Button>
                  <div className="mt-3 rounded-xl bg-ink-50 p-3 dark:bg-white/5">
                    <p className="break-all text-[10px] text-ink-400">{code.checkInUrl}</p>
                  </div>
                </>
              ) : <div className="mt-4"><Skeleton className="aspect-square w-full" /></div>}
            </Card>

            <Card>
              <SectionHeader title="Manual check-in" />
              <form onSubmit={manualCheckIn} className="space-y-3">
                <Input label="Student email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@campusquest.dev" required />
                <Button type="submit" loading={busy} className="w-full"><UserCheck size={15} /> Check in student</Button>
              </form>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Registered</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{participants?.participants.length ?? '—'}</p></Card>
              <Card className="p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Checked in</p><p className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-300">{checkedIn}</p></Card>
              <Card className="p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Remaining</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{participants ? participants.participants.length - checkedIn : '—'}</p></Card>
            </div>

            <Card>
              <SectionHeader title="Attendance roster" action={<span className="text-xs text-ink-400">{checkedIn}/{participants?.participants.length || 0} present</span>} />
              <div className="relative mb-3">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input className="input pl-9" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              {filtered.length ? (
                <div className="max-h-[480px] divide-y divide-ink-100 overflow-y-auto scrollbar-thin dark:divide-white/5">
                  {filtered.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 py-2.5">
                      <Avatar name={entry.user?.name} src={entry.user?.avatarUrl} size={34} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{entry.user?.name}</p>
                        <p className="truncate text-[11px] text-ink-400">{entry.user?.email}</p>
                      </div>
                      {entry.checkedInAt ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300"><CheckCircle2 size={13} /> {formatDateTime(entry.checkedInAt)}</span>
                      ) : entry.status === 'cancelled' ? (
                        <StatusBadge status="cancelled" />
                      ) : (
                        <span className="text-[11px] text-ink-400">Not checked in</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : <EmptyState icon={UserCheck} title="No matching attendees" />}
            </Card>

            <p className="flex items-center gap-1.5 text-[11px] text-ink-400"><Link2 size={12} /> The QR token is signed and versioned. Rotating invalidates every previously printed code.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

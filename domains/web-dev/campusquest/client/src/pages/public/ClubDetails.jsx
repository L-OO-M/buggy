import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag, Settings, Users } from 'lucide-react';
import { clubsApi, reportsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ChallengeCard, EventCard } from '../../components/cards.jsx';
import {
  Avatar,
  Button,
  Card,
  CategoryBadge,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { formatDate, formatRelative } from '../../utils/format.js';

export default function ClubDetails() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => clubsApi.get(slug), [slug]);
  const [joinOpen, setJoinOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ reason: '', details: '' });
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState error={error} onRetry={refresh} /></div>;

  const { club, members = [], events = [], challenges = [], myMembership, canManage } = data;
  const member = myMembership?.status === 'approved';

  const join = async () => {
    if (!user) return navigate('/login', { state: { from: `/clubs/${slug}` } });
    setBusy(true);
    try {
      await clubsApi.join(club._id, message);
      toast.success('Membership request sent to the organizer.');
      setJoinOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await clubsApi.leave(club._id);
      toast.info('You left the club.');
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
      await reportsApi.create({ targetType: 'club', targetId: club._id, reason: report.reason, details: report.details });
      toast.success('Report sent to campus admins.');
      setReportOpen(false);
      setReport({ reason: '', details: '' });
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-3 text-sm"><ArrowLeft size={16} /> Back</button>

      <div className="surface overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-brand-600 via-indigo-600 to-fuchsia-600">
          <div className="absolute inset-0 hero-grid opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-500 to-fuchsia-500 font-display text-3xl font-extrabold text-white shadow-lg dark:border-ink-900">
                {club.name?.[0]}
              </span>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={club.category} />
                  <StatusBadge status={club.status} />
                </div>
                <h1 className="mt-1.5 font-display text-2xl font-extrabold text-ink-900 sm:text-3xl dark:text-white">{club.name}</h1>
                <p className="text-sm text-ink-500 dark:text-ink-400">{club.tagline}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage ? (
                <Link to={`/organizer/clubs/${club._id}`} className="btn-secondary"><Settings size={15} /> Manage club</Link>
              ) : null}
              {user && !member ? (
                <Button onClick={() => setJoinOpen(true)} disabled={myMembership?.status === 'pending'}>
                  {myMembership?.status === 'pending' ? 'Request pending' : 'Request to join'}
                </Button>
              ) : null}
              {member && !canManage ? (
                <Button variant="secondary" loading={busy} onClick={leave}>Leave club</Button>
              ) : null}
              {!user ? (
                <Link to="/login" state={{ from: `/clubs/${slug}` }} className="btn-primary">Sign in to join</Link>
              ) : null}
              <Button variant="ghost" onClick={() => setReportOpen(true)} aria-label="Report club"><Flag size={16} /></Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Members</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{club.membersCount}</p></div>
            <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Upcoming events</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{events.length}</p></div>
            <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Meets</p><p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{club.meetingSchedule || 'See activity feed'}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <SectionHeader title="About the club" />
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600 dark:text-ink-300">{club.description}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
              <span>Founded {formatDate(club.foundedAt)}</span>
              <span>·</span>
              <span>Organizer {club.organizer?.name}</span>
            </div>
          </Card>

          {events.length ? (
            <div>
              <SectionHeader title="Club events" description="Registered students can check in and earn points." />
              <div className="grid gap-4 sm:grid-cols-2">
                {events.map((event) => <EventCard key={event._id} event={event} />)}
              </div>
            </div>
          ) : null}

          {challenges.length ? (
            <div>
              <SectionHeader title="Club challenges" description="Individual and team missions from this club." />
              <div className="grid gap-4 sm:grid-cols-2">
                {challenges.map((challenge) => <ChallengeCard key={challenge._id} challenge={challenge} compact />)}
              </div>
            </div>
          ) : null}

          <Card>
            <SectionHeader title="Activity feed" description="The latest updates from this club." />
            {club.activity?.length ? (
              <ol className="space-y-3">
                {[...club.activity].reverse().slice(0, 8).map((entry, index) => (
                  <li key={`${entry.createdAt}-${index}`} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div>
                      <p className="text-sm text-ink-700 dark:text-ink-200">{entry.message}</p>
                      <p className="text-[11px] text-ink-400">{formatRelative(entry.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title="No club activity yet" description="Updates will appear here as the organizer publishes events and challenges." />
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeader title={`Members (${members.length})`} />
            {members.length ? (
              <ul className="space-y-3">
                {members.slice(0, 10).map((membership) => (
                  <li key={membership._id} className="flex items-center gap-3">
                    <Avatar name={membership.user?.name} src={membership.user?.avatarUrl} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{membership.user?.name}</p>
                      <p className="text-[11px] text-ink-400">{membership.role} · {membership.user?.department || 'Student'}</p>
                    </div>
                    {membership.user?._id ? <Link to={`/profile/${membership.user._id}`} className="text-[11px] font-semibold text-brand-600 dark:text-brand-300">View</Link> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-500 dark:text-ink-400">No approved members yet.</p>}
          </Card>
          <div className="surface-muted p-4 text-xs text-ink-500 dark:text-ink-400">
            <p className="flex items-center gap-1.5 font-semibold text-ink-700 dark:text-ink-200"><Users size={14} /> Membership is curated</p>
            <p className="mt-1.5">Requests are reviewed by the club organizer. You will get a notification when a decision is made.</p>
          </div>
        </div>
      </div>

      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title={`Join ${club.name}`}
        description="Tell the organizer why you want to join. Keep it short and specific."
        footer={<><Button variant="secondary" onClick={() => setJoinOpen(false)}>Cancel</Button><Button loading={busy} onClick={join}>Send request</Button></>}
      >
        <Textarea label="Message to organizer" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="I'm interested in the weekly build nights and have some React experience." />
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this club"
        footer={<><Button variant="secondary" onClick={() => setReportOpen(false)}>Cancel</Button><Button loading={busy} onClick={submitReport}>Send report</Button></>}
      >
        <div className="space-y-4">
          <Input label="Reason" value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })} placeholder="Inactive or misleading club" />
          <Textarea label="Details" value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

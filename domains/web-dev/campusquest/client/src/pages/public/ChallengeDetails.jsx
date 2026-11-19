import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Clock,
  Flag,
  Send,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import { challengesApi, reportsApi, submissionsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  CategoryBadge,
  DifficultyBadge,
  EmptyState,
  ErrorState,
  InfoRow,
  Input,
  Modal,
  SectionHeader,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { formatDate, formatDateTime, formatRelative } from '../../utils/format.js';

export default function ChallengeDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => challengesApi.get(id), [id]);
  const [joinBusy, setJoinBusy] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [evidence, setEvidence] = useState({ note: '', url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ reason: '', details: '' });

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-1/3" /><Skeleton className="h-56 w-full" /><Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState error={error} onRetry={refresh} /></div>;

  const { challenge, participation, submissions = [], team, approvedCount } = data;
  const now = new Date();
  const ended = new Date(challenge.deadline) < now || challenge.status === 'closed';
  const started = new Date(challenge.startDate) <= now;
  const pending = submissions.find((entry) => entry.status === 'pending');
  const approved = participation?.status === 'approved' || submissions.some((entry) => entry.status === 'approved');
  const canSubmit = Boolean(participation && started && !ended && !pending && !approved && challenge.status === 'published');
  const canManage = user && (user.role === 'admin' || String(challenge.organizer?._id) === String(user._id));
  const needsTeam = challenge.type === 'team';
  const fill = Math.min(100, Math.round((challenge.participationCount / challenge.maxParticipants) * 100));

  const join = async () => {
    if (!user) return navigate('/login', { state: { from: `/challenges/${id}` } });
    setJoinBusy(true);
    try {
      await challengesApi.join(id);
      toast.success('You joined the challenge. Submit evidence before the deadline.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setJoinBusy(false);
    }
  };

  const submitEvidence = async () => {
    if (evidence.note.trim().length < 10) return toast.warning('Describe your evidence in at least 10 characters.');
    setSubmitting(true);
    try {
      await submissionsApi.create({ challengeId: id, note: evidence.note, url: evidence.url });
      toast.success('Evidence submitted. An organizer will review it.');
      setSubmitOpen(false);
      setEvidence({ note: '', url: '' });
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async () => {
    if (report.reason.trim().length < 3) return toast.warning('Add a short reason.');
    setSubmitting(true);
    try {
      await reportsApi.create({ targetType: 'challenge', targetId: id, reason: report.reason, details: report.details });
      toast.success('Report sent to campus admins.');
      setReportOpen(false);
      setReport({ reason: '', details: '' });
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost mb-5 -ml-3 text-sm"><ArrowLeft size={16} /> Back</button>

      <div className="surface p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={challenge.category} />
          <DifficultyBadge difficulty={challenge.difficulty} />
          <span className="badge bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300"><Users size={12} /> {challenge.type} challenge</span>
          <StatusBadge status={challenge.status} />
        </div>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink-900 sm:text-4xl dark:text-white">{challenge.title}</h1>
        <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-relaxed text-ink-600 dark:text-ink-300">{challenge.description}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Reward</p><p className="mt-1 inline-flex items-center gap-1.5 font-display text-xl font-bold text-amber-600 dark:text-amber-300"><Trophy size={17} /> {challenge.rewardPoints} pts</p></div>
          <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Deadline</p><p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{formatDate(challenge.deadline)}</p><p className="text-[11px] text-ink-400">{ended ? 'Closed' : formatRelative(challenge.deadline)}</p></div>
          <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Participants</p><p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{challenge.participationCount} / {challenge.maxParticipants}</p><p className="text-[11px] text-ink-400">{approvedCount} approved</p></div>
          <div className="surface-muted p-4"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Resubmission</p><p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-200">{challenge.allowResubmission ? 'Allowed after rejection' : 'One attempt only'}</p></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <SectionHeader title="Completion requirements" />
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600 dark:text-ink-300">{challenge.requirements || 'Follow the challenge brief and submit clear proof of completion.'}</p>
            {challenge.evidenceHint ? (
              <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-800 dark:bg-brand-500/10 dark:text-brand-200">
                <p className="font-semibold">Evidence tips</p>
                <p className="mt-1">{challenge.evidenceHint}</p>
              </div>
            ) : null}
            <div className="mt-4">
              <InfoRow label="Opens">{formatDateTime(challenge.startDate)}</InfoRow>
              <InfoRow label="Deadline">{formatDateTime(challenge.deadline)}</InfoRow>
              <InfoRow label="Host">{challenge.organizer?.name}{challenge.club?.name ? ` · ${challenge.club.name}` : ''}</InfoRow>
              <InfoRow label="Approved completions">{approvedCount}</InfoRow>
            </div>
          </Card>

          {participationsIsTeam(team, needsTeam) ? (
            <Card>
              <SectionHeader title="Your team" description="Team challenges are submitted once per team." />
              <div className="flex items-center gap-3">
                <Avatar name={team.name} size={40} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{team.name}</p>
                  <p className="text-xs text-ink-400">{team.members?.map((member) => member.name).join(', ')}</p>
                </div>
                <Link to={`/teams/${team._id}`} className="btn-secondary btn-sm">Open team</Link>
              </div>
            </Card>
          ) : null}

          <Card>
            <SectionHeader title="Your submissions" description="Evidence and organizer feedback for this challenge." />
            {!user ? (
              <EmptyState icon={ShieldCheck} title="Sign in to participate" description="Join the challenge to track progress and submit evidence." />
            ) : submissions.length ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission._id} className="rounded-xl border border-ink-100 p-4 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusBadge status={submission.status} />
                      <span className="text-[11px] text-ink-400">Attempt {submission.attempt} · {formatRelative(submission.createdAt)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-ink-700 dark:text-ink-200">{submission.evidence?.note}</p>
                    {submission.evidence?.url ? (
                      <a href={submission.evidence.url} target="_blank" rel="noreferrer" className="link mt-1 block break-all text-xs">{submission.evidence.url}</a>
                    ) : null}
                    {submission.feedback ? (
                      <div className="mt-3 rounded-lg bg-ink-50 p-3 text-xs text-ink-600 dark:bg-white/5 dark:text-ink-300">
                        <p className="font-semibold text-ink-700 dark:text-ink-200">Organizer feedback</p>
                        <p className="mt-1">{submission.feedback}</p>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Send}
                title={participation ? 'No evidence submitted yet' : 'You have not joined this challenge'}
                description={participation ? 'Submit a note and optional link when you are ready for review.' : 'Join first, then submit proof before the deadline.'}
                action={canSubmit ? <Button onClick={() => setSubmitOpen(true)}>Submit evidence</Button> : null}
              />
            )}
            {submissions.length && canSubmit ? (
              <Button className="mt-4" onClick={() => setSubmitOpen(true)}>Submit another attempt</Button>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your status</p>
            {!user ? (
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Sign in to join and track this challenge.</p>
            ) : participation ? (
              <div className="mt-2 space-y-1.5">
                <StatusBadge status={participation.status} />
                <p className="text-xs text-ink-400">Joined {formatRelative(participation.createdAt)}</p>
                {participation.pointsAwarded ? <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">+{participation.pointsAwarded} points awarded</p> : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">Not joined yet.</p>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
              <span>{challenge.participationCount} joined</span>
              <span>{fill}% full</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-200/70 dark:bg-white/10">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${fill}%` }} />
            </div>

            <div className="mt-5 space-y-2">
              {!user ? (
                <Link to="/login" state={{ from: `/challenges/${id}` }} className="btn-primary w-full">Sign in to join</Link>
              ) : !participation ? (
                <Button className="w-full" loading={joinBusy} onClick={join} disabled={ended || !started}>
                  {ended ? 'Challenge closed' : !started ? 'Not started' : needsTeam ? 'Join with my team' : 'Join challenge'}
                </Button>
              ) : (
                <Button className="w-full" onClick={() => setSubmitOpen(true)} disabled={!canSubmit}>
                  {approved ? 'Approved — nice work' : pending ? 'Awaiting review' : ended ? 'Deadline passed' : 'Submit evidence'}
                </Button>
              )}
              {needsTeam && !team && user ? (
                <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  <AlertTriangle size={12} className="mr-1 inline" /> Create or join a team before entering this challenge.
                  <Link to="/teams" className="ml-1 font-semibold underline">Go to teams</Link>
                </p>
              ) : null}
              {canManage ? (
                <Link to="/organizer/submissions" className="btn-secondary w-full"><ShieldCheck size={15} /> Review submissions</Link>
              ) : null}
              <Button variant="ghost" className="w-full" onClick={() => setReportOpen(true)}><Flag size={15} /> Report challenge</Button>
            </div>
          </Card>

          <div className="surface-muted p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-700 dark:text-ink-200"><CalendarDays size={14} /> Timeline</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between"><span className="text-ink-400">Opened</span><span className="font-medium text-ink-700 dark:text-ink-200">{formatDate(challenge.startDate)}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-400">Closes</span><span className="font-medium text-ink-700 dark:text-ink-200">{formatDate(challenge.deadline)}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-400">Status</span><span className="font-medium text-ink-700 dark:text-ink-200">{ended ? 'Closed' : started ? 'Accepting evidence' : 'Opens soon'}</span></div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="Submit challenge evidence"
        description="Provide a clear description and an optional public link. Organizers review every submission."
        footer={<><Button variant="secondary" onClick={() => setSubmitOpen(false)}>Cancel</Button><Button loading={submitting} onClick={submitEvidence}><Send size={15} /> Submit for review</Button></>}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-600 dark:bg-white/5 dark:text-ink-300">
            <p className="flex items-center gap-1.5 font-semibold"><Clock size={13} /> Deadline {formatDateTime(challenge.deadline)}</p>
            <p className="mt-1">{challenge.requirements}</p>
          </div>
          <Textarea label="What did you complete?" value={evidence.note} onChange={(event) => setEvidence({ ...evidence, note: event.target.value })} placeholder="Describe your work, the steps you took, and how the evidence proves completion." required />
          <Input label="Evidence link (optional)" type="url" value={evidence.url} onChange={(event) => setEvidence({ ...evidence, url: event.target.value })} placeholder="https://github.com/your-repo" />
        </div>
      </Modal>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report this challenge"
        footer={<><Button variant="secondary" onClick={() => setReportOpen(false)}>Cancel</Button><Button loading={submitting} onClick={submitReport}>Send report</Button></>}
      >
        <div className="space-y-4">
          <Input label="Reason" value={report.reason} onChange={(event) => setReport({ ...report, reason: event.target.value })} placeholder="Unclear requirements or unsafe task" />
          <Textarea label="Details" value={report.details} onChange={(event) => setReport({ ...report, details: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

function participationsIsTeam(team, needsTeam) {
  return needsTeam && team;
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, LogOut, Mail, UserMinus, Users } from 'lucide-react';
import { teamsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  SectionHeader,
  Select,
  Skeleton,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDate, formatRelative } from '../../utils/format.js';

export default function TeamDetails() {
  const { id } = useParams();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => teamsApi.get(id), [id]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', message: '' });
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferId, setTransferId] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (error || !data) return <ErrorState error={error} onRetry={refresh} />;

  const { team, invitations, participations, score, isLeader } = data;
  const members = team.members || [];

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      toast.success(success);
      await refresh();
      await refreshUser();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = () =>
    run(async () => {
      await teamsApi.invite(id, invite);
      setInviteOpen(false);
      setInvite({ email: '', message: '' });
    }, 'Invitation sent.');

  const remove = (member) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;
    run(() => teamsApi.removeMember(id, member._id), 'Member removed.');
  };

  const leave = () => {
    if (!window.confirm('Leave this team?')) return;
    run(() => teamsApi.leave(id), 'You left the team.');
  };

  const transfer = () =>
    run(async () => {
      await teamsApi.transfer(id, transferId);
      setTransferOpen(false);
    }, 'Leadership transferred.');

  return (
    <div>
      <button type="button" onClick={() => window.history.back()} className="btn-ghost mb-4 -ml-3 text-sm"><ArrowLeft size={16} /> Back</button>

      <div className="surface p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={team.name} size={56} />
            <div>
              <h1 className="font-display text-2xl font-extrabold text-ink-900 dark:text-white">{team.name}</h1>
              <p className="text-sm text-ink-500 dark:text-ink-400">{team.description || 'Campus team'}</p>
              <p className="mt-1 text-xs text-ink-400">{team.membersCount}/{team.maxSize} members · Created {formatDate(team.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLeader ? <Button onClick={() => setInviteOpen(true)}><Mail size={15} /> Invite student</Button> : null}
            {!isLeader ? <Button variant="secondary" loading={busy} onClick={leave}><LogOut size={15} /> Leave team</Button> : null}
            {isLeader ? <Button variant="secondary" onClick={() => setTransferOpen(true)}><Crown size={15} /> Transfer lead</Button> : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="surface-muted p-4"><p className="text-[11px] uppercase tracking-wider text-ink-400">Team score</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{score}</p></div>
          <div className="surface-muted p-4"><p className="text-[11px] uppercase tracking-wider text-ink-400">Challenges joined</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{participations.length}</p></div>
          <div className="surface-muted p-4"><p className="text-[11px] uppercase tracking-wider text-ink-400">Completed</p><p className="mt-1 font-display text-2xl font-bold text-ink-900 dark:text-white">{participations.filter((entry) => entry.status === 'approved').length}</p></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <SectionHeader title={`Members (${members.length})`} description="Points shown are each member's live campus points." />
            <ul className="space-y-2">
              {members.map((member) => (
                <li key={member._id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/10">
                  <Avatar name={member.name} src={member.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {member.name}
                      {String(team.leader?._id) === String(member._id) ? <Crown size={13} className="text-amber-500" /> : null}
                    </p>
                    <p className="text-[11px] text-ink-400">{member.department || 'Student'} · {member.points || 0} pts</p>
                  </div>
                  <Link to={`/profile/${member._id}`} className="text-[11px] font-semibold text-brand-600 dark:text-brand-300">Profile</Link>
                  {isLeader && String(member._id) !== String(team.leader?._id) ? (
                    <button type="button" onClick={() => remove(member)} className="rounded-lg p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10" aria-label={`Remove ${member.name}`}>
                      <UserMinus size={15} />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader title="Team challenges" description="Shared challenge participation for this team." />
            {participations.length ? (
              <ul className="space-y-2">
                {participations.map((entry) => (
                  <li key={entry._id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/10">
                    <div className="min-w-0 flex-1">
                      <Link to={`/challenges/${entry.challenge?._id}`} className="truncate text-sm font-semibold text-ink-900 hover:text-brand-700 dark:text-white">{entry.challenge?.title}</Link>
                      <p className="text-[11px] text-ink-400">Ends {formatDate(entry.challenge?.deadline)} · +{entry.challenge?.rewardPoints} pts per member</p>
                    </div>
                    <StatusBadge status={entry.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Users} title="No team challenges yet" description="Find a team challenge and join it from the challenge page." action={<Link to="/challenges?type=team" className="btn-secondary btn-sm">Browse team challenges</Link>} />
            )}
          </Card>

          <Card>
            <SectionHeader title="Team activity" />
            {team.activity?.length ? (
              <ol className="space-y-3">
                {[...team.activity].reverse().map((entry, index) => (
                  <li key={`${entry.createdAt}-${index}`} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div>
                      <p className="text-sm text-ink-700 dark:text-ink-200">{entry.message}</p>
                      <p className="text-[11px] text-ink-400">{formatRelative(entry.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-ink-500 dark:text-ink-400">No activity yet.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeader title={`Pending invites (${invitations?.length || 0})`} />
            {invitations?.length ? (
              <ul className="space-y-2">
                {invitations.map((invitation) => (
                  <li key={invitation._id} className="rounded-lg bg-ink-50 p-3 text-xs dark:bg-white/5">
                    <p className="font-semibold text-ink-800 dark:text-ink-100">{invitation.invitee?.name}</p>
                    <p className="text-ink-400">{invitation.invitee?.email}</p>
                    <p className="mt-1 text-ink-500 dark:text-ink-400">{invitation.message || 'No message'}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-500 dark:text-ink-400">No pending invitations.</p>}
          </Card>
          <div className="surface-muted p-4 text-xs text-ink-500 dark:text-ink-400">
            <p className="flex items-center gap-1.5 font-semibold text-ink-700 dark:text-ink-200"><Crown size={14} /> Leader tools</p>
            <p className="mt-1.5">Leaders invite members, remove members, and transfer leadership. Only the leader can archive a team.</p>
            {isLeader ? (
              <Button size="sm" variant="ghost" className="mt-2 text-rose-600 dark:text-rose-300" loading={busy} onClick={() => { if (window.confirm('Archive this team? Pending invitations will be cancelled.')) run(() => teamsApi.archive(id), 'Team archived.'); }}>
                Archive team
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a student"
        description="Send an invitation by email. They must accept it before appearing on the team."
        footer={<><Button variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button><Button loading={busy} onClick={sendInvite}>Send invite</Button></>}
      >
        <div className="space-y-4">
          <Input label="Student email" type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="student@campusquest.dev" required />
          <Input label="Message (optional)" value={invite.message} onChange={(event) => setInvite({ ...invite, message: event.target.value })} placeholder="We need a designer for the next build." />
        </div>
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer leadership"
        description="The selected member will gain leader controls. You remain a regular member."
        footer={<><Button variant="secondary" onClick={() => setTransferOpen(false)}>Cancel</Button><Button loading={busy} onClick={transfer} disabled={!transferId}>Transfer</Button></>}
      >
        <Select label="New leader" value={transferId} onChange={(event) => setTransferId(event.target.value)}>
          <option value="">Choose a member</option>
          {members.filter((member) => String(member._id) !== String(team.leader?._id)).map((member) => (
            <option key={member._id} value={member._id}>{member.name}</option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Check, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { teamsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { TeamCard } from '../../components/cards.jsx';
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  SectionHeader,
  Skeleton,
  Textarea,
} from '../../components/ui.jsx';
import { formatRelative } from '../../utils/format.js';

export default function MyTeams() {
  const toast = useToast();
  const { data: teams, loading, error, refresh } = useApi(() => teamsApi.mine(), []);
  const { data: invitations, refresh: refreshInvitations } = useApi(() => teamsApi.invitations(), []);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', maxSize: 5 });
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (form.name.trim().length < 3) return toast.warning('Team name needs at least 3 characters.');
    setBusy(true);
    try {
      await teamsApi.create({ ...form, maxSize: Number(form.maxSize) });
      toast.success('Team created. Invite your first member.');
      setCreateOpen(false);
      setForm({ name: '', description: '', maxSize: 5 });
      await refresh();
      await refreshInvitations();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const respond = async (invitation, decision) => {
    setBusy(true);
    try {
      await teamsApi.respond(invitation._id, decision);
      toast.success(decision === 'accepted' ? 'You joined the team.' : 'Invitation declined.');
      await refresh();
      await refreshInvitations();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><div className="grid gap-4 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}</div></div>;
  }
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <div>
      <PageHeader
        eyebrow="My activity"
        title="Teams"
        description="Team up for multi-person challenges. Every team has a leader, a member limit, and a shared submission trail."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Create team</Button>}
      />

      {invitations?.length ? (
        <div className="mb-6">
          <SectionHeader title={`Pending invitations (${invitations.length})`} description="Accept one and other pending invitations are cancelled automatically." />
          <div className="space-y-2">
            {invitations.map((invitation) => (
              <div key={invitation._id} className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><Users size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-900 dark:text-white">{invitation.team?.name}</p>
                  <p className="text-xs text-ink-500 dark:text-ink-400">
                    {invitation.inviter?.name} invited you · {invitation.message || 'No message'} · {formatRelative(invitation.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={busy} onClick={() => respond(invitation, 'accepted')}><Check size={14} /> Accept</Button>
                  <Button size="sm" variant="secondary" loading={busy} onClick={() => respond(invitation, 'rejected')}><X size={14} /> Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <SectionHeader title={`Your teams (${teams?.length || 0})`} />
      {!teams?.length ? (
        <EmptyState icon={ShieldCheck} title="No teams yet" description="Create a team for team challenges, or wait for an invitation from a classmate." action={<Button onClick={() => setCreateOpen(true)}>Create your first team</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => <TeamCard key={team._id} team={team} />)}
        </div>
      )}

      <div className="mt-8 surface-muted p-4 text-xs text-ink-500 dark:text-ink-400">
        <p className="font-semibold text-ink-700 dark:text-ink-200">Team rules</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>One active team per student. Leave your current team before creating another.</li>
          <li>Leaders cannot leave until they transfer leadership or archive the team.</li>
          <li>Team challenge evidence is submitted once per team and shared with every member.</li>
        </ul>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a team"
        description="Two to twenty students. You become the leader and can invite members from your team page."
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button loading={busy} onClick={create}>Create team</Button></>}
      >
        <div className="space-y-4">
          <Input label="Team name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Byte Brigade" required />
          <Textarea label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What does your team care about?" />
          <Input label="Maximum members" type="number" min={2} max={20} value={form.maxSize} onChange={(event) => setForm({ ...form, maxSize: event.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

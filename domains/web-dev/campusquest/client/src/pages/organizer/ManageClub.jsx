import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Archive, Check, Save, UserCheck, X } from 'lucide-react';
import { clubsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  SectionHeader,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { CATEGORIES, categoryLabel } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

export default function ManageClub() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => clubsApi.get(id), [id]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    clubsApi.requests(id).then((result) => setRequests(result.requests)).catch(() => null);
  }, [id, data?.club?._id]);

  useEffect(() => {
    if (!data?.club) return;
    setForm({
      name: data.club.name,
      tagline: data.club.tagline || '',
      description: data.club.description,
      category: data.club.category,
      logoUrl: data.club.logoUrl || '',
      coverUrl: data.club.coverUrl || '',
      meetingSchedule: data.club.meetingSchedule || '',
    });
  }, [data]);

  const save = async (event) => {
    event.preventDefault();
    setBusy('save');
    try {
      await clubsApi.update(id, form);
      toast.success('Club details updated.');
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(null);
    }
  };

  const decide = async (userId, decision) => {
    setBusy(userId);
    try {
      await clubsApi.decide(id, userId, decision);
      toast.success(`Membership ${decision}.`);
      const result = await clubsApi.requests(id);
      setRequests(result.requests);
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(null);
    }
  };

  const archive = async () => {
    setBusy('archive');
    try {
      await clubsApi.archive(id);
      toast.info('Club archived. Members were notified.');
      setArchiving(false);
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (error || !data) return <ErrorState error={error} onRetry={refresh} />;

  const { club, members, events, challenges } = data;

  return (
    <div>
      <Link to="/organizer/clubs" className="btn-ghost mb-3 -ml-3"><ArrowLeft size={16} /> Your clubs</Link>
      <PageHeader
        eyebrow="Club management"
        title={club.name}
        description={club.tagline || 'Manage details, membership requests, members, and club-hosted activity.'}
        actions={<><StatusBadge status={club.status} /><Link to={`/clubs/${club.slug}`} className="btn-secondary">Public page</Link><Button variant="danger" onClick={() => setArchiving(true)}><Archive size={15} /> Archive</Button></>}
      />

      {club.status === 'pending' ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          This club is awaiting admin approval. You can still prepare details and approve members, but it will not be public until approved.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <SectionHeader title="Club details" />
            {form ? (
              <form onSubmit={save} className="space-y-4">
                <Input label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                <Input label="Tagline" value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} maxLength={160} />
                <Textarea label="Description" rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                    {CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
                  </Select>
                  <Input label="Meeting schedule" value={form.meetingSchedule} onChange={(event) => setForm({ ...form, meetingSchedule: event.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Logo URL" value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} />
                  <Input label="Cover URL" value={form.coverUrl} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} />
                </div>
                <Button type="submit" loading={busy === 'save'}><Save size={15} /> Save details</Button>
              </form>
            ) : null}
          </Card>

          <Card>
            <SectionHeader title={`Members (${members.length})`} description="Approved members can join club events and challenges." />
            {members.length ? (
              <div className="divide-y divide-ink-100 dark:divide-white/5">
                {members.map((membership) => (
                  <div key={membership._id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={membership.user?.name} src={membership.user?.avatarUrl} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{membership.user?.name}</p>
                      <p className="truncate text-[11px] text-ink-400">{membership.user?.email} · {membership.role}</p>
                    </div>
                    <span className="text-[11px] text-ink-400">Joined {formatDate(membership.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={UserCheck} title="No members yet" />}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeader title={`Requests (${requests.length})`} />
            {requests.length ? (
              <div className="space-y-2">
                {requests.map((membership) => (
                  <div key={membership._id} className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Avatar name={membership.user?.name} src={membership.user?.avatarUrl} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{membership.user?.name}</p>
                        <p className="truncate text-[11px] text-ink-400">{membership.user?.email}</p>
                      </div>
                    </div>
                    {membership.message ? <p className="mt-2 text-xs italic text-ink-500 dark:text-ink-400">“{membership.message}”</p> : null}
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" loading={busy === membership.user?._id} onClick={() => decide(membership.user?._id, 'approved')}><Check size={13} /> Approve</Button>
                      <Button size="sm" variant="secondary" loading={busy === membership.user?._id} onClick={() => decide(membership.user?._id, 'rejected')}><X size={13} /> Reject</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-ink-500 dark:text-ink-400">No pending requests.</p>}
          </Card>

          <Card>
            <SectionHeader title="Club activity" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-400">Published events</span>
                <span className="font-bold text-ink-900 dark:text-white">{events.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-400">Open challenges</span>
                <span className="font-bold text-ink-900 dark:text-white">{challenges.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-500 dark:text-ink-400">Members</span>
                <span className="font-bold text-ink-900 dark:text-white">{club.membersCount}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Link to="/organizer/events/new" className="btn-secondary btn-sm">Host an event</Link>
              <Link to="/organizer/challenges/new" className="btn-secondary btn-sm">Create a challenge</Link>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={archiving}
        onClose={() => setArchiving(false)}
        title="Archive this club?"
        description="The club will disappear from discovery and every member will be notified. This cannot be undone from the UI."
        footer={<><Button variant="secondary" onClick={() => setArchiving(false)}>Keep club</Button><Button variant="danger" loading={busy === 'archive'} onClick={archive}>Archive club</Button></>}
      >
        <p className="text-sm text-ink-600 dark:text-ink-300">Events and challenges remain in the database for historical records.</p>
      </Modal>
    </div>
  );
}

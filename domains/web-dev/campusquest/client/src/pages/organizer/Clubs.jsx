import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings, Users } from 'lucide-react';
import { clubsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { CATEGORIES, categoryLabel } from '../../utils/constants.js';

const emptyClub = { name: '', tagline: '', description: '', category: 'academic', logoUrl: '', meetingSchedule: '' };

export default function OrganizerClubs() {
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => clubsApi.mine(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyClub);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const create = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Club name needs at least 3 characters.';
    if (form.description.trim().length < 20) nextErrors.description = 'Description needs at least 20 characters.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    try {
      await clubsApi.create(form);
      toast.success('Club submitted for admin approval.');
      setOpen(false);
      setForm(emptyClub);
      await refresh();
    } catch (error) {
      const details = error.response?.data?.error?.details;
      if (Array.isArray(details)) setErrors(Object.fromEntries(details.map((item) => [item.path, item.message])));
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-48 w-full" /></div>;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <div>
      <PageHeader
        eyebrow="Organizer"
        title="Your clubs"
        description="Clubs need admin approval before they appear publicly. You can prepare members and details while pending."
        actions={<Button onClick={() => setOpen(true)}><Plus size={15} /> Create club</Button>}
      />

      {!data?.length ? (
        <EmptyState icon={Users} title="No clubs yet" description="Create a club to manage members, host events, and publish challenges under a shared identity." action={<Button onClick={() => setOpen(true)}>Create your first club</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((membership) => {
            const club = membership.club;
            if (!club) return null;
            return (
              <Card key={membership._id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {club.logoUrl ? <img src={club.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 font-display text-lg font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{club.name.slice(0, 1)}</span>}
                    <div>
                      <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">{club.name}</h3>
                      <p className="text-[11px] text-ink-400">{categoryLabel(club.category)} · {club.membersCount} members</p>
                    </div>
                  </div>
                  <StatusBadge status={club.status} />
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">{club.tagline || club.description}</p>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-ink-100 dark:border-white/10">
                  <Link to={`/organizer/clubs/${club._id}`} className="btn-secondary btn-sm flex-1"><Settings size={14} /> Manage</Link>
                  <Link to={`/clubs/${club.slug}`} className="btn-ghost btn-sm">View</Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a club"
        description="An admin reviews every new club before it goes live."
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy} onClick={create}>Submit club</Button></>}
      >
        <form onSubmit={create} className="space-y-4">
          <Input label="Club name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} error={errors.name} required />
          <Input label="Tagline" value={form.tagline} onChange={(event) => setForm({ ...form, tagline: event.target.value })} maxLength={160} />
          <Textarea label="Description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} error={errors.description} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
            </Select>
            <Input label="Meeting schedule" value={form.meetingSchedule} onChange={(event) => setForm({ ...form, meetingSchedule: event.target.value })} placeholder="Wednesdays, 6pm" />
          </div>
          <Input label="Logo URL" value={form.logoUrl} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} />
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { clubsApi, notificationsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button, Card, PageHeader, SectionHeader, Select, Input, Textarea } from '../../components/ui.jsx';

export default function Announcements() {
  const toast = useToast();
  const { data: memberships } = useApi(() => clubsApi.mine(), []);
  const [form, setForm] = useState({ title: '', message: '', audience: 'students', club: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  useEffect(() => {
    if (form.audience !== 'club' && form.club) setForm((current) => ({ ...current, club: '' }));
  }, [form.audience, form.club]);

  const submit = async (event) => {
    event.preventDefault();
    if (form.title.trim().length < 3 || form.message.trim().length < 3) {
      toast.error('Add a title and message first.');
      return;
    }
    if (form.audience === 'club' && !form.club) {
      toast.error('Choose which club should receive this announcement.');
      return;
    }
    setBusy(true);
    setSent(null);
    try {
      const result = await notificationsApi.announce({
        title: form.title,
        message: form.message,
        audience: form.audience,
        club: form.audience === 'club' ? form.club : undefined,
      });
      setSent(result.sent);
      toast.success(`Announcement sent to ${result.sent} people.`);
      setForm((current) => ({ ...current, title: '', message: '' }));
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const clubs = (memberships || []).map((membership) => membership.club).filter(Boolean);

  return (
    <div>
      <PageHeader eyebrow="Organizer" title="Announcements" description="Send a notification to students or your club members. Keep it short and useful." />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={140} required placeholder="Venue change for Saturday" />
            <Textarea label="Message" rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} maxLength={500} required hint={`${form.message.length}/500 characters`} />
            <Select label="Audience" value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })}>
              <option value="students">All students</option>
              <option value="all">Everyone (including organizers and admins)</option>
              <option value="club">Members of one club</option>
            </Select>
            {form.audience === 'club' ? (
              <Select label="Club" value={form.club} onChange={(event) => setForm({ ...form, club: event.target.value })} required>
                <option value="">Choose a club</option>
                {clubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}
              </Select>
            ) : null}
            <Button type="submit" loading={busy}><Send size={15} /> Send announcement</Button>
            {sent !== null ? <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">Delivered to {sent} recipients.</p> : null}
          </form>
        </Card>
        <Card>
          <SectionHeader title="Announcement etiquette" />
          <ul className="space-y-3 text-sm text-ink-600 dark:text-ink-300">
            <li className="flex gap-2"><Megaphone size={15} className="mt-0.5 shrink-0 text-brand-500" /> Put the action in the title: “Venue changed to Hall B”.</li>
            <li className="flex gap-2"><Megaphone size={15} className="mt-0.5 shrink-0 text-brand-500" /> Use club audience only for club-specific information.</li>
            <li className="flex gap-2"><Megaphone size={15} className="mt-0.5 shrink-0 text-brand-500" /> Announcements are notifications, not email. Students see them in the bell menu.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

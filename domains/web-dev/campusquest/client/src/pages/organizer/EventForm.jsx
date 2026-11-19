import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { clubsApi, eventsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '../../components/ui.jsx';
import { CATEGORIES, EVENT_STATUS_OPTIONS, categoryLabel } from '../../utils/constants.js';

const emptyForm = {
  title: '',
  description: '',
  category: 'technology',
  venue: '',
  startDate: '',
  endDate: '',
  capacity: 100,
  points: 20,
  status: 'draft',
  coverUrl: '',
  club: '',
  tags: '',
};

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function toISO(value) {
  return value ? new Date(value).toISOString() : '';
}

export default function EventForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(!editing);
  const { data: memberships } = useApi(() => clubsApi.mine(), []);

  useEffect(() => {
    if (!editing) return;
    eventsApi.get(id).then((result) => {
      const event = result.event;
      setForm({
        title: event.title,
        description: event.description,
        category: event.category,
        venue: event.venue,
        startDate: toLocalInput(event.startDate),
        endDate: toLocalInput(event.endDate),
        capacity: event.capacity,
        points: event.points,
        status: event.status,
        coverUrl: event.coverUrl || '',
        club: event.club?._id || event.club || '',
        tags: (event.tags || []).join(', '),
      });
      setLoaded(true);
    }).catch((error) => toast.error(error.friendlyMessage));
  }, [editing, id, toast]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.title.trim().length < 3) nextErrors.title = 'Give the event a clear title.';
    if (form.description.trim().length < 20) nextErrors.description = 'Description needs at least 20 characters.';
    if (!form.venue.trim()) nextErrors.venue = 'Venue is required.';
    if (!form.startDate) nextErrors.startDate = 'Choose a start date.';
    if (!form.endDate) nextErrors.endDate = 'Choose an end date.';
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) nextErrors.endDate = 'End must be after start.';
    if (Number(form.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      ...form,
      capacity: Number(form.capacity),
      points: Number(form.points),
      startDate: toISO(form.startDate),
      endDate: toISO(form.endDate),
      club: form.club || null,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };

    setBusy(true);
    try {
      if (editing) {
        await eventsApi.update(id, payload);
        toast.success('Event updated.');
      } else {
        const result = await eventsApi.create(payload);
        toast.success(payload.status === 'published' ? 'Event published.' : 'Draft saved.');
        navigate(`/organizer/events/${result.event._id}/edit`);
        return;
      }
      navigate('/organizer/events');
    } catch (error) {
      const details = error.response?.data?.error?.details;
      if (Array.isArray(details)) setErrors(Object.fromEntries(details.map((item) => [item.path, item.message])));
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-96 w-full" /></div>;

  const clubs = (memberships || []).map((membership) => membership.club).filter(Boolean);

  return (
    <div>
      <Link to="/organizer/events" className="btn-ghost mb-3 -ml-3"><ArrowLeft size={16} /> All events</Link>
      <PageHeader
        eyebrow="Organizer"
        title={editing ? 'Edit event' : 'Create an event'}
        description={editing ? 'Changes go live immediately. Cancelling notifies every attendee.' : 'Draft it now, publish once the venue and capacity are locked.'}
      />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <Input label="Event title" name="title" value={form.title} onChange={(event) => update('title', event.target.value)} error={errors.title} required maxLength={140} placeholder="Hack the Campus 2026" />
            <Textarea label="Description" name="description" rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} error={errors.description} required maxLength={5000} placeholder="What will students do, learn, and take away?" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" name="category" value={form.category} onChange={(event) => update('category', event.target.value)}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
              </Select>
              <Select label="Status" name="status" value={form.status} onChange={(event) => update('status', event.target.value)}>
                {EVENT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{categoryLabel(option)}</option>)}
              </Select>
            </div>
            <Input label="Venue" name="venue" value={form.venue} onChange={(event) => update('venue', event.target.value)} error={errors.venue} required placeholder="Innovation Hub, Hall B" />
            <Input label="Cover image URL" name="coverUrl" value={form.coverUrl} onChange={(event) => update('coverUrl', event.target.value)} placeholder="https://images.unsplash.com/..." />
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Schedule and capacity</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Starts" type="datetime-local" name="startDate" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} error={errors.startDate} required />
              <Input label="Ends" type="datetime-local" name="endDate" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} error={errors.endDate} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Capacity" type="number" min="1" max="10000" name="capacity" value={form.capacity} onChange={(event) => update('capacity', event.target.value)} error={errors.capacity} required />
              <Input label="Check-in points" type="number" min="0" name="points" value={form.points} onChange={(event) => update('points', event.target.value)} hint="Points awarded at verified check-in." />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Hosting</h2>
            <Select label="Club (optional)" name="club" value={form.club} onChange={(event) => update('club', event.target.value)} hint="Only clubs you organize can host events.">
              <option value="">Personal / campus-wide</option>
              {clubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}
            </Select>
            <Input label="Tags" name="tags" value={form.tags} onChange={(event) => update('tags', event.target.value)} hint="Comma-separated, e.g. ai, teamwork, beginners" />
          </Card>

          <Card>
            <h2 className="font-display text-base font-bold text-ink-900 dark:text-white">Cover preview</h2>
            {form.coverUrl ? <img src={form.coverUrl} alt="Cover preview" className="mt-3 h-36 w-full rounded-xl object-cover" /> : <div className="mt-3 flex h-36 items-center justify-center rounded-xl bg-ink-50 text-xs text-ink-400 dark:bg-white/5">Add an image URL</div>}
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" loading={busy}><Save size={15} /> {editing ? 'Save changes' : 'Create event'}</Button>
            <Button variant="secondary" onClick={() => navigate('/organizer/events')}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { challengesApi, clubsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '../../components/ui.jsx';
import { CATEGORIES, CHALLENGE_STATUS_OPTIONS, DIFFICULTIES, TEAM_TYPES, categoryLabel } from '../../utils/constants.js';

const emptyForm = {
  title: '',
  description: '',
  category: 'technology',
  difficulty: 'easy',
  type: 'individual',
  startDate: '',
  deadline: '',
  maxParticipants: 100,
  rewardPoints: 50,
  xpReward: 50,
  requirements: '',
  evidenceHint: '',
  coverUrl: '',
  club: '',
  status: 'draft',
  badgeCode: '',
  allowResubmission: true,
};

function toLocalInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function ChallengeForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loaded, setLoaded] = useState(!editing);
  const [busy, setBusy] = useState(false);
  const { data: memberships } = useApi(() => clubsApi.mine(), []);

  useEffect(() => {
    if (!editing) return;
    challengesApi.get(id).then(({ challenge }) => {
      setForm({
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        type: challenge.type,
        startDate: toLocalInput(challenge.startDate),
        deadline: toLocalInput(challenge.deadline),
        maxParticipants: challenge.maxParticipants,
        rewardPoints: challenge.rewardPoints,
        xpReward: challenge.xpReward,
        requirements: challenge.requirements || '',
        evidenceHint: challenge.evidenceHint || '',
        coverUrl: challenge.coverUrl || '',
        club: challenge.club?._id || challenge.club || '',
        status: challenge.status,
        badgeCode: challenge.badgeCode || '',
        allowResubmission: challenge.allowResubmission,
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
    if (form.title.trim().length < 3) nextErrors.title = 'Give the challenge a clear title.';
    if (form.description.trim().length < 20) nextErrors.description = 'Description needs at least 20 characters.';
    if (!form.startDate) nextErrors.startDate = 'Choose a start date.';
    if (!form.deadline) nextErrors.deadline = 'Choose a deadline.';
    if (form.startDate && form.deadline && new Date(form.deadline) <= new Date(form.startDate)) nextErrors.deadline = 'Deadline must be after the start.';
    if (Number(form.rewardPoints) < 1) nextErrors.rewardPoints = 'Reward must be at least 1 point.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      ...form,
      maxParticipants: Number(form.maxParticipants),
      rewardPoints: Number(form.rewardPoints),
      xpReward: Number(form.xpReward),
      startDate: new Date(form.startDate).toISOString(),
      deadline: new Date(form.deadline).toISOString(),
      club: form.club || null,
    };

    setBusy(true);
    try {
      if (editing) {
        await challengesApi.update(id, payload);
        toast.success('Challenge updated.');
      } else {
        const result = await challengesApi.create(payload);
        toast.success(payload.status === 'published' ? 'Challenge published.' : 'Draft saved.');
        navigate(`/organizer/challenges/${result.challenge._id}/edit`);
        return;
      }
      navigate('/organizer/challenges');
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
      <Link to="/organizer/challenges" className="btn-ghost mb-3 -ml-3"><ArrowLeft size={16} /> All challenges</Link>
      <PageHeader
        eyebrow="Organizer"
        title={editing ? 'Edit challenge' : 'Create a challenge'}
        description="Make the evidence requirement explicit so students know exactly what a strong submission looks like."
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="space-y-4">
            <Input label="Challenge title" name="title" value={form.title} onChange={(event) => update('title', event.target.value)} error={errors.title} required maxLength={140} placeholder="30-Day Campus Sustainability Sprint" />
            <Textarea label="Description" name="description" rows={6} value={form.description} onChange={(event) => update('description', event.target.value)} error={errors.description} required maxLength={5000} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Category" value={form.category} onChange={(event) => update('category', event.target.value)}>
                {CATEGORIES.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
              </Select>
              <Select label="Difficulty" value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}>
                {DIFFICULTIES.map((difficulty) => <option key={difficulty} value={difficulty}>{categoryLabel(difficulty)}</option>)}
              </Select>
              <Select label="Participation type" value={form.type} onChange={(event) => update('type', event.target.value)}>
                {TEAM_TYPES.map((type) => <option key={type} value={type}>{categoryLabel(type)}</option>)}
              </Select>
              <Select label="Status" value={form.status} onChange={(event) => update('status', event.target.value)}>
                {CHALLENGE_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{categoryLabel(option)}</option>)}
              </Select>
            </div>
            <Input label="Cover image URL" value={form.coverUrl} onChange={(event) => update('coverUrl', event.target.value)} />
          </Card>

          <Card className="space-y-4">
            <Textarea label="Requirements" rows={4} value={form.requirements} onChange={(event) => update('requirements', event.target.value)} maxLength={2000} placeholder="Rules, constraints, what counts..." />
            <Input label="Evidence hint" value={form.evidenceHint} onChange={(event) => update('evidenceHint', event.target.value)} maxLength={500} hint="Shown on the submission form to guide students." placeholder="Link a public repo, screenshot, or 2-minute video." />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Timing and limits</h2>
            <Input label="Starts" type="datetime-local" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} error={errors.startDate} required />
            <Input label="Deadline" type="datetime-local" value={form.deadline} onChange={(event) => update('deadline', event.target.value)} error={errors.deadline} required />
            <Input label="Max participants" type="number" min="1" value={form.maxParticipants} onChange={(event) => update('maxParticipants', event.target.value)} />
            <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
              <input type="checkbox" checked={form.allowResubmission} onChange={(event) => update('allowResubmission', event.target.checked)} className="accent-brand-600" />
              Allow resubmission after rejection
            </label>
          </Card>

          <Card className="space-y-4">
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">Rewards and hosting</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Points" type="number" min="1" value={form.rewardPoints} onChange={(event) => update('rewardPoints', event.target.value)} error={errors.rewardPoints} />
              <Input label="XP" type="number" min="0" value={form.xpReward} onChange={(event) => update('xpReward', event.target.value)} />
            </div>
            <Input label="Badge code (optional)" value={form.badgeCode} onChange={(event) => update('badgeCode', event.target.value)} hint="Must match an achievement code." />
            <Select label="Club (optional)" value={form.club} onChange={(event) => update('club', event.target.value)}>
              <option value="">Personal / campus-wide</option>
              {clubs.map((club) => <option key={club._id} value={club._id}>{club.name}</option>)}
            </Select>
          </Card>

          <div className="flex flex-col gap-2">
            <Button type="submit" loading={busy}><Save size={15} /> {editing ? 'Save changes' : 'Create challenge'}</Button>
            <Button variant="secondary" onClick={() => navigate('/organizer/challenges')}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

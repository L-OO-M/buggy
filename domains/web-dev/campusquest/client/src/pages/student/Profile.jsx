import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CalendarDays, Save, Sparkles, Trophy, Zap } from 'lucide-react';
import { achievementsApi, usersApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Button,
  Card,
  Input,
  PageHeader,
  ProgressBar,
  SectionHeader,
  Select,
  StatCard,
  StatusBadge,
  Textarea,
} from '../../components/ui.jsx';
import { formatDate, roleLabel } from '../../utils/format.js';

export default function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', bio: '', campus: '', department: '', year: 1, avatarUrl: '' });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: stats, refresh: refreshStats } = useApi(() => usersApi.stats(), []);
  const { data: points } = useApi(() => usersApi.points({ limit: 8 }), []);
  const { data: achievements } = useApi(() => achievementsApi.mine(), []);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      bio: user.bio || '',
      campus: user.campus || '',
      department: user.department || '',
      year: user.year || 1,
      avatarUrl: user.avatarUrl || '',
    });
  }, [user]);

  const save = async (event) => {
    event.preventDefault();
    setErrors({});
    if (form.name.trim().length < 2) {
      setErrors({ name: 'Name needs at least 2 characters.' });
      return;
    }
    setBusy(true);
    try {
      const result = await usersApi.updateMe({ ...form, year: Number(form.year) });
      updateUser(result.user);
      await refreshUser();
      await refreshStats();
      toast.success('Profile saved. Your changes are live across CampusQuest.');
    } catch (error) {
      const details = error.response?.data?.error?.details;
      if (Array.isArray(details)) setErrors(Object.fromEntries(details.map((item) => [item.path, item.message])));
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <PageHeader eyebrow="Account" title="Your profile" description="This is what teammates and organizers see when they check your campus record." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={form.name || user.name} src={form.avatarUrl} size={64} />
              <div>
                <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">{form.name || user.name}</h2>
                <p className="text-sm text-ink-500 dark:text-ink-400">{roleLabel(user.role)} · {user.email}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StatusBadge status={user.role === 'student' ? 'active' : user.role} />
                  <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Level {user.level} · {user.levelTitle}</span>
                </div>
              </div>
            </div>

            <form onSubmit={save} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} error={errors.name} required />
                <Input label="Avatar image URL" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="https://..." />
              </div>
              <Textarea label="Bio" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} hint="Max 500 characters. Tell people what you are into." maxLength={500} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Campus" value={form.campus} onChange={(event) => setForm({ ...form, campus: event.target.value })} />
                <Input label="Department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                <Select label="Year" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>
                  {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </Select>
              </div>
              <div className="flex items-center justify-between border-t border-ink-100 pt-4 dark:border-white/10">
                <p className="text-xs text-ink-400">Signed in as {user.email}</p>
                <Button type="submit" loading={busy}><Save size={15} /> Save profile</Button>
              </div>
            </form>
          </Card>

          <Card>
            <SectionHeader title="Points ledger" description="Every point transaction is auditable." />
            {points?.data?.length ? (
              <div className="divide-y divide-ink-100 dark:divide-white/5">
                {points.data.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{transaction.reason}</p>
                      <p className="text-[11px] text-ink-400">{formatDate(transaction.createdAt)} · {transaction.type.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`shrink-0 font-display text-sm font-bold ${transaction.amount >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-ink-500">No point transactions yet.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Points" value={stats?.points ?? user.points} icon={Zap} tone="warning" />
            <StatCard label="Rank" value={stats?.rank ? `#${stats.rank}` : '-'} icon={Trophy} tone="brand" />
            <StatCard label="Events" value={stats?.attended ?? 0} icon={CalendarDays} tone="info" />
            <StatCard label="Badges" value={stats?.achievements ?? 0} icon={Award} tone="success" />
          </div>

          <Card>
            <SectionHeader title="Level progress" />
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-extrabold text-white">{user.level}</span>
              <div>
                <p className="font-display text-base font-bold text-ink-900 dark:text-white">{user.levelTitle}</p>
                <p className="text-xs text-ink-400">{stats?.nextLevelAt ? `${stats.nextLevelAt - user.xp} XP to next level` : 'Max level reached'}</p>
              </div>
            </div>
            <ProgressBar value={stats?.levelProgress ?? 0} className="mt-4" tone="brand" />
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-500 dark:bg-white/5 dark:text-ink-400">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-amber-500" />
              <p>Earn XP from approved challenges, check-ins, and club activity. Points and XP move together in this demo.</p>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Recent badges" action={<Link to="/achievements" className="text-xs font-semibold text-brand-600 dark:text-brand-300">All</Link>} />
            {achievements?.items?.length ? (
              <ul className="space-y-2">
                {achievements.items.slice(0, 5).map((entry) => (
                  <li key={entry._id} className="flex items-center gap-2.5">
                    <span className="inline-flex rounded-lg bg-amber-100 p-1.5 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"><Award size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800 dark:text-ink-100">{entry.achievement?.title}</p>
                      <p className="text-[11px] text-ink-400">{formatDate(entry.unlockedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-500">No badges yet. Complete a challenge to unlock your first.</p>}
          </Card>

          <Card className="p-4">
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Public profile link:
              <Link to={`/profile/${user._id}`} className="link ml-1 break-all">/profile/{user._id}</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

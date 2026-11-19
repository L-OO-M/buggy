import { useEffect, useState } from 'react';
import { Award, Plus, Search, Zap } from 'lucide-react';
import { adminApi } from '../../api/index.js';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SectionHeader,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui.jsx';
import { formatDate, titleCase } from '../../utils/format.js';

const criteria = ['points', 'challenges_completed', 'events_attended', 'clubs_joined', 'teams_created', 'streak'];
const emptyAchievement = { code: '', title: '', description: '', icon: 'award', category: 'general', criteriaType: 'points', threshold: 100, bonusPoints: 0, active: true };

export default function AdminRewards() {
  const toast = useToast();
  const { data: achievements, loading: achievementsLoading, refresh: refreshAchievements } = useApi(() => adminApi.achievements(), []);
  const [page, setPage] = useState(1);
  const { data: transactions, meta, loading: ledgerLoading, refresh: refreshLedger } = useApi(() => adminApi.points({ page, limit: 15 }), [page]);
  const [achievementOpen, setAchievementOpen] = useState(false);
  const [form, setForm] = useState(emptyAchievement);
  const [busy, setBusy] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const search = useDebounced(userQuery, 300);
  const [userResults, setUserResults] = useState([]);
  const [pointForm, setPointForm] = useState({ userId: '', amount: 25, reason: '' });
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (search.length < 2) {
      setUserResults([]);
      return;
    }
    adminApi.users({ q: search, limit: 6 }).then((result) => setUserResults(result.data)).catch(() => setUserResults([]));
  }, [search]);

  const openAchievement = (achievement) => {
    setForm(achievement ? {
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      criteriaType: achievement.criteriaType,
      threshold: achievement.threshold,
      bonusPoints: achievement.bonusPoints,
      active: achievement.active,
    } : emptyAchievement);
    setAchievementOpen(true);
  };

  const saveAchievement = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await adminApi.upsertAchievement({ ...form, threshold: Number(form.threshold), bonusPoints: Number(form.bonusPoints) });
      toast.success('Achievement saved.');
      setAchievementOpen(false);
      await refreshAchievements();
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  const adjust = async (event) => {
    event.preventDefault();
    if (!pointForm.userId) {
      toast.error('Choose a student first.');
      return;
    }
    setBusy(true);
    try {
      await adminApi.adjustPoints({ ...pointForm, amount: Number(pointForm.amount) });
      toast.success('Points adjusted and achievements rechecked.');
      setPointForm({ userId: '', amount: 25, reason: '' });
      setSelectedUser(null);
      setUserQuery('');
      await refreshLedger();
    } catch (error) {
      toast.error(error.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Rewards and points"
        description="Tune the achievement catalog and correct point balances with an auditable ledger."
        actions={<Button onClick={() => openAchievement(null)}><Plus size={15} /> New achievement</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionHeader title="Achievement catalog" description="Changes apply the next time achievements are evaluated." />
          {achievementsLoading ? <Skeleton className="h-64 w-full" /> : (
            <div className="space-y-2">
              {achievements?.map((achievement) => (
                <button key={achievement._id} type="button" onClick={() => openAchievement(achievement)} className="flex w-full items-center gap-3 rounded-xl border border-ink-100 p-3 text-left transition hover:border-brand-200 dark:border-white/10 dark:hover:border-brand-400/30">
                  <span className="inline-flex rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"><Award size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{achievement.title}</p>
                    <p className="text-[11px] text-ink-400">{titleCase(achievement.criteriaType)} ≥ {achievement.threshold} · {achievement.bonusPoints} bonus pts · {achievement.code}</p>
                  </div>
                  {!achievement.active ? <Badge tone="warning">Inactive</Badge> : null}
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionHeader title="Adjust points" description="Use for support corrections. Every adjustment is logged." />
            <form onSubmit={adjust} className="space-y-4">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input className="input pl-9" value={userQuery} onChange={(event) => { setUserQuery(event.target.value); setSelectedUser(null); setPointForm({ ...pointForm, userId: '' }); }} placeholder="Search student name or email" />
              </div>
              {userResults.length && !selectedUser ? (
                <div className="rounded-xl border border-ink-100 p-1 dark:border-white/10">
                  {userResults.map((user) => (
                    <button key={user._id} type="button" onClick={() => { setSelectedUser(user); setPointForm({ ...pointForm, userId: user._id }); setUserQuery(user.name); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-ink-50 dark:hover:bg-white/5">
                      <Avatar name={user.name} src={user.avatarUrl} size={26} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink-800 dark:text-ink-100">{user.name}</span><span className="block truncate text-[10px] text-ink-400">{user.email}</span></span>
                    </button>
                  ))}
                </div>
              ) : null}
              {selectedUser ? <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">Selected: {selectedUser.name} ({selectedUser.points} pts)</p> : null}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Amount" type="number" value={pointForm.amount} onChange={(event) => setPointForm({ ...pointForm, amount: event.target.value })} required hint="Negative removes points." />
                <Input label="Reason" value={pointForm.reason} onChange={(event) => setPointForm({ ...pointForm, reason: event.target.value })} required />
              </div>
              <Button type="submit" loading={busy} className="w-full"><Zap size={15} /> Apply adjustment</Button>
            </form>
          </Card>

          <Card>
            <SectionHeader title="Recent ledger" />
            {ledgerLoading ? <Skeleton className="h-40 w-full" /> : (
              <div className="divide-y divide-ink-100 dark:divide-white/5">
                {transactions?.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink-800 dark:text-ink-100">{transaction.user?.name}</p>
                      <p className="truncate text-[10px] text-ink-400">{transaction.reason} · {formatDate(transaction.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold ${transaction.amount >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>{transaction.amount >= 0 ? '+' : ''}{transaction.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <Pagination meta={meta} onPage={setPage} />
          </Card>
        </div>
      </div>

      <Modal
        open={achievementOpen}
        onClose={() => setAchievementOpen(false)}
        title={form.code ? `Edit ${form.code}` : 'New achievement'}
        footer={<><Button variant="secondary" onClick={() => setAchievementOpen(false)}>Cancel</Button><Button loading={busy} onClick={saveAchievement}>Save</Button></>}
      >
        <form onSubmit={saveAchievement} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required placeholder="first-steps" />
            <Input label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Criteria" value={form.criteriaType} onChange={(event) => setForm({ ...form, criteriaType: event.target.value })}>
              {criteria.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}
            </Select>
            <Input label="Threshold" type="number" min="0" value={form.threshold} onChange={(event) => setForm({ ...form, threshold: event.target.value })} required />
            <Input label="Bonus points" type="number" min="0" value={form.bonusPoints} onChange={(event) => setForm({ ...form, bonusPoints: event.target.value })} />
            <Input label="Icon" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} className="accent-brand-600" />
            Active in the catalog
          </label>
        </form>
      </Modal>
    </div>
  );
}

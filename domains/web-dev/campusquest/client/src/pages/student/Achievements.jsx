import { useState } from 'react';
import { Award, CheckCircle2, Lock, RefreshCw, Sparkles } from 'lucide-react';
import { achievementsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  ProgressBar,
  Skeleton,
  StatCard,
} from '../../components/ui.jsx';
import { formatDate } from '../../utils/format.js';

const criteriaLabels = {
  points: 'Campus points',
  challenges_completed: 'Approved challenges',
  events_attended: 'Events attended',
  clubs_joined: 'Clubs joined',
  teams_created: 'Teams led',
  streak: 'Activity streak',
};

export default function Achievements() {
  const toast = useToast();
  const { data, loading, error, refresh } = useApi(() => achievementsApi.list(), []);
  const [busy, setBusy] = useState(false);

  const recheck = async () => {
    setBusy(true);
    try {
      const result = await achievementsApi.recheck();
      if (result.unlocked?.length) {
        toast.success(`Unlocked ${result.unlocked.length} achievements.`);
      } else {
        toast.info('No new achievements yet. Keep going.');
      }
      await refresh();
    } catch (err) {
      toast.error(err.friendlyMessage);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />)}</div></div>;
  }
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const { achievements, unlockedCount, total, metrics } = data;
  const sorted = [...achievements].sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.progress - b.progress);

  return (
    <div>
      <PageHeader
        eyebrow="My activity"
        title="Achievements"
        description="Badges unlock automatically when your campus record crosses each threshold."
        actions={<Button variant="secondary" loading={busy} onClick={recheck}><RefreshCw size={15} /> Recheck progress</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Unlocked" value={`${unlockedCount}/${total}`} hint="Badges earned" icon={Award} tone="warning" />
        <StatCard label="Campus points" value={metrics.points} hint="Lifetime points" icon={Sparkles} tone="brand" />
        <StatCard label="Approved challenges" value={metrics.challenges_completed} hint="Evidence verified" icon={CheckCircle2} tone="success" />
        <StatCard label="Events attended" value={metrics.events_attended} hint={`${metrics.clubs_joined} clubs joined`} icon={Award} tone="info" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((achievement) => (
          <div
            key={achievement._id}
            className={`surface p-5 transition ${achievement.unlocked ? 'border-amber-300/60 bg-gradient-to-br from-amber-50/80 to-white dark:border-amber-400/20 dark:from-amber-500/10 dark:to-ink-900' : ''}`}
          >
            <div className="flex items-start justify-between">
              <span className={`inline-flex rounded-xl p-2.5 ${achievement.unlocked ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-ink-100 text-ink-400 dark:bg-white/10'}`}>
                {achievement.unlocked ? <Sparkles size={20} /> : <Lock size={20} />}
              </span>
              {achievement.unlocked ? (
                <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Unlocked</span>
              ) : (
                <span className="text-xs font-semibold text-ink-400">{achievement.progress}%</span>
              )}
            </div>
            <h3 className="mt-3 font-display text-base font-bold text-ink-900 dark:text-white">{achievement.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{achievement.description}</p>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[11px] text-ink-400">
                <span>{criteriaLabels[achievement.criteriaType]}</span>
                <span>{achievement.currentValue} / {achievement.threshold}</span>
              </div>
              <ProgressBar value={achievement.progress} tone={achievement.unlocked ? 'success' : 'brand'} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
              <span>Bonus +{achievement.bonusPoints} pts</span>
              {achievement.unlockedAt ? <span>{formatDate(achievement.unlockedAt)}</span> : <span>In progress</span>}
            </div>
          </div>
        ))}
      </div>

      {!achievements.length ? <EmptyState icon={Award} title="No achievements configured" description="Ask an admin to seed the achievement catalog." /> : null}
    </div>
  );
}

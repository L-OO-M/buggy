import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarDays, Trophy, Users, Zap } from 'lucide-react';
import { usersApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { Avatar, Card, EmptyState, ErrorState, SectionHeader, Skeleton, StatCard } from '../../components/ui.jsx';
import { formatDate, roleLabel } from '../../utils/format.js';

export default function UserProfile() {
  const { id } = useParams();
  const { data, loading, error, refresh } = useApi(() => usersApi.profile(id), [id]);

  if (loading) return <div className="mx-auto max-w-4xl space-y-4 px-4 py-10"><Skeleton className="h-40 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState error={error} onRetry={refresh} /></div>;

  const { user, achievements, clubs, teams, rank } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <button type="button" onClick={() => window.history.back()} className="btn-ghost mb-4 -ml-3 text-sm"><ArrowLeft size={16} /> Back</button>
      <div className="surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.avatarUrl} size={72} />
            <div>
              <h1 className="font-display text-2xl font-extrabold text-ink-900 dark:text-white">{user.name}</h1>
              <p className="text-sm text-ink-500 dark:text-ink-400">{roleLabel(user.role)} · {user.department || 'Campus member'} · Year {user.year}</p>
              <p className="mt-1 text-xs text-ink-400">{user.campus} · Joined {formatDate(user.createdAt)}</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
            <Trophy size={20} className="text-brand-600 dark:text-brand-300" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Campus rank</p>
              <p className="font-display text-xl font-bold text-ink-900 dark:text-white">{rank ? `#${rank.rank}` : 'Unranked'}</p>
            </div>
          </div>
        </div>
        {user.bio ? <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-600 dark:text-ink-300">{user.bio}</p> : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Points" value={user.points} icon={Zap} tone="warning" />
        <StatCard label="Level" value={`${user.level} · ${user.levelTitle}`} icon={Award} tone="brand" />
        <StatCard label="Challenges approved" value={achievements.length ? achievements.filter((entry) => entry.achievement?.criteriaType === 'challenges_completed').length || 0 : 0} icon={Trophy} tone="success" />
        <StatCard label="Streak" value={`${user.streak} days`} icon={CalendarDays} tone="info" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title={`Badges (${achievements.length})`} />
          {achievements.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {achievements.map((entry) => (
                <div key={entry._id} className="flex items-center gap-2.5 rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
                  <Award size={17} className="text-amber-600 dark:text-amber-300" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink-900 dark:text-white">{entry.achievement?.title}</p>
                    <p className="text-[10px] text-ink-400">{formatDate(entry.unlockedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Award} title="No badges yet" />}
        </Card>

        <Card>
          <SectionHeader title="Clubs and teams" />
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Clubs ({clubs.length})</p>
              {clubs.length ? (
                <div className="flex flex-wrap gap-2">
                  {clubs.map((club) => (
                    <Link key={club._id} to={`/clubs/${club.slug}`} className="chip">{club.name}</Link>
                  ))}
                </div>
              ) : <p className="text-xs text-ink-400">No approved club memberships.</p>}
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Teams ({teams.length})</p>
              {teams.length ? (
                <div className="space-y-1.5">
                  {teams.map((team) => (
                    <div key={team._id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-xs dark:bg-white/5">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-ink-800 dark:text-ink-100"><Users size={13} /> {team.name}</span>
                      <span className="text-ink-400">{team.membersCount} members</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-ink-400">Not on a team yet.</p>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

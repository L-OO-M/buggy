import { Link } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  ChevronRight,
  Flame,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi.js';
import {
  achievementsApi,
  challengesApi,
  eventsApi,
  leaderboardsApi,
  registrationsApi,
  teamsApi,
  usersApi,
} from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressBar,
  SectionHeader,
  Skeleton,
  StatCard,
  StatusBadge,
} from '../../components/ui.jsx';
import { formatDate, percent } from '../../utils/format.js';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refresh } = useApi(
    async () => {
      const [stats, registrations, participations, teams, achievements, leaders, events] = await Promise.all([
        usersApi.stats(),
        registrationsApi.mine({ limit: 4, status: 'registered' }),
        challengesApi.participations(),
        teamsApi.mine(),
        achievementsApi.list(),
        leaderboardsApi.me(),
        eventsApi.list({ limit: 3 }),
      ]);
      return { stats, registrations, participations, teams, achievements, leaders, events };
    },
    [],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}</div>
        <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-64 w-full" />)}</div>
      </div>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const stats = data.stats;
  const openParticipations = data.participations.filter((entry) => entry.status === 'active').slice(0, 4);
  const approvedChallenges = data.participations.filter((entry) => entry.status === 'approved');
  const unlocked = data.achievements.achievements.filter((entry) => entry.unlocked).slice(0, 4);
  const nextAchievement = data.achievements.achievements.find((entry) => !entry.unlocked);
  const activeTeam = data.teams.find((team) => team.status === 'active');
  const rank = data.leaders.rank;

  return (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-fuchsia-600 p-6 text-white sm:p-8">
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Student dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Good to see you, {user.name.split(' ')[0]}.</h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              You are <span className="font-semibold text-white">Level {stats.level} · {stats.levelTitle}</span> with a {stats.streak}-day streak.
              {rank ? ` Ranked #${rank.rank} on the global board.` : ' Complete a challenge to enter the rankings.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/challenges" className="btn bg-white text-brand-700 hover:bg-brand-50"><Swords size={15} /> Browse challenges</Link>
              <Link to="/events" className="btn border border-white/25 text-white hover:bg-white/10"><CalendarDays size={15} /> Find an event</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider text-white/60">Points</p>
              <p className="mt-1 font-display text-2xl font-bold">{stats.points}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wider text-white/60">Badges</p>
              <p className="mt-1 font-display text-2xl font-bold">{stats.achievements}</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-white/10 p-3 backdrop-blur">
              <div className="flex items-center justify-between text-[11px] text-white/70">
                <span>Level {stats.level} progress</span>
                <span>{stats.nextLevelAt ? `${stats.nextLevelAt - stats.xp} XP to next` : 'Max level'}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${stats.levelProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Events attended" value={stats.attended} hint={`${stats.registrations} active registrations`} icon={CalendarDays} tone="info" />
        <StatCard label="Challenges complete" value={stats.approved} hint={`${stats.participations} joined overall`} icon={Swords} tone="success" />
        <StatCard label="Clubs joined" value={stats.clubs} hint={activeTeam ? `Team: ${activeTeam.name}` : 'No active team yet'} icon={Users} tone="warning" />
        <StatCard label="Campus rank" value={rank ? `#${rank.rank}` : '—'} hint={rank ? `${rank.score} points` : 'Join a challenge'} icon={Trophy} tone="brand" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeader
            title="Mission progress"
            description="Completed challenges against everything you have joined."
            action={<Link to="/achievements" className="text-xs font-semibold text-brand-600 dark:text-brand-300">Achievements</Link>}
          />
          <div className="rounded-2xl bg-ink-50 p-4 dark:bg-white/5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-display font-bold text-ink-900 dark:text-white">{stats.challengeProgress.percent}%</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{stats.challengeProgress.completed} of {stats.challengeProgress.joined} joined missions approved</p>
              </div>
              <Target size={26} className="text-brand-500" />
            </div>
            <ProgressBar value={stats.challengeProgress.percent} className="mt-3" tone="success" />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Active missions</p>
            {openParticipations.length ? (
              <ul className="space-y-2">
                {openParticipations.map((entry) => (
                  <li key={entry._id}>
                    <Link to={`/challenges/${entry.challenge?._id}`} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 transition hover:border-brand-300 dark:border-white/10">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><Swords size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{entry.challenge?.title}</p>
                        <p className="text-[11px] text-ink-400">Ends {formatDate(entry.challenge?.deadline)} · {entry.submissionCount} submission{entry.submissionCount === 1 ? '' : 's'}</p>
                      </div>
                      <ChevronRight size={16} className="text-ink-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Swords} title="No active missions" description="Join a challenge and start building evidence for your next badge." action={<Link to="/challenges" className="btn-primary btn-sm">Explore challenges</Link>} />
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeader title="Next achievement" action={<Link to="/achievements" className="text-xs font-semibold text-brand-600 dark:text-brand-300">All</Link>} />
            {nextAchievement ? (
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"><Award size={20} /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink-900 dark:text-white">{nextAchievement.title}</p>
                    <p className="text-[11px] text-ink-400">{nextAchievement.description}</p>
                  </div>
                </div>
                <ProgressBar value={nextAchievement.progress} className="mt-3" label={`${nextAchievement.currentValue} / ${nextAchievement.threshold}`} />
              </div>
            ) : <p className="text-sm text-ink-500">All achievements unlocked. Legend status.</p>}
            {unlocked.length ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4 dark:border-white/10">
                {unlocked.map((entry) => (
                  <span key={entry._id} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600 dark:bg-white/10 dark:text-ink-300">
                    <Sparkles size={11} className="text-amber-500" /> {entry.title}
                  </span>
                ))}
              </div>
            ) : null}
          </Card>

          <Card>
            <SectionHeader title="Streak" />
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500 dark:bg-orange-500/10"><Flame size={20} /></span>
              <div>
                <p className="font-display text-2xl font-bold text-ink-900 dark:text-white">{stats.streak} days</p>
                <p className="text-[11px] text-ink-400">Longest streak: {user.longestStreak || stats.streak} days</p>
              </div>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 7 }).map((_, index) => (
                <span key={index} className={`h-2 flex-1 rounded-full ${index < Math.min(7, stats.streak) ? 'bg-orange-400' : 'bg-ink-200 dark:bg-white/10'}`} />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-400">Sign in, register, or complete a mission each day to keep it alive.</p>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Upcoming registrations" action={<Link to="/registrations" className="text-xs font-semibold text-brand-600 dark:text-brand-300">Manage</Link>} />
          {data.registrations.data.length ? (
            <ul className="space-y-2">
              {data.registrations.data.map((registration) => (
                <li key={registration._id}>
                  <Link to={`/events/${registration.event?._id}`} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 hover:border-brand-300 dark:border-white/10">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      <span className="text-[10px] font-bold uppercase">{formatDate(registration.event?.startDate, { month: 'short' })}</span>
                      <span className="font-display text-base font-bold leading-none">{new Date(registration.event?.startDate).getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{registration.event?.title}</p>
                      <p className="text-[11px] text-ink-400">{registration.event?.venue} · <StatusBadge status={registration.status} /></p>
                    </div>
                    <ChevronRight size={16} className="text-ink-300" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={CalendarDays} title="No upcoming events" description="Browse campus events and reserve a seat." action={<Link to="/events" className="btn-secondary btn-sm">Explore events</Link>} />}
        </Card>

        <Card>
          <SectionHeader title="Your team" action={<Link to="/teams" className="text-xs font-semibold text-brand-600 dark:text-brand-300">All teams</Link>} />
          {activeTeam ? (
            <div>
              <div className="flex items-center gap-3">
                <Avatar name={activeTeam.name} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink-900 dark:text-white">{activeTeam.name}</p>
                  <p className="text-[11px] text-ink-400">{activeTeam.membersCount}/{activeTeam.maxSize} members · Led by {activeTeam.leader?.name}</p>
                </div>
                <Link to={`/teams/${activeTeam._id}`} className="btn-secondary btn-sm">Open</Link>
              </div>
              <div className="mt-4 flex gap-2">
                {(activeTeam.members || []).slice(0, 6).map((member) => (
                  <Avatar key={member._id} name={member.name} src={member.avatarUrl} size={32} />
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-ink-50 p-3 text-xs text-ink-500 dark:bg-white/5 dark:text-ink-400">
                Team challenges let you submit one piece of evidence for the whole group. Check the team page for active missions.
              </div>
            </div>
          ) : (
            <EmptyState icon={Users} title="You are not on a team" description="Create a team to take on team challenges with friends." action={<Link to="/teams" className="btn-primary btn-sm">Create a team</Link>} />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <SectionHeader title="Recommended events" action={<Link to="/events" className="text-xs font-semibold text-brand-600 dark:text-brand-300">See all</Link>} />
          <div className="space-y-2">
            {data.events.data.map((event) => (
              <Link key={event._id} to={`/events/${event._id}`} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 hover:border-brand-300 dark:border-white/10">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{event.title}</p>
                  <p className="text-[11px] text-ink-400">{formatDate(event.startDate)} · {event.venue}</p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-400">{percent(event.registrationCount, event.capacity)}% full</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHeader title="Completed missions" description={`${approvedChallenges.length} approved challenge${approvedChallenges.length === 1 ? '' : 's'}.`} />
          {approvedChallenges.length ? (
            <ul className="space-y-2">
              {approvedChallenges.slice(0, 4).map((entry) => (
                <li key={entry._id} className="flex items-center gap-2 rounded-lg bg-ink-50 p-2.5 text-xs dark:bg-white/5">
                  <Zap size={13} className="text-amber-500" />
                  <span className="min-w-0 flex-1 truncate text-ink-700 dark:text-ink-200">{entry.challenge?.title}</span>
                  <span className="font-semibold text-ink-500 dark:text-ink-300">+{entry.challenge?.rewardPoints}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Trophy} title="No completed missions yet" description="Your first approval unlocks points and badges." action={<Button variant="secondary" size="sm" onClick={() => (window.location.href = '/challenges')}>Find a challenge</Button>} />
          )}
        </Card>
      </div>
    </div>
  );
}

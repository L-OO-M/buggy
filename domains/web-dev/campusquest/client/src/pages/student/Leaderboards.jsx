import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Medal, RefreshCw, Trophy, Wifi, WifiOff } from 'lucide-react';
import { leaderboardsApi } from '../../api/index.js';
import { useApi } from '../../hooks/useApi.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
} from '../../components/ui.jsx';
import { CATEGORIES } from '../../utils/constants.js';

const periods = [
  { key: 'global', label: 'All time' },
  { key: 'weekly', label: 'This week' },
  { key: 'monthly', label: 'This month' },
];

const medalStyles = [
  'bg-amber-400 text-ink-950',
  'bg-ink-300 text-ink-900',
  'bg-orange-400 text-white',
];

export default function Leaderboards({ mode = 'individual' }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [period, setPeriod] = useState('global');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [liveAt, setLiveAt] = useState(null);

  const params = mode === 'teams' ? { page, limit: 20 } : { page, limit: 20, period, category: category || undefined };
  const { data, meta, loading, error, refresh } = useApi(
    () => (mode === 'teams' ? leaderboardsApi.teams(params) : leaderboardsApi.individual(params)),
    [mode, period, category, page],
  );
  const { data: me } = useApi(() => leaderboardsApi.me(), []);

  useEffect(() => {
    if (!socket) return undefined;
    const handler = (payload) => {
      setLiveAt(payload.generatedAt || new Date().toISOString());
      if (page === 1 && period === 'global' && !category) refresh();
    };
    socket.emit('leaderboard:subscribe');
    socket.on('leaderboard:update', handler);
    return () => {
      socket.off('leaderboard:update', handler);
      socket.emit('leaderboard:unsubscribe');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, page, period, category]);

  const title = mode === 'teams' ? 'Team leaderboard' : 'Individual leaderboard';

  return (
    <div>
      <PageHeader
        eyebrow="Compete"
        title={title}
        description="Points come from approved challenges, verified event check-ins, club membership, and team creation."
        actions={
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${connected ? 'bg-mint/15 text-emerald-700 dark:text-emerald-300' : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-400'}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />} {connected ? 'Live' : 'Offline'}
            </span>
            <Button variant="secondary" size="sm" onClick={refresh}><RefreshCw size={14} /> Refresh</Button>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
          <Link to="/leaderboards/individual" className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${mode === 'individual' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white'}`}>
            Students
          </Link>
          <Link to="/leaderboards/teams" className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${mode === 'teams' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white'}`}>
            Teams
          </Link>
        </div>
        {mode === 'individual' ? (
          <div className="flex flex-wrap items-center gap-2">
            {periods.map((entry) => (
              <button key={entry.key} type="button" className={`chip ${period === entry.key ? 'chip-active' : ''}`} onClick={() => { setPeriod(entry.key); setPage(1); }}>
                {entry.label}
              </button>
            ))}
            <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Category ranking">
              <option value="">All categories</option>
              {CATEGORIES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
            </Select>
          </div>
        ) : null}
      </div>

      {liveAt ? (
        <p className="mb-3 text-[11px] text-ink-400">Last live update: {new Date(liveAt).toLocaleTimeString()}</p>
      ) : null}

      {mode === 'individual' && me?.rank && page === 1 ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-400/20 dark:bg-brand-500/10">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} src={user?.avatarUrl} size={40} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">Your global position</p>
              <p className="text-sm font-bold text-ink-900 dark:text-white">#{me.rank.rank} · {me.rank.name}</p>
            </div>
          </div>
          <p className="font-display text-2xl font-extrabold text-brand-700 dark:text-brand-200">{me.rank.score} pts</p>
        </div>
      ) : null}

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <div className="space-y-2">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState icon={Trophy} title="No rankings yet" description={mode === 'teams' ? 'Create a team and complete a challenge to enter the board.' : 'Earn your first points by checking into an event or completing a challenge.'} />
      ) : null}

      {!loading && data?.length ? (
        <div className="space-y-2">
          {data.map((entry) => (
            <div
              key={entry.id}
              className={`surface flex items-center gap-3 p-3.5 sm:gap-4 ${entry.id === user?._id ? 'border-brand-300 bg-brand-50/60 dark:border-brand-400/30 dark:bg-brand-500/10' : ''}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold ${entry.rank <= 3 ? medalStyles[entry.rank - 1] : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300'}`}>
                {entry.rank <= 3 ? <Medal size={16} /> : entry.rank}
              </span>
              {mode === 'teams' ? (
                <>
                  <Avatar name={entry.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/leaderboards/teams`} className="truncate text-sm font-bold text-ink-900 dark:text-white">{entry.name}</Link>
                    <p className="text-[11px] text-ink-400">{entry.membersCount} members · {entry.members?.map((member) => member.name).slice(0, 3).join(', ')}</p>
                  </div>
                </>
              ) : (
                <>
                  <Avatar name={entry.name} src={entry.avatarUrl} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink-900 dark:text-white">
                      {entry.name}
                      {entry.rank === 1 ? <Crown size={13} className="text-amber-500" /> : null}
                    </p>
                    <p className="text-[11px] text-ink-400">{entry.levelTitle} · Level {entry.level} · {entry.campus}</p>
                  </div>
                </>
              )}
              <div className="text-right">
                <p className="font-display text-lg font-extrabold text-ink-900 dark:text-white">{entry.score}</p>
                <p className="text-[10px] uppercase tracking-wider text-ink-400">points</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

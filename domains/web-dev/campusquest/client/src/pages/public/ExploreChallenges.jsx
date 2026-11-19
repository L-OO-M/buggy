import { useMemo, useState } from 'react';
import { Search, Swords, X } from 'lucide-react';
import { challengesApi } from '../../api/index.js';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { ChallengeCard } from '../../components/cards.jsx';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, Select, SkeletonGrid } from '../../components/ui.jsx';
import { CATEGORIES, DIFFICULTIES, TEAM_TYPES } from '../../utils/constants.js';

export default function ExploreChallenges() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [openOnly, setOpenOnly] = useState(true);
  const [page, setPage] = useState(1);
  const debounced = useDebounced(query, 350);

  const params = useMemo(
    () => ({
      page,
      limit: 12,
      ...(debounced ? { q: debounced } : {}),
      ...(category ? { category } : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(type ? { type } : {}),
      ...(openOnly ? { open: 'true' } : { open: 'false' }),
    }),
    [page, debounced, category, difficulty, type, openOnly],
  );

  const { data, meta, loading, error, refresh } = useApi(() => challengesApi.list(params), [params]);

  const clear = () => {
    setQuery('');
    setCategory('');
    setDifficulty('');
    setType('');
    setOpenOnly(true);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Missions"
        title="Challenges & quests"
        description="Individual missions and team quests with verified evidence, organizer feedback, and real rewards."
      />

      <div className="surface mb-6 space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-10"
              placeholder="Search challenges..."
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              aria-label="Search challenges"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Category">
              <option value="">Category</option>
              {CATEGORIES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
            </Select>
            <Select value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setPage(1); }} aria-label="Difficulty">
              <option value="">Difficulty</option>
              {DIFFICULTIES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
            </Select>
            <Select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} aria-label="Type">
              <option value="">Type</option>
              {TEAM_TYPES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3 dark:border-white/10">
          {CATEGORIES.slice(0, 5).map((entry) => (
            <button key={entry} type="button" className={`chip ${category === entry ? 'chip-active' : ''}`} onClick={() => { setCategory(category === entry ? '' : entry); setPage(1); }}>
              {entry[0].toUpperCase() + entry.slice(1)}
            </button>
          ))}
          <button type="button" className={`chip ${openOnly ? 'chip-active' : ''}`} onClick={() => { setOpenOnly((value) => !value); setPage(1); }}>
            Open only
          </button>
          {query || category || difficulty || type || !openOnly ? (
            <button type="button" className="chip text-rose-600 dark:text-rose-300" onClick={clear}><X size={13} /> Clear</button>
          ) : null}
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <SkeletonGrid count={6} /> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState icon={Swords} title="No challenges fit those filters" description="Clear a filter or search a broader term. New missions are added by organizers each week." action={<Button variant="secondary" onClick={clear}>Reset filters</Button>} />
      ) : null}
      {!loading && data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((challenge) => <ChallengeCard key={challenge._id} challenge={challenge} />)}
        </div>
      ) : null}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

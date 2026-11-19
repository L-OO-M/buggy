import { useMemo, useState } from 'react';
import { Search, Users, X } from 'lucide-react';
import { clubsApi } from '../../api/index.js';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { ClubCard } from '../../components/cards.jsx';
import { Button, EmptyState, ErrorState, PageHeader, Pagination, Select, SkeletonGrid } from '../../components/ui.jsx';
import { CATEGORIES } from '../../utils/constants.js';

export default function ExploreClubs() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(query, 350);
  const params = useMemo(
    () => ({ page, limit: 12, ...(debounced ? { q: debounced } : {}), ...(category ? { category } : {}) }),
    [page, debounced, category],
  );
  const { data, meta, loading, error, refresh } = useApi(() => clubsApi.list(params), [params]);

  const clear = () => {
    setQuery('');
    setCategory('');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Community"
        title="Campus clubs"
        description="Approved student organizations with real members, events, and challenges. Find the room where you belong."
      />

      <div className="surface mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10"
            placeholder="Search clubs by name or mission..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            aria-label="Search clubs"
          />
        </div>
        <div className="sm:w-56">
          <Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} aria-label="Filter by category">
            <option value="">All categories</option>
            {CATEGORIES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
          </Select>
        </div>
        {query || category ? (
          <Button variant="ghost" onClick={clear}><X size={15} /> Clear</Button>
        ) : null}
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <SkeletonGrid count={6} /> : null}
      {!loading && !error && !data?.length ? (
        <EmptyState icon={Users} title="No clubs found" description="Try a different search or category. Clubs appear here after admin approval." action={<Button variant="secondary" onClick={clear}>Reset</Button>} />
      ) : null}
      {!loading && data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((club) => <ClubCard key={club._id} club={club} />)}
        </div>
      ) : null}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

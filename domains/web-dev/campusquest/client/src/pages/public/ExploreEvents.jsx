import { useMemo, useState } from 'react';
import { CalendarDays, Search, SlidersHorizontal, X } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi.js';
import { eventsApi } from '../../api/index.js';
import { EventCard } from '../../components/cards.jsx';
import { Button, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, SkeletonGrid } from '../../components/ui.jsx';
import { CATEGORIES } from '../../utils/constants.js';

export default function ExploreEvents() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedQuery = useDebounced(query, 350);

  const params = useMemo(
    () => ({
      page,
      limit: 12,
      ...(debouncedQuery ? { q: debouncedQuery } : {}),
      ...(category ? { category } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    [page, debouncedQuery, category, from, to],
  );

  const { data, meta, loading, error, refresh } = useApi(() => eventsApi.list(params), [params]);

  const clear = () => {
    setQuery('');
    setCategory('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const activeFilters = [category, from, to, query].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Discover"
        title="Campus events"
        description="Workshops, tournaments, service days, and nights out. Filter by what fits your week."
        actions={
          <Button variant="secondary" onClick={() => setShowFilters((value) => !value)}>
            <SlidersHorizontal size={16} /> Filters {activeFilters ? `(${activeFilters})` : ''}
          </Button>
        }
      />

      <div className="surface mb-6 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input pl-10"
              placeholder="Search by title, venue, or tag..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              aria-label="Search events"
            />
          </div>
          <Button onClick={() => setShowFilters((value) => !value)} className="sm:hidden">
            <SlidersHorizontal size={16} /> Filters
          </Button>
        </div>

        {showFilters ? (
          <div className="mt-4 grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-3 dark:border-white/10">
            <Select label="Category" name="category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {CATEGORIES.map((entry) => <option key={entry} value={entry}>{entry[0].toUpperCase() + entry.slice(1)}</option>)}
            </Select>
            <Input label="From date" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
            <Input label="To date" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className={`chip ${!category ? 'chip-active' : ''}`} onClick={() => { setCategory(''); setPage(1); }}>
            <CalendarDays size={13} /> All
          </button>
          {CATEGORIES.slice(0, 6).map((entry) => (
            <button
              key={entry}
              type="button"
              className={`chip ${category === entry ? 'chip-active' : ''}`}
              onClick={() => { setCategory(entry); setPage(1); }}
            >
              {entry[0].toUpperCase() + entry.slice(1)}
            </button>
          ))}
          {activeFilters ? (
            <button type="button" className="chip text-rose-600 dark:text-rose-300" onClick={clear}>
              <X size={13} /> Clear
            </button>
          ) : null}
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {loading ? <SkeletonGrid count={6} /> : null}
      {!loading && !error && data?.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events match those filters"
          description="Try a broader date range or clear the category filter. New events are added regularly."
          action={<Button variant="secondary" onClick={clear}>Reset filters</Button>}
        />
      ) : null}
      {!loading && !error && data?.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => <EventCard key={event._id} event={event} />)}
        </div>
      ) : null}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}

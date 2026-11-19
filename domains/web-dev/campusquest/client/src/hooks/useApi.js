import { useCallback, useEffect, useRef, useState } from 'react';

export function useApi(fetcher, deps = [], options = {}) {
  const { immediate = true, initialData = null } = options;
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (!mounted.current) return result;
      if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
        setData(result.data);
        setMeta(result.meta || {});
      } else {
        setData(result);
        setMeta({});
      }
      return result;
    } catch (err) {
      if (mounted.current) setError(err);
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
    return run();
  }, [run]);

  return { data, meta, loading, error, refresh, setData, setMeta };
}

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { getVisitorId } from '@/lib/visitorId';

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

/** Fire-and-forget log of a search query. Never throws; never awaits. */
const logSearch = (query: string, resultCount: number) => {
  try {
    fetch(`${API_URL}/search/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, result_count: resultCount, visitor_id: getVisitorId() }),
      keepalive: true,
    }).catch(() => {
      // Intentionally silent — analytics must never crash search UX.
    });
  } catch {
    // Browser blocked fetch for some reason. Fine.
  }
};

export interface SearchResult {
  id: string;
  name: string;
  slug: string | null;
  image: string;
  price: number;
  category: string;
  rank: number;
  /** Pre-sanitized HTML snippet from FTS5 `snippet()` with `<mark>` tags
   *  around matched terms. Safe for `dangerouslySetInnerHTML` because the
   *  worker builds it from quoted tokens, not raw user input. */
  highlight: string;
}

/**
 * Header product search. Hits the worker's `/search/products` FTS5 endpoint —
 * not the legacy `.or(ilike)` path. The worker owns injection safety + BM25
 * relevance; this hook only handles debouncing + loading state.
 */
export const useProductSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchProducts = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/search/products?q=${encodeURIComponent(trimmed)}&limit=6`
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results: SearchResult[] };
      const nextResults = data.results ?? [];
      setResults(nextResults);
      // Log the search (fire-and-forget). Skip if the server refused the
      // query (empty results can mean rejected-by-sanitizer, still worth
      // logging as "zero result" to surface in the admin miss report).
      logSearch(trimmed, nextResults.length);
    } catch {
      // Network blip — empty results beats a stale list.
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchProducts(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchProducts]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return { query, setQuery, results, isLoading, clearSearch };
};

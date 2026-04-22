import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

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
      setResults(data.results ?? []);
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

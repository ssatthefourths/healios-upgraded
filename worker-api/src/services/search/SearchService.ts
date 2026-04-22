/**
 * The single abstraction callers depend on. No SQL, no field names, no
 * query-builder surface. To add functionality, add a named method here and
 * implement it on a backend — do not widen the public surface by passing
 * raw queries through.
 */
export interface SearchResult {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  price: number;
  image: string;
  /** BM25 rank — lower is better, always <= 0 for FTS5. */
  rank: number;
  /** HTML snippet with `<mark>` tags around matched terms. Safe for innerHTML
   *  because the backend constructs it from quoted tokens. */
  highlight: string;
}

export interface SearchService {
  search(rawQuery: string, opts?: { limit?: number }): Promise<SearchResult[]>;
}

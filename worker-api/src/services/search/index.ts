import type { D1Database } from '@cloudflare/workers-types';
import type { SearchService } from './SearchService';
import { FtsSearchBackend } from './FtsSearchBackend';

export type { SearchService, SearchResult } from './SearchService';

/**
 * Single entry point. Other layers never import a concrete backend —
 * they call this factory and depend on the SearchService interface.
 * Swapping to a hybrid (FTS + Vectorize) or paid backend later is
 * additive here; no caller changes.
 */
export const createSearchService = (db: D1Database): SearchService => {
  return new FtsSearchBackend(db);
};

import type { D1Database } from '@cloudflare/workers-types';
import type { SearchService, SearchResult } from './SearchService';
import { sanitizeQuery } from './sanitizeQuery';

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;

export class FtsSearchBackend implements SearchService {
  constructor(private readonly db: D1Database) {}

  async search(rawQuery: string, opts?: { limit?: number }): Promise<SearchResult[]> {
    const match = sanitizeQuery(rawQuery);
    if (!match) return [];

    const limit = Math.min(Math.max(1, opts?.limit ?? DEFAULT_LIMIT), MAX_LIMIT);

    // Snippet column index 1 = `name` in the FTS5 declaration order
    // (product_id UNINDEXED is index 0). `name` is the highest-signal field
    // to highlight for header-search display.
    const stmt = this.db.prepare(`
      SELECT
        p.id        AS id,
        p.name      AS name,
        p.slug      AS slug,
        p.category  AS category,
        p.price     AS price,
        p.image     AS image,
        bm25(products_fts) AS rank,
        snippet(products_fts, 1, '<mark>', '</mark>', '…', 12) AS highlight
      FROM products_fts
      JOIN products p ON p.id = products_fts.product_id
      WHERE products_fts MATCH ? AND p.is_published = 1
      ORDER BY rank
      LIMIT ?
    `);

    const { results } = await stmt.bind(match, limit).all<SearchResult>();
    return results ?? [];
  }
}

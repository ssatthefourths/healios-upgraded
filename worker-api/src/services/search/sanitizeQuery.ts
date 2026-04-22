/**
 * Turn raw user input into a bounded, injection-safe FTS5 MATCH expression.
 *
 * FTS5 has its own operator syntax (`"phrase"`, `col:term`, `AND`, `OR`, `NOT`,
 * `NEAR/3`, `*` prefix). Letting the user supply raw MATCH text would allow
 * them to inject operators that widen the query. We own the expression
 * construction: tokenize the input ourselves, quote each token, and attach
 * a single trailing `*` for prefix matching.
 *
 * The result is always either `null` (rejected, run empty search) or a
 * string of the form:  "token1"* OR "token2"*  ...
 */

const MAX_QUERY_LEN = 80;
const MAX_TOKENS = 6;
const MIN_TOKEN_LEN = 2;
const MAX_TOKEN_LEN = 32;

// Strip every character that could be interpreted as FTS5 syntax.
// Left-intact: unicode letters, digits, hyphen (for slug-like terms), apostrophe.
const stripFtsSyntax = (raw: string): string =>
  raw
    .replace(/["()*:+\-^~|&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const sanitizeQuery = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > MAX_QUERY_LEN) return null;

  const cleaned = stripFtsSyntax(trimmed);
  if (cleaned.length === 0) return null;

  // Tokenize on whitespace. Drop empty tokens, tokens too short, tokens too long.
  const tokens = cleaned
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= MIN_TOKEN_LEN && t.length <= MAX_TOKEN_LEN)
    .slice(0, MAX_TOKENS);

  if (tokens.length === 0) return null;

  // Each token quoted + prefix star. OR-join so any match surfaces — BM25
  // ranks multi-token matches higher anyway.
  return tokens.map((t) => `"${t.replace(/"/g, '')}"*`).join(' OR ');
};

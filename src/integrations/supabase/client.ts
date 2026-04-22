/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NOT SUPABASE — this is a compatibility alias only.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The project migrated from Supabase to Cloudflare D1 + Workers. To avoid
 * rewriting 60+ files of imports, this module re-exports the Cloudflare
 * client under the identifier `supabase`.
 *
 * What that means in practice:
 *   - Every `supabase.from(...)`, `.rpc(...)`, `.functions.invoke(...)` call
 *     in the codebase routes to https://healios-api.ss-f01.workers.dev
 *     (see src/integrations/cloudflare/client.ts for the real implementation).
 *   - There is NO Supabase project. No Supabase auth, no Supabase DB, no
 *     Supabase edge functions are being hit. The word "supabase" in imports
 *     and variable names is purely a legacy naming choice.
 *   - The folder `supabase/functions/` at the repo root is pre-migration
 *     dead code; it is not deployed and is slated for deletion in a
 *     dedicated rename pass.
 *
 * A future batch will mechanically rename `@/integrations/supabase/client`
 * → `@/integrations/cf/client` and the identifier `supabase` → `cf`
 * across the codebase. Until then, treat any `supabase.*` call you see as
 * "a Cloudflare Worker call wearing an old name tag."
 */
export { cloudflare as supabase } from '@/integrations/cloudflare/client';

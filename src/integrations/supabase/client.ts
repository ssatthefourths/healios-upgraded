/**
 * Cloudflare Worker API Bridge
 * Re-exports the Cloudflare client under the `supabase` alias so all
 * existing imports ( @/integrations/supabase/client ) continue to work
 * without any changes.  Supabase is no longer used — everything routes
 * through the Cloudflare Worker at VITE_CF_WORKER_URL.
 */
export { cloudflare as supabase } from '@/integrations/cloudflare/client';

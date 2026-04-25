/**
 * Healios API Worker Entry Point
 */

import { handleAuth } from './auth';
import { handleProducts } from './products';
import { handleOrders } from './orders';
import { handleWellnessChat } from './wellness-chat';
import { handleCheckout } from './checkout';
import { handleCurrency } from './currency';
import { handleDiscount } from './discount';
import { handleStripeWebhook } from './stripe-webhook';
import { handleBlog } from './blog';
import { handleReviews } from './reviews';
import { handleWellness } from './wellness';
import { handleTable } from './table-handler';
import { handleAdminStats } from './admin-stats';
import { handleAdminUsers } from './admin-users';
import { handleAdminOrders } from './admin-orders';
import { handleBundles } from './bundles';
import { handleUpload } from './upload';
import { handleNewsletter } from './newsletter';
import { handleGiftCards } from './gift-cards';
import { handleSearch } from './search';
import { handleSiteConfig } from './site-config';
import { handleSearchPhrases } from './search-phrases';
import { handleSearchAnalytics } from './search-analytics';
import { handleCertifications } from './certifications';
import { handleDsr } from './dsr';
import { handleSitemap } from './sitemap';
import { pruneExpiredIpHashes } from './utils/client-ip';

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  AI: Ai;
  STRIPE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
  IP_HASH_SECRET: string;
}

// Security headers applied to every worker response. CSP is deferred to H2 —
// it needs careful per-page tuning against Stripe / fonts / analytics.
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function withSecurityHeaders(res: Response): Response {
  // Clone headers so we can mutate them, then unconditionally set our security
  // headers — handlers must not be able to accidentally downgrade these.
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return withSecurityHeaders(new Response(null, { headers: corsHeaders }));
    }

    const response = await handleRequest(request, env, ctx, path, corsHeaders);
    return withSecurityHeaders(response);
  },

  // Daily cron (03:00 UTC) — prune expired IP hashes per retention policy.
  // See worker-api/src/utils/client-ip.ts and docs/SECURITY-IP.md.
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const { deleted } = await pruneExpiredIpHashes(env);
          console.log(`[cron] pruned ${deleted} expired IP hashes`);
        } catch (err) {
          console.error('[cron] prune failed:', err);
        }
      })(),
    );
  },
};

async function handleRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  path: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
    try {
      if (path.startsWith('/auth')) {
        return await handleAuth(request, env, ctx);
      }

      if (path.startsWith('/products')) {
        return await handleProducts(request, env);
      }

      if (path === '/categories' || path === '/categories/') {
        return await handleProducts(request, env);
      }

      if (path.startsWith('/orders')) {
        // Public read-only routes handled by handleOrders (e.g. /orders/by-token/:token).
        if (request.method === 'GET' && path.startsWith('/orders/by-token/')) {
          return await handleOrders(request, env);
        }
        if (request.method === 'GET') return await handleTable(request, env);
        return await handleOrders(request, env);
      }

      if (path === '/wellness-chat') {
        return await handleWellnessChat(request, env);
      }

      if (path === '/checkout-session') {
        return await handleCheckout(request, env);
      }

      if (path === '/search/products') {
        return await handleSearch(request, env);
      }

      if (path === '/public/site-config' || path === '/admin/site-config') {
        return await handleSiteConfig(request, env);
      }

      if (path.startsWith('/public/product/') && path.endsWith('/certifications')) {
        return await handleCertifications(request, env);
      }

      // Dynamic sitemap. Pages routes /sitemap.xml here via _redirects.
      // Filters out coming-soon + unpublished products (was a bug in the
      // static public/sitemap.xml — see docs/LAUNCH-READINESS.md audit).
      if (path === '/sitemap.xml') {
        return await handleSitemap(request, env);
      }

      if (path === '/dsr/request' || path.startsWith('/dsr/verify/') || path.startsWith('/admin/dsr')) {
        return await handleDsr(request, env);
      }

      if (path.startsWith('/admin/search-phrases')) {
        return await handleSearchPhrases(request, env);
      }

      if (
        path === '/search/log' ||
        path === '/search/log-click' ||
        path === '/admin/search-analytics' ||
        path.startsWith('/admin/search-configs')
      ) {
        return await handleSearchAnalytics(request, env);
      }

      if (path === '/currency') {
        return await handleCurrency(request, env);
      }

      if (path === '/validate-discount') {
        return await handleDiscount(request, env);
      }

      if (path === '/stripe-webhook') {
        return await handleStripeWebhook(request, env);
      }

      if (path.startsWith('/blog_posts') || path.startsWith('/blog_categories')) {
        return await handleBlog(request, env);
      }

      if (path.startsWith('/product_reviews')) {
        return await handleReviews(request, env);
      }

      if (path.startsWith('/wellness_posts')) {
        return await handleWellness(request, env);
      }

      if (path === '/admin/stats' && request.method === 'GET') {
        return await handleAdminStats(request, env);
      }

      if (path.startsWith('/admin/orders')) {
        return await handleAdminOrders(request, env);
      }

      if (path.startsWith('/admin/bundles') || path.startsWith('/bundles')) {
        return await handleBundles(request, env);
      }

      if (path === '/admin/upload') {
        return await handleUpload(request, env);
      }

      if (path === '/admin/user-management' && request.method === 'POST') {
        return await handleAdminUsers(request, env);
      }

      if (path === '/newsletter/subscribe') {
        return await handleNewsletter(request, env);
      }

      if (path.startsWith('/gift-cards')) {
        return await handleGiftCards(request, env);
      }

      const TABLE_PATHS = [
        '/profiles', '/addresses', '/wishlist', '/loyalty_points',
        '/loyalty_transactions', '/subscriptions', '/order_items',
        '/newsletter_subscriptions', '/discount_codes', '/users',
        '/product_versions', '/scheduled_newsletters', '/admin_audit_log',
        '/stock_notifications',
      ];
      if (TABLE_PATHS.some(t => path.startsWith(t))) {
        return await handleTable(request, env);
      }

      return new Response('Healios API - Not Found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      console.error(err);
      return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
}

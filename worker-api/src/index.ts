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

export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  AI: Ai;
  STRIPE_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESEND_API_KEY: string;
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
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (path.startsWith('/auth')) {
        return await handleAuth(request, env);
      }

      if (path.startsWith('/products')) {
        return await handleProducts(request, env);
      }

      if (path === '/categories' || path === '/categories/') {
        return await handleProducts(request, env);
      }

      if (path.startsWith('/orders')) {
        if (request.method === 'GET') return await handleTable(request, env);
        return await handleOrders(request, env);
      }

      if (path === '/wellness-chat') {
        return await handleWellnessChat(request, env);
      }

      if (path === '/checkout-session') {
        return await handleCheckout(request, env);
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
  },
};

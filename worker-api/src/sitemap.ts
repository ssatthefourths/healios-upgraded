import type { Env } from './index';

/**
 * Dynamic sitemap.xml — the static one lived at public/sitemap.xml and
 * baked-in 18 product URLs even when only ~5 were truly live, so coming-soon
 * products were leaking into search-engine indexes (flagged in
 * docs/LAUNCH-READINESS.md, 2026-04-25 audit).
 *
 * This route queries D1 for the actual `is_published=1 AND is_coming_soon=0`
 * set so the sitemap always reflects the live catalogue. Cached for 1 hour
 * per PoP — sitemap changes are rare, daily cron + manual refresh both
 * cover us.
 *
 * Pages routes /sitemap.xml here via public/_redirects. The static file
 * has been removed.
 */

const SITE = 'https://www.thehealios.com';

const STATIC_URLS: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/',                          priority: '1.0', changefreq: 'weekly' },
  { path: '/blog',                      priority: '0.8', changefreq: 'daily' },
  // Category pages
  { path: '/category/all',              priority: '0.9', changefreq: 'weekly' },
  { path: '/category/vitamins-minerals',priority: '0.8', changefreq: 'weekly' },
  { path: '/category/adaptogens',       priority: '0.8', changefreq: 'weekly' },
  { path: '/category/digestive-health', priority: '0.8', changefreq: 'weekly' },
  { path: '/category/sleep-relaxation', priority: '0.8', changefreq: 'weekly' },
  { path: '/category/beauty',           priority: '0.8', changefreq: 'weekly' },
  { path: '/category/womens-health',    priority: '0.8', changefreq: 'weekly' },
  { path: '/category/bundles',          priority: '0.8', changefreq: 'weekly' },
  // About
  { path: '/about/our-story',           priority: '0.7', changefreq: 'monthly' },
  { path: '/about/quality-sourcing',    priority: '0.7', changefreq: 'monthly' },
  { path: '/about/product-guide',       priority: '0.7', changefreq: 'monthly' },
  { path: '/about/customer-care',       priority: '0.7', changefreq: 'monthly' },
  { path: '/about/wholesale',           priority: '0.7', changefreq: 'monthly' },
  // Support
  { path: '/faq',                       priority: '0.7', changefreq: 'monthly' },
  { path: '/wellness-drive',            priority: '0.6', changefreq: 'monthly' },
  { path: '/subscribe',                 priority: '0.7', changefreq: 'monthly' },
  // Legal
  { path: '/privacy-policy',            priority: '0.5', changefreq: 'yearly' },
  { path: '/terms-of-service',          priority: '0.5', changefreq: 'yearly' },
  { path: '/shipping-returns',          priority: '0.5', changefreq: 'yearly' },
];

const xmlEscape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const isoDate = (date: Date | string | null | undefined): string => {
  if (!date) return new Date().toISOString().slice(0, 10);
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

export async function handleSitemap(_request: Request, env: Env): Promise<Response> {
  // Live catalogue — only published, non-coming-soon products. Bundles include
  // both is_bundle and the is_published gate (bundles are unpublished today,
  // so they automatically stay off the sitemap until Monique ships them).
  const { results } = await env.DB.prepare(
    `SELECT slug, id, updated_at, is_bundle
     FROM products
     WHERE is_published = 1 AND is_coming_soon = 0
     ORDER BY sort_order ASC, name ASC`,
  ).all<{ slug: string; id: string; updated_at: string | null; is_bundle: number }>();

  const products = results ?? [];

  const today = new Date().toISOString().slice(0, 10);

  const urls: string[] = [];

  // Static pages
  for (const u of STATIC_URLS) {
    urls.push(
      `  <url>\n    <loc>${SITE}${u.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    );
  }

  // Live products
  for (const p of products) {
    const slug = p.slug || p.id;
    urls.push(
      `  <url>\n    <loc>${SITE}/product/${xmlEscape(slug)}</loc>\n    <lastmod>${isoDate(p.updated_at)}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // 1h per PoP; sitemap changes rarely. Manual cache-bust = redeploy.
      'Cache-Control': 'public, s-maxage=3600, max-age=300',
    },
  });
}

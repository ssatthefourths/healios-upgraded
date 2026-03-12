import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE_URL = "https://www.thehealios.com";

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Generating dynamic sitemap...");

  // Fetch all published products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, slug, updated_at, category")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  // Fetch all published blog posts
  const { data: blogPosts, error: blogError } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (blogError) {
    console.error("Error fetching blog posts:", blogError);
  }

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/blog", priority: "0.8", changefreq: "daily" },
    { loc: "/category/all", priority: "0.9", changefreq: "weekly" },
    { loc: "/category/vitamins-minerals", priority: "0.8", changefreq: "weekly" },
    { loc: "/category/adaptogens", priority: "0.8", changefreq: "weekly" },
    { loc: "/category/digestive-health", priority: "0.8", changefreq: "weekly" },
    { loc: "/category/sleep-relaxation", priority: "0.8", changefreq: "weekly" },
    { loc: "/category/beauty", priority: "0.8", changefreq: "weekly" },
    { loc: "/category/womens-health", priority: "0.8", changefreq: "weekly" },
    { loc: "/category/bundles", priority: "0.8", changefreq: "weekly" },
    { loc: "/about/our-story", priority: "0.7", changefreq: "monthly" },
    { loc: "/about/quality-sourcing", priority: "0.7", changefreq: "monthly" },
    { loc: "/about/product-guide", priority: "0.7", changefreq: "monthly" },
    { loc: "/about/customer-care", priority: "0.7", changefreq: "monthly" },
    { loc: "/about/wholesale", priority: "0.7", changefreq: "monthly" },
    { loc: "/faq", priority: "0.7", changefreq: "monthly" },
    { loc: "/wellness-drive", priority: "0.6", changefreq: "monthly" },
    { loc: "/subscribe", priority: "0.7", changefreq: "monthly" },
    { loc: "/privacy-policy", priority: "0.5", changefreq: "yearly" },
    { loc: "/terms-of-service", priority: "0.5", changefreq: "yearly" },
    { loc: "/shipping-returns", priority: "0.5", changefreq: "yearly" },
  ];

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  const today = new Date().toISOString().split("T")[0];
  for (const page of staticPages) {
    xml += `  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  // Add product pages
  if (products && products.length > 0) {
    for (const product of products) {
      const slug = product.slug || product.id;
      const lastmod = product.updated_at 
        ? new Date(product.updated_at).toISOString().split("T")[0]
        : today;
      
      xml += `  <url>
    <loc>${SITE_URL}/product/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
    console.log(`Added ${products.length} products to sitemap`);
  }

  // Add blog posts
  if (blogPosts && blogPosts.length > 0) {
    for (const post of blogPosts) {
      const lastmod = post.updated_at 
        ? new Date(post.updated_at).toISOString().split("T")[0]
        : post.published_at
        ? new Date(post.published_at).toISOString().split("T")[0]
        : today;
      
      xml += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
    console.log(`Added ${blogPosts.length} blog posts to sitemap`);
  }

  xml += `</urlset>`;

  console.log("Sitemap generated successfully");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
});

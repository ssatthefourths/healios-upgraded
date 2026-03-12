import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - prevents cross-origin attacks
const ALLOWED_ORIGINS = [
  Deno.env.get("ALLOWED_ORIGIN") || "https://www.thehealios.com",
  "https://healios.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
};

// Default CORS headers for backwards compatibility
const corsHeaders = getCorsHeaders(null);

interface ProductPerformance {
  product_id: string;
  product_name: string;
  views: number;
  add_to_carts: number;
  purchases: number;
  conversion_rate: number;
  previous_views: number;
  view_change_percent: number;
}

interface Alert {
  type: "trending" | "underperforming" | "declining";
  product_name: string;
  product_id: string;
  reason: string;
  metrics: Record<string, number | string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date ranges
    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // Previous 7 days

    // Fetch current period analytics
    const { data: currentAnalytics, error: currentError } = await supabase
      .from("product_analytics")
      .select("product_id, event_type")
      .gte("created_at", currentPeriodStart.toISOString())
      .lt("created_at", now.toISOString());

    if (currentError) throw currentError;

    // Fetch previous period analytics
    const { data: previousAnalytics, error: previousError } = await supabase
      .from("product_analytics")
      .select("product_id, event_type")
      .gte("created_at", previousPeriodStart.toISOString())
      .lt("created_at", currentPeriodStart.toISOString());

    if (previousError) throw previousError;

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .eq("is_published", true);

    if (productsError) throw productsError;

    // Aggregate current period metrics
    const currentMetrics = new Map<string, { views: number; add_to_carts: number; purchases: number }>();
    for (const event of currentAnalytics || []) {
      const existing = currentMetrics.get(event.product_id) || { views: 0, add_to_carts: 0, purchases: 0 };
      if (event.event_type === "view") existing.views++;
      if (event.event_type === "add_to_cart") existing.add_to_carts++;
      if (event.event_type === "purchase") existing.purchases++;
      currentMetrics.set(event.product_id, existing);
    }

    // Aggregate previous period metrics
    const previousMetrics = new Map<string, { views: number }>();
    for (const event of previousAnalytics || []) {
      if (event.event_type === "view") {
        const existing = previousMetrics.get(event.product_id) || { views: 0 };
        existing.views++;
        previousMetrics.set(event.product_id, existing);
      }
    }

    // Calculate performance for each product
    const productPerformance: ProductPerformance[] = [];
    for (const product of products || []) {
      const current = currentMetrics.get(product.id) || { views: 0, add_to_carts: 0, purchases: 0 };
      const previous = previousMetrics.get(product.id) || { views: 0 };
      
      const conversionRate = current.views > 0 ? (current.purchases / current.views) * 100 : 0;
      const viewChangePercent = previous.views > 0 
        ? ((current.views - previous.views) / previous.views) * 100 
        : current.views > 0 ? 100 : 0;

      productPerformance.push({
        product_id: product.id,
        product_name: product.name,
        views: current.views,
        add_to_carts: current.add_to_carts,
        purchases: current.purchases,
        conversion_rate: conversionRate,
        previous_views: previous.views,
        view_change_percent: viewChangePercent,
      });
    }

    // Identify alerts
    const alerts: Alert[] = [];

    // Calculate averages for comparison
    const avgViews = productPerformance.reduce((sum, p) => sum + p.views, 0) / productPerformance.length || 1;
    const avgConversion = productPerformance.reduce((sum, p) => sum + p.conversion_rate, 0) / productPerformance.length || 1;

    for (const product of productPerformance) {
      // Trending: High views (2x average) and good conversion
      if (product.views >= avgViews * 2 && product.conversion_rate >= avgConversion) {
        alerts.push({
          type: "trending",
          product_name: product.product_name,
          product_id: product.product_id,
          reason: "High traffic with strong conversion",
          metrics: {
            views: product.views,
            conversion_rate: `${product.conversion_rate.toFixed(1)}%`,
            purchases: product.purchases,
          },
        });
      }

      // Declining: Views dropped by more than 50% compared to previous period
      if (product.previous_views >= 10 && product.view_change_percent <= -50) {
        alerts.push({
          type: "declining",
          product_name: product.product_name,
          product_id: product.product_id,
          reason: "Significant drop in views from previous week",
          metrics: {
            current_views: product.views,
            previous_views: product.previous_views,
            change: `${product.view_change_percent.toFixed(0)}%`,
          },
        });
      }

      // Underperforming: Has views but very low conversion (below 25% of average)
      if (product.views >= 20 && product.conversion_rate < avgConversion * 0.25 && product.purchases === 0) {
        alerts.push({
          type: "underperforming",
          product_name: product.product_name,
          product_id: product.product_id,
          reason: "High views but no conversions",
          metrics: {
            views: product.views,
            add_to_carts: product.add_to_carts,
            purchases: product.purchases,
          },
        });
      }
    }

    console.log(`Found ${alerts.length} performance alerts`);

    // If there are alerts and we have Resend configured, send email
    if (alerts.length > 0 && resendApiKey) {
      // Fetch admin emails
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map((r) => r.user_id);
        
        const { data: adminUsers } = await supabase.auth.admin.listUsers();
        const adminEmails = adminUsers?.users
          ?.filter((u) => adminIds.includes(u.id))
          ?.map((u) => u.email)
          ?.filter(Boolean) as string[];

        if (adminEmails && adminEmails.length > 0) {
          const trendingAlerts = alerts.filter((a) => a.type === "trending");
          const decliningAlerts = alerts.filter((a) => a.type === "declining");
          const underperformingAlerts = alerts.filter((a) => a.type === "underperforming");

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
                .section { margin: 20px 0; padding: 15px; border-radius: 8px; }
                .trending { background: #dcfce7; border-left: 4px solid #22c55e; }
                .declining { background: #fef3c7; border-left: 4px solid #f59e0b; }
                .underperforming { background: #fee2e2; border-left: 4px solid #ef4444; }
                .alert-item { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
                .metrics { font-size: 12px; color: #666; margin-top: 5px; }
                h2 { margin: 0 0 10px 0; font-size: 16px; }
                h3 { margin: 0; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Product Performance Alerts</h1>
                  <p>Weekly summary for Healios</p>
                </div>
                
                ${trendingAlerts.length > 0 ? `
                  <div class="section trending">
                    <h2>🚀 Trending Products (${trendingAlerts.length})</h2>
                    ${trendingAlerts.map((a) => `
                      <div class="alert-item">
                        <h3>${a.product_name}</h3>
                        <p>${a.reason}</p>
                        <div class="metrics">
                          ${Object.entries(a.metrics).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" | ")}
                        </div>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
                
                ${decliningAlerts.length > 0 ? `
                  <div class="section declining">
                    <h2>⚠️ Declining Products (${decliningAlerts.length})</h2>
                    ${decliningAlerts.map((a) => `
                      <div class="alert-item">
                        <h3>${a.product_name}</h3>
                        <p>${a.reason}</p>
                        <div class="metrics">
                          ${Object.entries(a.metrics).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" | ")}
                        </div>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
                
                ${underperformingAlerts.length > 0 ? `
                  <div class="section underperforming">
                    <h2>🔴 Underperforming Products (${underperformingAlerts.length})</h2>
                    ${underperformingAlerts.map((a) => `
                      <div class="alert-item">
                        <h3>${a.product_name}</h3>
                        <p>${a.reason}</p>
                        <div class="metrics">
                          ${Object.entries(a.metrics).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join(" | ")}
                        </div>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
                
                <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                  View detailed analytics in your <a href="https://www.thehealios.com/admin/analytics">Admin Dashboard</a>
                </p>
              </div>
            </body>
            </html>
          `;

          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Healios <hello@thehealios.com>",
              to: adminEmails,
              subject: `Product Performance Alert: ${alerts.length} items need attention`,
              html: emailHtml,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error("Failed to send email:", errorText);
          } else {
            console.log(`Performance alert email sent to ${adminEmails.length} admins`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_count: alerts.length,
        alerts 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in product-performance-alerts:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

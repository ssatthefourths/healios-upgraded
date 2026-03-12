import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

interface ProductChangeRequest {
  product_id: string;
  product_name: string;
  action: "create" | "update" | "delete";
  changed_by_email?: string;
  changes?: Record<string, any>;
}

const sendEmail = async (to: string[], subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Healios <hello@thehealios.com>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: verify_jwt = false — validate JWT in code
  // Reason: Product change notifications require admin role
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const authClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check admin role
  const userId = claimsData.claims.sub as string;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminCheckClient = createClient(supabaseUrl, supabaseServiceKey);
  const { data: isAdmin } = await adminCheckClient.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { product_id, product_name, action, changed_by_email, changes }: ProductChangeRequest = await req.json();

    console.log(`Processing product change notification: ${action} for ${product_name}`);

    // Create Supabase client to fetch admin emails
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch admin emails from auth.users
    const adminIds = adminRoles.map((r) => r.user_id);
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    const adminEmails = users
      .filter((user) => adminIds.includes(user.id) && user.email)
      .map((user) => user.email!);

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(JSON.stringify({ message: "No admin emails found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending notifications to ${adminEmails.length} admin(s)`);

    // Format action text
    const actionText = action === "create" ? "created" : action === "update" ? "updated" : "deleted";
    
    // Format changes for email
    let changesHtml = "";
    if (changes && Object.keys(changes).length > 0) {
      const changedFields = Object.keys(changes).slice(0, 10);
      changesHtml = `
        <h3 style="color: #333; margin-top: 20px;">Fields Changed:</h3>
        <ul style="color: #666;">
          ${changedFields.map((field) => `<li>${field}</li>`).join("")}
        </ul>
        ${Object.keys(changes).length > 10 ? `<p style="color: #888; font-size: 12px;">... and ${Object.keys(changes).length - 10} more fields</p>` : ""}
      `;
    }

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
          Product ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}
        </h1>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #666;"><strong>Product:</strong> ${product_name}</p>
          <p style="margin: 10px 0 0; color: #666;"><strong>Product ID:</strong> ${product_id}</p>
          ${changed_by_email ? `<p style="margin: 10px 0 0; color: #666;"><strong>Changed by:</strong> ${changed_by_email}</p>` : ""}
          <p style="margin: 10px 0 0; color: #666;"><strong>Time:</strong> ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}</p>
        </div>
        
        ${changesHtml}
        
        <p style="margin-top: 30px;">
          <a href="https://www.thehealios.com/admin/products" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Products
          </a>
        </p>
        
        <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          This is an automated notification from Healios Admin.
        </p>
      </div>
    `;

    const emailResponse = await sendEmail(
      adminEmails,
      `Product ${actionText}: ${product_name}`,
      html
    );

    console.log("Notification emails sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, sent_to: adminEmails.length }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-product-change function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  action: 
    | "list_users" 
    | "list_admins" 
    | "add_admin" 
    | "remove_admin" 
    | "send_password_reset" 
    | "delete_user" 
    | "invite_user";
  target_user_id?: string;
  target_email?: string;
  make_admin?: boolean;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 100; // 100 ops per hour per admin
const MAX_SENSITIVE_OPS_PER_WINDOW = 20; // 20 sensitive ops (delete, add_admin, remove_admin) per hour

// In-memory rate limit store (resets on function cold start)
// For production, consider using a database table or Redis
const rateLimitStore = new Map<string, { count: number; sensitiveCount: number; windowStart: number }>();

function checkRateLimit(userId: string, isSensitiveOp: boolean): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);

  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(userId, { 
      count: 1, 
      sensitiveCount: isSensitiveOp ? 1 : 0, 
      windowStart: now 
    });
    return { allowed: true };
  }

  // Check total requests
  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return { 
      allowed: false, 
      reason: `Rate limit exceeded: max ${MAX_REQUESTS_PER_WINDOW} operations per hour` 
    };
  }

  // Check sensitive operations limit
  if (isSensitiveOp && userLimit.sensitiveCount >= MAX_SENSITIVE_OPS_PER_WINDOW) {
    return { 
      allowed: false, 
      reason: `Rate limit exceeded: max ${MAX_SENSITIVE_OPS_PER_WINDOW} sensitive operations per hour` 
    };
  }

  // Increment counters
  userLimit.count++;
  if (isSensitiveOp) {
    userLimit.sensitiveCount++;
  }
  rateLimitStore.set(userId, userLimit);

  return { allowed: true };
}

function isSensitiveAction(action: string): boolean {
  return ['delete_user', 'add_admin', 'remove_admin', 'invite_user'].includes(action);
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the calling user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using has_role function
    const { data: isAdmin, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      console.log("Admin check failed:", roleError, isAdmin);
      return new Response(
        JSON.stringify({ error: "Access denied. Admin role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body early to check rate limiting for action type
    const body: RequestBody = await req.json();
    const { action, target_user_id, target_email, make_admin } = body;

    // Apply rate limiting
    const rateLimitResult = checkRateLimit(user.id, isSensitiveAction(action));
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for admin ${user.email}: ${rateLimitResult.reason}`);
      return new Response(
        JSON.stringify({ error: rateLimitResult.reason }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Admin ${user.email} performing action: ${action}`);

    // Helper to log audit events
    const logAudit = async (actionName: string, targetId?: string, targetMail?: string, metadata?: Record<string, unknown>) => {
      await adminClient.from("admin_audit_log").insert({
        admin_user_id: user.id,
        action: actionName,
        target_user_id: targetId || null,
        target_email: targetMail || null,
        metadata: metadata || {},
      });
    };

    switch (action) {
      case "list_users": {
        // Get all users from auth.users via admin API
        const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers({
          perPage: 1000,
        });

        if (listError) {
          console.error("Error listing users:", listError);
          return new Response(
            JSON.stringify({ error: "Failed to list users" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get profiles
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("id, first_name, last_name");

        // Get roles
        const { data: roles } = await adminClient
          .from("user_roles")
          .select("user_id, role");

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const rolesMap = new Map<string, string[]>();
        roles?.forEach(r => {
          const existing = rolesMap.get(r.user_id) || [];
          existing.push(r.role);
          rolesMap.set(r.user_id, existing);
        });

        const users = authUsers.users.map(u => ({
          id: u.id,
          email: u.email,
          first_name: profilesMap.get(u.id)?.first_name || null,
          last_name: profilesMap.get(u.id)?.last_name || null,
          roles: rolesMap.get(u.id) || [],
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
        }));

        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "list_admins": {
        const { data: adminRoles, error: rolesError } = await adminClient
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (rolesError) {
          return new Response(
            JSON.stringify({ error: "Failed to list admins" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const adminIds = adminRoles?.map(r => r.user_id) || [];
        
        // Get user details for admins
        const admins = [];
        for (const adminId of adminIds) {
          const { data: userData } = await adminClient.auth.admin.getUserById(adminId);
          const { data: profile } = await adminClient
            .from("profiles")
            .select("first_name, last_name")
            .eq("id", adminId)
            .single();

          if (userData?.user) {
            admins.push({
              id: userData.user.id,
              email: userData.user.email,
              first_name: profile?.first_name || null,
              last_name: profile?.last_name || null,
              created_at: userData.user.created_at,
            });
          }
        }

        return new Response(
          JSON.stringify({ admins }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add_admin": {
        if (!target_user_id) {
          return new Response(
            JSON.stringify({ error: "target_user_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: insertError } = await adminClient
          .from("user_roles")
          .insert({ user_id: target_user_id, role: "admin" });

        if (insertError) {
          if (insertError.code === "23505") {
            return new Response(
              JSON.stringify({ error: "User is already an admin" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.error("Error adding admin:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to add admin role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAudit("add_admin", target_user_id, target_email);

        return new Response(
          JSON.stringify({ success: true, message: "Admin role added" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "remove_admin": {
        if (!target_user_id) {
          return new Response(
            JSON.stringify({ error: "target_user_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-removal
        if (target_user_id === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot remove your own admin role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if this would leave no admins
        const { count } = await adminClient
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");

        if (count && count <= 1) {
          return new Response(
            JSON.stringify({ error: "Cannot remove the last admin" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: deleteError } = await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", target_user_id)
          .eq("role", "admin");

        if (deleteError) {
          console.error("Error removing admin:", deleteError);
          return new Response(
            JSON.stringify({ error: "Failed to remove admin role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAudit("remove_admin", target_user_id, target_email);

        return new Response(
          JSON.stringify({ success: true, message: "Admin role removed" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_password_reset": {
        if (!target_email) {
          return new Response(
            JSON.stringify({ error: "target_email required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
          target_email,
          { redirectTo: `${req.headers.get("origin")}/auth?mode=reset` }
        );

        if (resetError) {
          console.error("Error sending reset:", resetError);
          return new Response(
            JSON.stringify({ error: "Failed to send password reset email" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAudit("send_password_reset", target_user_id, target_email);

        return new Response(
          JSON.stringify({ success: true, message: "Password reset email sent" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete_user": {
        if (!target_user_id) {
          return new Response(
            JSON.stringify({ error: "target_user_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent self-deletion
        if (target_user_id === user.id) {
          return new Response(
            JSON.stringify({ error: "Cannot delete your own account from admin panel" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user email for logging before deletion
        const { data: targetUser } = await adminClient.auth.admin.getUserById(target_user_id);
        const targetEmailForLog = targetUser?.user?.email;

        const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id);

        if (deleteError) {
          console.error("Error deleting user:", deleteError);
          return new Response(
            JSON.stringify({ error: "Failed to delete user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAudit("delete_user", target_user_id, targetEmailForLog);

        return new Response(
          JSON.stringify({ success: true, message: "User deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "invite_user": {
        if (!target_email) {
          return new Response(
            JSON.stringify({ error: "target_email required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
          target_email,
          { redirectTo: `${req.headers.get("origin")}/auth` }
        );

        if (inviteError) {
          console.error("Error inviting user:", inviteError);
          return new Response(
            JSON.stringify({ error: inviteError.message || "Failed to invite user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // If make_admin is true, add admin role
        if (make_admin && inviteData.user) {
          await adminClient
            .from("user_roles")
            .insert({ user_id: inviteData.user.id, role: "admin" });
        }

        await logAudit("invite_user", inviteData.user?.id, target_email, { make_admin });

        return new Response(
          JSON.stringify({ success: true, message: "Invitation sent", user_id: inviteData.user?.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in admin-user-management:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

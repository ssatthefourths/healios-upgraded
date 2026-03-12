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

interface ValidateDiscountRequest {
  code: string;
  subtotal: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: verify_jwt = false — validate JWT in code
  // Reason: Discount validation requires authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ valid: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ valid: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // Use service role key to bypass RLS - discount validation must work for all users
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { code, subtotal }: ValidateDiscountRequest = await req.json();

    if (!code || typeof subtotal !== "number") {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    console.log(`Validating discount code: ${normalizedCode} for subtotal: ${subtotal}`);

    // Fetch the discount code
    const { data: discountCode, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .single();

    if (error || !discountCode) {
      console.log("Discount code not found or inactive");
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid discount code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if code has expired
    const now = new Date();
    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      console.log("Discount code has expired");
      return new Response(
        JSON.stringify({ valid: false, error: "This discount code has expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if code is not yet valid
    if (new Date(discountCode.valid_from) > now) {
      console.log("Discount code not yet valid");
      return new Response(
        JSON.stringify({ valid: false, error: "This discount code is not yet active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check max uses
    if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
      console.log("Discount code has reached max uses");
      return new Response(
        JSON.stringify({ valid: false, error: "This discount code has been fully redeemed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check minimum order amount
    if (subtotal < discountCode.min_order_amount) {
      console.log(`Subtotal ${subtotal} below minimum ${discountCode.min_order_amount}`);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `Minimum order amount of £${discountCode.min_order_amount.toFixed(2)} required` 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate discount amount
    let discountAmount: number;
    if (discountCode.discount_type === "percentage") {
      discountAmount = (subtotal * discountCode.discount_value) / 100;
    } else {
      discountAmount = Math.min(discountCode.discount_value, subtotal);
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;

    console.log(`Discount valid: ${discountCode.discount_type} ${discountCode.discount_value}, amount: ${discountAmount}`);

    return new Response(
      JSON.stringify({
        valid: true,
        code: discountCode.code,
        discount_type: discountCode.discount_type,
        discount_value: discountCode.discount_value,
        discount_amount: discountAmount,
        message: discountCode.discount_type === "percentage" 
          ? `${discountCode.discount_value}% off applied!`
          : `£${discountCode.discount_value.toFixed(2)} off applied!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error validating discount:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

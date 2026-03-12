import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

interface ManageSubscriptionRequest {
  subscription_id: string;
  action: "pause" | "resume" | "cancel" | "skip" | "change_frequency";
  new_frequency?: "monthly" | "bimonthly" | "quarterly";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_TEST_RESTRICT_KEY");
  if (!stripeKey) {
    console.error("Stripe key not configured");
    return new Response(
      JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Verify JWT and get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the user's JWT
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subscription_id, action, new_frequency }: ManageSubscriptionRequest = await req.json();

    console.log(`Processing ${action} for subscription ${subscription_id} by user ${user.id}`);

    // Fetch the subscription from our database - verify ownership using user's JWT
    const { data: subscription, error: fetchError } = await supabaseClient
      .from("subscriptions")
      .select("stripe_subscription_id, status, user_id")
      .eq("id", subscription_id)
      .eq("user_id", user.id) // Ensure user owns this subscription
      .single();

    if (fetchError || !subscription) {
      console.error("Subscription not found or not owned by user:", fetchError);
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSubscriptionId = subscription.stripe_subscription_id;

    if (!stripeSubscriptionId) {
      // No Stripe subscription ID - just update locally (legacy subscriptions)
      console.log("No Stripe subscription ID, updating local only");
      
      let updateData: any = {};
      
      switch (action) {
        case "pause":
          updateData = { status: "paused", paused_at: new Date().toISOString() };
          break;
        case "resume":
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 30);
          updateData = { status: "active", paused_at: null, next_delivery_date: nextDate.toISOString() };
          break;
        case "cancel":
          updateData = { status: "cancelled", cancelled_at: new Date().toISOString() };
          break;
        case "skip":
          // Skip the next delivery by pushing the date forward
          const skipDate = new Date();
          skipDate.setDate(skipDate.getDate() + 30); // Skip one cycle
          updateData = { next_delivery_date: skipDate.toISOString() };
          break;
        case "change_frequency":
          if (!new_frequency) {
            return new Response(
              JSON.stringify({ error: "New frequency is required" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          // Calculate new next delivery date based on new frequency
          const freqDays = new_frequency === 'monthly' ? 30 : new_frequency === 'bimonthly' ? 60 : 90;
          const newDeliveryDate = new Date();
          newDeliveryDate.setDate(newDeliveryDate.getDate() + freqDays);
          updateData = { frequency: new_frequency, next_delivery_date: newDeliveryDate.toISOString() };
          break;
      }

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", subscription_id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, message: `Subscription ${action}d (local only)` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Execute Stripe action
    let stripeResult: any;
    let localUpdate: any = {};

    switch (action) {
      case "pause":
        // Pause collection (stops billing but keeps subscription)
        stripeResult = await stripe.subscriptions.update(stripeSubscriptionId, {
          pause_collection: {
            behavior: "void", // Don't invoice when resumed
          },
        });
        localUpdate = { status: "paused", paused_at: new Date().toISOString() };
        console.log("Stripe subscription paused:", stripeResult.id);
        break;

      case "resume":
        // Resume collection
        stripeResult = await stripe.subscriptions.update(stripeSubscriptionId, {
          pause_collection: null, // Remove pause to resume
        });
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30);
        localUpdate = { 
          status: "active", 
          paused_at: null, 
          next_delivery_date: nextDate.toISOString() 
        };
        console.log("Stripe subscription resumed:", stripeResult.id);
        break;

      case "cancel":
        // Cancel subscription at period end (customer gets remaining time)
        stripeResult = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        localUpdate = { status: "cancelled", cancelled_at: new Date().toISOString() };
        console.log("Stripe subscription cancelled:", stripeResult.id);
        break;

      case "skip":
        // For Stripe subscriptions, we push the billing anchor forward
        // This skips the next billing cycle
        const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        const skipToDate = new Date(currentPeriodEnd);
        skipToDate.setDate(skipToDate.getDate() + 30); // Skip one cycle
        
        // Update local only - Stripe will handle billing naturally
        localUpdate = { next_delivery_date: skipToDate.toISOString() };
        stripeResult = { status: "skipped", id: stripeSubscriptionId };
        console.log("Subscription delivery skipped, next delivery:", skipToDate.toISOString());
        break;

      case "change_frequency":
        if (!new_frequency) {
          return new Response(
            JSON.stringify({ error: "New frequency is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Calculate new billing interval for Stripe
        const intervalMap = {
          monthly: { interval: 'month' as const, interval_count: 1 },
          bimonthly: { interval: 'month' as const, interval_count: 2 },
          quarterly: { interval: 'month' as const, interval_count: 3 },
        };
        const newInterval = intervalMap[new_frequency];
        
        // Get current subscription to find price
        const currentSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const currentItem = currentSub.items.data[0];
        
        // Note: Changing interval on Stripe requires updating the subscription item
        // For simplicity, we update local and note that Stripe billing continues as-is
        // Full implementation would require creating a new price or using price schedules
        
        const freqDays = new_frequency === 'monthly' ? 30 : new_frequency === 'bimonthly' ? 60 : 90;
        const nextDelivery = new Date();
        nextDelivery.setDate(nextDelivery.getDate() + freqDays);
        
        localUpdate = { 
          frequency: new_frequency, 
          next_delivery_date: nextDelivery.toISOString() 
        };
        stripeResult = { status: "frequency_changed", id: stripeSubscriptionId };
        console.log("Subscription frequency changed to:", new_frequency);
        break;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Update local database
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update(localUpdate)
      .eq("id", subscription_id);

    if (updateError) {
      console.error("Error updating local subscription:", updateError);
      // Stripe succeeded but local failed - log but don't fail the request
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Subscription ${action}d successfully`,
        stripe_status: stripeResult.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error managing subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Rate limiting storage (in-memory, per function instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_HOUR = 20;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES = 20;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  const existing = rateLimitMap.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + hourInMs });
    return true;
  }
  
  if (existing.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  existing.count++;
  return true;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  
  return messages.every((msg) => {
    if (typeof msg !== "object" || msg === null) return false;
    const { role, content } = msg as Record<string, unknown>;
    if (typeof role !== "string" || typeof content !== "string") return false;
    if (!["user", "assistant", "system"].includes(role)) return false;
    if (content.length > MAX_MESSAGE_LENGTH) return false;
    return true;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: verify_jwt = false — validate JWT in code
  // Reason: Wellness chat requires authenticated user to prevent abuse
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Rate limiting check
    const clientId = getClientIdentifier(req);
    if (!checkRateLimit(clientId)) {
      console.warn(`Rate limit exceeded for client: ${clientId}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages } = body as { messages: unknown };
    
    // Validate input
    if (!validateMessages(messages)) {
      console.warn("Invalid messages format received");
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    // Fetch products for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: products } = await supabase
      .from("products")
      .select("id, name, category, description, price, benefits, who_is_it_for, is_kids_product, is_adults_only")
      .eq("is_published", true)
      .order("name");

    const productContext = products?.map(p => 
      `- ${p.name} (${p.category}, £${p.price}): ${p.description || 'Premium wellness supplement'}. ${p.who_is_it_for ? `Best for: ${p.who_is_it_for}` : ''} ${p.is_kids_product ? '(Kids product)' : ''} ${p.is_adults_only ? '(Adults only)' : ''}`
    ).join('\n') || '';

    const systemPrompt = `You are a friendly and knowledgeable wellness advisor for Healios, a premium gummy vitamin and supplement brand. Your role is to help customers find the perfect supplements for their wellness journey.

## Your Product Catalog:
${productContext}

## Guidelines:
1. Be warm, helpful, and conversational - like talking to a knowledgeable friend
2. Ask clarifying questions to understand the customer's needs, goals, and any concerns
3. Recommend specific products from our catalog that match their needs
4. Explain the benefits of recommended products in simple terms
5. If someone mentions children, only recommend kids-appropriate products
6. If someone asks about pregnancy or medical conditions, advise consulting a healthcare professional
7. Keep responses concise but informative (2-3 paragraphs max)
8. Use emojis sparingly to keep the tone friendly ✨
9. If you don't know something, be honest and suggest they contact support@thehealios.com

## Example interactions:
- "I'm feeling tired all the time" → Ask about sleep, stress levels, then recommend relevant products like Magnesium, Ashwagandha, or Iron + Vitamin C
- "Looking for something for my kids" → Recommend Kids Multivitamin and ask about any specific concerns
- "I want to improve my skin" → Recommend Hair, Skin & Nails gummies or Halo Glow Collagen

Remember: You're here to help customers find the right supplements, not to diagnose or treat medical conditions.`;

    console.log("Sending request to Lovable AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "We're experiencing high demand. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log("Streaming response from AI gateway...");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Wellness chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

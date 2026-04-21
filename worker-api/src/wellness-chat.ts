import { Env } from './index';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const MAX_REQUESTS_PER_HOUR = 20;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES = 20;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function validateMessages(messages: unknown): messages is ChatMessage[] {
  if (!Array.isArray(messages)) return false;
  if (messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  return messages.every((msg) => {
    if (typeof msg !== 'object' || msg === null) return false;
    const { role, content } = msg as Record<string, unknown>;
    if (typeof role !== 'string' || typeof content !== 'string') return false;
    if (!['user', 'assistant', 'system'].includes(role)) return false;
    if (content.length > MAX_MESSAGE_LENGTH) return false;
    return true;
  });
}

export async function handleWellnessChat(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = await env.SESSIONS.get(token);
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  const hourWindow = Math.floor(Date.now() / 1000 / 3600);
  const fullKey = `ratelimit:chat:${ip}:${hourWindow}`;

  const currentCount = parseInt((await env.SESSIONS.get(fullKey)) || '0', 10);
  if (currentCount >= MAX_REQUESTS_PER_HOUR) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  await env.SESSIONS.put(fullKey, String(currentCount + 1), { expirationTtl: 3600 });

  const body = await request.json() as any;
  const { messages } = body;

  if (!validateMessages(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid request format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const products = await env.DB.prepare(
    'SELECT id, name, category, description, price, benefits, who_is_it_for, is_kids_product, is_adults_only FROM products WHERE is_published = 1 ORDER BY name'
  ).all();

  const productContext = products.results.map((p: any) =>
    `- ${p.name} (${p.category}, R${p.price}): ${p.description || 'Premium wellness supplement'}. ${p.who_is_it_for ? `Best for: ${p.who_is_it_for}` : ''} ${p.is_kids_product ? '(Kids product)' : ''} ${p.is_adults_only ? '(Adults only)' : ''}`
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

Remember: You're here to help customers find the right supplements, not to diagnose or treat medical conditions.`;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  });

  return new Response(response as ReadableStream, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
  });
}

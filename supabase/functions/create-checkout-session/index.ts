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

// ==================================
// RATE LIMITING (P0 Security)
// ==================================

// Simple in-memory rate limiter
// In production, consider using Redis or Supabase table for persistence
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 checkout attempts
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Per 60 seconds

/**
 * Check if request should be rate limited
 * @param identifier - IP address or user ID to rate limit
 * @returns true if request should be blocked
 */
const isRateLimited = (identifier: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  // Clean up expired entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count++;
  return false;
};

/**
 * Get rate limit identifier from request
 */
const getRateLimitIdentifier = (req: Request, userId?: string): string => {
  // Prefer user ID if available
  if (userId) return `user:${userId}`;
  
  // Fall back to IP address
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
};

// Helper to construct full image URL from relative path
const getFullImageUrl = (imagePath: string, origin: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const baseUrl = origin.includes('localhost') ? origin : 'https://www.thehealios.com';
  return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// ==================================
// SERVER-SIDE INPUT SANITIZATION
// ==================================

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<[^>]*>/g,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
];

/**
 * Sanitizes string input to prevent XSS and injection attacks
 */
const sanitizeString = (input: unknown, maxLength: number = 500): string => {
  if (typeof input !== 'string') return '';
  
  let sanitized = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  return sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, maxLength);
};

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
};

/**
 * Validates UK postcode format
 */
const isValidUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  const cleaned = postcode.trim().toUpperCase();
  const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i;
  return UK_POSTCODE_REGEX.test(cleaned);
};

/**
 * Validates and sanitizes customer details
 */
const validateCustomerDetails = (details: unknown): { valid: boolean; error?: string; data?: { firstName: string; lastName: string; phone: string } } => {
  if (!details || typeof details !== 'object') {
    return { valid: false, error: 'Customer details are required' };
  }
  
  const d = details as Record<string, unknown>;
  const firstName = sanitizeString(d.firstName, 50);
  const lastName = sanitizeString(d.lastName, 50);
  const phone = sanitizeString(d.phone, 20);
  
  if (!firstName || firstName.length < 1) {
    return { valid: false, error: 'First name is required' };
  }
  if (!lastName || lastName.length < 1) {
    return { valid: false, error: 'Last name is required' };
  }
  
  // Validate name characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'\-&;]+$/;
  if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
    return { valid: false, error: 'Names contain invalid characters' };
  }
  
  return { valid: true, data: { firstName, lastName, phone } };
};

/**
 * Validates and sanitizes address
 */
const validateAddress = (address: unknown, fieldName: string): { valid: boolean; error?: string; data?: { address: string; city: string; postalCode: string; country: string } } => {
  if (!address || typeof address !== 'object') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const a = address as Record<string, unknown>;
  const addr = sanitizeString(a.address, 200);
  const city = sanitizeString(a.city, 100);
  const postalCode = sanitizeString(a.postalCode, 10);
  const country = sanitizeString(a.country, 100);
  
  if (!addr || addr.length < 3) {
    return { valid: false, error: `${fieldName} street address is required` };
  }
  if (!city || city.length < 1) {
    return { valid: false, error: `${fieldName} city is required` };
  }
  if (!postalCode || !isValidUKPostcode(postalCode)) {
    return { valid: false, error: `${fieldName} has an invalid UK postcode` };
  }
  if (!country) {
    return { valid: false, error: `${fieldName} country is required` };
  }
  
  return { valid: true, data: { address: addr, city, postalCode, country } };
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
  isSubscription?: boolean;
}

interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  captured_at?: string;
}

interface AttributionData {
  first_touch: UTMParams | null;
  last_touch: UTMParams | null;
  session: UTMParams | null;
}

interface CheckoutRequest {
  cartItems: CartItem[];
  customerEmail: string;
  customerDetails: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  discountCode?: string;
  discountAmount?: number;
  referralCode?: string;
  shippingMethod?: string;
  shippingCost: number;
  userId?: string;
  attribution?: AttributionData;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract IP address early for security logging
  const forwarded = req.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  try {
    // Parse request body first to get userId for rate limiting
    const body = await req.text();
    const requestData: CheckoutRequest = JSON.parse(body);

    // Initialize Supabase client early for security checks
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ==================================
    // IP-BASED SECURITY CHECK
    // ==================================
    const { data: securityCheck, error: securityError } = await supabase.rpc(
      'check_checkout_ip_security',
      { p_ip_address: clientIp }
    );

    if (securityError) {
      console.error("[SECURITY] Error checking IP security:", securityError);
      // Don't block on security check errors, but log them
    } else if (securityCheck && securityCheck.length > 0) {
      const check = securityCheck[0];
      
      if (check.is_suspicious || check.is_rate_limited) {
        // Log the blocked attempt
        await supabase.rpc('log_checkout_security_event', {
          p_ip_address: clientIp,
          p_event_type: check.is_suspicious ? 'suspicious' : 'rate_limited',
          p_user_id: requestData.userId || null,
          p_metadata: {
            reason: check.reason,
            attempts_last_hour: check.attempts_last_hour,
            failures_last_hour: check.failures_last_hour
          }
        });

        console.warn(`[SECURITY BLOCKED] IP: ${clientIp}, Reason: ${check.reason}`);
        
        return new Response(
          JSON.stringify({ 
            error: check.reason || "Access temporarily restricted. Please try again later.",
            retryAfter: 3600
          }),
          { 
            status: 429, 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": "3600"
            } 
          }
        );
      }
    }

    // Log the checkout attempt
    await supabase.rpc('log_checkout_security_event', {
      p_ip_address: clientIp,
      p_event_type: 'attempt',
      p_user_id: requestData.userId || null,
      p_metadata: { items_count: requestData.cartItems?.length || 0 }
    });

    // ==================================
    // IN-MEMORY RATE LIMITING CHECK (additional layer)
    // ==================================
    const rateLimitId = getRateLimitIdentifier(req, requestData.userId);
    
    if (isRateLimited(rateLimitId)) {
      // Log rate limited event
      await supabase.rpc('log_checkout_security_event', {
        p_ip_address: clientIp,
        p_event_type: 'rate_limited',
        p_user_id: requestData.userId || null,
        p_metadata: { source: 'in_memory_rate_limiter' }
      });

      console.warn(`[RATE LIMITED] Identifier: ${rateLimitId}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many checkout attempts. Please wait a moment and try again.",
          retryAfter: 60
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }

    const stripeKey = Deno.env.get("STRIPE_TEST_RESTRICT_KEY");
    if (!stripeKey) {
      throw new Error("Stripe key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const {
      cartItems,
      customerEmail,
      customerDetails,
      shippingAddress,
      billingAddress,
      discountCode,
      discountAmount,
      referralCode,
      shippingMethod,
      shippingCost,
      userId,
      attribution,
    } = requestData;

    // ==================================
    // SERVER-SIDE INPUT VALIDATION
    // ==================================
    
    // Validate email
    const sanitizedEmail = sanitizeString(customerEmail, 254);
    if (!isValidEmail(sanitizedEmail)) {
      console.warn(`[VALIDATION] Invalid email: ${sanitizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate customer details
    const customerValidation = validateCustomerDetails(customerDetails);
    if (!customerValidation.valid) {
      console.warn(`[VALIDATION] Customer details: ${customerValidation.error}`);
      return new Response(
        JSON.stringify({ error: customerValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const validatedCustomerDetails = customerValidation.data!;

    // Validate shipping address
    const shippingValidation = validateAddress(shippingAddress, "Shipping address");
    if (!shippingValidation.valid) {
      console.warn(`[VALIDATION] Shipping address: ${shippingValidation.error}`);
      return new Response(
        JSON.stringify({ error: shippingValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const validatedShippingAddress = shippingValidation.data!;

    // Validate billing address if provided
    let validatedBillingAddress: { address: string; city: string; postalCode: string; country: string } | undefined;
    if (billingAddress) {
      const billingValidation = validateAddress(billingAddress, "Billing address");
      if (!billingValidation.valid) {
        console.warn(`[VALIDATION] Billing address: ${billingValidation.error}`);
        return new Response(
          JSON.stringify({ error: billingValidation.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      validatedBillingAddress = billingValidation.data;
    }

    // Validate cart items basic structure
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      console.warn("[VALIDATION] Empty or invalid cart");
      return new Response(
        JSON.stringify({ error: "Cart cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (cartItems.length > 50) {
      console.warn("[VALIDATION] Too many cart items");
      return new Response(
        JSON.stringify({ error: "Too many items in cart" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize discount code
    const sanitizedDiscountCode = discountCode 
      ? discountCode.toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, 30)
      : undefined;

    console.log("Creating checkout session for:", sanitizedEmail);
    console.log("Cart items received:", JSON.stringify(cartItems));

    // Supabase client already initialized above for security checks

    // ===========================================
    // SERVER-SIDE PRICE VALIDATION (P0 Security)
    // ===========================================
    
    // Fetch actual prices from database
    const productIds = cartItems.map(item => item.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, name, image, category, is_published, stock_quantity, track_inventory, is_bundle, bundle_discount_percent')
      .in('id', productIds);

    if (productsError) {
      console.error("Failed to fetch products for validation:", productsError);
      return new Response(
        JSON.stringify({ error: "Failed to validate cart items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create price lookup map
    const productMap = new Map(products?.map(p => [p.id, p]) || []);

    // Validate each cart item and build validated items array
    const validatedItems: CartItem[] = [];
    const validationErrors: string[] = [];

    for (const item of cartItems) {
      const product = productMap.get(item.id);
      
      // Check product exists
      if (!product) {
        validationErrors.push(`Product "${item.id}" not found`);
        continue;
      }
      
      // Check product is published
      if (!product.is_published) {
        validationErrors.push(`Product "${product.name}" is no longer available`);
        continue;
      }
      
      // Check stock if inventory tracking is enabled
      if (product.track_inventory && product.stock_quantity < item.quantity) {
        validationErrors.push(
          `Insufficient stock for "${product.name}". Only ${product.stock_quantity} available.`
        );
        continue;
      }

      // Validate quantity is positive
      if (item.quantity < 1) {
        validationErrors.push(`Invalid quantity for "${product.name}"`);
        continue;
      }

      // Calculate SERVER-SIDE price (ignore client price)
      const SUBSCRIPTION_DISCOUNT = 0.15; // 15% off for subscriptions
      const serverPrice = item.isSubscription 
        ? Number(product.price) * (1 - SUBSCRIPTION_DISCOUNT)
        : Number(product.price);

      // Log price mismatch for monitoring (but don't block - just use server price)
      if (Math.abs(serverPrice - item.price) > 0.01) {
        console.warn(
          `[PRICE MISMATCH] Product: ${item.id}, Client price: £${item.price}, Server price: £${serverPrice.toFixed(2)}`
        );
      }

      // Build validated item with SERVER price
      validatedItems.push({
        id: product.id,
        name: product.name,
        price: serverPrice,
        image: product.image,
        quantity: item.quantity,
        category: product.category,
        isSubscription: item.isSubscription || false,
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      console.error("Cart validation failed:", validationErrors);
      return new Response(
        JSON.stringify({ 
          error: "Cart validation failed",
          details: validationErrors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Recalculate totals with validated server prices
    const validatedSubtotal = validatedItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    console.log("Validated subtotal:", validatedSubtotal.toFixed(2));

    // Check if there are any subscription items
    const hasSubscriptions = validatedItems.some(item => item.isSubscription);

    // Find or create Stripe customer
    let stripeCustomerId: string | undefined;
    
    if (userId) {
      // Check if user already has a Stripe customer ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single();

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id;
        console.log("Found existing Stripe customer:", stripeCustomerId);
      }
    }

    // Create customer if not exists
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: sanitizedEmail,
        name: `${validatedCustomerDetails.firstName} ${validatedCustomerDetails.lastName}`,
        phone: validatedCustomerDetails.phone,
        address: {
          line1: validatedShippingAddress.address,
          city: validatedShippingAddress.city,
          postal_code: validatedShippingAddress.postalCode,
          country: validatedShippingAddress.country === "United Kingdom" ? "GB" : validatedShippingAddress.country,
        },
        metadata: {
          user_id: userId || "",
        },
      });
      stripeCustomerId = customer.id;
      console.log("Created new Stripe customer:", stripeCustomerId);

      // Save Stripe customer ID to profile if user is logged in
      if (userId) {
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", userId);
      }
    }

    // Get the origin for image URLs and success/cancel URLs
    const origin = req.headers.get("origin") || "https://www.thehealios.com";

    // Build line items using VALIDATED items (server prices)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of validatedItems) {
      // Price already includes subscription discount from validation step
      const unitAmount = Math.round(item.price * 100);

      if (item.isSubscription) {
        lineItems.push({
          price_data: {
            currency: "gbp",
            product_data: {
              name: item.name,
              description: "Monthly subscription - 15% off",
              images: item.image ? [getFullImageUrl(item.image, origin)] : [],
              metadata: {
                product_id: item.id,
                category: item.category,
                is_subscription: "true",
              },
            },
            unit_amount: unitAmount,
            recurring: {
              interval: "month",
            },
          },
          quantity: item.quantity,
        });
      } else {
        lineItems.push({
          price_data: {
            currency: "gbp",
            product_data: {
              name: item.name,
              images: item.image ? [getFullImageUrl(item.image, origin)] : [],
              metadata: {
                product_id: item.id,
                category: item.category,
                is_subscription: "false",
              },
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
      }
    }

    // Add shipping as a line item if there's a cost
    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: shippingMethod || "Shipping",
          },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    // Create a Stripe coupon if discount is applied
    let stripeCouponId: string | undefined;
    if (discountAmount && discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: "gbp",
        duration: "once",
        name: sanitizedDiscountCode || "Discount",
      });
      stripeCouponId = coupon.id;
      console.log("Created Stripe coupon:", stripeCouponId, "for amount:", discountAmount);
    }

    // Prepare metadata for webhook (using VALIDATED/SANITIZED data)
    const lastTouch = attribution?.last_touch;
    const metadata = {
      user_id: userId || "",
      customer_email: sanitizedEmail,
      customer_first_name: validatedCustomerDetails.firstName,
      customer_last_name: validatedCustomerDetails.lastName,
      customer_phone: validatedCustomerDetails.phone || "",
      shipping_address: validatedShippingAddress.address,
      shipping_city: validatedShippingAddress.city,
      shipping_postal_code: validatedShippingAddress.postalCode,
      shipping_country: validatedShippingAddress.country,
      billing_address: validatedBillingAddress?.address || validatedShippingAddress.address,
      billing_city: validatedBillingAddress?.city || validatedShippingAddress.city,
      billing_postal_code: validatedBillingAddress?.postalCode || validatedShippingAddress.postalCode,
      billing_country: validatedBillingAddress?.country || validatedShippingAddress.country,
      discount_code: sanitizedDiscountCode || "",
      discount_amount: (discountAmount || 0).toString(),
      referral_code: sanitizeString(referralCode || "", 30),
      shipping_method: sanitizeString(shippingMethod || "", 50),
      shipping_cost: shippingCost.toString(),
      cart_items: JSON.stringify(validatedItems), // Use validated items with server prices
      // Attribution data (last touch for conversion attribution)
      utm_source: sanitizeString(lastTouch?.utm_source || "", 100),
      utm_medium: sanitizeString(lastTouch?.utm_medium || "", 100),
      utm_campaign: sanitizeString(lastTouch?.utm_campaign || "", 100),
      utm_term: sanitizeString(lastTouch?.utm_term || "", 100),
      utm_content: sanitizeString(lastTouch?.utm_content || "", 100),
      gclid: sanitizeString(lastTouch?.gclid || "", 100),
      fbclid: sanitizeString(lastTouch?.fbclid || "", 100),
    };

    // Determine checkout mode
    const mode = hasSubscriptions ? "subscription" : "payment";


    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      customer_update: {
        address: "auto",
        name: "auto",
      },
      line_items: lineItems,
      mode: mode,
      success_url: `${origin}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?cancelled=true`,
      metadata: metadata,
      billing_address_collection: "auto",
      shipping_address_collection: {
        allowed_countries: ["GB", "IE"],
      },
      discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,
    };

    // Add subscription-specific options
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: metadata,
      };
    } else {
      sessionParams.payment_intent_data = {
        metadata: metadata,
      };
    }

    console.log("Creating Stripe session with mode:", mode);
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    
    // Log failure for security monitoring
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.rpc('log_checkout_security_event', {
        p_ip_address: clientIp,
        p_event_type: 'failure',
        p_metadata: { error: error.message?.substring(0, 200) || 'Unknown error' }
      });
    } catch (logError) {
      console.error("Failed to log security event:", logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

interface OrderItem {
  product_name: string;
  product_image: string;
  product_category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface OrderEmailRequest {
  type: "confirmation" | "status_update";
  order_id: string;
  email: string;
  first_name: string;
  last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_method: string;
  items: OrderItem[];
  new_status?: string;
}

const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

/**
 * HTML entity encoding to prevent XSS in emails
 * Encodes user-provided values to prevent script injection
 */
const escapeHtml = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getShippingMethodLabel = (method: string) => {
  switch (method) {
    case "express":
      return "Express (1-2 business days)";
    case "overnight":
      return "Overnight (Next business day)";
    default:
      return "Standard (3-5 business days)";
  }
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case "processing":
      return "Your order is now being processed and will be shipped soon.";
    case "shipped":
      return "Great news! Your order has been shipped and is on its way to you.";
    case "delivered":
      return "Your order has been delivered. We hope you enjoy your products!";
    case "cancelled":
      return "Your order has been cancelled. If you have any questions, please contact our support team.";
    case "refunded":
      return "Your order has been refunded. The refund should appear in your account within 5-10 business days.";
    default:
      return "There has been an update to your order.";
  }
};

const generateOrderConfirmationHtml = (data: OrderEmailRequest) => {
  // Escape all user-provided values to prevent XSS
  const safeFirstName = escapeHtml(data.first_name);
  const safeLastName = escapeHtml(data.last_name);
  const safeAddress = escapeHtml(data.shipping_address);
  const safeCity = escapeHtml(data.shipping_city);
  const safePostalCode = escapeHtml(data.shipping_postal_code);
  const safeCountry = escapeHtml(data.shipping_country);

  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <div>
            <p style="margin: 0; font-weight: 500; color: #1a1a1a;">${escapeHtml(item.product_name)}</p>
            <p style="margin: 4px 0 0 0; color: #666; font-size: 14px;">${escapeHtml(item.product_category)} × ${item.quantity}</p>
          </div>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; color: #1a1a1a;">
          ${formatCurrency(item.line_total)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: 2px;">HEALIOS</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">The Healios Health Co.</p>
        </div>
        
        <div style="background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #1a1a1a;">Thank you for your order!</h2>
          <p style="margin: 0 0 24px 0; color: #666;">Hi ${safeFirstName}, we've received your order and it's being prepared.</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Reference</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 500; color: #1a1a1a; font-family: monospace;">#${escapeHtml(data.order_id.slice(0, 8).toUpperCase())}</p>
          </div>
          
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500; color: #1a1a1a;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsHtml}
          </table>
          
          <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #1a1a1a;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #666;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right; color: #1a1a1a;">${formatCurrency(data.subtotal)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #666;">Shipping (${escapeHtml(getShippingMethodLabel(data.shipping_method))})</td>
                <td style="padding: 4px 0; text-align: right; color: #1a1a1a;">${data.shipping_cost === 0 ? "Free" : formatCurrency(data.shipping_cost)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 0 0; font-weight: 600; font-size: 18px; color: #1a1a1a;">Total</td>
                <td style="padding: 12px 0 0 0; text-align: right; font-weight: 600; font-size: 18px; color: #1a1a1a;">${formatCurrency(data.total)}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #1a1a1a;">Shipping Address</h3>
            <p style="margin: 0; color: #666; line-height: 1.6;">
              ${safeFirstName} ${safeLastName}<br>
              ${safeAddress}<br>
              ${safeCity}, ${safePostalCode}<br>
              ${safeCountry}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #999; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">Questions? Contact us at <a href="mailto:support@thehealios.com" style="color: #666;">support@thehealios.com</a></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} The Healios Health Co. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateStatusUpdateHtml = (data: OrderEmailRequest) => {
  // Escape all user-provided values to prevent XSS
  const safeFirstName = escapeHtml(data.first_name);
  const safeStatus = escapeHtml(data.new_status || "");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: 2px;">HEALIOS</h1>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">The Healios Health Co.</p>
        </div>
        
        <div style="background: #fff; border-radius: 8px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 400; color: #1a1a1a;">Order Update</h2>
          <p style="margin: 0 0 24px 0; color: #666;">Hi ${safeFirstName}, here's an update on your order.</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Reference</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 500; color: #1a1a1a; font-family: monospace;">#${escapeHtml(data.order_id.slice(0, 8).toUpperCase())}</p>
          </div>
          
          <div style="background: #e8f5e9; padding: 20px; border-radius: 6px; border-left: 4px solid #4caf50;">
            <p style="margin: 0; font-size: 14px; color: #666;">New Status</p>
            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: 500; color: #2e7d32; text-transform: capitalize;">${safeStatus}</p>
            <p style="margin: 12px 0 0 0; color: #666;">${escapeHtml(getStatusMessage(data.new_status || ""))}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 32px; color: #999; font-size: 12px;">
          <p style="margin: 0 0 8px 0;">Questions? Contact us at <a href="mailto:support@thehealios.com" style="color: #666;">support@thehealios.com</a></p>
          <p style="margin: 0;">© ${new Date().getFullYear()} The Healios Health Co. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Healios <hello@thehealios.com>",
      to: [to],
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

  try {
    const data: OrderEmailRequest = await req.json();
    
    console.log(`Processing ${data.type} email for order ${data.order_id} to ${data.email}`);

    let subject: string;
    let html: string;

    if (data.type === "confirmation") {
      subject = `Order Confirmed - #${data.order_id.slice(0, 8).toUpperCase()}`;
      html = generateOrderConfirmationHtml(data);
    } else {
      subject = `Order Update - #${data.order_id.slice(0, 8).toUpperCase()} is now ${data.new_status}`;
      html = generateStatusUpdateHtml(data);
    }

    const emailResponse = await sendEmail(data.email, subject, html);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
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
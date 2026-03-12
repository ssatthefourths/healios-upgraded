import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  order_items: OrderItem[];
}

// Generate a simple text-based PDF using a minimal PDF structure
function generateInvoicePDF(order: Order): Uint8Array {
  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Calculate VAT (20% included in total)
  const vatAmount = order.total - (order.total / 1.2);
  const netAmount = order.total / 1.2;
  
  // Build the invoice content as plain text that will be embedded in PDF
  const lines: string[] = [
    "THE HEALIOS HEALTH CO.",
    "Premium Wellness Supplements",
    "",
    "hello@thehealios.com",
    "www.thehealios.com",
    "",
    "================================",
    "",
    `INVOICE: ${invoiceNumber}`,
    `DATE: ${invoiceDate}`,
    "",
    "================================",
    "",
    "BILL TO:",
    `${order.first_name} ${order.last_name}`,
    order.email,
    order.shipping_address,
    `${order.shipping_city}, ${order.shipping_postal_code}`,
    order.shipping_country,
    "",
    "================================",
    "",
    "ITEMS:",
    "",
  ];
  
  // Add order items
  for (const item of order.order_items) {
    lines.push(`${item.product_name}`);
    lines.push(`  Qty: ${item.quantity} x £${Number(item.unit_price).toFixed(2)} = £${Number(item.line_total).toFixed(2)}`);
    lines.push("");
  }
  
  lines.push("================================");
  lines.push("");
  lines.push(`Subtotal (ex. VAT):    £${netAmount.toFixed(2)}`);
  lines.push(`VAT (20%):             £${vatAmount.toFixed(2)}`);
  
  if (Number(order.shipping_cost) > 0) {
    lines.push(`Shipping:              £${Number(order.shipping_cost).toFixed(2)}`);
  } else {
    lines.push(`Shipping:              FREE`);
  }
  
  if (Number(order.discount_amount) > 0) {
    lines.push(`Discount:             -£${Number(order.discount_amount).toFixed(2)}`);
  }
  
  lines.push("");
  lines.push(`TOTAL:                 £${Number(order.total).toFixed(2)}`);
  lines.push("");
  lines.push("================================");
  lines.push("");
  lines.push("Thank you for your order!");
  lines.push("");
  lines.push("The Healios Health Co.");
  lines.push("United Kingdom");
  
  const textContent = lines.join("\n");
  
  // Create a simple PDF structure
  // This is a minimal valid PDF with embedded text
  const pdfContent = createSimplePDF(textContent, invoiceNumber, invoiceDate);
  
  return new TextEncoder().encode(pdfContent);
}

function createSimplePDF(text: string, invoiceNumber: string, date: string): string {
  // Escape special PDF characters
  const escapedText = text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\n/g, ') Tj T* (');
  
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length 6 0 R >>
stream
BT
/F1 10 Tf
50 800 Td
12 TL
(${escapedText}) Tj
ET
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>
endobj

6 0 obj
${escapedText.length + 100}
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000${(400 + escapedText.length).toString().padStart(3, '0')} 00000 n 
0000000${(470 + escapedText.length).toString().padStart(3, '0')} 00000 n 

trailer
<< /Size 7 /Root 1 0 R >>
startxref
${500 + escapedText.length}
%%EOF`;

  return content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: verify_jwt = false — validate JWT in code
  // Reason: Invoice generation requires authenticated user
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
    
    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating invoice for order:", orderId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with items
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order items" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullOrder: Order = {
      ...order,
      order_items: orderItems || [],
    };

    // Generate PDF
    const pdfBytes = generateInvoicePDF(fullOrder);
    const invoiceNumber = `INV-${orderId.slice(0, 8).toUpperCase()}`;
    const fileName = `invoices/${orderId}/${invoiceNumber}.pdf`;

    console.log("Uploading invoice to storage:", fileName);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("order-documents")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading invoice:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload invoice" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("order-documents")
      .createSignedUrl(fileName, 3600);

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to create download URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order with invoice URL
    const { error: updateError } = await supabase
      .from("orders")
      .update({ invoice_url: fileName })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order with invoice URL:", updateError);
    }

    console.log("Invoice generated successfully:", invoiceNumber);

    return new Response(
      JSON.stringify({ 
        success: true,
        invoiceNumber,
        downloadUrl: signedUrlData.signedUrl,
        storagePath: fileName,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Invoice generation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

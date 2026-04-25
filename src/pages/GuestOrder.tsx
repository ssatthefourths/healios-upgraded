import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Package, Check, Truck, Loader2 } from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SEOHead from "@/components/seo/SEOHead";
import { useCurrency } from "@/contexts/CurrencyContext";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || "https://healios-api.ss-f01.workers.dev";

interface OrderSummary {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  shipping_address: string | null;
  shipping_address_2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_method: string | null;
  shipping_cost: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  currency?: string | null;
  status: string;
  tracking_carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  delivered_by: 'admin' | 'customer' | null;
  created_at: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_category: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_subscription: number | boolean | null;
}

type FetchState =
  | { kind: "loading" }
  | { kind: "ready"; order: OrderSummary; items: OrderItem[] }
  | { kind: "not-found" }
  | { kind: "expired" }
  | { kind: "error" };

const GuestOrder = () => {
  const { accessToken } = useParams<{ accessToken: string }>();
  const { formatPrice } = useCurrency();
  const [state, setState] = useState<FetchState>({ kind: "loading" });
  const [confirming, setConfirming] = useState(false);

  /**
   * Customer-confirm delivery handler — closes ticket #2 in
   * HealiosIssuesFeedback_v3.csv (the customer half of the
   * shipped→delivered transition).
   *
   * Optimistically flips the local order state on success so the UI
   * reflects the new status immediately; the worker has already
   * persisted + fired the delivery email before we get here.
   */
  const handleConfirmDelivered = async () => {
    if (!accessToken || state.kind !== "ready") return;
    setConfirming(true);
    try {
      const res = await fetch(
        `${API_URL}/orders/by-token/${encodeURIComponent(accessToken)}/confirm-delivered`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Couldn't confirm delivery");
      }
      const now = new Date().toISOString();
      setState((prev) =>
        prev.kind === "ready"
          ? {
              ...prev,
              order: { ...prev.order, status: "delivered", delivered_at: now, delivered_by: "customer" },
            }
          : prev,
      );
      toast.success("Marked as delivered. Thanks for confirming!");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't confirm delivery");
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      setState({ kind: "not-found" });
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/by-token/${encodeURIComponent(accessToken)}`);
        if (res.status === 404) {
          setState({ kind: "not-found" });
          return;
        }
        if (res.status === 410) {
          setState({ kind: "expired" });
          return;
        }
        if (!res.ok) {
          setState({ kind: "error" });
          return;
        }
        const data = (await res.json()) as { order: OrderSummary; items: OrderItem[] };
        setState({ kind: "ready", order: data.order, items: data.items });
      } catch (err) {
        logger.error("Failed to load guest order", err, { accessToken });
        setState({ kind: "error" });
      }
    };

    load();
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Your order | Healios" description="View your Healios order." noIndex />
      <Header />
      <main id="main-content" className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {state.kind === "loading" && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {(state.kind === "not-found" || state.kind === "expired" || state.kind === "error") && (
            <Card>
              <CardContent className="p-8 text-center space-y-6">
                <h1 className="text-2xl font-light text-foreground">
                  {state.kind === "expired"
                    ? "This link has expired"
                    : state.kind === "not-found"
                    ? "We couldn't find that order"
                    : "Something went wrong"}
                </h1>
                <p className="text-sm text-muted-foreground font-light">
                  {state.kind === "expired"
                    ? "For your security, guest order links expire after 30 days. Sign in to your account to see your full order history."
                    : state.kind === "not-found"
                    ? "The link may be mistyped or the order may have been removed. If you have a Healios account, sign in to view your orders."
                    : "We had trouble loading your order. Please try again in a moment."}
                </p>
                <div className="flex flex-col gap-3">
                  <Button asChild className="w-full h-12 rounded-none">
                    <Link to="/auth?redirect=/account%3Ftab%3Dorders">Sign in</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 rounded-none">
                    <Link to="/auth?mode=signUp&redirect=/account%3Ftab%3Dorders">Create an account</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/">Back to shopping</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {state.kind === "ready" && (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-3xl font-light text-foreground mb-2">
                  Thanks, {state.order.first_name || "friend"}
                </h1>
                <p className="text-muted-foreground">
                  Order <span className="font-medium text-foreground">{state.order.id}</span>
                </p>
              </div>

              <div className="bg-muted/10 p-6 mb-6">
                <h2 className="font-medium text-foreground mb-4">Items</h2>
                <div className="space-y-3">
                  {state.items.map((item, idx) => (
                    <div key={`${item.product_id}-${idx}`} className="flex gap-4 p-4 bg-muted/20">
                      <div className="w-20 h-20 bg-muted overflow-hidden flex-shrink-0">
                        {item.product_image ? (
                          <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">{item.product_name}</h3>
                        {item.product_category && (
                          <p className="text-sm text-muted-foreground">{item.product_category}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                          {!!item.is_subscription && (
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary">Subscribe & Save</span>
                          )}
                        </div>
                      </div>
                      <div className="text-foreground font-medium">{formatPrice(item.line_total)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-muted-foreground/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatPrice(state.order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-foreground">
                      {state.order.shipping_cost > 0 ? formatPrice(state.order.shipping_cost) : "Free"}
                    </span>
                  </div>
                  {state.order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Discount</span>
                      <span>-{formatPrice(state.order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-medium pt-2 border-t border-muted-foreground/20">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatPrice(state.order.total)}</span>
                  </div>
                </div>
              </div>

              {(state.order.shipping_address || state.order.shipping_city) && (
                <div className="bg-muted/10 p-6 mb-6">
                  <h2 className="font-medium text-foreground mb-2">Shipping to</h2>
                  <p className="text-sm text-muted-foreground font-light">
                    {state.order.first_name} {state.order.last_name}
                    <br />
                    {state.order.shipping_address}
                    {state.order.shipping_address_2 && (<><br />{state.order.shipping_address_2}</>)}
                    <br />
                    {[state.order.shipping_city, state.order.shipping_postal_code].filter(Boolean).join(", ")}
                    <br />
                    {state.order.shipping_country}
                  </p>
                </div>
              )}

              {/* Tracking + customer-confirm delivery (v3 #2/#3/#4). */}
              {(state.order.status === "shipped" || state.order.status === "delivered") && (
                <div className="bg-muted/10 p-6 mb-6">
                  <h2 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {state.order.status === "delivered" ? "Delivered" : "On its way"}
                  </h2>
                  {state.order.status === "shipped" && (
                    <>
                      {(state.order.tracking_carrier || state.order.tracking_number) && (
                        <p className="text-sm text-muted-foreground font-light mb-3">
                          {state.order.tracking_carrier}
                          {state.order.tracking_number && (
                            <>
                              {" · "}
                              <span className="font-mono">{state.order.tracking_number}</span>
                            </>
                          )}
                        </p>
                      )}
                      {state.order.tracking_url && (
                        <a
                          href={state.order.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline hover:no-underline text-primary block mb-4"
                        >
                          Track package →
                        </a>
                      )}
                      <Button
                        onClick={handleConfirmDelivered}
                        disabled={confirming}
                        className="w-full sm:w-auto rounded-none"
                        variant="outline"
                      >
                        {confirming ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming…</>
                        ) : (
                          <><Check className="h-4 w-4 mr-2" /> I have received my order</>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Got your package? Tap above so we can mark this order as delivered.
                      </p>
                    </>
                  )}
                  {state.order.status === "delivered" && (
                    <p className="text-sm text-muted-foreground font-light">
                      Delivered{state.order.delivered_at ? ` on ${new Date(state.order.delivered_at).toLocaleDateString()}` : ""}.
                      Thanks for confirming!
                    </p>
                  )}
                </div>
              )}

              <Card>
                <CardContent className="p-8 text-center space-y-4">
                  <h2 className="font-medium text-foreground">Save your order history</h2>
                  <p className="text-sm text-muted-foreground font-light">
                    Create an account with <span className="font-medium">{state.order.email}</span> to track this order and future deliveries.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button asChild className="w-full h-12 rounded-none">
                      <Link to={`/auth?mode=signUp&redirect=/account%3Ftab%3Dorders`}>Create an account</Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full">
                      <Link to="/">Continue shopping</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuestOrder;

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const AUTO_DISMISS_MS = 4500;

interface CartPopoverProps {
  onOpenCart: () => void;
}

/**
 * Speech-bubble popover anchored below the cart icon. Renders the last
 * added item + quick CTAs. Auto-dismisses after AUTO_DISMISS_MS or when
 * the user clicks outside / presses Escape. Triangle tail points at the
 * cart button above it.
 */
const CartPopover = ({ onOpenCart }: CartPopoverProps) => {
  const { lastAdded, dismissLastAdded } = useCart();
  const { formatPrice } = useCurrency();
  const [visibleSequence, setVisibleSequence] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Re-show every new add, even if the popover was already open for a different item.
  useEffect(() => {
    if (!lastAdded) return;
    setVisibleSequence(lastAdded.sequence);
  }, [lastAdded]);

  // Auto-dismiss timer.
  useEffect(() => {
    if (visibleSequence === null) return;
    const t = window.setTimeout(() => {
      dismissLastAdded();
      setVisibleSequence(null);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [visibleSequence, dismissLastAdded]);

  // Click-outside dismiss.
  useEffect(() => {
    if (visibleSequence === null) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        dismissLastAdded();
        setVisibleSequence(null);
      }
    };
    // Defer so the click that caused the add isn't captured as an outside click.
    const id = window.setTimeout(() => document.addEventListener("mousedown", onDocClick), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [visibleSequence, dismissLastAdded]);

  // Escape to dismiss.
  useEffect(() => {
    if (visibleSequence === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissLastAdded();
        setVisibleSequence(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleSequence, dismissLastAdded]);

  if (visibleSequence === null || !lastAdded) return null;

  const { item } = lastAdded;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      className="absolute right-0 top-[calc(100%+10px)] z-50 w-[320px] max-w-[calc(100vw-24px)] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Pointer tail */}
      <div className="absolute right-3 -top-[7px] w-3 h-3 bg-background border-l border-t border-border rotate-45" />

      <div className="relative bg-background border border-border rounded-md shadow-xl">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-green-600/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-green-700" strokeWidth={3} />
            </span>
            <p className="flex-1 text-sm font-medium text-foreground leading-snug">
              Added to bag
            </p>
            <button
              type="button"
              onClick={() => {
                dismissLastAdded();
                setVisibleSequence(null);
              }}
              className="p-0.5 -mt-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-3 mt-3">
            {item.image && (
              <div className="w-14 h-14 bg-muted/40 rounded-sm overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-light text-foreground truncate">{item.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.price)}</p>
              {item.isSubscription && (
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-primary">
                  Subscribe &amp; Save
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 pt-0">
          <button
            type="button"
            onClick={() => {
              dismissLastAdded();
              setVisibleSequence(null);
              onOpenCart();
            }}
            className="h-10 border border-border text-sm font-light rounded-none hover:bg-muted transition-colors"
          >
            View bag
          </button>
          <Link
            to="/checkout"
            onClick={() => {
              dismissLastAdded();
              setVisibleSequence(null);
            }}
            className="h-10 flex items-center justify-center bg-foreground text-background text-sm font-light rounded-none hover:bg-foreground/90 transition-colors"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPopover;

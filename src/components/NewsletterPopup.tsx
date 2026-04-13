import { useState, useEffect } from "react";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { trackNewsletterSignup } from "@/lib/analytics";
import { trackMetaLead } from "@/lib/metaPixel";

const POPUP_DELAY_MS = 30000; // Show after 30 seconds
const POPUP_STORAGE_KEY = "healios_newsletter_popup_shown";
const NEWSLETTER_SUBSCRIBED_KEY = "healios_newsletter_subscribed";

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkAndShowPopup = async () => {
      // Don't show if already subscribed or popup was dismissed
      const wasShown = localStorage.getItem(POPUP_STORAGE_KEY);
      const isSubscribed = localStorage.getItem(NEWSLETTER_SUBSCRIBED_KEY);
      
      if (wasShown || isSubscribed) return;

      // If user is logged in, skip popup (they can subscribe via footer)
      if (user?.email) {
        return;
      }

      // Show after delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, POPUP_DELAY_MS);

      // Exit intent listener
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0 && !localStorage.getItem(POPUP_STORAGE_KEY)) {
          setIsVisible(true);
        }
      };

      document.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    };

    checkAndShowPopup();
  }, [user?.email]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(POPUP_STORAGE_KEY, "true");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      toast.success("Welcome! Use code WELCOME10 for 10% off.");
      trackNewsletterSignup("popup");
      trackMetaLead("popup");
      localStorage.setItem(NEWSLETTER_SUBSCRIBED_KEY, "true");
      handleClose();
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-background border border-border rounded-lg shadow-xl animate-in zoom-in-95 duration-300">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Get 10% Off Your First Order
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Join our wellness community for exclusive offers, health tips, and early access to new products.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-center"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing up..." : "Claim My 10% Off"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
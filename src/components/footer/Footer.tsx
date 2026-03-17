import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trackNewsletterSignup } from "@/lib/analytics";
import { trackMetaLead } from "@/lib/metaPixel";
import { BRAND } from "@/constants/brand";
import logger from "@/lib/logger";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .insert({ email: email.toLowerCase().trim() });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed to our newsletter");
        } else {
          throw error;
        }
      } else {
        toast.success("Thanks for subscribing!");
        trackNewsletterSignup("footer");
        trackMetaLead("footer");
        setEmail("");
      }
    } catch (error) {
      logger.error("Newsletter subscription error", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full bg-background text-foreground border-t border-border px-page pt-[var(--space-xl)] pb-[var(--space-md)]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-[var(--space-lg)]">
          {/* Brand - Left side */}
          <div>
            <h2 className="text-xl font-medium mb-4">{BRAND.name}</h2>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-md mb-6">
              {BRAND.description}
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-6">
              <p className="text-sm font-normal text-foreground mb-2">Join Our Newsletter</p>
              <p className="text-sm font-light text-muted-foreground mb-3">
                Get wellness tips and exclusive offers delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm">
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-9 text-sm"
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  disabled={isSubmitting}
                  className="h-9"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-2 text-sm font-light text-muted-foreground">
              <div>
                <p className="font-normal text-foreground mb-1">Contact</p>
                <p>{BRAND.email.general}</p>
                <p>{BRAND.email.support}</p>
              </div>
              <div>
                <p className="font-normal text-foreground mb-1 mt-3">Website</p>
                <p>{BRAND.website.domain}</p>
              </div>
            </div>
          </div>

          {/* Link lists - Right side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Shop */}
            <div>
              <h4 className="text-sm font-normal mb-4">Shop</h4>
              <ul className="space-y-2">
                <li><Link to="/category/all" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">All Products</Link></li>
                <li><Link to="/category/vitamins-minerals" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Vitamins & Minerals</Link></li>
                <li><Link to="/category/adaptogens" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Adaptogens</Link></li>
                <li><Link to="/category/digestive-health" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Digestive Health</Link></li>
                <li><Link to="/category/sleep-relaxation" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Sleep & Relaxation</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-normal mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/subscribe" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Subscribe & Save</Link></li>
                <li><Link to="/gift-cards" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Gift Cards</Link></li>
                <li><Link to="/faq" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link to="/about/product-guide" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Product Guide</Link></li>
                <li><Link to="/about/quality-sourcing" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Quality & Sourcing</Link></li>
                <li><Link to="/about/customer-care" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Customer Care</Link></li>
                <li><Link to="/about/wholesale" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Wholesale</Link></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-normal mb-4">About</h4>
              <ul className="space-y-2">
                <li><Link to="/about/our-story" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Our Story</Link></li>
                <li><Link to="/blog" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Wellness Journal</Link></li>
                <li><Link to="/about/wholesale" className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Partner With Us</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="max-w-7xl mx-auto border-t border-border pt-[var(--space-sm)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-sm font-light text-foreground mb-1 md:mb-0">
            © {new Date().getFullYear()} {BRAND.name} · Built by The Fourths Digital Agency
          </p>
          <div className="flex space-x-6">
            <Link to="/shipping-returns" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Shipping & Returns
            </Link>
            <Link to="/privacy-policy" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { trackNewsletterSignup } from "@/lib/analytics";
import { trackMetaLead } from "@/lib/metaPixel";
import { BRAND } from "@/constants/brand";
import { ROUTES } from "@/constants/routes";
import logger from "@/lib/logger";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import IconBundle, { type IconBundleItem } from "@/components/footer/IconBundle";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  GoogleIcon,
  TrustpilotIcon,
} from "@/components/footer/FooterIcons";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { config } = useSiteConfig();

  const socialItems: IconBundleItem[] = [
    { key: "facebook", label: "Facebook", href: config["social.facebook"] ?? "", Icon: FacebookIcon },
    { key: "instagram", label: "Instagram", href: config["social.instagram"] ?? "", Icon: InstagramIcon },
    { key: "tiktok", label: "TikTok", href: config["social.tiktok"] ?? "", Icon: TikTokIcon },
  ].filter((i) => i.href.trim().length > 0);

  const trustItems: IconBundleItem[] = [
    { key: "google", label: "Google Business", href: config["trust.google_business"] ?? "", Icon: GoogleIcon },
    { key: "trustpilot", label: "Trustpilot", href: config["trust.trustpilot"] ?? "", Icon: TrustpilotIcon },
  ].filter((i) => i.href.trim().length > 0);

  const showIconRow = socialItems.length > 0 || trustItems.length > 0;

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      toast.success("Thanks for subscribing!");
      trackNewsletterSignup("footer");
      trackMetaLead("footer");
      setEmail("");
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
                <li><Link to={ROUTES.CATEGORY.ALL} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">All Products</Link></li>
                <li><Link to={ROUTES.CATEGORY.VITAMINS} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Vitamins & Minerals</Link></li>
                <li><Link to={ROUTES.CATEGORY.ADAPTOGENS} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Adaptogens</Link></li>
                <li><Link to={ROUTES.CATEGORY.DIGESTIVE} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Digestive Health</Link></li>
                <li><Link to={ROUTES.CATEGORY.SLEEP} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Sleep & Relaxation</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-normal mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to={ROUTES.SUBSCRIBE} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Subscribe & Save</Link></li>
                <li><Link to={ROUTES.GIFT_CARDS} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Gift Cards</Link></li>
                <li><Link to={ROUTES.FAQ} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
                <li><Link to={ROUTES.ABOUT.GUIDE} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Product Guide</Link></li>
                <li><Link to={ROUTES.ABOUT.QUALITY} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Quality & Sourcing</Link></li>
                <li><Link to={ROUTES.ABOUT.CARE} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Customer Care</Link></li>
                <li><Link to={ROUTES.ABOUT.WHOLESALE} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Wholesale</Link></li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h4 className="text-sm font-normal mb-4">About</h4>
              <ul className="space-y-2">
                <li><Link to={ROUTES.ABOUT.STORY} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Our Story</Link></li>
                <li><Link to={ROUTES.BLOG} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Wellness Journal</Link></li>
                <li><Link to={ROUTES.ABOUT.WHOLESALE} className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors">Partner With Us</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="max-w-7xl mx-auto border-t border-border pt-[var(--space-sm)]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-sm font-light text-foreground mb-1 md:mb-0">
            © {new Date().getFullYear()} {BRAND.name} · Built by <a href="https://www.thefourths.com" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">The Fourths Digital Agency</a>
          </p>
          <div className="flex space-x-6">
            <Link to={ROUTES.SHIPPING} className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Shipping & Returns
            </Link>
            <Link to={ROUTES.PRIVACY} className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to={ROUTES.DATA_REQUEST} className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Data Request
            </Link>
            <Link to={ROUTES.TERMS} className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors">
              Terms of Service
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-preferences'))}
              className="text-sm font-light text-foreground hover:text-muted-foreground transition-colors"
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
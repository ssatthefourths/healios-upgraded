import { useLocation, Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";
import { useEffect } from "react";
import { Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants/brand";
import { logger } from "@/lib/logger";
import SEOHead from "@/components/seo/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.warn("404 Error: User attempted to access non-existent route", { path: location.pathname });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="404 - Page Not Found | Healios"
        description="The page you're looking for doesn't exist. Browse our wellness products or return to the Healios homepage."
        noIndex
      />
      {/* Header */}
      <header className="border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-page">
          <Link to="/" className="flex items-center gap-2">
            <OptimizedImage 
              src={BRAND.assets.logo} 
              alt={BRAND.name} 
              priority={true}
              className="h-8 w-auto"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-[120px] sm:text-[160px] font-bold leading-none text-primary/10">
              404
            </div>
            <div className="mt-[-2rem] sm:mt-[-3rem]">
              <span className="text-6xl sm:text-8xl">🌿</span>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Oops! The page you're looking for seems to have wandered off on its wellness journey. 
            Let's get you back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Return Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/category/all">
                <ShoppingBag className="h-4 w-4" />
                Shop Products
              </Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div className="border-t border-border pt-8">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Popular Categories
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/category/vitamins">Vitamins</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/category/sleep">Sleep Support</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/category/beauty">Beauty</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/category/bundles">Bundles</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/category/all">View All</Link>
              </Button>
            </div>
          </div>

          {/* Help Link */}
          <div className="mt-8">
            <p className="text-sm text-muted-foreground">
              Need help?{" "}
              <Link to="/about/customer-care" className="text-primary hover:underline">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRAND.name}. {BRAND.tagline}.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;
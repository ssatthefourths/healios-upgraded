import heroImage from "@/assets/hero-image.png";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";

const LargeHero = () => {
  return (
    <section className="w-full mb-[var(--space-xl)] px-md">
      <div className="w-full aspect-[16/9] mb-[var(--space-md)] overflow-hidden relative rounded-[var(--radius-section)] shadow-[var(--shadow-ambient)]">
        <OptimizedImage 
          src={heroImage} 
          alt="Premium wellness supplements by Healios" 
          priority={true}
          aspectRatio="video"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-[var(--space-lg)] left-[var(--space-lg)] right-[var(--space-lg)] text-white">
          <h1 className="cinematic-title font-serif mb-[var(--space-sm)]">
            Feel Better. Live Better.
          </h1>
          <p className="text-base md:text-lg font-light opacity-90 max-w-2xl mb-md">
            Science-backed supplements designed to help you sleep deeper, think clearer, and thrive every day.
          </p>
          <Link 
            to="/wellness-quiz" 
            className="inline-flex items-center gap-2 bg-white text-foreground px-md py-sm text-sm font-medium premium-btn rounded-[var(--radius)]"
          >
            <span>Find Your Perfect Supplement</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-normal text-foreground mb-xs uppercase tracking-widest">
            Premium Wellness
          </h2>
          <p className="text-sm font-light text-muted-foreground">
            Clean ingredients, proven research, real results
          </p>
        </div>
        <Link 
          to="/category/all" 
          className="inline-flex items-center gap-1 text-sm font-light text-foreground hover:translate-x-1 transition-transform duration-300"
        >
          <span>Shop All Products</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
};

export default LargeHero;

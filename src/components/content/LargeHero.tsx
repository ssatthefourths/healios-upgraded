import heroImage from "@/assets/hero-image.png";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";

const LargeHero = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="w-full aspect-[16/9] mb-6 overflow-hidden relative">
        <OptimizedImage 
          src={heroImage} 
          alt="Premium wellness supplements by Healios" 
          priority={true}
          aspectRatio="video"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <h1 className="text-3xl md:text-5xl font-light mb-3">
            Feel Better. Live Better.
          </h1>
          <p className="text-lg md:text-xl font-light opacity-90 max-w-2xl mb-4">
            Science-backed supplements designed to help you sleep deeper, think clearer, and thrive every day.
          </p>
          <Link 
            to="/wellness-quiz" 
            className="inline-flex items-center gap-2 bg-white text-foreground px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition-colors duration-200 rounded-sm"
          >
            <span>Find Your Perfect Supplement</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-normal text-foreground mb-1">
            Premium Wellness
          </h2>
          <p className="text-sm font-light text-foreground">
            Clean ingredients, proven research, real results
          </p>
        </div>
        <Link 
          to="/category/all" 
          className="inline-flex items-center gap-1 text-sm font-light text-foreground hover:text-foreground/80 transition-colors duration-200"
        >
          <span>Shop All Products</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
};

export default LargeHero;

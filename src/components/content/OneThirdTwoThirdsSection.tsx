import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const probioticsImage = "/products/probiotics-vitamins-gummies.png";
const ashwagandhaProduct = "/products/ashwagandha-gummies.png";

const OneThirdTwoThirdsSection = () => {
  const staggerReveal = useGsapReveal({ direction: "up", distance: 40, stagger: 0.1, duration: 1, ease: "power3.out" });

  return (
    <section className="w-full px-page">
      <div className="flex items-center justify-between mb-[var(--space-md)]">
        <span className="editorial-overline">Shop by Category</span>
      </div>

      <div ref={staggerReveal} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Narrow column — Digestive Health */}
        <div className="lg:col-span-1">
          <Link to="/category/digestive" className="block group relative">
            <div className="w-full h-[420px] lg:h-[600px] overflow-hidden rounded-[var(--radius-card)] relative shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-700">
              <OptimizedImage
                src={probioticsImage}
                alt="Digestive health supplements"
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-smooth"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Text overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-[var(--space-md)] text-white">
                <span className="editorial-overline text-white/55 mb-2">Collection</span>
                <h3 className="text-sm md:text-base font-light leading-snug tracking-tight mb-3">
                  Digestive<br />Health
                </h3>
                <div className="inline-flex items-center gap-1.5 text-xs font-light border border-white/30 rounded-full px-3 py-1.5 group-hover:bg-white/10 transition-colors duration-300">
                  <span className="tracking-wide">Explore</span>
                  <ArrowRight size={10} />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Wide column — Sleep & Relaxation */}
        <div className="lg:col-span-2">
          <Link to="/category/sleep" className="block group relative">
            <div className="w-full h-[420px] lg:h-[600px] overflow-hidden rounded-[var(--radius-card)] relative shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-700">
              <OptimizedImage
                src={ashwagandhaProduct}
                alt="Sleep and relaxation supplements"
                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-smooth"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

              {/* Text overlay — split layout for wide panel */}
              <div className="absolute bottom-0 left-0 right-0 p-[var(--space-md)] text-white flex items-end justify-between">
                <div>
                  <span className="editorial-overline text-white/55 mb-2">Collection</span>
                  <h3 className="text-base md:text-xl font-light leading-snug tracking-tight mb-3">
                    Sleep &<br />Relaxation
                  </h3>
                  <div className="inline-flex items-center gap-1.5 text-xs font-light border border-white/30 rounded-full px-3 py-1.5 group-hover:bg-white/10 transition-colors duration-300">
                    <span className="tracking-wide">Shop now</span>
                    <ArrowRight size={10} />
                  </div>
                </div>

                {/* Pill count badge */}
                <div className="hidden md:flex flex-col items-end gap-1 mb-1">
                  <span className="text-white/40 text-[0.6rem] uppercase tracking-[0.2em]">From</span>
                  <span className="text-white text-lg font-light">R16.99</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;

import haloGlowCollagen from "@/assets/halo-glow-collagen.png";
import wellnessHeroImage from "@/assets/womens-wellness-hero.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useGsapReveal } from "@/hooks/useGsapReveal";

const FiftyFiftySection = () => {
  const staggerReveal = useGsapReveal({ direction: "up", distance: 50, stagger: 0.15, duration: 1, ease: "power3.out" });

  return (
    <section className="w-full px-page">
      {/* Editorial overline */}
      <div className="flex items-center justify-between mb-[var(--space-md)]">
        <span className="editorial-overline">Explore Healios</span>
        <Link
          to="/category/all"
          className="inline-flex items-center gap-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wide"
        >
          Shop all
          <ArrowRight size={11} />
        </Link>
      </div>

      {/* Two-column editorial grid */}
      <div ref={staggerReveal} className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-sm)] md:gap-4">

        {/* Left — Women's Wellness (tall portrait) */}
        <Link to="/wellness-drive" className="block group relative">
          <div className="w-full aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] relative shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-700">
            <OptimizedImage
              src={wellnessHeroImage}
              alt="Women's Wellness Drive"
              priority={true}
              aspectRatio="square"
              className="group-hover:scale-[1.04] transition-transform duration-700 ease-smooth w-full h-full object-cover"
            />
            {/* Editorial overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

            {/* Bottom label */}
            <div className="absolute bottom-0 left-0 right-0 p-[var(--space-md)] text-white">
              <span className="editorial-overline text-white/60 mb-2">Community</span>
              <h3 className="text-base md:text-lg font-light leading-snug tracking-tight">
                Women's<br />Wellness Drive
              </h3>
              <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                <span className="text-xs font-light tracking-wide">Explore</span>
                <ArrowRight size={11} />
              </div>
            </div>
          </div>
        </Link>

        {/* Right — Halo Glow product (slightly shorter on desktop for visual tension) */}
        <div className="flex flex-col gap-4">
          <Link to="/category/beauty" className="block group relative flex-1">
            <div className="w-full aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] relative shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-700">
              <OptimizedImage
                src={haloGlowCollagen}
                alt="Halo Glow Collagen Powder"
                priority={true}
                aspectRatio="square"
                className="group-hover:scale-[1.04] transition-transform duration-700 ease-smooth w-full h-full object-cover"
              />
              {/* Soft gradient at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-[var(--space-md)] text-white">
                <span className="editorial-overline text-white/60 mb-2">Beauty</span>
                <h3 className="text-base md:text-lg font-light leading-snug tracking-tight">
                  Halo Glow<br />Collagen Powder
                </h3>
                <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                  <span className="text-xs font-light tracking-wide">Shop now</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            </div>
          </Link>

          {/* Trust micro-strip beneath right image */}
          <div className="flex items-center gap-[var(--space-md)] px-1">
            {["Premium Quality", "UK Made", "Science-Backed"].map((val) => (
              <span key={val} className="text-[0.65rem] font-light text-muted-foreground uppercase tracking-[0.18em]">
                {val}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiftyFiftySection;

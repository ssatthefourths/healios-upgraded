import heroImage from "@/assets/hero-image.png";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { useCurrency } from "@/contexts/CurrencyContext";

const REGION_CONTENT: Record<string, { delivery: string }> = {
  GBP: { delivery: "Orders over £40" },
  ZAR: { delivery: "Orders over R600" },
  USD: { delivery: "Orders over $35" },
  EUR: { delivery: "International delivery" },
  CAD: { delivery: "Orders over C$45" },
  AUD: { delivery: "Orders over A$50" },
};
const DEFAULT_REGION = { delivery: "Worldwide delivery" };

const LargeHero = () => {
  const contentReveal = useGsapReveal({ direction: "up", distance: 40, duration: 1.2, ease: "power3.out" });
  const { detectedCurrency } = useCurrency();
  const region = REGION_CONTENT[detectedCurrency] ?? DEFAULT_REGION;

  return (
    <section className="w-full px-page">
      {/* Main hero image */}
      <div className="w-full aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] mb-5 overflow-hidden relative rounded-[var(--radius-section)] shadow-[var(--shadow-ambient)]">
        <OptimizedImage
          src={heroImage}
          alt="Premium wellness supplements by Healios"
          priority={true}
          aspectRatio="video"
          className="w-full h-full object-cover"
        />

        {/* Multi-layer gradient for depth — top-to-bottom for legibility at bottom edge,
            plus a light left-side darkening for the headline's contrast. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

        {/* Split layout per Monique's mockup (2026-04-24):
            - Headline + tagline on the LEFT (bigger type per her "bigger text" note)
            - CTAs (Shop Bestsellers + wellness quiz) on the RIGHT
            On mobile, both blocks stack naturally in a single column. */}
        <div
          ref={contentReveal}
          className="absolute bottom-[var(--space-lg)] left-[var(--space-lg)] right-[var(--space-lg)] text-white flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          {/* Left: headline + tagline */}
          <div className="md:max-w-2xl">
            {/* Thin rule accent */}
            <div className="w-12 h-px bg-white/60 mb-5" />

            <h1
              className="cinematic-title mb-[var(--space-sm)]"
              style={{ fontSize: 'clamp(3rem, 7vw, 6rem)' }}
            >
              Wellness,<br />Elevated.
            </h1>

            <p className="text-base md:text-lg lg:text-xl font-light opacity-85 max-w-lg leading-relaxed">
              Science-backed gummy supplements that help you sleep deeper, think clearer, and feel your best, every single day.
            </p>
          </div>

          {/* Right: CTAs (stay anchored bottom-right on md+) */}
          <div className="flex items-center gap-3 flex-wrap md:flex-shrink-0">
            <Link
              to="/category/best-sellers"
              className="inline-flex items-center gap-2 bg-white text-foreground px-6 py-3 text-sm font-medium premium-btn rounded-[var(--radius)] tracking-wide uppercase"
            >
              <span>Shop Bestsellers</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/wellness-quiz"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-light transition-colors duration-300 tracking-wide"
            >
              <span>Take the wellness quiz</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Product count badge — top right */}
        <div className="absolute top-[var(--space-md)] right-[var(--space-md)] bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5">
          <span className="text-white text-[0.6rem] font-light tracking-[0.18em] uppercase">18 Premium Products</span>
        </div>
      </div>

      {/* Caption strip below hero — "All products" moved to the left, credibility nuggets to the right (ticket #13) */}
      <div className="flex items-start justify-between gap-4">
        <Link
          to="/category/all"
          className="inline-flex items-center gap-1.5 text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wide whitespace-nowrap"
        >
          <span>All products</span>
          <ArrowRight size={11} />
        </Link>
        <div className="flex items-center gap-[var(--space-lg)]">
          {[
            { label: "Free Delivery", sub: region.delivery },
            { label: "🇬🇧 UK Made", sub: "Premium quality" },
          ].map(({ label, sub }) => (
            <div key={label} className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground tracking-wide">{label}</p>
              <p className="text-xs font-light text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LargeHero;

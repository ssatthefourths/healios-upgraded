/**
 * Brand Definition Block
 * A visual manifesto section — premium feel, editorial scale, no fuss.
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const values = [
  { label: "UK Made", desc: "Manufactured to pharmaceutical standards" },
  { label: "100% Vegan", desc: "No animal-derived ingredients, ever" },
  { label: "Science-Backed", desc: "Every formula peer-reviewed" },
  { label: "Clean Label", desc: "No artificial colours or sweeteners" },
];

const BrandDefinition = () => {
  return (
    <section className="w-full bg-[hsl(var(--secondary))] py-[var(--space-xl)] px-page">
      <div className="max-w-7xl mx-auto">

        {/* Top row — overline + CTA */}
        <div className="flex items-start justify-between mb-[var(--space-lg)]">
          <span className="editorial-overline">Our Philosophy</span>
          <Link
            to="/about/our-story"
            className="group inline-flex items-center gap-2 text-xs font-light text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wide"
          >
            <span>Our story</span>
            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Large serif statement */}
        <div className="mb-[var(--space-xl)]">
          <h2 className="font-serif font-normal text-foreground leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)", fontStyle: "italic" }}>
            Wellness that works
            <span className="text-muted-foreground"> — because your health</span>
            <br className="hidden md:block" />
            <span className="text-muted-foreground"> deserves more than a compromise.</span>
          </h2>
        </div>

        {/* Values grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/60 border border-border/60 rounded-[var(--radius-card)] overflow-hidden">
          {values.map(({ label, desc }) => (
            <div key={label} className="bg-[hsl(var(--secondary))] px-[var(--space-md)] py-[var(--space-md)] group">
              <div className="w-4 h-px bg-foreground/30 mb-4 transition-all duration-500 group-hover:w-8" />
              <p className="text-xs font-medium text-foreground uppercase tracking-[0.14em] mb-1.5">{label}</p>
              <p className="text-xs font-light text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default BrandDefinition;

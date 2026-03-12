/**
 * Brand Definition Block for AI Engine Optimization (AEO)
 * Provides clear, extractable brand information for AI search engines
 */

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const BrandDefinition = () => {
  return (
    <section className="w-full bg-background px-md mb-xl">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md md:gap-xl items-center">
          {/* Left - Visual element */}
          <div className="space-y-sm">
            <h2 className="text-lg font-medium text-foreground uppercase tracking-widest">
              What is Healios?
            </h2>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-md">
              Premium gummy vitamins made in the UK. Science-backed formulas 
              that taste great and deliver real results.
            </p>
            
            {/* Minimal brand values */}
            <div className="flex flex-wrap gap-x-md gap-y-xs text-xs text-muted-foreground font-light uppercase tracking-widest">
              <span>UK Made</span>
              <span className="opacity-40">/</span>
              <span>Vegan Friendly</span>
              <span className="opacity-40">/</span>
              <span>Science-Backed</span>
            </div>
          </div>
          
          {/* Right - CTA */}
          <div className="flex md:justify-end">
            <Link 
              to="/about/our-story" 
              className="group inline-flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
            >
              <span>Learn more about us</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandDefinition;

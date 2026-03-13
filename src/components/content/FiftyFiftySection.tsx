import haloGlowCollagen from "@/assets/halo-glow-collagen.png";
import wellnessHeroImage from "@/assets/womens-wellness-hero.jpg";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-[var(--space-xl)] px-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-md)]">
        <Link to="/wellness-drive" className="block group">
          <div className="w-full aspect-square mb-[var(--space-sm)] overflow-hidden bg-muted rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-500">
            <OptimizedImage 
              src={wellnessHeroImage} 
              alt="Women's Wellness Drive - diverse women celebrating wellness"
              priority={true}
              aspectRatio="square"
              className="group-hover:scale-[1.03] transition-transform duration-500 ease-smooth"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground mb-[var(--space-xs)] uppercase tracking-wider">
              Women's Wellness Drive
            </h3>
            <p className="text-sm font-light text-muted-foreground">
              Join women of all ages sharing their daily wellness routines with Healios
            </p>
          </div>
        </Link>

        <div>
          <Link to="/category/beauty" className="block group">
            <div className="w-full aspect-square mb-[var(--space-sm)] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-500">
              <OptimizedImage 
                src={haloGlowCollagen} 
                alt="Halo Glow Collagen Powder" 
                priority={true}
                aspectRatio="square"
                className="group-hover:scale-[1.03] transition-transform duration-500 ease-smooth"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-medium text-foreground mb-[var(--space-xs)] uppercase tracking-wider">
              Halo Glow Collagen Powder
            </h3>
            <p className="text-sm font-light text-muted-foreground">
              Daily beauty-support to help maintain skin radiance and support collagen formation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiftyFiftySection;

import haloGlowCollagen from "@/assets/halo-glow-collagen.png";
import wellnessHeroImage from "@/assets/womens-wellness-hero.jpg";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/wellness-drive" className="block group">
          <div className="w-full aspect-square mb-3 overflow-hidden bg-muted">
            <OptimizedImage 
              src={wellnessHeroImage} 
              alt="Women's Wellness Drive - diverse women celebrating wellness"
              priority={true}
              aspectRatio="square"
              className="group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div>
            <h3 className="text-sm font-normal text-foreground mb-1">
              Women's Wellness Drive
            </h3>
            <p className="text-sm font-light text-foreground">
              Join women of all ages sharing their daily wellness routines with Healios
            </p>
          </div>
        </Link>

        <div>
          <Link to="/category/beauty" className="block">
            <div className="w-full aspect-square mb-3 overflow-hidden">
              <OptimizedImage 
                src={haloGlowCollagen} 
                alt="Halo Glow Collagen Powder" 
                priority={true}
                aspectRatio="square"
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-normal text-foreground mb-1">
              Halo Glow Collagen Powder
            </h3>
            <p className="text-sm font-light text-foreground">
              Daily beauty-support to help maintain skin radiance and support collagen formation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FiftyFiftySection;

import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";

// Use images from public folder
const ashwagandhaProduct = "/products/ashwagandha-gummies.png";
const organicEarring = "/products/probiotics-vitamins-gummies.png";

const OneThirdTwoThirdsSection = () => {
  return (
    <section className="w-full mb-[var(--space-xl)] px-md">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--space-md)]">
        <div className="lg:col-span-1">
          <Link to="/category/digestive" className="block group">
            <div className="w-full h-[500px] lg:h-[800px] mb-[var(--space-sm)] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-500">
              <OptimizedImage 
                src={organicEarring} 
                alt="Digestive health supplements" 
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-smooth"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-medium text-foreground mb-[var(--space-xs)] uppercase tracking-widest">
              Digestive Health
            </h3>
            <p className="text-sm font-light text-muted-foreground">
              Probiotics and gut support for better digestion and immunity
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Link to="/category/sleep" className="block group">
            <div className="w-full h-[500px] lg:h-[800px] mb-[var(--space-sm)] overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-ambient)] group-hover:shadow-[var(--shadow-ambient-hover)] transition-shadow duration-500">
              <OptimizedImage 
                src={ashwagandhaProduct} 
                alt="Ashwagandha supplements for relaxation"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-smooth"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-medium text-foreground mb-[var(--space-xs)] uppercase tracking-widest">
              Sleep & Relaxation
            </h3>
            <p className="text-sm font-light text-muted-foreground">
              Natural formulas for deeper sleep and muscle recovery
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;

import { Link } from "react-router-dom";
import OptimizedImage from "@/components/ui/optimized-image";

// Use images from public folder
const ashwagandhaProduct = "/products/ashwagandha-gummies.png";
const organicEarring = "/products/probiotics-vitamins-gummies.png";

const OneThirdTwoThirdsSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Link to="/category/digestive" className="block">
            <div className="w-full h-[500px] lg:h-[800px] mb-3 overflow-hidden">
              <OptimizedImage 
                src={organicEarring} 
                alt="Digestive health supplements" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-normal text-foreground mb-1">
              Digestive Health
            </h3>
            <p className="text-sm font-light text-foreground">
              Probiotics and gut support for better digestion and immunity
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Link to="/category/sleep" className="block">
            <div className="w-full h-[500px] lg:h-[800px] mb-3 overflow-hidden">
              <OptimizedImage 
                src={ashwagandhaProduct} 
                alt="Ashwagandha supplements for relaxation"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </Link>
          <div className="">
            <h3 className="text-sm font-normal text-foreground mb-1">
              Sleep & Relaxation
            </h3>
            <p className="text-sm font-light text-foreground">
              Natural formulas for deeper sleep and muscle recovery
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OneThirdTwoThirdsSection;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EditorialSection = () => {
  return (
    <section className="w-full mb-xl px-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md md:gap-xl items-center">
        <div className="space-y-sm max-w-[630px]">
          <h2 className="text-2xl font-medium text-foreground leading-tight md:text-xl uppercase tracking-widest">
            Women's Wellness Drive
          </h2>
          <p className="text-sm font-light text-muted-foreground leading-relaxed">
            Join women of all ages sharing their daily wellness routines with Healios. Be inspired, share your journey, and celebrate real wellness together.
          </p>
          <Link to="/wellness-drive">
            <Button variant="outline" className="mt-sm">
              Share Your Story
            </Button>
          </Link>
        </div>
        
        <div className="order-first md:order-last">
          <div className="w-full aspect-square overflow-hidden bg-muted rounded-card">
            <video
              src="/videos/healios-womens-wellness.mov"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-500 ease-smooth hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;

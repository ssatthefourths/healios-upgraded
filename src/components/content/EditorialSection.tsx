import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const EditorialSection = () => {
  return (
    <section className="w-full mb-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4 max-w-[630px]">
          <h2 className="text-2xl font-normal text-foreground leading-tight md:text-xl">
            Women's Wellness Drive
          </h2>
          <p className="text-sm font-light text-foreground leading-relaxed">
            Join women of all ages sharing their daily wellness routines with Healios. Be inspired, share your journey, and celebrate real wellness together.
          </p>
          <Link to="/wellness-drive">
            <Button variant="outline" className="mt-2">
              Share Your Story
            </Button>
          </Link>
        </div>
        
        <div className="order-first md:order-last">
          <div className="w-full aspect-square overflow-hidden bg-muted">
            <video
              src="/videos/healios-womens-wellness.mov"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;

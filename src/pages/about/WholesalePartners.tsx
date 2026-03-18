import AboutLayout from "../../components/about/AboutLayout";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "@/components/ui/button";
import { Building, TrendingUp, Package, Users, Mail } from "lucide-react";

const WholesalePartners = () => (
  <AboutLayout
    title="Wholesale Partners"
    subtitle="Partner with Healios to offer premium supplements to your customers"
    seoTitle="Wholesale Partners | Healios"
    seoDescription="Partner with Healios to offer premium gummy vitamins to your customers. Competitive margins, marketing support, and flexible ordering."
    canonicalUrl="https://www.thehealios.com/about/wholesale-partners"
    keywords={["wholesale", "retail partner", "bulk vitamins", "stockist"]}
  >
    <ContentSection title="Why Partner with Healios?">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-light text-foreground mb-2">High Margins</h3>
            <p className="text-muted-foreground leading-relaxed">
              Competitive wholesale pricing that allows you to maintain healthy profit margins while offering your customers premium products.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-light text-foreground mb-2">Reliable Stock</h3>
            <p className="text-muted-foreground leading-relaxed">
              Consistent inventory and dependable fulfillment so you never have to worry about stock-outs or letting your customers down.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-light text-foreground mb-2">Marketing Support</h3>
            <p className="text-muted-foreground leading-relaxed">
              Access to marketing materials, product education resources and training to help you sell effectively.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-light text-foreground mb-2">Premium Products</h3>
            <p className="text-muted-foreground leading-relaxed">
              Science-backed, clean formulations that your customers will trust and repurchase. Quality that speaks for itself.
            </p>
          </div>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Who Can Partner?">
      <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">
        We work with a range of businesses and professionals who share our commitment to quality wellness products.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 border border-border rounded-lg text-center">
          <h3 className="text-lg font-light text-foreground mb-2">Gyms & Fitness Studios</h3>
          <p className="text-muted-foreground text-sm">
            Offer your members supplements that support their training and recovery goals.
          </p>
        </div>

        <div className="p-6 border border-border rounded-lg text-center">
          <h3 className="text-lg font-light text-foreground mb-2">Health Retailers</h3>
          <p className="text-muted-foreground text-sm">
            Stock trusted, science-backed supplements that customers actively seek out.
          </p>
        </div>

        <div className="p-6 border border-border rounded-lg text-center">
          <h3 className="text-lg font-light text-foreground mb-2">Health Professionals</h3>
          <p className="text-muted-foreground text-sm">
            Recommend and supply quality supplements to your clients with confidence.
          </p>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="How It Works">
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium shrink-0">
            1
          </div>
          <div>
            <h3 className="text-lg font-light text-foreground mb-1">Get in Touch</h3>
            <p className="text-muted-foreground">
              Email us with details about your business and what products you're interested in stocking.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium shrink-0">
            2
          </div>
          <div>
            <h3 className="text-lg font-light text-foreground mb-1">Review & Approval</h3>
            <p className="text-muted-foreground">
              We'll review your application and discuss pricing, minimum orders and terms.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-medium shrink-0">
            3
          </div>
          <div>
            <h3 className="text-lg font-light text-foreground mb-1">Start Selling</h3>
            <p className="text-muted-foreground">
              Place your first order and start offering Healios products to your customers.
            </p>
          </div>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Contact Our Wholesale Team">
      <div className="bg-muted/30 p-8 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <span className="text-lg text-foreground">hello@thehealios.com</span>
        </div>
        <p className="text-muted-foreground mb-6">
          Interested in becoming a Healios wholesale partner? Get in touch with our team to discuss how we can work together.
        </p>
        <Button asChild>
          <a href="mailto:hello@thehealios.com">Apply for Wholesale</a>
        </Button>
      </div>
    </ContentSection>
  </AboutLayout>
);

export default WholesalePartners;

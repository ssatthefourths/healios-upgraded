import AboutLayout from "../../components/about/AboutLayout";
import ContentSection from "../../components/about/ContentSection";
import { Shield, Leaf, FlaskConical, Award } from "lucide-react";

const QualitySourcing = () => (
  <AboutLayout
    title="Quality & Sourcing"
    subtitle="Premium ingredients, rigorous standards, transparent practices"
    seoTitle="Quality & Sourcing | Healios"
    seoDescription="Learn about Healios commitment to quality. Premium ingredients, rigorous testing standards, and transparent sourcing practices."
    canonicalUrl="https://www.thehealios.com/about/quality-sourcing"
    keywords={["quality supplements", "ingredient sourcing", "third party testing", "premium vitamins"]}
  >
    <ContentSection title="Our Commitment to Quality">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <FlaskConical className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-light text-foreground mb-2">Evidence-Based Formulations</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every product is developed using peer-reviewed research and clinical studies. We use ingredients at effective dosages, not just trace amounts for label appeal.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-light text-foreground mb-2">Clean Ingredients</h3>
              <p className="text-muted-foreground leading-relaxed">
                No unnecessary fillers, artificial colours or hidden additives. Our formulations are minimal by design, containing only what's needed for maximum effectiveness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Ingredient Sourcing">
      <p className="text-muted-foreground leading-relaxed max-w-3xl mb-8">
        We partner with trusted suppliers worldwide to source the highest quality raw ingredients. Each ingredient is selected based on purity, potency and scientific backing.
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="space-y-4 p-6 border border-border rounded-lg">
          <h3 className="text-lg font-light text-foreground">KSM-66® Ashwagandha</h3>
          <p className="text-muted-foreground text-sm">
            The world's most clinically studied ashwagandha extract, with 24+ gold-standard clinical trials proving its efficacy for stress, energy and cognitive function.
          </p>
        </div>
        <div className="space-y-4 p-6 border border-border rounded-lg">
          <h3 className="text-lg font-light text-foreground">Premium Magnesium</h3>
          <p className="text-muted-foreground text-sm">
            Our magnesium complex uses highly bioavailable forms including glycinate and citrate for optimal absorption and effectiveness.
          </p>
        </div>
        <div className="space-y-4 p-6 border border-border rounded-lg">
          <h3 className="text-lg font-light text-foreground">Vitamin D3</h3>
          <p className="text-muted-foreground text-sm">
            Sourced as cholecalciferol, the same form your body naturally produces from sunlight, for superior absorption and utilisation.
          </p>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Manufacturing Standards">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-light text-foreground mb-2">GMP-Certified Facilities</h3>
              <p className="text-muted-foreground leading-relaxed">
                All products are manufactured in Good Manufacturing Practice certified facilities, ensuring consistent quality, purity and safety in every batch.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-light text-foreground mb-2">Third-Party Testing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Every batch undergoes independent laboratory testing to verify potency, purity and the absence of contaminants. We test for heavy metals, microbes and allergens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Our Quality Promise">
      <div className="bg-muted/30 p-8 rounded-lg">
        <p className="text-lg text-foreground leading-relaxed">
          We stand behind every product we create. If you're not completely satisfied with the quality of any Healios supplement, contact our support team and we'll make it right. Your trust is our priority.
        </p>
      </div>
    </ContentSection>
  </AboutLayout>
);

export default QualitySourcing;

import AboutLayout from "../../components/about/AboutLayout";
import ContentSection from "../../components/about/ContentSection";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Zap, Heart, Brain, Smile } from "lucide-react";

const ProductGuide = () => (
  <AboutLayout
    title="Product Guide"
    subtitle="Find the right supplements for your wellness goals"
    seoTitle="Product Guide | Healios"
    seoDescription="Find the right Healios supplements for your wellness goals. Browse our complete product guide with benefits, ingredients, and recommendations."
    canonicalUrl="https://www.thehealios.com/about/product-guide"
    keywords={["product guide", "supplement guide", "which vitamins to take", "wellness guide"]}
  >
    <ContentSection title="Our Product Range">
      <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">
        Each Healios supplement is designed to target specific wellness needs. Use this guide to understand what each product does and how it can support your health journey.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-light text-foreground">Magnesium Complex</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Supports relaxation, muscle recovery and quality sleep. Our highly bioavailable blend helps calm the nervous system and reduce stress.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded">Sleep</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Relaxation</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Muscle Recovery</span>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sun className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-light text-foreground">Vitamin D3</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Essential for immune function, mood regulation and bone health. Especially important during winter months or for those with limited sun exposure.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded">Immunity</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Mood</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Bone Health</span>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-light text-foreground">Ashwagandha (KSM-66)</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Clinically proven adaptogen that helps manage stress, boost energy and support cognitive function. The gold-standard ashwagandha extract.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded">Stress</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Energy</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Focus</span>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smile className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-light text-foreground">Apple Cider Vinegar Gummies</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            A delicious way to support digestion and metabolism. Combined with ginger for enhanced digestive benefits.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded">Digestion</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Metabolism</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Gut Health</span>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-light text-foreground">Probiotic Complex</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Multi-strain probiotic formula to support gut health, immunity and overall digestive wellness. Shelf-stable for convenience.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded">Gut Health</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Immunity</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Digestion</span>
          </div>
        </div>

        <div className="p-6 border border-border rounded-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-light text-foreground">Iron + Vitamin C</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Gentle iron formula combined with vitamin C for enhanced absorption. Supports energy levels and reduces fatigue.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs bg-muted px-2 py-1 rounded">Energy</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Fatigue</span>
            <span className="text-xs bg-muted px-2 py-1 rounded">Vitality</span>
          </div>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="When to Take Your Supplements">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-light text-foreground flex items-center gap-2">
            <Sun className="h-5 w-5" /> Morning
          </h3>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>• Vitamin D3: best absorbed with breakfast</li>
            <li>• Iron + Vitamin C: take on empty stomach or with food</li>
            <li>• Ashwagandha: for daytime energy and focus</li>
          </ul>
        </div>
        <div className="space-y-4 p-6 bg-muted/30 rounded-lg">
          <h3 className="text-lg font-light text-foreground flex items-center gap-2">
            <Moon className="h-5 w-5" /> Evening
          </h3>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>• Magnesium Complex: 30-60 mins before bed</li>
            <li>• Ashwagandha: alternatively for relaxation</li>
            <li>• Probiotic: with or without food</li>
          </ul>
        </div>
      </div>
    </ContentSection>

    <ContentSection title="Storage Tips">
      <div className="space-y-4 max-w-3xl">
        <p className="text-muted-foreground leading-relaxed">
          To maintain potency and freshness:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li>• Store in a cool, dry place away from direct sunlight</li>
          <li>• Keep bottles tightly closed when not in use</li>
          <li>• Probiotics can be refrigerated for extended shelf life</li>
          <li>• Check expiration dates and use within recommended timeframe</li>
        </ul>
      </div>
    </ContentSection>

    <ContentSection title="Need Personalised Advice?">
      <Button variant="outline" className="w-fit" asChild>
        <a href="mailto:support@thehealios.com">Email Our Team</a>
      </Button>
      <p className="text-muted-foreground text-sm mt-4">
        Our wellness team is happy to help you find the right supplements for your needs. Contact us at support@thehealios.com
      </p>
    </ContentSection>
  </AboutLayout>
);

export default ProductGuide;

import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import ImageTextBlock from "../../components/about/ImageTextBlock";
import AboutSidebar from "../../components/about/AboutSidebar";
import SEOHead from "../../components/seo/SEOHead";

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Our Story | Healios"
        description="Discover the story behind Healios. Learn about our mission to make wellness simple, effective and accessible through premium gummy vitamins."
        canonicalUrl="https://www.thehealios.com/about/our-story"
        keywords={["about healios", "our story", "wellness brand", "gummy vitamins company"]}
      />
      
      <Header />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AboutSidebar />
        </div>
        
        <main className="w-full lg:w-[70vw] lg:ml-auto px-page py-[var(--space-xl)]">
          <PageHeader 
            title="Our Story" 
            subtitle="Making wellness simple, effective and accessible"
          />
          
          <ContentSection>
            <ImageTextBlock
              image="/founders.png"
              imageAlt="The Healios Health Co. team"
              title="Created from a Simple Belief"
              content="The Healios Health Co. was born from a simple belief: people deserve supplements that are trustworthy, transparent and genuinely helpful. Too many brands hide behind hype or poor formulations. We focus on premium ingredients, proven research and products that customers actually feel and benefit from."
              imagePosition="left"
            />
          </ContentSection>

          <ContentSection title="Our Approach">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Science-Backed Formulations</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every product in our range is developed with evidence-based formulations. We don't follow trends or make empty promises. Instead, we focus on research-supported ingredients at effective dosages, ensuring you get supplements that genuinely work.
                </p>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-light text-foreground">Clean & Transparent</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We believe in minimal ingredient lists with no hidden fillers or unnecessary additives. What you see is what you get: premium ingredients, clearly labelled, with no hype or complexity. Just supplements that help you feel better.
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Our Values">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Premium Quality</h3>
                <p className="text-muted-foreground">
                  We source only the highest quality, research-backed ingredients for every product we create.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Transparency</h3>
                <p className="text-muted-foreground">
                  Clear education, honest labelling and no hidden ingredients. We believe you deserve to know exactly what you're taking.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-light text-foreground">Simplicity</h3>
                <p className="text-muted-foreground">
                  We cut through the noise of the modern wellness industry to make healthy living accessible and straightforward.
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Our Mission">
            <div className="max-w-3xl">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Healios exists to deliver clean, science-driven supplements that help people feel better, sleep deeper, think clearer and live healthier, without the complexity or noise of the modern wellness industry. We're here to make wellness simple, effective and accessible for everyone.
              </p>
            </div>
          </ContentSection>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default OurStory;

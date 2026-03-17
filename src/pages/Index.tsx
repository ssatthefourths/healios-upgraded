import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import LargeHero from "../components/content/LargeHero";
import FiftyFiftySection from "../components/content/FiftyFiftySection";
import OneThirdTwoThirdsSection from "../components/content/OneThirdTwoThirdsSection";
import ProductCarousel from "../components/content/ProductCarousel";
import BrandDefinition from "../components/content/BrandDefinition";
import PersonalizedRecommendations from "../components/product/PersonalizedRecommendations";
import NewsletterPopup from "../components/NewsletterPopup";
import OrganizationSchema from "../components/seo/OrganizationSchema";
import WebSiteSchema from "../components/seo/WebSiteSchema";
import SEOHead from "../components/seo/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Healios | Premium Gummy Vitamins & Supplements"
        description="Discover Healios premium gummy vitamins and supplements. Delicious, effective wellness made simple. Shop ashwagandha, collagen, magnesium and more."
        canonicalUrl="https://www.thehealios.com/"
        keywords={["gummy vitamins", "supplements", "wellness", "ashwagandha gummies", "collagen gummies", "vitamin gummies"]}
      />

      <OrganizationSchema />
      <WebSiteSchema />

      <Header />

      <main id="main-content" className="flex flex-col gap-[var(--space-xl)] pb-[var(--space-xl)]">
        {/* 1 — Hero: primary CTA above the fold */}
        <LargeHero />

        {/* 2 — Products: show what we sell immediately after the hook */}
        <ProductCarousel />

        {/* 3 — Editorial: brand story and featured content */}
        <FiftyFiftySection />

        {/* 4 — Category grid: drive exploration */}
        <OneThirdTwoThirdsSection />

        {/* 5 — Brand values: build trust before they consider leaving */}
        <BrandDefinition />

        {/* 6 — Personalised picks: closing nudge for return visitors */}
        <PersonalizedRecommendations title="Recommended for You" />
      </main>

      <Footer />
      <NewsletterPopup />
    </div>
  );
};

export default Index;

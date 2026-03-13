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
      {/* SEO Head */}
      <SEOHead
        title="Healios | Premium Gummy Vitamins & Supplements"
        description="Discover Healios premium gummy vitamins and supplements. Delicious, effective wellness made simple. Shop ashwagandha, collagen, magnesium and more."
        canonicalUrl="https://www.thehealios.com/"
        keywords={["gummy vitamins", "supplements", "wellness", "ashwagandha gummies", "collagen gummies", "vitamin gummies UK"]}
      />
      
      {/* SEO Schemas */}
      <OrganizationSchema />
      <WebSiteSchema />
      
      <Header />
      
      <main id="main-content" className="pb-[var(--space-2xl)] flex flex-col gap-[var(--space-xl)]">
        <FiftyFiftySection />
        <ProductCarousel />
        <PersonalizedRecommendations title="Recommended for You" />
        <BrandDefinition />
        <LargeHero />
        <OneThirdTwoThirdsSection />
      </main>
      
      <Footer />
      <NewsletterPopup />
    </div>
  );
};

export default Index;

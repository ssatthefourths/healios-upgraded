import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import PairsWellWith from "../components/product/PairsWellWith";
import BundleContents from "../components/product/BundleContents";
import PersonalizedRecommendations from "../components/product/PersonalizedRecommendations";
import ProductSchema from "../components/seo/ProductSchema";
import BreadcrumbSchema from "../components/seo/BreadcrumbSchema";
import FAQSchema from "../components/seo/FAQSchema";
import HowToSchema from "../components/seo/HowToSchema";
import SEOHead from "../components/seo/SEOHead";
import PageContainer from "../components/layout/PageContainer";
import { useProduct } from "@/hooks/useProduct";
import { useProductAnalytics } from "@/hooks/useProductAnalytics";
import { useProductRatings } from "@/hooks/useProductRatings";
import { trackViewItem } from "@/lib/analytics";
import { trackMetaViewContent } from "@/lib/metaPixel";
import { categoryDisplayToSlug } from "@/lib/categorySlug";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetail = () => {
  const { productId } = useParams();
  const { product, loading, error } = useProduct(productId);
  const { trackView } = useProductAnalytics();
  
  // Get product ratings for schema
  const { ratings } = useProductRatings(product?.id ? [product.id] : []);
  const productRating = product?.id ? ratings[product.id] : undefined;

  // Track product view (internal analytics + GA4 + Meta Pixel)
  useEffect(() => {
    if (product?.id) {
      trackView(product.id);
      
      // GA4 view_item event
      trackViewItem({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      });
      
      // Meta Pixel ViewContent event
      trackMetaViewContent({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      });
    }
  }, [product?.id, trackView]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PageContainer maxWidth="wide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="aspect-square w-full" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PageContainer className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-2xl font-light text-foreground mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/" className="text-foreground underline hover:no-underline">
              Return to Homepage
            </Link>
          </PageContainer>
        </main>
        <Footer />
      </div>
    );
  }

  const categoryLabel = product.category.charAt(0).toUpperCase() + product.category.slice(1).replace(/-/g, ' ');
  const categorySlugForUrl = categoryDisplayToSlug(product.category);

  // Breadcrumb items for schema
  const breadcrumbItems = [
    { name: "Home", url: "https://www.thehealios.com/" },
    { name: categoryLabel, url: `https://www.thehealios.com/category/${categorySlugForUrl}` },
    { name: product.name, url: `https://www.thehealios.com/product/${product.slug || product.id}` }
  ];

  // Parse product FAQs for schema (stored as JSON in database)
  const productFaqs = product.faqs as Array<{ question: string; answer: string }> | null;

  // Parse how_to_take for HowTo schema
  const howToSteps = product.how_to_take?.split(/\d+\.\s*/).filter(Boolean) || [];

  // Generate SEO meta description
  const metaDescription = product.meta_description || 
    `${product.name} - ${product.description?.substring(0, 120) || 'Premium gummy vitamins from Healios'}...`;
  const seoTitle = product.seo_title || `${product.name} | Healios Gummy Vitamins`;
  const canonicalUrl = `https://www.thehealios.com/product/${product.slug || product.id}`;
  const keywords = product.secondary_keywords || [product.primary_keyword, product.category].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <SEOHead
        title={seoTitle}
        description={metaDescription}
        canonicalUrl={canonicalUrl}
        ogType="product"
        ogImage={product.image.startsWith('http') ? product.image : `https://www.thehealios.com${product.image}`}
        keywords={keywords}
      />
      
      {/* SEO Schemas */}
      <ProductSchema product={product} rating={productRating} />
      <BreadcrumbSchema items={breadcrumbItems} />
      {productFaqs && productFaqs.length > 0 && <FAQSchema faqs={productFaqs} />}
      {howToSteps.length > 0 && (
        <HowToSchema
          name={`How to Take ${product.name}`}
          description={`Usage instructions for ${product.name} gummy vitamins`}
          steps={howToSteps}
          totalTime="PT1M"
          image={product.image}
        />
      )}
      
      <Header />
      
      <main id="main-content">
        <PageContainer maxWidth="wide" className="py-6">
          {/* Breadcrumb - Show above image on smaller screens */}
          <div className="lg:hidden mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/category/${categorySlugForUrl}`}>{categoryLabel}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{product.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          {/* Top hero — gallery left, slim sticky buy-box right.
              Description blocks moved out of the sticky column to render
              full-width below (per 2026-04-25 PDP rework). */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
            <ProductImageGallery productImage={product.image} productName={product.name} />

            <div className="lg:sticky lg:top-6 lg:self-start">
              <ProductInfo product={product} />

              {/* Bundle Contents — only on bundle products */}
              {!!product.is_bundle && product.bundle_products && (
                <BundleContents
                  bundleProducts={product.bundle_products}
                  bundleDiscount={product.bundle_discount_percent || undefined}
                />
              )}
            </div>
          </div>

          {/* Below-hero content blocks: Description, Benefits, How to Take,
              Who Is It For, Ingredients, Reviews (open by default), then
              collapsed Safety + FAQs. Full-width inside PageContainer. */}
          <ProductDescription product={product} />
        </PageContainer>
        
        {/* Pairs Well With Section */}
        <PairsWellWith 
          productIds={product.pairs_well_with} 
          currentProductId={product.id} 
        />
        
        {/* Personalized Recommendations */}
        <PersonalizedRecommendations 
          currentProductId={product.id}
          title="Recommended for You"
        />
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetail;

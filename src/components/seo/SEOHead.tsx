import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[];
}

/**
 * SEO Head component for dynamic meta tags
 * Use on all pages for proper SEO optimization
 */
const SEOHead = ({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage = "https://www.thehealios.com/healios-og.png",
  noIndex = false,
  keywords = [],
}: SEOHeadProps) => {
  const fullTitle = title.includes("Healios") ? title : `${title} | Healios`;
  const baseUrl = "https://www.thehealios.com";
  const canonical = canonicalUrl || (typeof window !== "undefined" ? window.location.href.split("?")[0] : "");

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:site_name" content="Healios" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default SEOHead;

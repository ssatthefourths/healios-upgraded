import { BRAND } from "@/constants/brand";

/**
 * WebSite Schema with SearchAction (JSON-LD) for SEO/AEO
 * Enables sitelinks search box in Google search results
 */
const WebSiteSchema = () => {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": BRAND.name,
    "alternateName": BRAND.shortName,
    "url": BRAND.website.url,
    "description": BRAND.description,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BRAND.website.url}/shop?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": BRAND.name
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
    />
  );
};

export default WebSiteSchema;

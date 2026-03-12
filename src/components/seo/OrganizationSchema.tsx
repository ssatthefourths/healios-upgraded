import { BRAND } from "@/constants/brand";

/**
 * Organization Schema (JSON-LD) for SEO/AEO
 * Helps AI engines and search engines identify brand entity, contact info, and social presence
 */
const OrganizationSchema = () => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": BRAND.name,
    "alternateName": BRAND.shortName,
    "url": BRAND.website.url,
    "logo": `${BRAND.website.url}${BRAND.assets.logo}`,
    "description": BRAND.description,
    "foundingDate": BRAND.foundingYear.toString(),
    "address": {
      "@type": "PostalAddress",
      "addressCountry": BRAND.countryCode
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": BRAND.email.general,
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "sameAs": [
      BRAND.socials.instagram.url,
      BRAND.socials.tiktok.url
    ],
    "brand": {
      "@type": "Brand",
      "name": BRAND.shortName
    },
    "slogan": BRAND.tagline
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
};

export default OrganizationSchema;

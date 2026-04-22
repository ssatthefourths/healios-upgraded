/**
 * Product Schema (JSON-LD) for SEO
 * Enables rich product results in Google with price, availability, and reviews
 */

interface ProductSchemaProps {
  product: {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    price: number;
    image: string;
    category: string;
    stock_quantity?: number;
  };
  rating?: {
    averageRating: number;
    reviewCount: number;
  };
}

const ProductSchema = ({ product, rating }: ProductSchemaProps) => {
  // Determine availability based on stock
  const getAvailability = () => {
    if (product.stock_quantity === undefined) return "https://schema.org/InStock";
    if (product.stock_quantity <= 0) return "https://schema.org/OutOfStock";
    if (product.stock_quantity < 10) return "https://schema.org/LimitedAvailability";
    return "https://schema.org/InStock";
  };

  // Build image URL
  const imageUrl = product.image.startsWith('http') 
    ? product.image 
    : `https://www.thehealios.com${product.image}`;

  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": imageUrl,
    "description": product.description || `${product.name} - Premium wellness supplement from Healios`,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Healios"
    },
    "category": product.category,
    "offers": {
      "@type": "Offer",
      "url": `https://www.thehealios.com/product/${product.slug || product.id}`,
      "priceCurrency": "GBP",
      "price": product.price.toFixed(2),
      "availability": getAvailability(),
      "seller": {
        "@type": "Organization",
        "name": "The Healios Health Co."
      },
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "GB"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    }
  };

  // Add aggregate rating if available
  if (rating && rating.reviewCount > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": rating.averageRating.toFixed(1),
      "reviewCount": rating.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
};

export default ProductSchema;

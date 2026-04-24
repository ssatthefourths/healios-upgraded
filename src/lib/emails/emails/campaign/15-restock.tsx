import * as React from "react";
import {
  BigCTA,
  Footer,
  Header,
  Hero,
  PillarStrip,
  ProductCallout,
} from "../../components";
import { Layout } from "../../components/Layout";
import { sampleProducts } from "../../data/sampleProducts";

interface RestockProps {
  customerName?: string;
  productSlug?: keyof typeof sampleProducts;
  unsubscribeUrl?: string;
  preferencesUrl?: string;
}

export const Restock: React.FC<RestockProps> = ({
  customerName = "Monique",
  productSlug = "ashwagandha",
  unsubscribeUrl,
  preferencesUrl,
}) => {
  const product = sampleProducts[productSlug];

  return (
    <Layout preview={`${product.name} is back in stock.`}>
      <Header />
      <Hero
        eyebrow="BACK IN STOCK"
        headline={`It's back, ${customerName}.`}
        italicWord="back"
        body={`You asked to be notified when ${product.name} returned. It's in the warehouse, and we're shipping today.`}
        ctaLabel="Shop now"
        ctaHref={product.href}
        imageUrl="https://placehold.co/1200x1400/F1F0EE/9A9AA3?text=Restock+hero+1200%C3%971400&font=playfair"
      />
      <PillarStrip />
      <ProductCallout
        category={product.category}
        name={product.name}
        description="Small batches, peak freshness. Last time it was available we sold through in under a week — don't wait."
        price={product.price}
        href={product.href}
        ctaLabel="Add to cart"
      />
      <BigCTA
        eyebrow="NEVER RUN OUT"
        headline="Subscribe and save 15%."
        italicWord="Subscribe"
        body="Set your cadence, skip or swap anytime, 15% off every order. Most customers find subscribing is the only way to stay consistent."
        ctaLabel="Start a subscription"
        ctaHref={`${product.href}?subscribe=1`}
        dark
      />
      <Footer unsubscribeUrl={unsubscribeUrl} preferencesUrl={preferencesUrl} />
    </Layout>
  );
};

Restock.displayName = "15 · Restock Alert";
export default Restock;

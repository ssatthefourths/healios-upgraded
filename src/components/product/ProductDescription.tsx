import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import ReviewProduct from "./ReviewProduct";
import ProductReviews from "./ProductReviews";

type Product = Tables<'products'>;

interface FAQ {
  question: string;
  answer: string;
}

interface ProductDescriptionProps {
  product: Product;
}

/**
 * PDP content blocks rendered BELOW the hero (gallery + buy-box) per the
 * 2026-04-25 layout rework. Headline content (Description, Key Benefits,
 * How to Take, Who Is It For, Ingredients, Reviews) is always-visible —
 * no chevrons to click. Only Safety + FAQs stay collapsible to keep
 * legal / low-frequency content out of the way.
 *
 * Reviews has an id="reviews" anchor so the buy-box star-rating link can
 * scroll-to it.
 */
const ProductDescription = ({ product }: ProductDescriptionProps) => {
  const [isFAQsOpen, setIsFAQsOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

  const rawBenefits = product.benefits;
  const benefits = Array.isArray(rawBenefits) ? rawBenefits : null;

  const faqs = Array.isArray(product.faqs) ? (product.faqs as unknown as FAQ[]) : null;

  const rawIngredients = product.ingredients as unknown as
    | Array<{ name: string; amount?: string; nrv?: string }>
    | { servingSize?: string; nutritionalValues?: Array<{ name: string; amount?: string; nrv?: string }>; servingsPerContainer?: string }
    | null;

  const nutritionalValues = Array.isArray(rawIngredients)
    ? rawIngredients
    : (rawIngredients?.nutritionalValues || null);
  const servingSize = !Array.isArray(rawIngredients) ? rawIngredients?.servingSize : null;
  const servingsPerContainer = !Array.isArray(rawIngredients) ? rawIngredients?.servingsPerContainer : null;

  return (
    <div className="space-y-12 mt-12">
      {/* Description + Key Benefits */}
      {(product.description || (benefits && benefits.length > 0)) && (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-medium text-foreground">Description</h2>
          {product.description && (
            <p className="text-base font-light text-muted-foreground leading-relaxed max-w-3xl">
              {product.description}
            </p>
          )}
          {benefits && benefits.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-base font-medium text-foreground">Key Benefits</h3>
              <ul className="space-y-1.5">
                {benefits.map((benefit, index) => {
                  const benefitText = typeof benefit === 'string'
                    ? benefit
                    : (benefit as { title: string; description?: string }).title;
                  return (
                    <li key={index} className="text-base font-light text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {benefitText}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* How to Take */}
      {product.how_to_take && (
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-medium text-foreground">How to Take</h2>
          <p className="text-base font-light text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">
            {product.how_to_take}
          </p>
        </section>
      )}

      {/* Who Is It For */}
      {product.who_is_it_for && (
        <section className="space-y-3">
          <h2 className="text-xl md:text-2xl font-medium text-foreground">Who Is It For</h2>
          <p className="text-base font-light text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">
            {product.who_is_it_for}
          </p>
        </section>
      )}

      {/* Ingredients */}
      {nutritionalValues && nutritionalValues.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-medium text-foreground">Ingredients</h2>
          {(servingSize || servingsPerContainer) && (
            <div className="text-sm text-muted-foreground">
              {servingSize && <span>Serving Size: {servingSize}</span>}
              {servingSize && servingsPerContainer && <span className="mx-2">|</span>}
              {servingsPerContainer && <span>Servings: {servingsPerContainer}</span>}
            </div>
          )}
          <div className="max-w-2xl divide-y divide-border border-y border-border">
            {nutritionalValues.map((ingredient, index) => (
              <div key={index} className="flex justify-between py-3 text-sm font-light">
                <span className="text-muted-foreground">{ingredient.name}</span>
                <span className="text-foreground">
                  {ingredient.amount}
                  {ingredient.nrv && <span className="text-muted-foreground ml-2">({ingredient.nrv} NRV)</span>}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews — open by default; anchored for buy-box star-rating link */}
      <section id="reviews" className="space-y-6 scroll-mt-24">
        <h2 className="text-xl md:text-2xl font-medium text-foreground">Reviews</h2>
        <ReviewProduct
          productId={product.id}
          onReviewSubmitted={() => setReviewRefreshTrigger(prev => prev + 1)}
        />
        <ProductReviews
          productId={product.id}
          refreshTrigger={reviewRefreshTrigger}
        />
      </section>

      {/* Safety + FAQs — kept collapsed (legal / low-frequency content) */}
      <div className="border-t border-border">
        {(product.safety_info || product.product_cautions) && (
          <div className="border-b border-border">
            <Button
              variant="ghost"
              onClick={() => setIsSafetyOpen(!isSafetyOpen)}
              className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
            >
              <span>Safety Information</span>
              {isSafetyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isSafetyOpen && (
              <div className="pb-6 space-y-4">
                {product.safety_info && (
                  <p className="text-sm font-light text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">
                    {product.safety_info}
                  </p>
                )}
                {product.product_cautions && (
                  <div className="p-4 bg-muted/50 rounded-sm max-w-3xl">
                    <p className="text-sm font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                      {product.product_cautions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {faqs && faqs.length > 0 && (
          <div className="border-b border-border">
            <Button
              variant="ghost"
              onClick={() => setIsFAQsOpen(!isFAQsOpen)}
              className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
            >
              <span>FAQs</span>
              {isFAQsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {isFAQsOpen && (
              <div className="pb-6 space-y-6 max-w-3xl">
                {faqs.map((faq, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">{faq.question}</h4>
                    <p className="text-sm font-light text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;

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

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true);
  const [isHowToTakeOpen, setIsHowToTakeOpen] = useState(false);
  const [isWhoIsItForOpen, setIsWhoIsItForOpen] = useState(false);
  const [isIngredientsOpen, setIsIngredientsOpen] = useState(false);
  const [isFAQsOpen, setIsFAQsOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [reviewRefreshTrigger, setReviewRefreshTrigger] = useState(0);

  // Parse benefits from JSON - handle both string[] and object[] formats
  const rawBenefits = product.benefits;
  const benefits = Array.isArray(rawBenefits) ? rawBenefits : null;

  // Parse JSON fields safely
  const faqs = Array.isArray(product.faqs) ? (product.faqs as unknown as FAQ[]) : null;
  
  // Handle both direct array and nested object formats for ingredients
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
    <div className="space-y-0 mt-8 border-t border-border">
      {/* Description */}
      {(product.description || (benefits && benefits.length > 0)) && (
        <div className="border-b border-border">
          <Button
            variant="ghost"
            onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
            className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
          >
            <span>Description</span>
            {isDescriptionOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isDescriptionOpen && (
            <div className="pb-6 space-y-4">
              {product.description && (
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}
              {benefits && benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-light text-foreground">Key Benefits</h4>
                  <ul className="space-y-1.5">
                    {benefits.map((benefit, index) => {
                      const benefitText = typeof benefit === 'string' 
                        ? benefit 
                        : (benefit as { title: string; description?: string }).title;
                      return (
                        <li key={index} className="text-sm font-light text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {benefitText}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* How to Take */}
      {product.how_to_take && (
        <div className="border-b border-border">
          <Button
            variant="ghost"
            onClick={() => setIsHowToTakeOpen(!isHowToTakeOpen)}
            className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
          >
            <span>How to Take</span>
            {isHowToTakeOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isHowToTakeOpen && (
            <div className="pb-6">
              <p className="text-sm font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.how_to_take}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Who Is It For */}
      {product.who_is_it_for && (
        <div className="border-b border-border">
          <Button
            variant="ghost"
            onClick={() => setIsWhoIsItForOpen(!isWhoIsItForOpen)}
            className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
          >
            <span>Who Is It For</span>
            {isWhoIsItForOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isWhoIsItForOpen && (
            <div className="pb-6">
              <p className="text-sm font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.who_is_it_for}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ingredients */}
      {nutritionalValues && nutritionalValues.length > 0 && (
        <div className="border-b border-border">
          <Button
            variant="ghost"
            onClick={() => setIsIngredientsOpen(!isIngredientsOpen)}
            className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
          >
            <span>Ingredients</span>
            {isIngredientsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isIngredientsOpen && (
            <div className="pb-6 space-y-3">
              {(servingSize || servingsPerContainer) && (
                <div className="text-xs text-muted-foreground mb-2">
                  {servingSize && <span>Serving Size: {servingSize}</span>}
                  {servingSize && servingsPerContainer && <span className="mx-2">|</span>}
                  {servingsPerContainer && <span>Servings: {servingsPerContainer}</span>}
                </div>
              )}
              {nutritionalValues.map((ingredient, index) => (
                <div key={index} className="flex justify-between text-sm font-light">
                  <span className="text-muted-foreground">{ingredient.name}</span>
                  <span className="text-foreground">
                    {ingredient.amount}
                    {ingredient.nrv && <span className="text-muted-foreground ml-2">({ingredient.nrv} NRV)</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAQs */}
      {faqs && faqs.length > 0 && (
        <div className="border-b border-border">
          <Button
            variant="ghost"
            onClick={() => setIsFAQsOpen(!isFAQsOpen)}
            className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
          >
            <span>FAQs</span>
            {isFAQsOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isFAQsOpen && (
            <div className="pb-6 space-y-6">
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

      {/* Safety Information */}
      {(product.safety_info || product.product_cautions) && (
        <div className="border-b border-border">
          <Button
            variant="ghost"
            onClick={() => setIsSafetyOpen(!isSafetyOpen)}
            className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
          >
            <span>Safety Information</span>
            {isSafetyOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {isSafetyOpen && (
            <div className="pb-6 space-y-4">
              {product.safety_info && (
                <p className="text-sm font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.safety_info}
                </p>
              )}
              {product.product_cautions && (
                <div className="p-4 bg-muted/50 rounded-sm">
                  <p className="text-sm font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                    {product.product_cautions}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="border-b border-border lg:mb-16">
        <Button
          variant="ghost"
          onClick={() => setIsReviewsOpen(!isReviewsOpen)}
          className="w-full h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Reviews</span>
          {isReviewsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isReviewsOpen && (
          <div className="pb-6 space-y-6">
            <ReviewProduct 
              productId={product.id} 
              onReviewSubmitted={() => setReviewRefreshTrigger(prev => prev + 1)} 
            />
            <ProductReviews 
              productId={product.id} 
              refreshTrigger={reviewRefreshTrigger} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;

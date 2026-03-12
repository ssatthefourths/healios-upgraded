import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface FAQAction {
  label: string;
  href: string;
}

/**
 * Maps FAQ questions from Products & Ingredients to contextual CTA buttons
 */
const faqActions: Record<string, FAQAction[]> = {
  'Are your products vegan?': [
    { label: 'Browse Vegan Products', href: '/category/vegan' },
    { label: 'View Non-Vegan Products', href: '/category/non-vegan' },
  ],
  'Are the products gluten-free?': [
    { label: 'Shop All Gluten-Free Products', href: '/category/gluten-free' },
  ],
  'Do your products contain sugar?': [
    { label: 'View No Added Sugar Products', href: '/category/sugar-free' },
  ],
  'Are artificial additives used?': [
    { label: 'Explore Our Clean Formulations', href: '/category/shop' },
  ],
  'Are your products keto-friendly?': [
    { label: 'Shop Keto-Friendly Products', href: '/category/keto-friendly' },
  ],
  'What allergens do your products contain?': [
    { label: 'Browse Allergen-Friendly Products', href: '/category/allergen-free' },
  ],
};

const FAQActionButtons = ({ question }: { question: string }) => {
  const actions = faqActions[question];
  if (!actions) return null;

  return (
    <div className="flex flex-wrap gap-3 mt-4 pt-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          to={action.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs tracking-[0.1em] uppercase bg-foreground text-background hover:bg-foreground/85 transition-colors"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ))}
    </div>
  );
};

export default FAQActionButtons;

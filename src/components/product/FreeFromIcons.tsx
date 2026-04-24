import { Leaf, WheatOff, CandyOff, Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FreeFromIconsProps {
  product: {
    is_vegan?: boolean | number | null;
    is_gluten_free?: boolean | number | null;
    is_sugar_free?: boolean | number | null;
    is_keto_friendly?: boolean | number | null;
  };
  /** Compact renders small icon-only row (cards). Default renders icon + label. */
  compact?: boolean;
  className?: string;
}

type Trait = {
  key: string;
  label: string;
  tooltip: string;
  Icon: typeof Leaf;
  active: boolean;
};

/**
 * Renders the subset of free-from traits that are true on the product.
 * D1 stores booleans as 0/1 integers — coerce before checking.
 *
 * Only the "true" traits render. If none are true, the component renders
 * nothing (null). Order is: Vegan → Gluten-Free → Sugar-Free → Keto.
 */
const FreeFromIcons = ({ product, compact = false, className = "" }: FreeFromIconsProps) => {
  const traits: Trait[] = [
    {
      key: "vegan",
      label: "Vegan",
      tooltip: "No animal-derived ingredients",
      Icon: Leaf,
      active: !!product.is_vegan,
    },
    {
      key: "gluten-free",
      label: "Gluten-Free",
      tooltip: "Contains no gluten",
      Icon: WheatOff,
      active: !!product.is_gluten_free,
    },
    {
      key: "sugar-free",
      label: "Sugar-Free",
      tooltip: "No added sugar",
      Icon: CandyOff,
      active: !!product.is_sugar_free,
    },
    {
      key: "keto",
      label: "Keto-Friendly",
      tooltip: "Low carb, fits ketogenic diets",
      Icon: Flame,
      active: !!product.is_keto_friendly,
    },
  ];

  const activeTraits = traits.filter((t) => t.active);
  if (activeTraits.length === 0) return null;

  if (compact) {
    // Icon-only row for product cards. Icons are still accessible via aria-label.
    return (
      <TooltipProvider delayDuration={200}>
        <div className={`flex items-center gap-2 ${className}`} role="list" aria-label="Dietary traits">
          {activeTraits.map(({ key, label, tooltip, Icon }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  role="listitem"
                  aria-label={label}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    );
  }

  // Full-label row for PDP. Icon + label side by side.
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}
      role="list"
      aria-label="Dietary traits"
    >
      {activeTraits.map(({ key, label, Icon }) => (
        <div
          key={key}
          className="inline-flex items-center gap-1.5 text-xs font-light text-muted-foreground"
          role="listitem"
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

export default FreeFromIcons;

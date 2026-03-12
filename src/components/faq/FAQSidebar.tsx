import { cn } from "@/lib/utils";

interface FAQSidebarProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryClick: (category: string) => void;
  resultCounts: Record<string, number>;
}

const FAQSidebar = ({ categories, activeCategory, onCategoryClick, resultCounts }: FAQSidebarProps) => {
  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-28">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Categories
        </p>
        <ul className="space-y-1">
          {categories.map((category) => (
            <li key={category}>
              <button
                onClick={() => onCategoryClick(category)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors rounded-sm flex items-center justify-between group",
                  activeCategory === category
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span>{category}</span>
                {resultCounts[category] !== undefined && (
                  <span className={cn(
                    "text-xs",
                    activeCategory === category ? "text-foreground/60" : "text-muted-foreground/60"
                  )}>
                    {resultCounts[category]}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default FAQSidebar;

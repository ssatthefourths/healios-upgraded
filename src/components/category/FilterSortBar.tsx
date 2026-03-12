import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

export interface ProductFilters {
  priceRanges: string[];
  suitability: string[];
  categories: string[];
}

interface FilterSortBarProps {
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  itemCount: number;
  sortBy: string;
  onSortChange: (value: string) => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  showCategoryFilter?: boolean;
  onResetAll?: () => void;
}

const PRICE_RANGES = [
  { label: "Under £15", value: "under-15" },
  { label: "£15 - £18", value: "15-18" },
  { label: "£18 - £20", value: "18-20" },
  { label: "Over £20", value: "over-20" },
];

const SUITABILITY_OPTIONS = [
  { label: "Kids Friendly", value: "kids" },
  { label: "Adults Only", value: "adults-only" },
];

const CATEGORY_OPTIONS = [
  { label: "Vitamins & Minerals", value: "Vitamins & Minerals" },
  { label: "Adaptogens", value: "Adaptogens" },
  { label: "Digestive Health", value: "Digestive Health" },
  { label: "Sleep & Relaxation", value: "Sleep & Relaxation" },
  { label: "Beauty", value: "Beauty" },
  { label: "Women's Health", value: "Women's Health" },
];

const FilterSortBar = ({ 
  filtersOpen, 
  setFiltersOpen, 
  itemCount, 
  sortBy, 
  onSortChange,
  filters,
  onFiltersChange,
  showCategoryFilter = false,
  onResetAll
}: FilterSortBarProps) => {

  const handlePriceToggle = (value: string) => {
    const newPrices = filters.priceRanges.includes(value)
      ? filters.priceRanges.filter(p => p !== value)
      : [...filters.priceRanges, value];
    onFiltersChange({ ...filters, priceRanges: newPrices });
  };

  const handleSuitabilityToggle = (value: string) => {
    const newSuitability = filters.suitability.includes(value)
      ? filters.suitability.filter(s => s !== value)
      : [...filters.suitability, value];
    onFiltersChange({ ...filters, suitability: newSuitability });
  };

  const handleCategoryToggle = (value: string) => {
    const newCategories = filters.categories.includes(value)
      ? filters.categories.filter(c => c !== value)
      : [...filters.categories, value];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onFiltersChange({ priceRanges: [], suitability: [], categories: [] });
  };

  const activeFilterCount = filters.priceRanges.length + filters.suitability.length + filters.categories.length;
  const hasActiveFiltersOrSort = activeFilterCount > 0 || sortBy !== 'featured';

  // Get display labels for active filters
  const getFilterChips = () => {
    const chips: { type: 'price' | 'suitability' | 'category'; value: string; label: string }[] = [];
    
    filters.priceRanges.forEach(value => {
      const range = PRICE_RANGES.find(r => r.value === value);
      if (range) chips.push({ type: 'price', value, label: range.label });
    });
    
    filters.suitability.forEach(value => {
      const item = SUITABILITY_OPTIONS.find(s => s.value === value);
      if (item) chips.push({ type: 'suitability', value, label: item.label });
    });
    
    filters.categories.forEach(value => {
      const cat = CATEGORY_OPTIONS.find(c => c.value === value);
      if (cat) chips.push({ type: 'category', value, label: cat.label });
    });
    
    return chips;
  };

  const handleRemoveChip = (type: 'price' | 'suitability' | 'category', value: string) => {
    if (type === 'price') {
      onFiltersChange({ ...filters, priceRanges: filters.priceRanges.filter(p => p !== value) });
    } else if (type === 'suitability') {
      onFiltersChange({ ...filters, suitability: filters.suitability.filter(s => s !== value) });
    } else {
      onFiltersChange({ ...filters, categories: filters.categories.filter(c => c !== value) });
    }
  };

  const filterChips = getFilterChips();

  return (
    <>
      <section className="w-full px-6 mb-8 border-b border-border pb-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-light text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'product' : 'products'}
          </p>
          
          <div className="flex items-center gap-4">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="font-light hover:bg-transparent"
                >
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-background border-none shadow-none">
                <SheetHeader className="mb-6 border-b border-border pb-4">
                  <SheetTitle className="text-lg font-light">Filters</SheetTitle>
                </SheetHeader>
                
                <div className="space-y-8">
                  {/* Price Filter */}
                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Price</h3>
                    <div className="space-y-3">
                      {PRICE_RANGES.map((range) => (
                        <div key={range.value} className="flex items-center space-x-3">
                          <Checkbox 
                            id={range.value} 
                            checked={filters.priceRanges.includes(range.value)}
                            onCheckedChange={() => handlePriceToggle(range.value)}
                            className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" 
                          />
                          <Label htmlFor={range.value} className="text-sm font-light text-foreground cursor-pointer">
                            {range.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="border-border" />

                  {/* Category Filter - only show when viewing all products */}
                  {showCategoryFilter && (
                    <>
                      <div>
                        <h3 className="text-sm font-light mb-4 text-foreground">Category</h3>
                        <div className="space-y-3">
                          {CATEGORY_OPTIONS.map((cat) => (
                            <div key={cat.value} className="flex items-center space-x-3">
                              <Checkbox 
                                id={cat.value} 
                                checked={filters.categories.includes(cat.value)}
                                onCheckedChange={() => handleCategoryToggle(cat.value)}
                                className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" 
                              />
                              <Label htmlFor={cat.value} className="text-sm font-light text-foreground cursor-pointer">
                                {cat.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator className="border-border" />
                    </>
                  )}

                  {/* Suitability Filter */}
                  <div>
                    <h3 className="text-sm font-light mb-4 text-foreground">Suitability</h3>
                    <div className="space-y-3">
                      {SUITABILITY_OPTIONS.map((item) => (
                        <div key={item.value} className="flex items-center space-x-3">
                          <Checkbox 
                            id={item.value} 
                            checked={filters.suitability.includes(item.value)}
                            onCheckedChange={() => handleSuitabilityToggle(item.value)}
                            className="border-border data-[state=checked]:bg-foreground data-[state=checked]:border-foreground" 
                          />
                          <Label htmlFor={item.value} className="text-sm font-light text-foreground cursor-pointer">
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="border-border" />

                  <div className="flex flex-col gap-2 pt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full border-none hover:bg-transparent hover:underline font-light text-left justify-start"
                      onClick={() => setFiltersOpen(false)}
                    >
                      View Results ({itemCount})
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full border-none hover:bg-transparent hover:underline font-light text-left justify-start"
                      onClick={clearFilters}
                      disabled={activeFilterCount === 0}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-auto border-none bg-transparent text-sm font-light shadow-none rounded-none pr-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="shadow-none border-none rounded-none bg-background">
                <SelectItem value="featured" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Featured</SelectItem>
                <SelectItem value="price-low" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Price: Low to High</SelectItem>
                <SelectItem value="price-high" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Price: High to Low</SelectItem>
                <SelectItem value="newest" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Newest</SelectItem>
                <SelectItem value="name-az" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Name A-Z</SelectItem>
                <SelectItem value="name-za" className="hover:bg-transparent hover:underline data-[state=checked]:bg-transparent data-[state=checked]:underline pl-2 [&>span:first-child]:hidden">Name Z-A</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFiltersOrSort && onResetAll && (
              <Button 
                variant="ghost" 
                size="sm"
                className="font-light hover:bg-transparent text-muted-foreground hover:text-foreground"
                onClick={onResetAll}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Active Filter Chips */}
      {filterChips.length > 0 && (
        <section className="w-full px-6 mb-4">
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <button
                key={`${chip.type}-${chip.value}`}
                onClick={() => handleRemoveChip(chip.type, chip.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-light bg-muted text-foreground rounded-full hover:bg-muted/80 transition-colors"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

export default FilterSortBar;

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar, { ProductFilters } from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import FeaturedArrivalsSection from "../components/category/FeaturedArrivalsSection";
import CategoryEducation from "../components/category/CategoryEducation";
import BreadcrumbSchema from "../components/seo/BreadcrumbSchema";
import PageContainer from "../components/layout/PageContainer";
import SEOHead from "../components/seo/SEOHead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackViewItemList } from "@/lib/analytics";

// Category meta descriptions for SEO
const categoryMeta: Record<string, { title: string; description: string }> = {
  'vitamins-minerals': {
    title: 'Vitamins & Minerals Gummies',
    description: 'Shop our range of delicious gummy vitamins and minerals. Essential nutrients for daily wellness including Vitamin D3, Iron, Magnesium and more. Free UK delivery over £30.',
  },
  'vitamins': {
    title: 'Vitamins & Minerals Gummies',
    description: 'Shop our range of delicious gummy vitamins and minerals. Essential nutrients for daily wellness including Vitamin D3, Iron, Magnesium and more. Free UK delivery over £30.',
  },
  'adaptogens': {
    title: 'Adaptogen Gummies',
    description: 'Discover our adaptogen gummies including Ashwagandha and Lions Mane. Natural stress relief and cognitive support in delicious gummy form. Free UK delivery over £30.',
  },
  'digestive-health': {
    title: 'Digestive Health Gummies',
    description: 'Support your gut health with our probiotic and digestive gummies. ACV, Turmeric and Probiotic formulas for optimal digestion. Free UK delivery over £30.',
  },
  'digestive': {
    title: 'Digestive Health Gummies',
    description: 'Support your gut health with our probiotic and digestive gummies. ACV, Turmeric and Probiotic formulas for optimal digestion. Free UK delivery over £30.',
  },
  'sleep-relaxation': {
    title: 'Sleep & Relaxation Gummies',
    description: 'Improve your sleep naturally with our relaxation gummies. Magnesium and sleep support formulas for restful nights. Free UK delivery over £30.',
  },
  'sleep': {
    title: 'Sleep & Relaxation Gummies',
    description: 'Improve your sleep naturally with our relaxation gummies. Magnesium and sleep support formulas for restful nights. Free UK delivery over £30.',
  },
  'beauty': {
    title: 'Beauty & Skin Gummies',
    description: 'Glow from within with our beauty gummies. Collagen, Hair Skin & Nails, and Biotin supplements for radiant skin and healthy hair. Free UK delivery over £30.',
  },
  'bundles': {
    title: 'Wellness Bundles & Stacks',
    description: 'Save with our curated wellness bundles. Morning Energy, Evening Wind Down, and Immunity stacks. Up to 15% off when you bundle. Free UK delivery.',
  },
  'stacks': {
    title: 'Wellness Bundles & Stacks',
    description: 'Save with our curated wellness bundles. Morning Energy, Evening Wind Down, and Immunity stacks. Up to 15% off when you bundle. Free UK delivery.',
  },
  'shop': {
    title: 'All Products',
    description: 'Browse the complete Healios range of gummy vitamins and supplements. Premium quality, delicious taste, effective results. Free UK delivery over £30.',
  },
  'all': {
    title: 'All Products',
    description: 'Browse the complete Healios range of gummy vitamins and supplements. Premium quality, delicious taste, effective results. Free UK delivery over £30.',
  },
  // Trait-based subcategory pages
  'vegan': {
    title: 'Vegan Supplements | Healios',
    description: 'Shop our collection of 100% vegan gummy supplements. Plant-based vitamins, adaptogens and wellness products with no animal-derived ingredients. Free UK delivery over £30.',
  },
  'non-vegan': {
    title: 'Collagen & Non-Vegan Supplements | Healios',
    description: 'Shop our collagen and animal-derived supplements. Premium quality formulations for skin, hair and joint support. Free UK delivery over £30.',
  },
  'gluten-free': {
    title: 'Gluten-Free Supplements | Healios',
    description: 'All Healios products are gluten-free and suitable for those with gluten sensitivities or coeliac disease. Shop with confidence. Free UK delivery over £30.',
  },
  'sugar-free': {
    title: 'No Added Sugar Supplements | Healios',
    description: 'Shop our range of supplements with no added sugar. Clean formulations using natural sweeteners for a guilt-free wellness routine. Free UK delivery over £30.',
  },
  'keto-friendly': {
    title: 'Keto-Friendly Supplements | Healios',
    description: 'Low-carb, keto-compatible gummy vitamins and supplements. Support your ketogenic lifestyle without compromising on nutrition. Free UK delivery over £30.',
  },
  'allergen-free': {
    title: 'Allergen-Friendly Supplements | Healios',
    description: 'Browse our allergen-friendly supplements free from gluten, dairy, soy and nuts. Clean formulations for sensitive individuals. Free UK delivery over £30.',
  },
};

// Parse URL params into filters
const parseFiltersFromParams = (searchParams: URLSearchParams): ProductFilters => {
  const priceRanges = searchParams.get('price')?.split(',').filter(Boolean) || [];
  const suitability = searchParams.get('suitability')?.split(',').filter(Boolean) || [];
  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  return { priceRanges, suitability, categories };
};

// Serialize filters to URL params
const serializeFiltersToParams = (
  filters: ProductFilters,
  sortBy: string,
  searchParams: URLSearchParams
): URLSearchParams => {
  const newParams = new URLSearchParams(searchParams);
  
  if (filters.priceRanges.length > 0) {
    newParams.set('price', filters.priceRanges.join(','));
  } else {
    newParams.delete('price');
  }
  
  if (filters.suitability.length > 0) {
    newParams.set('suitability', filters.suitability.join(','));
  } else {
    newParams.delete('suitability');
  }
  
  if (filters.categories.length > 0) {
    newParams.set('categories', filters.categories.join(','));
  } else {
    newParams.delete('categories');
  }
  
  if (sortBy && sortBy !== 'featured') {
    newParams.set('sort', sortBy);
  } else {
    newParams.delete('sort');
  }
  
  return newParams;
};

// Trait-based filter slugs (these filter by product properties, not category)
const traitFilterSlugs: Record<string, { column: string; value: boolean }> = {
  'vegan': { column: 'is_vegan', value: true },
  'non-vegan': { column: 'is_vegan', value: false },
  'gluten-free': { column: 'is_gluten_free', value: true },
  'sugar-free': { column: 'is_sugar_free', value: true },
  'keto-friendly': { column: 'is_keto_friendly', value: true },
  'allergen-free': { column: 'is_gluten_free', value: true }, // gluten-free + no common allergens
};

// Map URL slugs to database category values
const categoryMap: Record<string, string> = {
  'vitamins-minerals': 'Vitamins & Minerals',
  'vitamins': 'Vitamins & Minerals',
  'adaptogens': 'Adaptogens',
  'digestive-health': 'Digestive Health',
  'digestive': 'Digestive Health',
  'sleep-relaxation': 'Sleep & Relaxation',
  'sleep': 'Sleep & Relaxation',
  'beauty': 'Beauty',
  'womens-health': "Women's Health",
  'bundles': 'Bundles',
  'stacks': 'Bundles',
  'shop': '', // Show all products
  'all': '', // Show all products
  'new-in': '',
  'best-sellers': '',
  // Trait slugs also map to empty category (show all, filtered by trait)
  'vegan': '',
  'non-vegan': '',
  'gluten-free': '',
  'sugar-free': '',
  'keto-friendly': '',
  'allergen-free': '',
};

// Category display names
const categoryNames: Record<string, string> = {
  'vitamins-minerals': 'Vitamins & Minerals',
  'vitamins': 'Vitamins & Minerals',
  'adaptogens': 'Adaptogens',
  'digestive-health': 'Digestive Health',
  'digestive': 'Digestive Health',
  'sleep-relaxation': 'Sleep & Relaxation',
  'sleep': 'Sleep & Relaxation',
  'beauty': 'Beauty',
  'womens-health': "Women's Health",
  'bundles': 'Bundles & Stacks',
  'stacks': 'Bundles & Stacks',
  'shop': 'All Products',
  'all': 'All Products',
  'new-in': 'New Arrivals',
  'best-sellers': 'Best Sellers',
  // Trait-based pages
  'vegan': 'Vegan Products',
  'non-vegan': 'Non-Vegan Products',
  'gluten-free': 'Gluten-Free Products',
  'sugar-free': 'No Added Sugar Products',
  'keto-friendly': 'Keto-Friendly Products',
  'allergen-free': 'Allergen-Friendly Products',
};

// Helper to check if price matches filter ranges
const checkPriceFilter = (price: number, ranges: string[]): boolean => {
  if (ranges.length === 0) return true;
  
  return ranges.some(range => {
    switch (range) {
      case 'under-15':
        return price < 15;
      case '15-18':
        return price >= 15 && price < 18;
      case '18-20':
        return price >= 18 && price <= 20;
      case 'over-20':
        return price > 20;
      default:
        return true;
    }
  });
};

const Category = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Initialize state from URL params
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'featured');
  const [filters, setFilters] = useState<ProductFilters>(() => parseFiltersFromParams(searchParams));

  // Sync state changes to URL
  useEffect(() => {
    setSearchParams(prevParams => {
      const newParams = serializeFiltersToParams(filters, sortBy, prevParams);
      return newParams;
    }, { replace: true });
  }, [filters, sortBy, setSearchParams]);

  const categorySlug = category?.toLowerCase() || 'shop';
  const categoryFilter = categoryMap[categorySlug] ?? categorySlug;
  const categoryDisplayName = categoryNames[categorySlug] || category?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'All Products';
  const showAllProducts = !categoryFilter;
  const traitFilter = traitFilterSlugs[categorySlug] || null;

  const isBestSellers = categorySlug === 'best-sellers';
  
  // Define Product type for type safety
  type Product = {
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    is_published: boolean;
    stock_quantity: number;
    is_kids_product: boolean;
    is_adults_only: boolean;
    sort_order?: number;
    created_at?: string;
  };
  
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', categoryFilter, sortBy, filters, isBestSellers, traitFilter],
    queryFn: async (): Promise<Product[]> => {
      // Use best_seller_products view for best-sellers category
      if (isBestSellers) {
        const { data, error } = await supabase
          .rpc('get_best_seller_products' as never)
          .limit(8);
        
        if (error) {
          // Fallback to regular products if view doesn't exist
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('products')
            .select('id, name, category, price, image, is_published, stock_quantity, is_kids_product, is_adults_only, sort_order, created_at')
            .eq('is_published', true)
            .order('sort_order', { ascending: true })
            .limit(8);
          
          if (fallbackError) throw fallbackError;
          return (fallbackData || []) as Product[];
        }
        return (data || []) as Product[];
      }
      
      let query = supabase
        .from('products')
        .select('id, name, category, price, image, is_published, sort_order, created_at, stock_quantity, is_kids_product, is_adults_only, is_vegan, is_gluten_free, is_sugar_free, is_keto_friendly, contains_allergens')
        .eq('is_published', true);
      
      // Filter by category if not showing all
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      
      // Apply trait-based filter
      if (traitFilter) {
        if (traitFilter.column === 'is_vegan' || traitFilter.column === 'is_gluten_free' || traitFilter.column === 'is_sugar_free' || traitFilter.column === 'is_keto_friendly') {
          query = query.eq(traitFilter.column, traitFilter.value);
        }
      }
      
      // Filter by selected categories (only when showing all products)
      if (showAllProducts && filters.categories.length > 0) {
        query = query.in('category', filters.categories);
      }
      
      // Filter by suitability
      if (filters.suitability.includes('kids')) {
        query = query.eq('is_kids_product', true);
      }
      if (filters.suitability.includes('adults-only')) {
        query = query.eq('is_adults_only', true);
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'name-az':
          query = query.order('name', { ascending: true });
          break;
        case 'name-za':
          query = query.order('name', { ascending: false });
          break;
        default: // featured
          query = query.order('sort_order', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Apply price filter client-side (Supabase doesn't support OR conditions easily)
      let filteredData = data || [];
      if (filters.priceRanges.length > 0) {
        filteredData = filteredData.filter(product => 
          checkPriceFilter(product.price, filters.priceRanges)
        );
      }
      
      return filteredData;
    },
  });

  // Track view_item_list event when products are loaded
  const hasTrackedListRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (products && products.length > 0) {
      // Create a unique key for this product list to avoid duplicate tracking
      const listKey = `${categorySlug}-${products.map(p => p.id).join(',')}`;
      
      if (hasTrackedListRef.current !== listKey) {
        hasTrackedListRef.current = listKey;
        
        const listId = categorySlug || 'all-products';
        const listName = categoryDisplayName;
        
        trackViewItemList(
          listId,
          listName,
          products.map((product, index) => ({
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            index: index,
          }))
        );
      }
    }
  }, [products, categorySlug, categoryDisplayName]);

  const isNewIn = categorySlug === 'new-in';

  // Breadcrumb items for schema
  const breadcrumbItems = [
    { name: "Home", url: "https://www.thehealios.com/" },
    { name: categoryDisplayName, url: `https://www.thehealios.com/category/${categorySlug}` }
  ];

  // Get SEO meta for this category
  const seoMeta = categoryMeta[categorySlug] || {
    title: categoryDisplayName,
    description: `Shop ${categoryDisplayName} at Healios. Premium gummy supplements for your wellness journey. Free UK delivery over £30.`,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Meta Tags */}
      <SEOHead
        title={seoMeta.title}
        description={seoMeta.description}
        canonicalUrl={`https://www.thehealios.com/category/${categorySlug}`}
      />
      
      {/* SEO Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />
      
      <Header />
      
      <main id="main-content">
        {isNewIn ? (
          <FeaturedArrivalsSection />
        ) : (
          <PageContainer maxWidth="wide" className="pt-6 pb-12">
            <CategoryHeader 
              category={categoryDisplayName} 
            />
            
            <FilterSortBar 
              filtersOpen={filtersOpen}
              setFiltersOpen={setFiltersOpen}
              itemCount={products?.length || 0}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filters={filters}
              onFiltersChange={setFilters}
              showCategoryFilter={showAllProducts}
              onResetAll={() => {
                setFilters({ priceRanges: [], suitability: [], categories: [] });
                setSortBy('featured');
              }}
            />
            
            <ProductGrid 
              products={products || []} 
              isLoading={isLoading} 
            />

            <CategoryEducation categoryName={categoryFilter || categorySlug} />
          </PageContainer>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;

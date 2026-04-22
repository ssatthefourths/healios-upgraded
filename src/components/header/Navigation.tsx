import { ArrowRight, X, User, Settings, Loader2 } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useCurrency } from "@/contexts/CurrencyContext";
import ShoppingBag from "./ShoppingBag";
import CurrencySelector from "./CurrencySelector";
import { getProductPath } from "@/lib/productPath";
// Product images for navigation dropdowns
const magnesiumImage = "/products/magnesium-gummies.png";
const ashwagandhaImage = "/products/ashwagandha-gummies.png";
const probioticsImage = "/products/probiotics-vitamins-gummies.png";
import healiosLogo from "@/assets/healios-logo.png";

interface NavigationProps {
  onScrollChange?: (isScrolled: boolean) => void;
}

const Navigation = ({ onScrollChange }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const { totalItems, cartItems, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading, clearSearch } = useProductSearch();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredSubItem, setHoveredSubItem] = useState<{name: string, href: string, image?: string, description?: string} | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offCanvasType, setOffCanvasType] = useState<'favorites' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdowns on scroll
  const closeAllDropdowns = useCallback(() => {
    setActiveDropdown(null);
    setHoveredSubItem(null);
    setIsSearchOpen(false);
    setOffCanvasType(null);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (activeDropdown || isSearchOpen) {
        closeAllDropdowns();
      }
      onScrollChange?.(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDropdown, isSearchOpen, closeAllDropdowns, onScrollChange]);

  // Close open header panels on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isSearchOpen || offCanvasType)) {
        setIsSearchOpen(false);
        setOffCanvasType(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSearchOpen, offCanvasType]);

  // Preload dropdown images for faster display
  useEffect(() => {
    const imagesToPreload = [
      magnesiumImage,
      ashwagandhaImage,
      probioticsImage,
      "/founders.png"
    ];
    
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const popularSearches = [
    "Magnesium",
    "Vitamin D3", 
    "Ashwagandha",
    "Probiotics",
    "Sleep Support",
    "Energy"
  ];
  
  const navItems = [
    {
      name: "Shop",
      href: ROUTES.CATEGORY.ALL,
      submenuItems: [
        { name: "All Products",           href: ROUTES.CATEGORY.ALL,       image: magnesiumImage,                             description: "Discover our full range of scientifically-backed supplements." },
        { name: "Vitamins & Minerals",    href: ROUTES.CATEGORY.VITAMINS,  image: magnesiumImage,                             description: "Essential micronutrients to support your daily metabolic functions." },
        { name: "Adaptogens",             href: ROUTES.CATEGORY.ADAPTOGENS, image: ashwagandhaImage,                          description: "Powerful herbs to help your body manage stress and maintain balance." },
        { name: "Digestive Health",       href: ROUTES.CATEGORY.DIGESTIVE, image: probioticsImage,                            description: "Support your gut microbiome for better immunity and mood." },
        { name: "Sleep & Relaxation",     href: ROUTES.CATEGORY.SLEEP,     image: "/products/sleep-support-gummies.png",      description: "Natural solutions for deep, restorative sleep and daily calm." },
        { name: "Subscribe & Save",       href: ROUTES.SUBSCRIBE,          image: "/products/morning-energy-stack.png",       description: "Join our community and save up to 25% on your monthly essentials." },
        { name: "Take the Wellness Quiz", href: ROUTES.WELLNESS_QUIZ,      image: "/images/navigation/wellness-quiz.png",     description: "Get a personalized supplement plan tailored to your unique goals." }
      ],
      images: [
        { src: magnesiumImage,   alt: "Vitamins & Minerals Collection", label: "Vitamins",   href: ROUTES.CATEGORY.VITAMINS },
        { src: ashwagandhaImage, alt: "Adaptogens Collection",          label: "Adaptogens", href: ROUTES.CATEGORY.ADAPTOGENS }
      ]
    },
    {
      name: "New In",
      href: ROUTES.CATEGORY.NEW_IN,
      submenuItems: [
        { name: "Latest Arrivals",  href: ROUTES.CATEGORY.NEW_IN,      image: "/images/navigation/new-supplement.png",        description: "Explore our newest innovations in nutritional science." },
        { name: "Best Sellers",     href: ROUTES.CATEGORY.BEST_SELLERS, image: magnesiumImage,                                description: "Our community's most-loved and trusted wellness essentials." },
        { name: "Bundles & Stacks", href: ROUTES.CATEGORY.BUNDLES,     image: "/products/morning-energy-stack.png",           description: "Curated combinations for targeted health and wellness goals." }
      ],
      images: [
        { src: "/images/navigation/new-supplement.png", alt: "New Arrivals", label: "Shop New", href: ROUTES.CATEGORY.NEW_IN }
      ]
    },
    {
      name: "Wellness Drive",
      href: ROUTES.WELLNESS_DRIVE,
      submenuItems: [
        { name: "Community Stories", href: ROUTES.WELLNESS_DRIVE,        image: "/images/navigation/wellness-drive-stories.png", description: "Real wellness journeys shared by women in our community." },
        { name: "Submit Your Story", href: ROUTES.WELLNESS_DRIVE_SUBMIT, image: "/images/navigation/wellness-drive-submit.png",  description: "Share your daily routine and inspire others on their path." },
        { name: "Wellness Journal",  href: ROUTES.BLOG,                  image: "/images/navigation/wellness-journal.png",       description: "Expert advice and insights for your holistic health journey." }
      ],
      images: []
    },
    {
      name: "About",
      href: ROUTES.ABOUT.STORY,
      submenuItems: [
        { name: "Our Story",           href: ROUTES.ABOUT.STORY,     image: "/founders.png",                              description: "The vision and values behind The Healios Health Co." },
        { name: "Quality & Sourcing",  href: ROUTES.ABOUT.QUALITY,   image: "/images/navigation/quality-sourcing.png",   description: "Our commitment to the highest purity and ethical standards." },
        { name: "Product Guide",       href: ROUTES.ABOUT.GUIDE,     image: "/images/navigation/new-supplement.png",     description: "Everything you need to know about our range and benefits." },
        { name: "Customer Care",       href: ROUTES.ABOUT.CARE,      image: "/founders.png",                              description: "We're here to support you at every stage of your journey." },
        { name: "Wholesale Partners",  href: ROUTES.ABOUT.WHOLESALE, image: "/images/navigation/quality-sourcing.png",   description: "Bring premium wellness to your studio, clinic, or storefront." }
      ],
      images: [
        { src: "/founders.png", alt: "Our Story", label: "Read our story", href: ROUTES.ABOUT.STORY }
      ]
    }
  ];

  return (
    <>
    <nav 
      className="relative bg-white/90"
    >
      <div className="flex items-center justify-between h-16 px-page">
        {/* Mobile hamburger button */}
        <button
          type="button"
          className="lg:hidden p-3 mt-0.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-5 relative">
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? 'rotate-45 top-2.5' : 'top-1.5'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 top-2.5 ${
              isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
            }`}></span>
            <span className={`absolute block w-5 h-px bg-current transform transition-all duration-300 ${
              isMobileMenuOpen ? '-rotate-45 top-2.5' : 'top-3.5'
            }`}></span>
          </div>
        </button>

        {/* Left navigation - Hidden on tablets and mobile */}
        <div className="hidden lg:flex space-x-8">
          {navItems.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => {
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                if (item.submenuItems.length > 0 || item.images.length > 0) {
                  setActiveDropdown(item.name);
                  if (item.submenuItems.length > 0) {
                    setHoveredSubItem(item.submenuItems[0]);
                  }
                }
              }}
              onMouseLeave={() => {
                closeTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
              }}
            >
              <Link
                to={item.href}
                className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light py-6 block"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Center logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link to="/" className="block">
            <OptimizedImage 
              src={healiosLogo} 
              alt="The Healios Health Co." 
              className="h-8 w-auto"
              priority={true}
            />
          </Link>
        </div>

        {/* Right icons */}
        <div className="flex items-center space-x-1">
          {/* Hide currency selector on mobile - available in mobile menu */}
          <div className="hidden lg:block">
            <CurrencySelector />
          </div>
          <button 
            type="button"
            className="p-2.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Search"
            onClick={() => {
              setOffCanvasType(null);
              setIsSearchOpen(prev => !prev);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <button
            type="button"
            className="hidden lg:flex p-2.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200 min-w-[44px] min-h-[44px] items-center justify-center"
            aria-label="Favorites"
            onClick={() => {
              setIsSearchOpen(false);
              setOffCanvasType(prev => (prev === 'favorites' ? null : 'favorites'));
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
          {isAdmin && (
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => {
                if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
                setActiveDropdown('admin');
              }}
              onMouseLeave={() => {
                closeTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
              }}
            >
              <button 
                type="button"
                className="p-2.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Admin"
              >
                <Settings size={20} strokeWidth={1.5} />
              </button>
              {activeDropdown === 'admin' && (
                <div 
                  className="absolute top-full right-0 mt-1 bg-background border border-border shadow-lg rounded-md py-2 min-w-[180px] z-[100]"
                >
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="border-t border-border my-1"></div>
                  <Link
                    to="/admin/orders"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/admin/newsletter"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Newsletter
                  </Link>
                  <Link
                    to="/admin/wellness"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Wellness Posts
                  </Link>
                  <Link
                    to="/admin/inventory"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Inventory
                  </Link>
                  <Link
                    to="/admin/discounts"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Discounts
                  </Link>
                  <Link
                    to="/admin/reviews"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Reviews
                  </Link>
                  <Link
                    to="/admin/products"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Products
                  </Link>
                  <Link
                    to="/admin/blog"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Blog
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Analytics
                  </Link>
                  <Link
                    to="/admin/cohorts"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    Cohorts
                  </Link>
                  <Link
                    to="/admin/rfm"
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    RFM Analysis
                  </Link>
                </div>
              )}
            </div>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden lg:block p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200"
            aria-label={user ? "My Account" : "Sign In"}
          >
            <User size={20} strokeWidth={1.5} />
          </Link>
          <button 
            type="button"
            className="p-2.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200 relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Shopping bag"
            onClick={() => setIsShoppingBagOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[30%] text-[0.5rem] font-semibold text-black pointer-events-none">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeDropdown && activeDropdown !== 'admin' && (
        <div 
          key={activeDropdown}
          className="absolute top-full left-0 right-0 bg-nav border-b border-border z-[60] shadow-xl overflow-hidden"
          onMouseEnter={() => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          }}
          onMouseLeave={() => {
            closeTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
          }}
        >
          <div className="mx-auto max-w-7xl px-page h-[450px]">
            <div className="flex justify-between w-full h-full py-12 gap-16">
              {/* Left side - Menu items */}
              <div className="w-1/4 flex flex-col justify-start">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6 font-medium">Browse</h3>
                <ul className="space-y-1">
                   {navItems
                     .find(item => item.name === activeDropdown)
                     ?.submenuItems.map((subItem, index) => (
                      <li key={index}>
                        <Link
                          to={subItem.href}
                          className={`text-lg transition-all duration-300 block py-2 relative group ${
                            hoveredSubItem?.name === subItem.name
                              ? "text-nav-hover translate-x-1 font-normal"
                              : "text-nav-foreground/60 font-light hover:text-nav-hover hover:translate-x-1"
                          }`}
                          onMouseEnter={() => setHoveredSubItem(subItem)}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                   ))}
                </ul>
              </div>

              {/* Middle - Featured dynamic content */}
              <div className="flex-1 flex gap-8">
                <div className="flex-1 relative rounded-xl overflow-hidden group/img h-full border border-border/50 shadow-ambient transition-all duration-500">
                  {/* Dynamic Image Overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 z-10 pointer-events-none"></div>
                  
                  {hoveredSubItem ? (
                    <div className="relative w-full h-full overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                      <OptimizedImage 
                        src={hoveredSubItem.image}
                        alt={hoveredSubItem.name}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] scale-100 group-hover/img:scale-105"
                        key={hoveredSubItem.name} // Key forces transition on change
                      />
                      <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                        <p className="text-[10px] uppercase tracking-widest mb-2 opacity-80">Featured</p>
                        <h4 className="text-2xl font-serif mb-2">{hoveredSubItem.name}</h4>
                        <p className="text-xs font-light opacity-90 max-w-sm mb-4 leading-relaxed">{hoveredSubItem.description}</p>
                        <Link to={hoveredSubItem.href} className="inline-flex items-center gap-2 text-xs font-medium hover:underline">
                          Explore Now <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center p-12 text-center animate-in fade-in duration-500">
                      <div className="max-w-xs">
                        <h4 className="text-xl font-serif mb-4 text-foreground/80">Experience the Healios Difference</h4>
                        <p className="text-sm text-muted-foreground font-light leading-relaxed">
                          Discover our curated collection of premium wellness essentials designed to elevate your daily routine.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rightmost - Static or secondary featured */}
                <div className="w-[300px] flex flex-col gap-6 h-full">
                  <div className="flex-1 bg-muted/30 rounded-xl p-8 flex flex-col justify-end group cursor-pointer hover:bg-muted/50 transition-colors duration-300">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">Latest Arrivals</p>
                    <h4 className="text-xl font-serif mb-2">New Season Essentials</h4>
                    <Link to="/category/new-in" className="text-xs font-medium flex items-center gap-2">
                       Shop the Collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  <div className="h-1/3 bg-background border border-border rounded-xl p-6 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-colors duration-300">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Wellness Quiz</h4>
                      <p className="text-[10px] text-muted-foreground">Find your perfect match</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ArrowRight size={16} className="text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay */}
      {isSearchOpen && (
        <div 
          className="absolute top-full left-0 right-0 bg-nav border-b border-border z-[60]"
        >
          <div className="px-page py-8">
            <div className="max-w-2xl mx-auto">
              {/* Search input */}
              <div className="relative mb-8">
                <div className="flex items-center border-b border-border pb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-nav-foreground mr-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input
                    type="text"
                    name="search"
                    placeholder="Search for supplements..."
                    className="flex-1 bg-transparent text-nav-foreground placeholder:text-nav-foreground/60 outline-none text-lg"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {isLoading && (
                    <Loader2 className="w-5 h-5 text-nav-foreground animate-spin" />
                  )}
                  {query && !isLoading && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1 text-nav-foreground hover:text-nav-hover"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Results */}
              {query && results.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-nav-foreground text-sm font-light mb-4">Results</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        to={getProductPath(product)}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setIsSearchOpen(false);
                          clearSearch();
                        }}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-nav-foreground text-sm font-medium truncate">{product.name}</p>
                          <p className="text-nav-foreground/60 text-xs">{product.category}</p>
                          <p className="text-nav-foreground text-sm mt-1">{formatPrice(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link
                    to={`/category/all?search=${encodeURIComponent(query)}`}
                    className="block text-center text-sm text-nav-foreground hover:text-nav-hover mt-4 py-2 border border-border rounded-full transition-colors"
                    onClick={() => {
                      setIsSearchOpen(false);
                      clearSearch();
                    }}
                  >
                    View all results
                  </Link>
                </div>
              )}

              {/* No results message */}
              {query && !isLoading && results.length === 0 && (
                <div className="mb-8 text-center py-8">
                  <p className="text-nav-foreground/60 text-sm">No products found for "{query}"</p>
                </div>
              )}

              {/* Popular searches - show when no query */}
              {!query && (
                <div>
                  <h3 className="text-nav-foreground text-sm font-light mb-4">Popular Searches</h3>
                  <div className="flex flex-wrap gap-3">
                    {popularSearches.map((search, index) => (
                      <button
                        type="button"
                        key={index}
                        className="text-nav-foreground hover:text-nav-hover text-sm font-light py-2 px-4 border border-border rounded-full transition-colors duration-200 hover:border-nav-hover"
                        onClick={() => setQuery(search)}
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-nav border-b border-border z-[60]">
          <div className="px-page py-8">
            <div className="space-y-6">
              {navItems.map((item) => (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-lg font-light block py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                   <div className="mt-3 pl-4 space-y-2">
                     {item.submenuItems.map((subItem, subIndex) => (
                       <Link
                         key={subIndex}
                         to={subItem.href}
                         className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                         onClick={() => setIsMobileMenuOpen(false)}
                       >
                         {subItem.name}
                       </Link>
                     ))}
                   </div>
                </div>
              ))}

              {/* Account & Favorites for mobile */}
              <div className="border-t border-border pt-6 mt-6 space-y-3">
                <Link
                  to={user ? "/account" : "/auth"}
                  className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-lg font-light block py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {user ? "My Account" : "Sign In"}
                </Link>
                <button
                  type="button"
                  className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-lg font-light block py-2 text-left w-full"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setOffCanvasType('favorites');
                  }}
                >
                  My Favorites
                </button>
                {user && (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-lg font-light block py-2 text-left w-full"
                    onClick={() => { setIsMobileMenuOpen(false); signOut(); }}
                  >
                    Log Out
                  </button>
                )}
              </div>

              {/* Currency Selector for mobile */}
              <div className="border-t border-border pt-6 mt-6">
                <span className="text-nav-foreground/70 text-sm font-light block mb-3">Currency</span>
                <CurrencySelector />
              </div>
              
              {/* Admin section for mobile */}
              {isAdmin && (
                <div className="border-t border-border pt-6 mt-6">
                  <span className="text-nav-foreground text-lg font-light block py-2">Admin</span>
                  <div className="mt-3 pl-4 space-y-2">
                    <Link
                      to="/admin"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/admin/newsletter"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Newsletter
                    </Link>
                    <Link
                      to="/admin/wellness"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Wellness Posts
                    </Link>
                    <Link
                      to="/admin/inventory"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Inventory
                    </Link>
                    <Link
                      to="/admin/products"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Products
                    </Link>
                    <Link
                      to="/admin/blog"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Blog
                    </Link>
                    <Link
                      to="/admin/analytics"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link
                      to="/admin/cohorts"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Cohorts
                    </Link>
                    <Link
                      to="/admin/rfm"
                      className="text-nav-foreground/70 hover:text-nav-hover text-sm font-light block py-1"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      RFM Analysis
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Shopping Bag Component */}
      <ShoppingBag 
        isOpen={isShoppingBagOpen}
        onClose={() => setIsShoppingBagOpen(false)}
        cartItems={cartItems}
        updateQuantity={updateQuantity}
        onViewFavorites={() => {
          setIsShoppingBagOpen(false);
          setOffCanvasType('favorites');
        }}
      />
      
      {/* Favorites Off-canvas overlay */}
      {offCanvasType === 'favorites' && (
        <div className="fixed inset-0 z-50 h-screen">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 h-screen"
            onClick={() => setOffCanvasType(null)}
          />
          
          {/* Off-canvas panel */}
          <div className="absolute right-0 top-0 h-screen w-96 bg-background border-l border-border animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-light text-foreground">Your Favorites</h2>
              <button
                onClick={() => setOffCanvasType(null)}
                className="p-2 text-foreground hover:text-muted-foreground transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {!user && (
                <div className="mb-6 p-4 border border-border space-y-3">
                  <p className="text-sm font-medium text-foreground">Sign in to save your favourites permanently</p>
                  <p className="text-xs text-muted-foreground">Create an account or sign in to keep your favourites across devices.</p>
                  <Link
                    to={`${ROUTES.AUTH}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                    onClick={() => setOffCanvasType(null)}
                    className="inline-block w-full text-center py-2 px-4 bg-foreground text-background text-sm font-light hover:bg-foreground/90 transition-colors"
                  >
                    Sign In / Register
                  </Link>
                </div>
              )}
              <p className="text-muted-foreground text-sm mb-6">
                You haven't added any favorites yet. Browse our collection and click the heart icon to save items you love.
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>

    </>
  );
};

export default Navigation;

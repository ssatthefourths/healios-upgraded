import { ArrowRight, X, User, Settings, Loader2 } from "lucide-react";
import OptimizedImage from "@/components/ui/optimized-image";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useCurrency } from "@/contexts/CurrencyContext";
import ShoppingBag from "./ShoppingBag";
import CurrencySelector from "./CurrencySelector";
// Product images for navigation dropdowns
const magnesiumImage = "/products/magnesium-gummies.png";
const ashwagandhaImage = "/products/ashwagandha-gummies.png";
const probioticsImage = "/products/probiotics-vitamins-gummies.png";
import healiosLogo from "@/assets/healios-logo.png";

interface NavigationProps {
  onScrollChange?: (isScrolled: boolean) => void;
}

const Navigation = ({ onScrollChange }: NavigationProps) => {
  const { user } = useAuth();
  const { totalItems, cartItems, updateQuantity } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading, clearSearch } = useProductSearch();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offCanvasType, setOffCanvasType] = useState<'favorites' | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShoppingBagOpen, setIsShoppingBagOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  // Close dropdowns on scroll
  const closeAllDropdowns = useCallback(() => {
    setActiveDropdown(null);
    setIsSearchOpen(false);
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

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }
      
      setIsAdminLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data && !error);
      setIsAdminLoading(false);
    };
    
    checkAdminRole();
  }, [user]);
  
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
      href: "/category/all",
      submenuItems: [
        { name: "All Products", href: "/category/all" },
        { name: "Vitamins & Minerals", href: "/category/vitamins-minerals" },
        { name: "Adaptogens", href: "/category/adaptogens" },
        { name: "Digestive Health", href: "/category/digestive-health" },
        { name: "Sleep & Relaxation", href: "/category/sleep-relaxation" },
        { name: "Subscribe & Save", href: "/subscribe" },
        { name: "Take the Wellness Quiz", href: "/wellness-quiz" }
      ],
      images: [
        { src: magnesiumImage, alt: "Vitamins & Minerals Collection", label: "Vitamins", href: "/category/vitamins-minerals" },
        { src: ashwagandhaImage, alt: "Adaptogens Collection", label: "Adaptogens", href: "/category/adaptogens" }
      ]
    },
    { 
      name: "New In", 
      href: "/category/new-in",
      submenuItems: [
        { name: "Latest Arrivals", href: "/category/new-in" },
        { name: "Best Sellers", href: "/category/best-sellers" },
        { name: "Bundles & Stacks", href: "/category/bundles" }
      ],
      images: [
        { src: probioticsImage, alt: "New Arrivals", label: "Shop New", href: "/category/new-in" }
      ]
    },
    { 
      name: "Wellness Drive", 
      href: "/wellness-drive",
      submenuItems: [],
      images: []
    },
    { 
      name: "About", 
      href: "/about/our-story",
      submenuItems: [
        { name: "Our Story", href: "/about/our-story" },
        { name: "Quality & Sourcing", href: "/about/quality-sourcing" },
        { name: "Product Guide", href: "/about/product-guide" },
        { name: "Customer Care", href: "/about/customer-care" },
        { name: "Wholesale Partners", href: "/about/wholesale" }
      ],
      images: [
        { src: "/founders.png", alt: "Our Story", label: "Read our story", href: "/about/our-story" }
      ]
    }
  ];

  return (
    <>
    <nav 
      className="relative bg-white/90"
    >
      <div className="flex items-center justify-between h-16 px-6">
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
                if (item.submenuItems.length > 0 || item.images.length > 0) {
                  setActiveDropdown(item.name);
                }
              }}
              onMouseLeave={() => setActiveDropdown(null)}
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
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <button 
            type="button"
            className="hidden lg:flex p-2.5 text-nav-foreground hover:text-nav-hover transition-colors duration-200 min-w-[44px] min-h-[44px] items-center justify-center"
            aria-label="Favorites"
            onClick={() => setOffCanvasType('favorites')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
          {!isAdminLoading && isAdmin && (
            <div
              className="relative hidden lg:block"
              onMouseEnter={() => setActiveDropdown('admin')}
              onMouseLeave={() => setActiveDropdown(null)}
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

      {/* Full width dropdown - exclude admin since it has its own dropdown */}
      {activeDropdown && activeDropdown !== 'admin' && (
        <div 
          className="absolute top-full left-0 right-0 bg-nav border-b border-border z-[60]"
          onMouseEnter={() => setActiveDropdown(activeDropdown)}
          onMouseLeave={() => setActiveDropdown(null)}
        >
          <div className="px-6 py-8">
            <div className="flex justify-between w-full">
              {/* Left side - Menu items */}
              <div className="flex-1">
                <ul className="space-y-2">
                   {navItems
                     .find(item => item.name === activeDropdown)
                     ?.submenuItems.map((subItem, index) => (
                      <li key={index}>
                        <Link 
                          to={subItem.href}
                          className="text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light block py-2"
                        >
                          {subItem.name}
                        </Link>
                      </li>
                   ))}
                </ul>
              </div>

              {/* Right side - Images */}
              <div className="flex space-x-6">
                {navItems
                  .find(item => item.name === activeDropdown)
                  ?.images.map((image, index) => (
                    <Link key={index} to={image.href} className="w-[400px] h-[280px] cursor-pointer group relative overflow-hidden block">
                      <OptimizedImage 
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                      />
                      <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-black text-xs font-light flex items-center gap-1">
                        <span>{image.label}</span>
                        <ArrowRight size={12} />
                      </div>
                    </Link>
                  ))}
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
          <div className="px-6 py-8">
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
                        to={`/product/${product.slug || product.id}`}
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
          <div className="px-6 py-8">
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
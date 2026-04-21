import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import ScrollToTop from "./components/ScrollToTop";
import { CookieConsent } from "./components/CookieConsent";
import { Analytics } from "./components/Analytics";
import ErrorBoundary from "./components/ErrorBoundary";
import { UTMCapture } from "./components/UTMCapture";
import WellnessChatbot from "./components/chat/WellnessChatbot";
import { Loader2 } from "lucide-react";
import { FeatureGate } from "./lib/featureFlags";
import AdminRoute from "./components/AdminRoute";

// Eagerly loaded routes (core user journey)
import Index from "./pages/Index";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
const BundleDetail = lazy(() => import("./pages/BundleDetail"));
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

// Lazy loaded routes (less frequently accessed)
const OurStory = lazy(() => import("./pages/about/OurStory"));
const QualitySourcing = lazy(() => import("./pages/about/QualitySourcing"));
const ProductGuide = lazy(() => import("./pages/about/ProductGuide"));
const CustomerCare = lazy(() => import("./pages/about/CustomerCare"));
const WholesalePartners = lazy(() => import("./pages/about/WholesalePartners"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ShippingReturns = lazy(() => import("./pages/ShippingReturns"));
const WellnessDrive = lazy(() => import("./pages/WellnessDrive"));
const WellnessQuiz = lazy(() => import("./pages/WellnessQuiz"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const GiftCardSuccess = lazy(() => import("./pages/GiftCardSuccess"));

// Admin routes (lazy loaded - only accessed by admins)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const WellnessAdmin = lazy(() => import("./pages/admin/WellnessAdmin"));
const OrdersAdmin = lazy(() => import("./pages/admin/OrdersAdmin"));
const NewsletterAdmin = lazy(() => import("./pages/admin/NewsletterAdmin"));
const InventoryAdmin = lazy(() => import("./pages/admin/InventoryAdmin"));
const DiscountsAdmin = lazy(() => import("./pages/admin/DiscountsAdmin"));
const ReviewsAdmin = lazy(() => import("./pages/admin/ReviewsAdmin"));
const ProductsAdmin = lazy(() => import("./pages/admin/ProductsAdmin"));
const BundlesAdmin = lazy(() => import("./pages/admin/BundlesAdmin"));
const BundleEditor = lazy(() => import("./pages/admin/BundleEditor"));
const AnalyticsAdmin = lazy(() => import("./pages/admin/AnalyticsAdmin"));
const CohortAnalysis = lazy(() => import("./pages/admin/CohortAnalysis"));
const RFMAnalysis = lazy(() => import("./pages/admin/RFMAnalysis"));
const CampaignAnalytics = lazy(() => import("./pages/admin/CampaignAnalytics"));
const CLVDashboard = lazy(() => import("./pages/admin/CLVDashboard"));
const SubscriptionAnalytics = lazy(() => import("./pages/admin/SubscriptionAnalytics"));
const BlogAdmin = lazy(() => import("./pages/admin/BlogAdmin"));
const CheckoutSecurityAdmin = lazy(() => import("./pages/admin/CheckoutSecurityAdmin"));
const ReferralSecurityAdmin = lazy(() => import("./pages/admin/ReferralSecurityAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Chatbot is controlled by feature flag in lib/featureFlags.ts

// Loading fallback for lazy loaded routes
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <CurrencyProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <UTMCapture />
                  <CookieConsent />
                  <Analytics />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Core routes (eagerly loaded) */}
                      <Route path="/" element={<Index />} />
                      <Route path="/shop" element={<Navigate to="/category/shop" replace />} />
                      <Route path="/category/:category" element={<Category />} />
                      <Route path="/product/:productId" element={<ProductDetail />} />
                      <Route path="/bundle/:slug" element={<BundleDetail />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/account" element={<Account />} />
                      
                      {/* About pages (lazy loaded) */}
                      <Route path="/about/our-story" element={<OurStory />} />
                      <Route path="/about/quality-sourcing" element={<QualitySourcing />} />
                      <Route path="/about/product-guide" element={<ProductGuide />} />
                      <Route path="/about/customer-care" element={<CustomerCare />} />
                      <Route path="/about/wholesale" element={<WholesalePartners />} />
                      
                      {/* Legal/Info pages (lazy loaded) */}
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="/shipping-returns" element={<ShippingReturns />} />
                      <Route path="/wellness-drive" element={<WellnessDrive />} />
                      <Route path="/wellness-quiz" element={<WellnessQuiz />} />
                      <Route path="/faq" element={<FAQ />} />
                      
                      {/* Blog (lazy loaded) */}
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      
                      {/* E-commerce extras (lazy loaded) */}
                      <Route path="/subscribe" element={<Subscribe />} />
                      <Route path="/gift-cards" element={<GiftCards />} />
                      <Route path="/gift-cards/success" element={<GiftCardSuccess />} />
                      
                      {/* Admin routes (lazy loaded, auth + role guarded) */}
                      <Route element={<AdminRoute />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/wellness" element={<WellnessAdmin />} />
                        <Route path="/admin/orders" element={<OrdersAdmin />} />
                        <Route path="/admin/newsletter" element={<NewsletterAdmin />} />
                        <Route path="/admin/inventory" element={<InventoryAdmin />} />
                        <Route path="/admin/discounts" element={<DiscountsAdmin />} />
                        <Route path="/admin/reviews" element={<ReviewsAdmin />} />
                        <Route path="/admin/products" element={<ProductsAdmin />} />
                        <Route path="/admin/bundles" element={<BundlesAdmin />} />
                        <Route path="/admin/bundles/:id" element={<BundleEditor />} />
                        <Route path="/admin/analytics" element={<AnalyticsAdmin />} />
                        <Route path="/admin/cohorts" element={<CohortAnalysis />} />
                        <Route path="/admin/rfm" element={<RFMAnalysis />} />
                        <Route path="/admin/campaigns" element={<CampaignAnalytics />} />
                        <Route path="/admin/clv" element={<CLVDashboard />} />
                        <Route path="/admin/subscriptions" element={<SubscriptionAnalytics />} />
                        <Route path="/admin/blog" element={<BlogAdmin />} />
                        <Route path="/admin/security" element={<CheckoutSecurityAdmin />} />
                        <Route path="/admin/referral-security" element={<ReferralSecurityAdmin />} />
                        <Route path="/admin/users" element={<UsersAdmin />} />
                      </Route>
                      
                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <FeatureGate flag="chatbot">
                    <WellnessChatbot />
                  </FeatureGate>
                </BrowserRouter>
              </TooltipProvider>
            </CurrencyProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;

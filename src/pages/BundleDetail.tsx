import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import PageContainer from "../components/layout/PageContainer";
import SEOHead from "../components/seo/SEOHead";
import BreadcrumbSchema from "../components/seo/BreadcrumbSchema";
import OptimizedImage from "@/components/ui/optimized-image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { Loader2, Package, ArrowRight, ShoppingBag } from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

interface BundleItem {
  id: string;
  product_id: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
  description: string;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  compare_at_price: number | null;
  seo_title: string | null;
  meta_description: string | null;
  items: BundleItem[];
}

const BundleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const { data: bundle, isLoading, error } = useQuery<Bundle>({
    queryKey: ['bundle', slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/bundles/${slug}`);
      if (!res.ok) throw new Error('Bundle not found');
      return await res.json();
    },
    enabled: !!slug,
  });

  useEffect(() => {
    if (bundle) window.scrollTo(0, 0);
  }, [bundle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin" size={32} />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageContainer>
          <div className="text-center py-32">
            <h1 className="text-2xl font-medium mb-4">Bundle not found</h1>
            <p className="text-muted-foreground mb-6">We couldn't find the bundle you're looking for.</p>
            <Button onClick={() => navigate('/category/bundles')}>Browse all bundles</Button>
          </div>
        </PageContainer>
        <Footer />
      </div>
    );
  }

  const individualTotal = bundle.items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const savings = Math.max(0, individualTotal - Number(bundle.price));
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  const handleAddToCart = () => {
    addToCart({
      id: bundle.id,
      name: bundle.name,
      price: Number(bundle.price),
      image: bundle.image,
      category: 'Bundles',
      quantity: 1,
      isBundle: true,
      bundleItems: bundle.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    } as any);
    toast.success(`${bundle.name} added to bag`);
  };

  const breadcrumbItems = [
    { name: "Home", url: "https://www.thehealios.com/" },
    { name: "Bundles", url: "https://www.thehealios.com/category/bundles" },
    { name: bundle.name, url: `https://www.thehealios.com/bundle/${bundle.slug}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={bundle.seo_title || `${bundle.name} | Healios Bundle`}
        description={bundle.meta_description || bundle.description || `Save with the ${bundle.name} bundle. Curated wellness products.`}
        canonicalUrl={`https://www.thehealios.com/bundle/${bundle.slug}`}
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <Header />

      <main id="main-content">
        <PageContainer>
          <nav className="text-xs text-muted-foreground mb-6 flex items-center gap-2">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/category/bundles" className="hover:text-foreground">Bundles</Link>
            <span>/</span>
            <span className="text-foreground">{bundle.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <OptimizedImage
                src={bundle.image}
                alt={bundle.name}
                className="w-full h-full object-cover"
                aspectRatio="square"
              />
            </div>

            <div className="lg:pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="gap-1">
                  <Package className="h-3 w-3" />
                  Bundle
                </Badge>
                {savings > 0 && (
                  <Badge className="bg-green-600 hover:bg-green-700">Save {savingsPercent}%</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-4">{bundle.name}</h1>

              {bundle.description && (
                <p className="text-base text-muted-foreground mb-6 leading-relaxed">{bundle.description}</p>
              )}

              <div className="flex items-baseline gap-3 mb-8">
                <span className="text-3xl font-medium text-foreground">{formatPrice(Number(bundle.price))}</span>
                {savings > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(individualTotal)}</span>
                    <span className="text-sm text-green-700 font-medium">You save {formatPrice(savings)}</span>
                  </>
                )}
              </div>

              <Button size="lg" className="w-full gap-2" onClick={handleAddToCart}>
                <ShoppingBag className="h-5 w-5" />
                Add bundle to bag
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Free UK delivery over £30 · Secure checkout via Stripe
              </p>
            </div>
          </div>

          <section className="border-t border-border pt-12 mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-medium text-foreground">What's included</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundle.items.map((item) => (
                <div key={item.id} className="border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <Link to={`/product/${item.slug || item.product_id}`} className="block group">
                    <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-muted">
                      <OptimizedImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        aspectRatio="square"
                      />
                    </div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{item.category}</p>
                    <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-2">{item.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {item.quantity > 1 ? `${item.quantity} × ` : ''}
                        {formatPrice(Number(item.price))}
                      </span>
                    </div>
                  </Link>
                  <Link
                    to={`/product/${item.slug || item.product_id}`}
                    className="mt-4 text-xs text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    Buy individually
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-muted/40 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">
                Total if purchased separately: <span className="line-through">{formatPrice(individualTotal)}</span>
              </p>
              <p className="text-lg font-medium text-foreground mt-1">
                Bundle price: {formatPrice(Number(bundle.price))}
                {savings > 0 && <span className="text-green-700 ml-2">— save {formatPrice(savings)}</span>}
              </p>
            </div>
          </section>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default BundleDetail;

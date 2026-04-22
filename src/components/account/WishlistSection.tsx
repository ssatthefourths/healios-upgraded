import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Heart, X, ShoppingBag } from 'lucide-react';
import { logger } from '@/lib/logger';
import { getProductPath } from '@/lib/productPath';

interface Product {
  id: string;
  slug: string | null;
  name: string;
  price: number;
  image: string;
  category: string;
}

const WishlistSection = () => {
  const { wishlistItems, loading: wishlistLoading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, slug, name, price, image, category')
        .in('id', wishlistItems);

      if (error) {
        logger.error('Error fetching wishlist products', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    if (!wishlistLoading) {
      fetchProducts();
    }
  }, [wishlistItems, wishlistLoading]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      category: product.category,
    });
  };

  if (loading || wishlistLoading) {
    return (
      <div>
        <h2 className="text-xl font-light text-foreground mb-6">My Wishlist</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="h-4 bg-muted rounded mt-3 w-3/4" />
              <div className="h-4 bg-muted rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-light text-foreground mb-6">My Wishlist</h2>
        <div className="text-center py-12">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-4">
            Your wishlist is empty. Save your favorite pieces to find them later.
          </p>
          <Button variant="outline" asChild>
            <Link to="/category/shop">Browse Collection</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-light text-foreground mb-6">
        My Wishlist ({products.length} {products.length === 1 ? 'item' : 'items'})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group relative">
            <Link to={getProductPath(product)}>
              <div className="aspect-square bg-secondary rounded-lg overflow-hidden mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatPrice(Number(product.price))}
              </p>
            </Link>
            
            {/* Action buttons */}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              <button
                onClick={(e) => toggleWishlist(product.id, e)}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                aria-label="Remove from wishlist"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
            
            {/* Add to cart button */}
            <Button
              size="sm"
              variant="secondary"
              className="w-full mt-3"
              onClick={(e) => handleAddToCart(product, e)}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WishlistSection;
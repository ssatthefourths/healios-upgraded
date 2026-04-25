import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getProductPath } from "@/lib/productPath";

type Product = Tables<'products'>;

interface PairsWellWithProps {
  productIds: string[] | null;
  currentProductId: string;
}

const PairsWellWith = ({ productIds, currentProductId }: PairsWellWithProps) => {
  const { formatPrice } = useCurrency();
  const [pairedProducts, setPairedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPairedProducts = async () => {
      if (!productIds || productIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .neq('id', currentProductId)
        .eq('is_published', true);

      if (!error && data) {
        setPairedProducts(data);
      }
      setLoading(false);
    };

    fetchPairedProducts();
  }, [productIds, currentProductId]);

  if (loading || pairedProducts.length === 0) {
    return null;
  }

  return (
    <section className="w-full mt-16 lg:mt-24">
      <div className="mb-6 px-6">
        <h2 className="text-sm font-light text-foreground">Pairs Well With</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Build your wellness routine with complementary products
        </p>
      </div>
      <div className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pairedProducts.map((product) => (
            <Link
              key={product.id}
              to={getProductPath(product)}
              className="group"
            >
              <div className="aspect-square overflow-hidden bg-muted mb-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-base font-medium text-foreground leading-tight group-hover:underline">
                {product.name}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-sm font-medium text-foreground">
                  {formatPrice(product.price)}
                </p>
                {(product as { compare_at_price?: number | null }).compare_at_price != null &&
                  (product as { compare_at_price?: number | null }).compare_at_price! > product.price && (
                    <p className="text-xs font-light text-muted-foreground line-through">
                      {formatPrice((product as { compare_at_price?: number | null }).compare_at_price!)}
                    </p>
                  )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PairsWellWith;

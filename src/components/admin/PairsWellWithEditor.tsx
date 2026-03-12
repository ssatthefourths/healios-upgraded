import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
  id: string;
  name: string;
  image: string;
}

interface PairsWellWithEditorProps {
  currentProductId: string;
  selectedProducts: string[];
  onChange: (products: string[]) => void;
}

const PairsWellWithEditor = ({
  currentProductId,
  selectedProducts,
  onChange,
}: PairsWellWithEditorProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image")
        .neq("id", currentProductId)
        .order("name");

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [currentProductId]);

  const toggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      onChange(selectedProducts.filter((id) => id !== productId));
    } else {
      onChange([...selectedProducts, productId]);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading products...</p>;
  }

  return (
    <div className="space-y-3">
      <Label>Pairs Well With (select complementary products)</Label>
      <p className="text-xs text-muted-foreground">
        Selected products will appear in the "Pairs Well With" section on the product page.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto border rounded p-3">
        {products.map((product) => (
          <label
            key={product.id}
            className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
          >
            <Checkbox
              checked={selectedProducts.includes(product.id)}
              onCheckedChange={() => toggleProduct(product.id)}
            />
            <img
              src={product.image}
              alt={product.name}
              className="w-8 h-8 object-cover rounded"
            />
            <span className="text-sm truncate">{product.name}</span>
          </label>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  );
};

export default PairsWellWithEditor;

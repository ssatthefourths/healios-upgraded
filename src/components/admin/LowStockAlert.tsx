import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Package, Pencil, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  category: string;
  image: string;
}

interface Props {
  showAllProducts?: boolean;
}

const LowStockAlert = ({ showAllProducts = false }: Props) => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ stock: number; threshold: number }>({ stock: 0, threshold: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [showAllProducts]);

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold, category, image")
        .eq("is_published", true)
        .order("stock_quantity", { ascending: true });

      if (!showAllProducts) {
        query = query.eq("track_inventory", true).lte("stock_quantity", 10);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];
      
      // For low stock view, filter by threshold
      if (!showAllProducts) {
        filteredData = filteredData.filter(
          (p: any) => p.stock_quantity <= p.low_stock_threshold
        );
      }

      setProducts(filteredData as LowStockProduct[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (product: LowStockProduct) => {
    setEditingId(product.id);
    setEditValues({
      stock: product.stock_quantity,
      threshold: product.low_stock_threshold,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ stock: 0, threshold: 0 });
  };

  const saveStock = async (productId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          stock_quantity: editValues.stock,
          low_stock_threshold: editValues.threshold,
        })
        .eq("id", productId);

      if (error) throw error;

      // Update local state
      setProducts(products.map(p =>
        p.id === productId
          ? { ...p, stock_quantity: editValues.stock, low_stock_threshold: editValues.threshold }
          : p
      ));

      toast.success("Stock updated successfully");
      setEditingId(null);
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast.error(error.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="animate-pulse h-6 bg-amber-100 rounded w-48"></div>
      </div>
    );
  }

  // For low stock alert mode, hide if no low stock items
  if (!showAllProducts && products.length === 0) {
    return null;
  }

  const containerClass = showAllProducts
    ? "bg-card border border-border rounded-lg p-4 mb-8"
    : "bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8";

  const headerClass = showAllProducts
    ? "text-foreground"
    : "text-amber-800";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2 mb-4">
        {showAllProducts ? (
          <Package className="h-5 w-5 text-muted-foreground" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        )}
        <h3 className={`font-medium ${headerClass}`}>
          {showAllProducts ? "Inventory Management" : "Low Stock Alert"}
        </h3>
        <Badge variant="secondary" className={showAllProducts ? "" : "bg-amber-100 text-amber-800"}>
          {products.length} product{products.length !== 1 ? "s" : ""}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 bg-background p-3 rounded-lg"
          >
            <div className="w-10 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {product.category}
              </p>
            </div>
            
            {editingId === product.id ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground w-16">Stock:</span>
                    <Input
                      type="number"
                      min="0"
                      value={editValues.stock}
                      onChange={(e) => setEditValues({ ...editValues, stock: parseInt(e.target.value) || 0 })}
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground w-16">Threshold:</span>
                    <Input
                      type="number"
                      min="0"
                      value={editValues.threshold}
                      onChange={(e) => setEditValues({ ...editValues, threshold: parseInt(e.target.value) || 0 })}
                      className="w-20 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => saveStock(product.id)}
                    disabled={saving}
                    className="h-8 w-8 p-0"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    product.stock_quantity === 0 
                      ? "text-red-600" 
                      : product.stock_quantity <= product.low_stock_threshold
                        ? "text-amber-600"
                        : "text-foreground"
                  }`}>
                    {product.stock_quantity === 0 
                      ? "Out of stock" 
                      : `${product.stock_quantity} in stock`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {product.low_stock_threshold}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(product)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {!showAllProducts && (
        <p className="text-xs text-amber-700 mt-4">
          Click the pencil icon to update stock levels.
        </p>
      )}
    </div>
  );
};

export default LowStockAlert;
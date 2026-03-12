import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductList from "@/components/admin/ProductList";
import ProductEditor from "@/components/admin/ProductEditor";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

const ProductsAdmin = () => {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsCreating(true);
  };

  const handleBack = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleSave = () => {
    setEditingProduct(null);
    setIsCreating(false);
  };

  return (
    <AdminLayout 
      title={editingProduct ? "Edit Product" : isCreating ? "New Product" : "Products"} 
      subtitle={editingProduct || isCreating ? undefined : "Create, edit, and manage all products"}
    >
      {editingProduct || isCreating ? (
        <>
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBack} className="gap-2">
              <ArrowLeft size={16} />
              Back to Products
            </Button>
          </div>
          <ProductEditor
            product={editingProduct}
            onSave={handleSave}
            onCancel={handleBack}
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-end mb-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus size={16} />
              Add New Product
            </Button>
          </div>
          <ProductList onEdit={handleEdit} />
        </>
      )}
    </AdminLayout>
  );
};

export default ProductsAdmin;

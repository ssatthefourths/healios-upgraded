import AdminLayout from "@/components/admin/AdminLayout";
import ProductList from "@/components/admin/ProductList";
import ProductEditor from "@/components/admin/ProductEditor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Product } from "@/types/admin";
import { useAdminCRUD } from "@/hooks/useAdminCRUD";

const ProductsAdmin = () => {
  const {
    editingItem: editingProduct,
    isCreating,
    refreshKey,
    handleEdit,
    handleCreate,
    handleBack,
    handleSave,
    isViewingList,
  } = useAdminCRUD<Product>();

  return (
    <AdminLayout 
      title={editingProduct ? "Edit Product" : isCreating ? "New Product" : "Products"} 
      subtitle={isViewingList ? "Create, edit, and manage all products" : undefined}
    >
      {isViewingList ? (
        <>
          <div className="flex items-center justify-end mb-6">
            <Button onClick={handleCreate} className="gap-2">
              <Plus size={16} />
              Add New Product
            </Button>
          </div>
          <ProductList key={refreshKey} onEdit={handleEdit} />
        </>
      ) : (
        <ProductEditor
          product={editingProduct}
          onSave={handleSave}
          onCancel={handleBack}
        />
      )}
    </AdminLayout>
  );
};

export default ProductsAdmin;

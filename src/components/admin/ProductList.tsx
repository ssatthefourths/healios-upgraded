import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search, Pencil, Trash2, Copy, GripVertical, Eye } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductListProps {
  onEdit: (product: Product) => void;
}

interface SortableRowProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (product: Product) => void;
  onTogglePublished: (product: Product) => void;
  onPreview: (product: Product) => void;
  isDragDisabled: boolean;
}

const SortableRow = ({
  product,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublished,
  onPreview,
  isDragDisabled,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell className="w-10">
        {!isDragDisabled && (
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} className="text-muted-foreground" />
          </button>
        )}
      </TableCell>
      <TableCell>
        <img
          src={product.image}
          alt={product.name}
          className="w-12 h-12 object-cover rounded"
        />
      </TableCell>
      <TableCell>
        <div className="font-medium">{product.name}</div>
        <div className="text-xs text-muted-foreground">{product.id}</div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">{product.category}</Badge>
      </TableCell>
      <TableCell className="text-right">£{product.price.toFixed(2)}</TableCell>
      <TableCell className="text-center">
        <span
          className={
            product.stock_quantity <= product.low_stock_threshold
              ? "text-destructive font-medium"
              : ""
          }
        >
          {product.stock_quantity}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={product.is_published ?? false}
          onCheckedChange={() => onTogglePublished(product)}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPreview(product)}
            title="Preview product page"
          >
            <Eye size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicate(product)}
            title="Duplicate product"
          >
            <Copy size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(product)}
            title="Edit product"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product)}
            className="text-destructive hover:text-destructive"
            title="Delete product"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const ProductList = ({ onEdit }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const categories = [
    "Vitamins & Minerals",
    "Adaptogens",
    "Digestive Health",
    "Sleep & Relaxation",
    "Beauty",
    "Women's Health",
  ];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load products");
      console.error(error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleTogglePublished = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .update({ is_published: !product.is_published })
      .eq("id", product.id);

    if (error) {
      toast.error("Failed to update product status");
    } else {
      toast.success(`Product ${product.is_published ? "unpublished" : "published"}`);
      fetchProducts();
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", deleteProduct.id);

    if (error) {
      toast.error("Failed to delete product");
      console.error(error);
    } else {
      // Send notification to admins (fire and forget)
      supabase.functions.invoke("notify-product-change", {
        body: {
          product_id: deleteProduct.id,
          product_name: deleteProduct.name,
          action: "delete",
        },
      }).catch(console.error);

      toast.success("Product deleted successfully");
      fetchProducts();
    }
    setDeleteProduct(null);
  };

  const handleDuplicate = async (product: Product) => {
    const timestamp = Date.now();
    const newId = `${product.id}-copy-${timestamp}`;
    const newSlug = product.slug ? `${product.slug}-copy-${timestamp}` : null;

    const { created_at, updated_at, ...productData } = product;
    
    const duplicatedProduct = {
      ...productData,
      id: newId,
      slug: newSlug,
      name: `${product.name} (Copy)`,
      is_published: false,
    };

    const { error } = await supabase
      .from("products")
      .insert(duplicatedProduct);

    if (error) {
      toast.error("Failed to duplicate product");
      console.error(error);
    } else {
      toast.success("Product duplicated successfully");
      fetchProducts();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);

    const reorderedProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(reorderedProducts);

    // Update sort_order in database
    const updates = reorderedProducts.map((product, index) => ({
      id: product.id,
      sort_order: index,
    }));

    // Update each product's sort_order
    for (const update of updates) {
      const { error } = await supabase
        .from("products")
        .update({ sort_order: update.sort_order })
        .eq("id", update.id);

      if (error) {
        console.error("Failed to update sort order:", error);
        toast.error("Failed to save new order");
        fetchProducts(); // Revert on error
        return;
      }
    }

    toast.success("Product order saved");
  };

  const handlePreview = (product: Product) => {
    const url = `/product/${product.slug || product.id}`;
    window.open(url, "_blank");
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isDragDisabled = searchTerm !== "" || categoryFilter !== "all";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isDragDisabled && (
        <p className="text-sm text-muted-foreground">
          Clear search and filters to enable drag-and-drop reordering
        </p>
      )}

      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={filteredProducts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredProducts.map((product) => (
                    <SortableRow
                      key={product.id}
                      product={product}
                      onEdit={onEdit}
                      onDuplicate={handleDuplicate}
                      onDelete={setDeleteProduct}
                      onTogglePublished={handleTogglePublished}
                      onPreview={handlePreview}
                      isDragDisabled={isDragDisabled}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteProduct?.name}"? This action cannot be undone.
              This will also remove the product from wishlists and may affect order history display.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductList;

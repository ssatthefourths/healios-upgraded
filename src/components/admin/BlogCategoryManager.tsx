import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, GripVertical, Loader2 } from "lucide-react";
import { BlogCategory } from "@/types/admin";

const BlogCategoryManager = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editCategory, setEditCategory] = useState<BlogCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<BlogCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order");

    if (error) {
      toast.error("Failed to fetch categories");
      console.error(error);
    } else {
      setCategories(data as BlogCategory[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateDialog = () => {
    setEditCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: BlogCategory) => {
    setEditCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setIsDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editCategory) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    setSaving(true);

    const categoryData = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
    };

    if (editCategory) {
      // Update existing category
      const { error } = await supabase
        .from("blog_categories")
        .update(categoryData)
        .eq("id", editCategory.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("A category with this slug already exists");
        } else {
          toast.error("Failed to update category");
          console.error(error);
        }
      } else {
        toast.success("Category updated");
        setIsDialogOpen(false);
        fetchCategories();
      }
    } else {
      // Create new category
      const sortOrder = categories.length;
      const { error } = await supabase
        .from("blog_categories")
        .insert({ ...categoryData, sort_order: sortOrder });

      if (error) {
        if (error.code === "23505") {
          toast.error("A category with this slug already exists");
        } else {
          toast.error("Failed to create category");
          console.error(error);
        }
      } else {
        toast.success("Category created");
        setIsDialogOpen(false);
        fetchCategories();
      }
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    const { error } = await supabase
      .from("blog_categories")
      .delete()
      .eq("id", deleteCategory.id);

    if (error) {
      toast.error("Failed to delete category. It may have associated posts.");
      console.error(error);
    } else {
      toast.success("Category deleted");
      fetchCategories();
    }
    setDeleteCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Organize your blog posts into categories
        </p>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No categories yet. Create your first category!
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <GripVertical size={16} className="text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCategory(category)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editCategory
                ? "Update the category details below."
                : "Add a new category for your blog posts."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="category-slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
              {editCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? Posts in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogCategoryManager;

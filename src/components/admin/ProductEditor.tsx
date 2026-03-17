import { useState } from "react";
import { cloudflare as supabase } from "@/integrations/cloudflare/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BenefitsEditor from "./BenefitsEditor";
import FAQEditor from "./FAQEditor";
import IngredientsEditor from "./IngredientsEditor";
import PairsWellWithEditor from "./PairsWellWithEditor";
import ProductImageUpload from "./ProductImageUpload";
import ProductVersionHistory from "./ProductVersionHistory";
import { Save, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;

interface ProductEditorProps {
  product: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const generateId = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const ProductEditor = ({ product, onSave, onCancel }: ProductEditorProps) => {
  const { user } = useAuth();
  const isEditing = !!product;
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: product?.id || "",
    name: product?.name || "",
    slug: product?.slug || "",
    price: product?.price || 0,
    category: product?.category || "Vitamins & Minerals",
    image: product?.image || "",
    description: product?.description || "",
    hero_paragraph: product?.hero_paragraph || "",
    benefits: product?.benefits || [],
    what_is_it: product?.what_is_it || "",
    why_gummy: product?.why_gummy || "",
    who_is_it_for: product?.who_is_it_for || "",
    how_it_works: product?.how_it_works || "",
    how_to_take: product?.how_to_take || "",
    routine_30_day: product?.routine_30_day || "",
    what_makes_different: product?.what_makes_different || "",
    subscription_info: product?.subscription_info || "",
    ingredients: product?.ingredients || [],
    safety_info: product?.safety_info || "",
    product_cautions: product?.product_cautions || "",
    faqs: product?.faqs || [],
    seo_title: product?.seo_title || "",
    meta_description: product?.meta_description || "",
    primary_keyword: product?.primary_keyword || "",
    secondary_keywords: product?.secondary_keywords || [],
    is_published: product?.is_published ?? true,
    is_adults_only: product?.is_adults_only ?? false,
    is_kids_product: product?.is_kids_product ?? false,
    track_inventory: product?.track_inventory ?? true,
    stock_quantity: product?.stock_quantity || 100,
    low_stock_threshold: product?.low_stock_threshold || 10,
    sort_order: product?.sort_order || 0,
    pairs_well_with: product?.pairs_well_with || [],
  });

  const categories = [
    "Vitamins & Minerals",
    "Adaptogens",
    "Digestive Health",
    "Sleep & Relaxation",
    "Beauty",
    "Women's Health",
  ];

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug and ID from name for new products
      if (field === "name" && !isEditing) {
        updated.slug = generateSlug(value);
        updated.id = generateId(value);
      }
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.id || !formData.price) {
      toast.error("Please fill in required fields: Name, ID, and Price");
      return;
    }

    setSaving(true);

    try {
      const productData = {
        id: formData.id,
        name: formData.name,
        slug: formData.slug || null,
        price: formData.price,
        category: formData.category,
        image: formData.image,
        description: formData.description || null,
        hero_paragraph: formData.hero_paragraph || null,
        benefits: formData.benefits,
        what_is_it: formData.what_is_it || null,
        why_gummy: formData.why_gummy || null,
        who_is_it_for: formData.who_is_it_for || null,
        how_it_works: formData.how_it_works || null,
        how_to_take: formData.how_to_take || null,
        routine_30_day: formData.routine_30_day || null,
        what_makes_different: formData.what_makes_different || null,
        subscription_info: formData.subscription_info || null,
        ingredients: formData.ingredients,
        safety_info: formData.safety_info || null,
        product_cautions: formData.product_cautions || null,
        faqs: formData.faqs,
        seo_title: formData.seo_title || null,
        meta_description: formData.meta_description || null,
        primary_keyword: formData.primary_keyword || null,
        secondary_keywords: formData.secondary_keywords,
        is_published: formData.is_published,
        is_adults_only: formData.is_adults_only,
        is_kids_product: formData.is_kids_product,
        track_inventory: formData.track_inventory,
        stock_quantity: formData.stock_quantity,
        low_stock_threshold: formData.low_stock_threshold,
        sort_order: formData.sort_order,
        pairs_well_with: formData.pairs_well_with,
      };

      if (isEditing) {
        // Calculate changes for version history
        const changes: Record<string, any> = {};
        const previousValues: Record<string, any> = {};
        
        Object.keys(productData).forEach((key) => {
          const oldValue = product[key as keyof Product];
          const newValue = productData[key as keyof typeof productData];
          
          // Compare stringified values for objects/arrays
          const oldStr = JSON.stringify(oldValue);
          const newStr = JSON.stringify(newValue);
          
          if (oldStr !== newStr) {
            changes[key] = newValue;
            previousValues[key] = oldValue;
          }
        });

        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;

        // Log version history if there were changes
        if (Object.keys(changes).length > 0) {
          await supabase.from("product_versions").insert({
            product_id: product.id,
            changed_by: user?.id || null,
            action: "update",
            changes,
            previous_values: previousValues,
          });

          // Send notification to admins (fire and forget)
          supabase.functions.invoke("notify-product-change", {
            body: {
              product_id: product.id,
              product_name: formData.name,
              action: "update",
              changed_by_email: user?.email,
              changes,
            },
          }).catch(console.error);
        }

        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;

        // Log creation in version history
        await supabase.from("product_versions").insert({
          product_id: formData.id,
          changed_by: user?.id || null,
          action: "create",
          changes: productData,
          previous_values: {},
        });

        // Send notification to admins (fire and forget)
        supabase.functions.invoke("notify-product-change", {
          body: {
            product_id: formData.id,
            product_name: formData.name,
            action: "create",
            changed_by_email: user?.email,
            changes: productData,
          },
        }).catch(console.error);

        toast.success("Product created successfully");
      }

      onSave();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light">
          {isEditing ? `Edit: ${product.name}` : "Create New Product"}
        </h2>
        <div className="flex gap-2">
          {isEditing && (
            <ProductVersionHistory productId={product.id} productName={product.name} />
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Magnesium Gummies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">Product ID *</Label>
                  <Input
                    id="id"
                    value={formData.id}
                    onChange={(e) => handleChange("id", e.target.value)}
                    placeholder="e.g., magnesium-gummies"
                    disabled={isEditing}
                  />
                  {!isEditing && (
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from name. Cannot be changed after creation.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    placeholder="e.g., magnesium-gummies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (£) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ProductImageUpload
                currentImage={formData.image}
                productId={formData.id}
                onImageChange={(url) => handleChange("image", url)}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Brief product description for listings..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Page Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_paragraph">Hero Paragraph</Label>
                  <Textarea
                    id="hero_paragraph"
                    value={formData.hero_paragraph}
                    onChange={(e) => handleChange("hero_paragraph", e.target.value)}
                    placeholder="The main paragraph shown at the top of the product page..."
                    rows={4}
                  />
                </div>

                <BenefitsEditor
                  benefits={formData.benefits as any[]}
                  onChange={(benefits) => handleChange("benefits", benefits)}
                />

                <div className="space-y-2">
                  <Label htmlFor="what_is_it">What Is It?</Label>
                  <Textarea
                    id="what_is_it"
                    value={formData.what_is_it}
                    onChange={(e) => handleChange("what_is_it", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="why_gummy">Why Gummy Format?</Label>
                  <Textarea
                    id="why_gummy"
                    value={formData.why_gummy}
                    onChange={(e) => handleChange("why_gummy", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="who_is_it_for">Who Is It For?</Label>
                  <Textarea
                    id="who_is_it_for"
                    value={formData.who_is_it_for}
                    onChange={(e) => handleChange("who_is_it_for", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="how_it_works">How It Works</Label>
                  <Textarea
                    id="how_it_works"
                    value={formData.how_it_works}
                    onChange={(e) => handleChange("how_it_works", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="how_to_take">How To Take</Label>
                  <Textarea
                    id="how_to_take"
                    value={formData.how_to_take}
                    onChange={(e) => handleChange("how_to_take", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routine_30_day">30-Day Routine</Label>
                  <Textarea
                    id="routine_30_day"
                    value={formData.routine_30_day}
                    onChange={(e) => handleChange("routine_30_day", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="what_makes_different">What Makes Healios Different?</Label>
                  <Textarea
                    id="what_makes_different"
                    value={formData.what_makes_different}
                    onChange={(e) => handleChange("what_makes_different", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscription_info">Subscription Information</Label>
                  <Textarea
                    id="subscription_info"
                    value={formData.subscription_info}
                    onChange={(e) => handleChange("subscription_info", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Ingredients & Safety</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <IngredientsEditor
                ingredients={formData.ingredients as any}
                onChange={(ingredients) => handleChange("ingredients", ingredients)}
              />

              <div className="space-y-2">
                <Label htmlFor="safety_info">Safety Information</Label>
                <Textarea
                  id="safety_info"
                  value={formData.safety_info}
                  onChange={(e) => handleChange("safety_info", e.target.value)}
                  placeholder="Standard safety disclaimers and storage information..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_cautions">Product Cautions</Label>
                <Textarea
                  id="product_cautions"
                  value={formData.product_cautions}
                  onChange={(e) => handleChange("product_cautions", e.target.value)}
                  placeholder="Specific cautions for this product..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <FAQEditor
                faqs={formData.faqs as any[]}
                onChange={(faqs) => handleChange("faqs", faqs)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEO Title</Label>
                <Input
                  id="seo_title"
                  value={formData.seo_title}
                  onChange={(e) => handleChange("seo_title", e.target.value)}
                  placeholder="Page title for search engines (max 60 chars)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo_title?.length || 0}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleChange("meta_description", e.target.value)}
                  placeholder="Description for search results (max 160 chars)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.meta_description?.length || 0}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_keyword">Primary Keyword</Label>
                <Input
                  id="primary_keyword"
                  value={formData.primary_keyword}
                  onChange={(e) => handleChange("primary_keyword", e.target.value)}
                  placeholder="e.g., magnesium gummies UK"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_keywords">Secondary Keywords</Label>
                <Input
                  id="secondary_keywords"
                  value={(formData.secondary_keywords || []).join(", ")}
                  onChange={(e) =>
                    handleChange(
                      "secondary_keywords",
                      e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
                    )
                  }
                  placeholder="Comma-separated keywords"
                />
                <p className="text-xs text-muted-foreground">
                  Enter keywords separated by commas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Visibility & Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Published</Label>
                    <p className="text-xs text-muted-foreground">Show on website</p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => handleChange("is_published", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Adults Only</Label>
                    <p className="text-xs text-muted-foreground">Restrict to adult customers</p>
                  </div>
                  <Switch
                    checked={formData.is_adults_only}
                    onCheckedChange={(checked) => handleChange("is_adults_only", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Kids Product</Label>
                    <p className="text-xs text-muted-foreground">Designed for children</p>
                  </div>
                  <Switch
                    checked={formData.is_kids_product}
                    onCheckedChange={(checked) => handleChange("is_kids_product", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => handleChange("sort_order", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers appear first in listings
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Inventory</Label>
                    <p className="text-xs text-muted-foreground">Enable stock tracking</p>
                  </div>
                  <Switch
                    checked={formData.track_inventory}
                    onCheckedChange={(checked) => handleChange("track_inventory", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleChange("stock_quantity", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                  <Input
                    id="low_stock_threshold"
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) =>
                      handleChange("low_stock_threshold", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Cross-Selling</CardTitle>
              </CardHeader>
              <CardContent>
                <PairsWellWithEditor
                  currentProductId={formData.id}
                  selectedProducts={formData.pairs_well_with || []}
                  onChange={(products) => handleChange("pairs_well_with", products)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductEditor;

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Plus, X, Minus } from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
}

interface BundleItem {
  product_id: string;
  quantity: number;
  // UI-only join fields
  name?: string;
  image?: string;
  price?: number;
}

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  price: number;
  compare_at_price: number | null;
  is_published: number;
  sort_order: number;
  seo_title: string | null;
  meta_description: string | null;
  items: BundleItem[];
}

const emptyBundle: Bundle = {
  id: '', name: '', slug: '', description: '', image: '',
  price: 0, compare_at_price: null, is_published: 1, sort_order: 0,
  seo_title: null, meta_description: null, items: [],
};

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

const BundleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [bundle, setBundle] = useState<Bundle>(emptyBundle);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cf_session');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    (async () => {
      try {
        const prodRes = await fetch(`${API_URL}/products`);
        const allProducts = await prodRes.json();
        // Filter out non-published and hidden bundle-as-product rows
        setProducts((allProducts as Product[]).filter((p: any) => p.is_published));

        if (!isNew) {
          const res = await fetch(`${API_URL}/admin/bundles/${id}`, { headers: getAuthHeaders() });
          if (!res.ok) throw new Error('Failed to load');
          const data = await res.json() as any;
          setBundle({
            ...data,
            is_published: data.is_published ? 1 : 0,
            items: (data.items || []).map((i: any) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              name: i.name, image: i.image, price: i.price,
            })),
          });
        }
      } catch {
        toast.error('Failed to load bundle data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  const update = (patch: Partial<Bundle>) => setBundle(b => ({ ...b, ...patch }));

  const addItem = (product: Product) => {
    if (bundle.items.some(i => i.product_id === product.id)) return;
    update({
      items: [...bundle.items, {
        product_id: product.id, quantity: 1,
        name: product.name, image: product.image, price: product.price,
      }],
    });
  };

  const removeItem = (productId: string) => {
    update({ items: bundle.items.filter(i => i.product_id !== productId) });
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty < 1) return;
    update({
      items: bundle.items.map(i => i.product_id === productId ? { ...i, quantity: qty } : i),
    });
  };

  const individualTotal = bundle.items.reduce((sum, i) => sum + Number(i.price || 0) * i.quantity, 0);
  const savings = Math.max(0, individualTotal - Number(bundle.price || 0));
  const savingsPercent = individualTotal > 0 ? Math.round((savings / individualTotal) * 100) : 0;

  const handleSave = async () => {
    if (!bundle.name.trim()) { toast.error('Name is required'); return; }
    if (!bundle.image) { toast.error('Image is required'); return; }
    if (bundle.items.length < 2) { toast.error('Add at least 2 products to a bundle'); return; }
    if (bundle.price <= 0) { toast.error('Price must be greater than zero'); return; }

    setSaving(true);
    try {
      const payload: any = {
        name: bundle.name,
        slug: bundle.slug || slugify(bundle.name),
        description: bundle.description,
        image: bundle.image,
        price: Number(bundle.price),
        compare_at_price: individualTotal > 0 ? individualTotal : null,
        is_published: !!bundle.is_published,
        sort_order: bundle.sort_order || 0,
        seo_title: bundle.seo_title,
        meta_description: bundle.meta_description,
        items: bundle.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      };

      const url = isNew ? `${API_URL}/admin/bundles` : `${API_URL}/admin/bundles/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json() as any;
        throw new Error(err.error || 'Save failed');
      }
      toast.success(isNew ? 'Bundle created' : 'Bundle saved');
      navigate('/admin/bundles');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </AdminLayout>
    );
  }

  const availableProducts = products.filter(p => !bundle.items.some(i => i.product_id === p.id));

  return (
    <AdminLayout title={isNew ? 'Create Bundle' : `Edit: ${bundle.name}`}>
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/bundles')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to bundles
        </Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Bundle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bundle Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name" value={bundle.name}
                  onChange={(e) => update({ name: e.target.value, slug: isNew && !bundle.slug ? slugify(e.target.value) : bundle.slug })}
                  placeholder="e.g., Morning Energy Stack"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/bundle/</span>
                  <Input
                    id="slug" value={bundle.slug}
                    onChange={(e) => update({ slug: slugify(e.target.value) })}
                    placeholder="morning-energy-stack"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description" value={bundle.description}
                  onChange={(e) => update({ description: e.target.value })}
                  placeholder="Describe the bundle and who it's for..."
                  rows={4}
                />
              </div>
              <ImageUpload
                label="Bundle Image *"
                currentImage={bundle.image}
                onImageChange={(url) => update({ image: url })}
                prefix="bundles"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Products in this Bundle</CardTitle>
              <p className="text-xs text-muted-foreground">
                Add at least 2 products. Customers will see each product on the bundle page and can click through to buy individually.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {bundle.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>
              ) : (
                <div className="space-y-2">
                  {bundle.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-lg">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">£{Number(item.price).toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateItemQty(item.product_id, item.quantity - 1)} disabled={item.quantity <= 1}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => updateItemQty(item.product_id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeItem(item.product_id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {availableProducts.length > 0 && (
                <div className="border-t border-border pt-4">
                  <Label className="text-sm mb-2 block">Add a product</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {availableProducts.map((p) => (
                      <button
                        type="button" key={p.id}
                        onClick={() => addItem(p)}
                        className="flex items-center gap-2 p-2 border border-border rounded-md hover:border-primary/50 hover:bg-muted/50 text-left transition-colors"
                      >
                        <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">£{Number(p.price).toFixed(2)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Bundle Price (£) *</Label>
                <Input
                  id="price" type="number" min="0" step="0.01"
                  value={bundle.price}
                  onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sum of individual prices:</span>
                  <span>£{individualTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bundle price:</span>
                  <span className="font-medium">£{Number(bundle.price).toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-medium">Customer saves:</span>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      £{savings.toFixed(2)} ({savingsPercent}%)
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Published</Label>
                  <p className="text-xs text-muted-foreground">Show on the live site</p>
                </div>
                <Switch
                  checked={!!bundle.is_published}
                  onCheckedChange={(v) => update({ is_published: v ? 1 : 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order" type="number"
                  value={bundle.sort_order}
                  onChange={(e) => update({ sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BundleEditor;

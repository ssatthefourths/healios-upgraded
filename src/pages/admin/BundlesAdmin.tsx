import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Loader2, Edit, Trash2, Gift } from "lucide-react";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

interface Bundle {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  compare_at_price: number | null;
  is_published: number;
  item_count: number;
  created_at: string;
}

const BundlesAdmin = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cf_session');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchBundles = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/bundles`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to load bundles');
      const data = await res.json();
      setBundles(data as Bundle[]);
    } catch {
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBundles(); }, []);

  const handleDelete = async (bundle: Bundle) => {
    if (!window.confirm(`Delete bundle "${bundle.name}"? This cannot be undone.`)) return;
    setDeletingId(bundle.id);
    try {
      const res = await fetch(`${API_URL}/admin/bundles/${bundle.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      setBundles(bundles.filter(b => b.id !== bundle.id));
      toast.success(`"${bundle.name}" deleted`);
    } catch {
      toast.error('Failed to delete bundle');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout title="Bundles" subtitle="Create and manage product bundles">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {bundles.length} bundle{bundles.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={() => navigate('/admin/bundles/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Bundle
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : bundles.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-lg">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No bundles yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Bundles let customers buy curated stacks of products at a discount.
          </p>
          <Button onClick={() => navigate('/admin/bundles/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create your first bundle
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="p-4 w-16"></TableHead>
                <TableHead className="p-4">Name</TableHead>
                <TableHead className="p-4">Products</TableHead>
                <TableHead className="p-4">Price</TableHead>
                <TableHead className="p-4">Status</TableHead>
                <TableHead className="p-4">Created</TableHead>
                <TableHead className="p-4 w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="p-4">
                    <img
                      src={bundle.image || '/placeholder.svg'}
                      alt={bundle.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="font-medium text-foreground">{bundle.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{bundle.slug}</div>
                  </TableCell>
                  <TableCell className="p-4 text-sm text-muted-foreground">
                    {bundle.item_count} item{bundle.item_count !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="p-4 text-sm">£{Number(bundle.price).toFixed(2)}</TableCell>
                  <TableCell className="p-4">
                    <Badge variant={bundle.is_published ? 'default' : 'secondary'}>
                      {bundle.is_published ? 'Live' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-4 text-sm text-muted-foreground">
                    {format(new Date(bundle.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={() => navigate(`/admin/bundles/${bundle.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(bundle)}
                        disabled={deletingId === bundle.id}
                      >
                        {deletingId === bundle.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
};

export default BundlesAdmin;

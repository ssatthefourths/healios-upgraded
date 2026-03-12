import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Ticket, 
  Plus,
  Pencil,
  Trash2,
  Search,
  TrendingUp,
  PoundSterling,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

interface DiscountAnalytics {
  code: string;
  total_uses: number;
  total_orders: number;
  total_revenue: number;
  total_discount_given: number;
  avg_order_value: number;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const DiscountsAdmin = () => {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [analytics, setAnalytics] = useState<DiscountAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_amount: "0",
    max_uses: "",
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    fetchDiscounts();
    fetchAnalytics();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Failed to load discount codes");
    } else {
      setDiscounts(data || []);
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    const { data: orders, error } = await supabase
      .from("orders")
      .select("discount_code, discount_amount, total")
      .not("discount_code", "is", null);

    if (error) {
      console.error("Error fetching analytics:", error);
      return;
    }

    // Aggregate analytics by discount code
    const analyticsMap = new Map<string, DiscountAnalytics>();
    
    orders?.forEach((order) => {
      const code = order.discount_code!;
      const existing = analyticsMap.get(code) || {
        code,
        total_uses: 0,
        total_orders: 0,
        total_revenue: 0,
        total_discount_given: 0,
        avg_order_value: 0,
      };
      
      existing.total_uses += 1;
      existing.total_orders += 1;
      existing.total_revenue += Number(order.total) || 0;
      existing.total_discount_given += Number(order.discount_amount) || 0;
      
      analyticsMap.set(code, existing);
    });

    // Calculate averages
    analyticsMap.forEach((stats) => {
      stats.avg_order_value = stats.total_orders > 0 
        ? stats.total_revenue / stats.total_orders 
        : 0;
    });

    setAnalytics(Array.from(analyticsMap.values()).sort((a, b) => b.total_uses - a.total_uses));
  };

  const handleOpenDialog = (discount?: DiscountCode) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value.toString(),
        min_order_amount: discount.min_order_amount.toString(),
        max_uses: discount.max_uses?.toString() || "",
        valid_until: discount.valid_until ? discount.valid_until.split("T")[0] : "",
        is_active: discount.is_active,
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: "",
        min_order_amount: "0",
        max_uses: "",
        valid_until: "",
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.discount_value) {
      toast.error("Please fill in required fields");
      return;
    }

    const discountData = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: parseFloat(formData.min_order_amount) || 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      is_active: formData.is_active,
    };

    if (editingDiscount) {
      const { error } = await supabase
        .from("discount_codes")
        .update(discountData)
        .eq("id", editingDiscount.id);

      if (error) {
        console.error("Error updating discount:", error);
        toast.error("Failed to update discount code");
      } else {
        toast.success("Discount code updated");
        setIsDialogOpen(false);
        fetchDiscounts();
      }
    } else {
      const { error } = await supabase
        .from("discount_codes")
        .insert(discountData);

      if (error) {
        if (error.code === "23505") {
          toast.error("A discount code with this name already exists");
        } else {
          console.error("Error creating discount:", error);
          toast.error("Failed to create discount code");
        }
      } else {
        toast.success("Discount code created");
        setIsDialogOpen(false);
        fetchDiscounts();
      }
    }
  };

  const handleToggleActive = async (discount: DiscountCode) => {
    const { error } = await supabase
      .from("discount_codes")
      .update({ is_active: !discount.is_active })
      .eq("id", discount.id);

    if (error) {
      toast.error("Failed to update discount status");
    } else {
      toast.success(discount.is_active ? "Discount deactivated" : "Discount activated");
      fetchDiscounts();
    }
  };

  const handleDelete = async (discount: DiscountCode) => {
    if (!confirm(`Are you sure you want to delete "${discount.code}"?`)) return;

    const { error } = await supabase
      .from("discount_codes")
      .delete()
      .eq("id", discount.id);

    if (error) {
      toast.error("Failed to delete discount code");
    } else {
      toast.success("Discount code deleted");
      fetchDiscounts();
    }
  };

  const filteredDiscounts = discounts.filter(d =>
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Discounts" subtitle="Create and manage discount codes">
      {/* Analytics Summary */}
      {analytics.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-border p-4 bg-muted/10 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="h-4 w-4" />
                Total Redemptions
              </div>
              <p className="text-2xl font-light text-foreground">
                {analytics.reduce((sum, a) => sum + a.total_uses, 0)}
              </p>
            </div>
            <div className="border border-border p-4 bg-muted/10 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <PoundSterling className="h-4 w-4" />
                Revenue with Discounts
              </div>
              <p className="text-2xl font-light text-foreground">
                £{analytics.reduce((sum, a) => sum + a.total_revenue, 0).toFixed(2)}
              </p>
            </div>
            <div className="border border-border p-4 bg-muted/10 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Ticket className="h-4 w-4" />
                Total Discounts Given
              </div>
              <p className="text-2xl font-light text-foreground">
                £{analytics.reduce((sum, a) => sum + a.total_discount_given, 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Top Codes Table */}
          <div className="border border-border overflow-x-auto mb-8 rounded-lg">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Uses</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Revenue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Discounts Given</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Avg Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.slice(0, 5).map((stat) => (
                  <tr key={stat.code} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-foreground">{stat.code}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{stat.total_uses}</td>
                    <td className="px-4 py-3 text-foreground">£{stat.total_revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground">£{stat.total_discount_given.toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground">£{stat.avg_order_value.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search discount codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDiscount ? "Edit Discount Code" : "Create Discount Code"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., WELCOME10"
                  className="mt-1 uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">Value *</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === "percentage" ? "10" : "5.00"}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_order_amount">Min Order (£)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="0"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="valid_until">Expires On</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingDiscount ? "Update Discount" : "Create Discount"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Discounts Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No discount codes found
        </div>
      ) : (
        <div className="border border-border overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Code</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Uses</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Expires</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-foreground">{discount.code}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">
                    {discount.discount_type}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {discount.discount_type === "percentage" 
                      ? `${discount.discount_value}%` 
                      : `£${discount.discount_value}`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {discount.current_uses}{discount.max_uses ? `/${discount.max_uses}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={discount.is_active ? "default" : "secondary"}>
                      {discount.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {discount.valid_until 
                      ? format(new Date(discount.valid_until), "dd MMM yyyy") 
                      : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(discount)}
                      >
                        {discount.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(discount)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(discount)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default DiscountsAdmin;

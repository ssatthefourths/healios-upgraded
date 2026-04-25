import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Package,
  Loader2,
  Search,
  ChevronDown,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  MoreHorizontal,
  Download,
} from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';
import { format, formatDistanceToNow, startOfDay, startOfWeek, subDays, subWeeks, isAfter } from "date-fns";

type OrderStatus = 'pending' | 'payment_confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  product_category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  /** ISO 4217 code; e.g. 'GBP', 'ZAR'. Defaults to 'GBP' for legacy orders. */
  currency?: string;
  shipping_method: string;
  discount_code: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<any> }> = {
  pending: { label: "Pending", color: "text-amber-700", bgColor: "bg-amber-100", icon: Clock },
  processing: { label: "Processing", color: "text-blue-700", bgColor: "bg-blue-100", icon: Package },
  shipped: { label: "Shipped", color: "text-purple-700", bgColor: "bg-purple-100", icon: Truck },
  delivered: { label: "Delivered", color: "text-emerald-700", bgColor: "bg-emerald-100", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-100", icon: XCircle },
  refunded: { label: "Refunded", color: "text-slate-700", bgColor: "bg-slate-100", icon: RotateCcw },
};

const OrdersAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('cf_session');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/orders`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setOrders(data as Order[]);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
    setUpdatingOrderId(order.id);

    try {
      const res = await fetch(`${API_URL}/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update order');

      toast.success(newStatus === 'cancelled' ? 'Order cancelled — stock restored' : `Order updated to ${newStatus}`);
      setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update order";
      toast.error(message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleBulkUpdate = async (newStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) return;
    setBulkUpdating(true);
    const orderIds = Array.from(selectedOrderIds);
    let successCount = 0;
    let failCount = 0;

    for (const orderId of orderIds) {
      try {
        const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
          method: 'PUT',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Failed');
        successCount++;
      } catch {
        failCount++;
      }
    }

    setOrders(orders.map(o => selectedOrderIds.has(o.id) ? { ...o, status: newStatus } : o));
    setSelectedOrderIds(new Set());
    setBulkUpdating(false);

    if (failCount > 0) {
      toast.warning(`Updated ${successCount} orders, ${failCount} failed`);
    } else {
      toast.success(`Updated ${successCount} orders to ${newStatus}`);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // Per-order currency formatter — uses the order's `currency` column so a
  // ZAR / USD customer's amounts are shown in their actual paid currency
  // instead of being misleadingly formatted as GBP (ticket #6 in
  // HealiosIssuesFeedback_v3.csv). Aggregate metrics (today / week / AOV)
  // stay GBP-shaped for now — fixing those needs FX conversion across
  // mixed-currency orders, out of scope here.
  const CURRENCY_SYMBOLS: Record<string, string> = {
    GBP: '£', ZAR: 'R', USD: '$', EUR: '€', CAD: 'C$', AUD: 'A$',
  };
  const formatMoney = (amount: number, currency: string = 'GBP') => {
    const code = (currency || 'GBP').toUpperCase();
    const sym = CURRENCY_SYMBOLS[code] ?? `${code} `;
    return `${sym}${Number(amount).toFixed(2)}`;
  };
  // Legacy alias used by the aggregate KPI cards — keeps GBP behaviour.
  const formatCurrency = (amount: number) => formatMoney(amount, 'GBP');

  const exportToCSV = () => {
    if (filteredOrders.length === 0) { toast.error("No orders to export"); return; }
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Order ID', 'Date', 'First Name', 'Last Name', 'Email', 'Phone', 'Shipping Address', 'City', 'Postal Code', 'Country', 'Items', 'Subtotal', 'Shipping', 'Discount', 'Total', 'Status'].map(escape).join(','),
      ...filteredOrders.map(o => {
        const items = (o.order_items || []).map((i: OrderItem) => `${i.product_name} x${i.quantity}`).join(' | ');
        return [o.id, format(new Date(o.created_at), 'yyyy-MM-dd HH:mm'), o.first_name, o.last_name, o.email, o.phone || '', o.shipping_address, o.shipping_city, o.shipping_postal_code, o.shipping_country, items, o.subtotal, o.shipping_cost, o.discount_amount, o.total, o.status].map(escape).join(',');
      })
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `healios-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success(`Exported ${filteredOrders.length} orders`);
  };

  // Calculate KPI metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const yesterdayStart = startOfDay(subDays(now, 1));
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = subDays(weekStart, 1);

    const todayOrders = orders.filter(o => isAfter(new Date(o.created_at), todayStart));
    const yesterdayOrders = orders.filter(o => {
      const date = new Date(o.created_at);
      return isAfter(date, yesterdayStart) && !isAfter(date, todayStart);
    });
    const weekOrders = orders.filter(o => isAfter(new Date(o.created_at), weekStart));
    const lastWeekOrders = orders.filter(o => {
      const date = new Date(o.created_at);
      return isAfter(date, lastWeekStart) && !isAfter(date, weekStart);
    });

    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const weekRevenue = weekOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.total), 0);

    const pendingAction = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue,
        trend: yesterdayOrders.length > 0 
          ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100 
          : 0
      },
      week: {
        orders: weekOrders.length,
        revenue: weekRevenue,
        trend: lastWeekOrders.length > 0 
          ? ((weekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100 
          : 0
      },
      pendingAction,
      aov
    };
  }, [orders]);

  // Status counts for tabs
  const statusCounts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled" || o.status === "refunded").length,
  }), [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === "cancelled") {
        matchesTab = order.status === "cancelled" || order.status === "refunded";
      } else if (activeTab !== "all") {
        matchesTab = order.status === activeTab;
      }
      
      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, activeTab]);

  return (
    <AdminLayout title="Orders" subtitle="Manage and fulfill customer orders">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Today */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{metrics.today.orders}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(metrics.today.revenue)}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1 text-xs ${metrics.today.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {metrics.today.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(metrics.today.trend).toFixed(0)}%</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">vs yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{metrics.week.orders}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(metrics.week.revenue)}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className={`flex items-center gap-1 text-xs ${metrics.week.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {metrics.week.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{Math.abs(metrics.week.trend).toFixed(0)}%</span>
                </div>
                <span className="text-xs text-muted-foreground mt-1">vs last week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Action */}
        <Card className={`border-border ${metrics.pendingAction > 0 ? 'bg-amber-50 border-amber-200' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Needs Action</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{metrics.pendingAction}</p>
                <p className="text-sm text-muted-foreground">orders waiting</p>
              </div>
              <AlertCircle className={`h-8 w-8 ${metrics.pendingAction > 0 ? 'text-amber-500' : 'text-muted-foreground/30'}`} />
            </div>
          </CardContent>
        </Card>

        {/* AOV */}
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Order Value</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{formatCurrency(metrics.aov)}</p>
                <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Export */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers, emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={exportToCSV} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedOrderIds.size > 0 && (
        <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-4">
          <span className="text-sm font-medium">{selectedOrderIds.size} orders selected</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" disabled={bulkUpdating}>
                {bulkUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Status
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkUpdate("processing")}>
                Mark as Processing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkUpdate("shipped")}>
                Mark as Shipped
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkUpdate("delivered")}>
                Mark as Delivered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkUpdate("cancelled")}>
                Mark as Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" onClick={() => setSelectedOrderIds(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({statusCounts.processing})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({statusCounts.shipped})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({statusCounts.delivered})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({statusCounts.cancelled})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loadingOrders ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <>
                        <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedOrderIds.has(order.id)}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                            />
                          </TableCell>
                          <TableCell onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <div className="font-mono text-sm">{order.id.slice(0, 8)}...</div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <div>
                              <div className="font-medium">{order.first_name} {order.last_name}</div>
                              <div className="text-sm text-muted-foreground">{order.email}</div>
                            </div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <Badge className={`${config.bgColor} ${config.color} border-0`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <div className="flex items-center gap-2">
                              <span>{formatMoney(order.total, order.currency)}</span>
                              {order.currency && order.currency.toUpperCase() !== 'GBP' && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  {order.currency.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(new Date(order.created_at), "PPpp")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={updatingOrderId === order.id}>
                                  {updatingOrderId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateOrderStatus(order, "processing")}>
                                  Mark as Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order, "shipped")}>
                                  Mark as Shipped
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order, "delivered")}>
                                  Mark as Delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateOrderStatus(order, "cancelled")}>
                                  Mark as Cancelled
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {order.order_items?.map((item) => (
                                      <div key={item.id} className="flex items-center gap-3">
                                        <img
                                          src={item.product_image || "/placeholder.svg"}
                                          alt={item.product_name}
                                          className="w-10 h-10 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{item.product_name}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {item.quantity} × {formatMoney(item.unit_price, order.currency)}
                                          </div>
                                        </div>
                                        <div className="text-sm font-medium">{formatMoney(item.line_total, order.currency)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Shipping Address</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {order.shipping_address}<br />
                                    {order.shipping_city}, {order.shipping_postal_code}<br />
                                    {order.shipping_country}
                                  </p>
                                  {order.discount_code && (
                                    <div className="mt-4">
                                      <h4 className="font-medium mb-1">Discount</h4>
                                      <Badge variant="secondary">{order.discount_code}</Badge>
                                      <span className="ml-2 text-sm text-muted-foreground">
                                        -{formatMoney(order.discount_amount, order.currency)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default OrdersAdmin;

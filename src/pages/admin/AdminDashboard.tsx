import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackClarityEvent } from "@/lib/clarity";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Package,
  ShoppingCart,
  Mail,
  Star,
  Users,
  ShoppingBag,
  Tag,
  Heart,
  AlertTriangle,
  ArrowRight,
  Target,
  Repeat,
  TrendingUp,
  CalendarDays,
  Clock,
  BarChart3,
  Shield,
  FileText,
  UserCog,
} from "lucide-react";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

interface RecentOrder {
  id: string;
  email: string;
  total: number;
  status: string;
  created_at: string;
}

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  pendingReviews: number;
  lowStockProducts: number;
  totalProducts: number;
  newsletterSubscribers: number;
  pendingWellnessPosts: number;
  activeDiscounts: number;
  recentOrders: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  pending:           "bg-amber-100 text-amber-800 border-amber-200",
  payment_confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing:        "bg-sky-100 text-sky-800 border-sky-200",
  shipped:           "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered:         "bg-green-100 text-green-800 border-green-200",
  cancelled:         "bg-red-100 text-red-800 border-red-200",
  refunded:          "bg-rose-100 text-rose-800 border-rose-200",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    monthRevenue: 0,
    pendingReviews: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    newsletterSubscribers: 0,
    pendingWellnessPosts: 0,
    activeDiscounts: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackClarityEvent('dashboard_view');

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('cf_session');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/admin/stats`, { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminSections = [
    {
      title: "Orders",
      description: "Manage customer orders and update statuses",
      icon: ShoppingCart,
      href: "/admin/orders",
      stat: stats.totalOrders,
      statLabel: "total orders",
      alert: stats.pendingOrders > 0 ? `${stats.pendingOrders} pending` : undefined,
    },
    {
      title: "Products",
      description: "Create, edit, and manage all products",
      icon: ShoppingBag,
      href: "/admin/products",
      stat: stats.totalProducts,
      statLabel: "published products",
    },
    {
      title: "Inventory",
      description: "Track stock levels and manage inventory",
      icon: Package,
      href: "/admin/inventory",
      stat: stats.lowStockProducts,
      statLabel: "low stock items",
      alert: stats.lowStockProducts > 0 ? "Low stock alert" : undefined,
    },
    {
      title: "Reviews",
      description: "Moderate product reviews and ratings",
      icon: Star,
      href: "/admin/reviews",
      stat: stats.pendingReviews,
      statLabel: "pending reviews",
      alert: stats.pendingReviews > 0 ? "Needs attention" : undefined,
    },
    {
      title: "Blog",
      description: "Manage wellness blog posts and categories",
      icon: FileText,
      href: "/admin/blog",
      stat: "Manage",
      statLabel: "articles",
    },
    {
      title: "Newsletter",
      description: "Manage subscribers and send newsletters",
      icon: Mail,
      href: "/admin/newsletter",
      stat: stats.newsletterSubscribers,
      statLabel: "active subscribers",
    },
    {
      title: "Discounts",
      description: "Create and manage discount codes",
      icon: Tag,
      href: "/admin/discounts",
      stat: stats.activeDiscounts,
      statLabel: "active codes",
    },
    {
      title: "Wellness Drive",
      description: "Review community wellness submissions",
      icon: Heart,
      href: "/admin/wellness",
      stat: stats.pendingWellnessPosts,
      statLabel: "pending posts",
      alert: stats.pendingWellnessPosts > 0 ? "Needs review" : undefined,
    },
    {
      title: "Users",
      description: "Manage customer profiles and admin roles",
      icon: UserCog,
      href: "/admin/users",
      stat: "Manage",
      statLabel: "accounts",
    },
    {
      title: "Analytics",
      description: "General store performance and traffic",
      icon: BarChart3,
      href: "/admin/analytics",
      stat: "View",
      statLabel: "reports",
    },
    {
      title: "CLV Analytics",
      description: "Customer lifetime value insights",
      icon: Target,
      href: "/admin/clv",
      stat: "View",
      statLabel: "dashboard",
    },
    {
      title: "Subscriptions",
      description: "MRR, churn rate, and subscription metrics",
      icon: Repeat,
      href: "/admin/subscriptions",
      stat: "View",
      statLabel: "dashboard",
    },
    {
      title: "Checkout Security",
      description: "Monitor and block suspicious behavior",
      icon: Shield,
      href: "/admin/security",
      stat: "Secure",
      statLabel: "gateway",
    },
  ];

  const hasAlerts = stats.pendingOrders > 0 || stats.lowStockProducts > 0 || stats.pendingReviews > 0 || stats.pendingWellnessPosts > 0;

  const formatCurrency = (amount: number) =>
    `£${Number(amount).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return iso; }
  };

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your store's performance and quick actions">

      {/* Revenue + Orders stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-primary text-primary-foreground col-span-2 md:col-span-1">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide">All-time Revenue</p>
                <p className="text-2xl font-bold mt-1">{loading ? "—" : formatCurrency(stats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-40 shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">This Month</p>
                <p className="text-2xl font-bold text-foreground mt-1">{loading ? "—" : formatCurrency(stats.monthRevenue)}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-muted-foreground/40 shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Orders Today</p>
                <p className="text-2xl font-bold text-foreground mt-1">{loading ? "—" : stats.todayOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/40 shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-bold text-foreground mt-1">{loading ? "—" : stats.totalOrders}</p>
                {stats.pendingOrders > 0 && (
                  <p className="text-amber-600 text-xs mt-1 font-medium">{stats.pendingOrders} pending</p>
                )}
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40 shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts strip */}
      {!loading && hasAlerts && (
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mr-2">
            <AlertTriangle className="h-4 w-4" />
            Attention needed:
          </div>
          {stats.pendingOrders > 0 && (
            <Link to="/admin/orders">
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 cursor-pointer">
                {stats.pendingOrders} pending orders
              </Badge>
            </Link>
          )}
          {stats.lowStockProducts > 0 && (
            <Link to="/admin/inventory">
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 cursor-pointer">
                {stats.lowStockProducts} low stock
              </Badge>
            </Link>
          )}
          {stats.pendingReviews > 0 && (
            <Link to="/admin/reviews">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 cursor-pointer">
                {stats.pendingReviews} pending reviews
              </Badge>
            </Link>
          )}
          {stats.pendingWellnessPosts > 0 && (
            <Link to="/admin/wellness">
              <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200 cursor-pointer">
                {stats.pendingWellnessPosts} wellness posts
              </Badge>
            </Link>
          )}
        </div>
      )}

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {adminSections.map((section) => (
          <Link key={section.href} to={section.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  {section.alert && (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">
                      <AlertTriangle className="h-3 w-3" />
                      {section.alert}
                    </div>
                  )}
                </div>
                <CardTitle className="flex items-center justify-between mt-3 text-base">
                  {section.title}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <CardDescription className="text-xs">{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl font-semibold text-foreground">
                  {loading ? <span className="text-muted-foreground/40">—</span> : section.stat}
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    {section.statLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <CardDescription className="text-xs mt-0.5">Latest 8 orders across the store</CardDescription>
            </div>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">Loading orders…</div>
          ) : stats.recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[100px] px-6">Order ID</TableHead>
                    <TableHead className="px-4">Customer</TableHead>
                    <TableHead className="text-right px-4">Amount</TableHead>
                    <TableHead className="px-4">Status</TableHead>
                    <TableHead className="px-6">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order, i) => (
                    <TableRow key={order.id} className={i % 2 === 0 ? '' : 'bg-muted/10'}>
                      <TableCell className="px-6 font-mono text-xs text-muted-foreground">
                        {order.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="px-4 text-foreground truncate max-w-[160px]">{order.email || '—'}</TableCell>
                      <TableCell className="px-4 text-right font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground border-border'}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-muted-foreground text-xs">{formatDate(order.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Architecture note. Aggregates roll up to GBP because mixing currencies
          in a sum without FX conversion is meaningless. Per-order amounts are
          shown in each customer's actual paid currency on the Orders list —
          that's the source of truth for "what did this customer pay". Pending
          Monique sign-off (M15 in docs/LAUNCH-READINESS.md). */}
      <p className="text-xs text-muted-foreground/60 mt-4 text-center max-w-2xl mx-auto">
        Revenue aggregates here roll up in GBP (base currency). For the actual currency each customer paid in, see the per-order rows on the <span className="text-foreground">Orders</span> page — those carry the order's true currency. Pending sign-off on whether to FX-convert these aggregate cards.
      </p>
    </AdminLayout>
  );
};

export default AdminDashboard;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { trackClarityEvent } from "@/lib/clarity";
import { cloudflare as supabase } from "@/integrations/cloudflare/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Repeat
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  pendingReviews: number;
  lowStockProducts: number;
  totalProducts: number;
  newsletterSubscribers: number;
  pendingWellnessPosts: number;
  activeDiscounts: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    newsletterSubscribers: 0,
    pendingWellnessPosts: 0,
    activeDiscounts: 0,
  });

  useEffect(() => {
    trackClarityEvent('dashboard_view');

    const fetchStats = async () => {
      // Fetch all stats in parallel
      const [
        ordersResult,
        pendingOrdersResult,
        revenueResult,
        reviewsResult,
        lowStockResult,
        totalProductsResult,
        subscribersResult,
        wellnessResult,
        discountsResult,
      ] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("total"),
        supabase.from("product_reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock_quantity", 10),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("wellness_posts").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("discount_codes").select("id", { count: "exact", head: true }).eq("is_active", true),
      ]);

      const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setStats({
        totalOrders: ordersResult.count || 0,
        pendingOrders: pendingOrdersResult.count || 0,
        totalRevenue,
        pendingReviews: reviewsResult.count || 0,
        lowStockProducts: lowStockResult.count || 0,
        totalProducts: totalProductsResult.count || 0,
        newsletterSubscribers: subscribersResult.count || 0,
        pendingWellnessPosts: wellnessResult.count || 0,
        activeDiscounts: discountsResult.count || 0,
      });
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
      statLabel: "total products",
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
      title: "Inventory",
      description: "Track stock levels and manage inventory",
      icon: Package,
      href: "/admin/inventory",
      stat: stats.lowStockProducts,
      statLabel: "low stock items",
      alert: stats.lowStockProducts > 0 ? "Low stock alert" : undefined,
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
      title: "Wellness Drive",
      description: "Review community wellness submissions",
      icon: Heart,
      href: "/admin/wellness",
      stat: stats.pendingWellnessPosts,
      statLabel: "pending posts",
      alert: stats.pendingWellnessPosts > 0 ? "Needs review" : undefined,
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
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your store's performance and quick actions">
      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-foreground/80 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold">£{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <ShoppingCart className="h-10 w-10 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
              </div>
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Newsletter Subscribers</p>
                <p className="text-3xl font-bold text-foreground">{stats.newsletterSubscribers}</p>
              </div>
              <Users className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link key={section.href} to={section.href}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  {section.alert && (
                    <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {section.alert}
                    </div>
                  )}
                </div>
                <CardTitle className="flex items-center justify-between mt-4">
                  {section.title}
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {section.stat}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {section.statLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

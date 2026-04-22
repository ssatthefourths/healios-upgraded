import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Mail,
  Star,
  Tag,
  Heart,
  BarChart3,
  Target,
  Repeat,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Shield,
  UserCog,
  UserX,
  Gift,
  Settings2,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_CF_WORKER_URL || 'https://healios-api.ss-f01.workers.dev';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeType?: "warning" | "info";
}

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const AdminSidebar = ({ collapsed = false, onCollapse }: AdminSidebarProps) => {
  const location = useLocation();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const token = localStorage.getItem('cf_session');
      if (!token) return;
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingOrders(data.pendingOrders ?? 0);
        setLowStock(data.lowStockProducts ?? 0);
        setPendingReviews(data.pendingReviews ?? 0);
      }
    } catch {
      // non-critical — badges just won't show counts
    }
  };

  const handleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { title: "Orders", href: "/admin/orders", icon: ShoppingCart, badge: pendingOrders, badgeType: "warning" },
    { title: "Products", href: "/admin/products", icon: ShoppingBag },
    { title: "Bundles", href: "/admin/bundles", icon: Gift },
    { title: "Inventory", href: "/admin/inventory", icon: Package, badge: lowStock, badgeType: "warning" },
    { title: "Reviews", href: "/admin/reviews", icon: Star, badge: pendingReviews, badgeType: "info" },
    { title: "Newsletter", href: "/admin/newsletter", icon: Mail },
    { title: "Discounts", href: "/admin/discounts", icon: Tag },
    { title: "Wellness", href: "/admin/wellness", icon: Heart },
    { title: "Blog", href: "/admin/blog", icon: FileText },
    { title: "Users", href: "/admin/users", icon: UserCog },
    { title: "Site Settings", href: "/admin/site-config", icon: Settings2 },
    { title: "Search Phrases", href: "/admin/search-phrases", icon: Search },
  ];

  const analyticsItems: NavItem[] = [
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { title: "RFM Analysis", href: "/admin/rfm", icon: Target },
    { title: "CLV Dashboard", href: "/admin/clv", icon: Target },
    { title: "Subscriptions", href: "/admin/subscriptions", icon: Repeat },
    { title: "Campaigns", href: "/admin/campaigns", icon: Mail },
    { title: "Checkout Security", href: "/admin/security", icon: Shield },
    { title: "Referral Security", href: "/admin/referral-security", icon: UserX },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside 
      className={cn(
        "bg-card border-r border-border self-start sticky top-16 transition-all duration-200",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col">
        {/* Collapse Toggle */}
        <div className="p-2 border-b border-border flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCollapse}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="p-2 space-y-1">
          {!isCollapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Management
            </p>
          )}
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant={item.badgeType === "warning" ? "destructive" : "secondary"}
                      className="h-5 min-w-[20px] px-1.5 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              {isCollapsed && item.badge && item.badge > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 bg-destructive rounded-full" />
              )}
            </Link>
          ))}

          {!isCollapsed && (
            <p className="px-3 py-2 pt-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Analytics
            </p>
          )}
          {isCollapsed && <div className="border-t border-border my-2" />}
          {analyticsItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>

        {/* Quick Stats Footer */}
        {!isCollapsed && (pendingOrders > 0 || lowStock > 0) && (
          <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {pendingOrders > 0 && `${pendingOrders} pending orders`}
                {pendingOrders > 0 && lowStock > 0 && " · "}
                {lowStock > 0 && `${lowStock} low stock`}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;

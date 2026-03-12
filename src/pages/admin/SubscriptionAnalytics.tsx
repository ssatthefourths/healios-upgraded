import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, differenceInDays } from "date-fns";
import { 
  TrendingUp,
  TrendingDown,
  PoundSterling,
  Users,
  Repeat,
  Pause,
  XCircle,
  Calendar,
  Activity,
  Download
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  cancelledSubscriptions: number;
  mrr: number;
  arr: number;
  churnRate: number;
  avgSubscriptionLifetime: number;
  revenueByProduct: { productId: string; productName: string; revenue: number; count: number }[];
}

interface GrowthData {
  month: string;
  active: number;
  cancelled: number;
  new: number;
  mrr: number;
}

const SubscriptionAnalytics = () => {
  const [monthsBack, setMonthsBack] = useState("12");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    pausedSubscriptions: 0,
    cancelledSubscriptions: 0,
    mrr: 0,
    arr: 0,
    churnRate: 0,
    avgSubscriptionLifetime: 0,
    revenueByProduct: [],
  });
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [monthsBack]);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    const months = parseInt(monthsBack);

    try {
      // Fetch all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: true });

      if (subsError) throw subsError;

      // Fetch products for names
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("id, name");

      if (prodError) throw prodError;

      const productMap = new Map(products?.map(p => [p.id, p.name]) || []);

      // Calculate metrics
      const total = subscriptions?.length || 0;
      const active = subscriptions?.filter(s => s.status === "active").length || 0;
      const paused = subscriptions?.filter(s => s.status === "paused").length || 0;
      const cancelled = subscriptions?.filter(s => s.status === "cancelled").length || 0;

      // MRR calculation (only active subscriptions)
      const activeSubscriptions = subscriptions?.filter(s => s.status === "active") || [];
      let mrr = 0;
      activeSubscriptions.forEach(sub => {
        const monthlyPrice = sub.frequency === "monthly" ? Number(sub.price) :
          sub.frequency === "bimonthly" ? Number(sub.price) / 2 :
          sub.frequency === "quarterly" ? Number(sub.price) / 3 : Number(sub.price);
        mrr += monthlyPrice;
      });

      // Churn rate
      const now = new Date();
      const periodStart = subMonths(now, 1);
      const cancelledInPeriod = subscriptions?.filter(s => 
        s.cancelled_at && new Date(s.cancelled_at) >= periodStart
      ).length || 0;
      const totalAtPeriodStart = subscriptions?.filter(s => 
        new Date(s.created_at) < periodStart && 
        (!s.cancelled_at || new Date(s.cancelled_at) >= periodStart)
      ).length || 1;
      const churnRate = (cancelledInPeriod / totalAtPeriodStart) * 100;

      // Average subscription lifetime
      let totalLifetimeDays = 0;
      let lifetimeCount = 0;
      subscriptions?.forEach(sub => {
        const endDate = sub.cancelled_at ? new Date(sub.cancelled_at) : now;
        const startDate = new Date(sub.created_at);
        const lifetimeDays = differenceInDays(endDate, startDate);
        if (lifetimeDays > 0) {
          totalLifetimeDays += lifetimeDays;
          lifetimeCount++;
        }
      });
      const avgLifetimeDays = lifetimeCount > 0 ? totalLifetimeDays / lifetimeCount : 0;
      const avgLifetimeMonths = avgLifetimeDays / 30;

      // Revenue by product
      const productRevenue = new Map<string, { revenue: number; count: number }>();
      activeSubscriptions.forEach(sub => {
        const existing = productRevenue.get(sub.product_id) || { revenue: 0, count: 0 };
        existing.revenue += Number(sub.price);
        existing.count += 1;
        productRevenue.set(sub.product_id, existing);
      });

      const revenueByProduct = Array.from(productRevenue.entries())
        .map(([productId, data]) => ({
          productId,
          productName: productMap.get(productId) || productId,
          revenue: data.revenue,
          count: data.count,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setMetrics({
        totalSubscriptions: total,
        activeSubscriptions: active,
        pausedSubscriptions: paused,
        cancelledSubscriptions: cancelled,
        mrr,
        arr: mrr * 12,
        churnRate,
        avgSubscriptionLifetime: avgLifetimeMonths,
        revenueByProduct,
      });

      // Build growth data by month
      const growth: GrowthData[] = [];
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = startOfMonth(subMonths(now, i - 1));
        const monthLabel = format(monthStart, "MMM yy");

        const activeInMonth = subscriptions?.filter(s => {
          const created = new Date(s.created_at);
          const cancelled = s.cancelled_at ? new Date(s.cancelled_at) : null;
          return created < monthEnd && (!cancelled || cancelled >= monthStart);
        }).length || 0;

        const cancelledInMonth = subscriptions?.filter(s => {
          if (!s.cancelled_at) return false;
          const cancelled = new Date(s.cancelled_at);
          return cancelled >= monthStart && cancelled < monthEnd;
        }).length || 0;

        const newInMonth = subscriptions?.filter(s => {
          const created = new Date(s.created_at);
          return created >= monthStart && created < monthEnd;
        }).length || 0;

        // Calculate MRR for that month
        const activeSubsInMonth = subscriptions?.filter(s => {
          const created = new Date(s.created_at);
          const cancelled = s.cancelled_at ? new Date(s.cancelled_at) : null;
          return created < monthEnd && (!cancelled || cancelled >= monthStart) && s.status !== "cancelled";
        }) || [];

        let monthMrr = 0;
        activeSubsInMonth.forEach(sub => {
          const monthlyPrice = sub.frequency === "monthly" ? Number(sub.price) :
            sub.frequency === "bimonthly" ? Number(sub.price) / 2 :
            sub.frequency === "quarterly" ? Number(sub.price) / 3 : Number(sub.price);
          monthMrr += monthlyPrice;
        });

        growth.push({
          month: monthLabel,
          active: activeInMonth,
          cancelled: cancelledInMonth,
          new: newInMonth,
          mrr: monthMrr,
        });
      }

      setGrowthData(growth);

    } catch (error) {
      logger.error("Error fetching subscription data", error);
      toast.error("Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csvRows = [
      ["Subscription Analytics Report", format(new Date(), "yyyy-MM-dd")],
      [],
      ["Metric", "Value"],
      ["Total Subscriptions", metrics.totalSubscriptions.toString()],
      ["Active Subscriptions", metrics.activeSubscriptions.toString()],
      ["Paused Subscriptions", metrics.pausedSubscriptions.toString()],
      ["Cancelled Subscriptions", metrics.cancelledSubscriptions.toString()],
      ["MRR (£)", metrics.mrr.toFixed(2)],
      ["ARR (£)", metrics.arr.toFixed(2)],
      ["Churn Rate (%)", metrics.churnRate.toFixed(1)],
      ["Avg Lifetime (months)", metrics.avgSubscriptionLifetime.toFixed(1)],
      [],
      ["Product", "Revenue (£)", "Subscribers"],
      ...metrics.revenueByProduct.map(p => [p.productName, p.revenue.toFixed(2), p.count.toString()]),
      [],
      ["Month", "Active", "New", "Cancelled", "MRR (£)"],
      ...growthData.map(g => [g.month, g.active.toString(), g.new.toString(), g.cancelled.toString(), g.mrr.toFixed(2)]),
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscription-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Subscription report exported");
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const statusData = [
    { name: "Active", value: metrics.activeSubscriptions, color: "hsl(142, 76%, 36%)" },
    { name: "Paused", value: metrics.pausedSubscriptions, color: "hsl(48, 96%, 53%)" },
    { name: "Cancelled", value: metrics.cancelledSubscriptions, color: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);

  return (
    <AdminLayout title="Subscription Analytics" subtitle="MRR, churn rate, and subscription metrics">
      <div className="flex items-center justify-end gap-3 mb-6">
        <Select value={monthsBack} onValueChange={setMonthsBack}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportData} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : metrics.totalSubscriptions === 0 ? (
        <Card className="py-16">
          <CardContent className="text-center">
            <Repeat className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-medium text-foreground mb-2">No Subscriptions Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once customers subscribe to products, you'll see detailed analytics here including MRR, churn rate, and subscription trends.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Hero MRR Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Recurring Revenue</p>
                  <p className="text-5xl font-bold text-primary">£{metrics.mrr.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">From {metrics.activeSubscriptions} active subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Annual Run Rate</p>
                  <p className="text-4xl font-semibold text-foreground">£{metrics.arr.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Projected annual revenue</p>
                </div>
                <div className="text-center md:text-right">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                    metrics.churnRate > 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    metrics.churnRate > 5 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {metrics.churnRate > 5 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    <span className="font-medium">{metrics.churnRate.toFixed(1)}% Churn</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">{metrics.totalSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-lg font-semibold">{metrics.activeSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Pause className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paused</p>
                    <p className="text-lg font-semibold">{metrics.pausedSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                    <p className="text-lg font-semibold">{metrics.cancelledSubscriptions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Lifetime</p>
                    <p className="text-lg font-semibold">{metrics.avgSubscriptionLifetime.toFixed(1)} mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <PoundSterling className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ARR</p>
                    <p className="text-lg font-semibold">£{metrics.arr.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* MRR Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">MRR Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'MRR']} />
                      <Area 
                        type="monotone" 
                        dataKey="mrr" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Growth */}
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Subscription Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active" name="Active" stroke="hsl(142, 76%, 36%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="new" name="New" stroke="hsl(200, 98%, 39%)" strokeWidth={2} />
                    <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="hsl(0, 84%, 60%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Product */}
          {metrics.revenueByProduct.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Revenue by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.revenueByProduct} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="productName" type="category" width={150} className="text-xs" />
                      <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AdminLayout>
  );
};

export default SubscriptionAnalytics;

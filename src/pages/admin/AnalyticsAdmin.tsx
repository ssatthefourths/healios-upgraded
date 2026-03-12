import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Eye, ShoppingCart, CreditCard, Heart, TrendingUp, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsSummary {
  views: number;
  addToCarts: number;
  purchases: number;
  wishlistAdds: number;
  conversionRate: number;
}

interface ProductStats {
  product_id: string;
  product_name: string;
  views: number;
  add_to_carts: number;
  purchases: number;
  conversion_rate: number;
}

interface DailyStats {
  date: string;
  views: number;
  add_to_carts: number;
  purchases: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const AnalyticsAdmin = () => {
  const [dateRange, setDateRange] = useState("7");
  const [summary, setSummary] = useState<AnalyticsSummary>({
    views: 0,
    addToCarts: 0,
    purchases: 0,
    wishlistAdds: 0,
    conversionRate: 0,
  });
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAlerts, setRunningAlerts] = useState(false);

  const runPerformanceAlerts = async () => {
    setRunningAlerts(true);
    try {
      const { data, error } = await supabase.functions.invoke("product-performance-alerts");
      if (error) throw error;
      
      if (data?.alerts_count > 0) {
        toast.success(`Found ${data.alerts_count} performance alerts. Email sent to admins.`);
      } else {
        toast.info("No performance alerts at this time.");
      }
    } catch (error) {
      console.error("Error running performance alerts:", error);
      toast.error("Failed to run performance check");
    } finally {
      setRunningAlerts(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = parseInt(dateRange);
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    try {
      // Fetch all analytics events in date range
      const { data: events, error } = await supabase
        .from("product_analytics")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (error) throw error;

      // Fetch products for names
      const { data: products } = await supabase
        .from("products")
        .select("id, name");

      const productMap = new Map(products?.map((p) => [p.id, p.name]) || []);

      // Calculate summary
      const views = events?.filter((e) => e.event_type === "view").length || 0;
      const addToCarts = events?.filter((e) => e.event_type === "add_to_cart").length || 0;
      const purchases = events?.filter((e) => e.event_type === "purchase").length || 0;
      const wishlistAdds = events?.filter((e) => e.event_type === "wishlist_add").length || 0;

      setSummary({
        views,
        addToCarts,
        purchases,
        wishlistAdds,
        conversionRate: views > 0 ? (purchases / views) * 100 : 0,
      });

      // Calculate per-product stats
      const productStatsMap = new Map<string, { views: number; add_to_carts: number; purchases: number }>();
      
      events?.forEach((event) => {
        const stats = productStatsMap.get(event.product_id) || { views: 0, add_to_carts: 0, purchases: 0 };
        if (event.event_type === "view") stats.views++;
        if (event.event_type === "add_to_cart") stats.add_to_carts++;
        if (event.event_type === "purchase") stats.purchases++;
        productStatsMap.set(event.product_id, stats);
      });

      const productStatsArray: ProductStats[] = Array.from(productStatsMap.entries())
        .map(([productId, stats]) => ({
          product_id: productId,
          product_name: productMap.get(productId) || productId,
          views: stats.views,
          add_to_carts: stats.add_to_carts,
          purchases: stats.purchases,
          conversion_rate: stats.views > 0 ? (stats.purchases / stats.views) * 100 : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      setProductStats(productStatsArray);

      // Calculate daily stats
      const dailyStatsMap = new Map<string, { views: number; add_to_carts: number; purchases: number }>();
      
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        dailyStatsMap.set(date, { views: 0, add_to_carts: 0, purchases: 0 });
      }

      events?.forEach((event) => {
        const date = format(new Date(event.created_at), "yyyy-MM-dd");
        const stats = dailyStatsMap.get(date);
        if (stats) {
          if (event.event_type === "view") stats.views++;
          if (event.event_type === "add_to_cart") stats.add_to_carts++;
          if (event.event_type === "purchase") stats.purchases++;
        }
      });

      const dailyStatsArray: DailyStats[] = Array.from(dailyStatsMap.entries()).map(([date, stats]) => ({
        date: format(new Date(date), "MMM d"),
        views: stats.views,
        add_to_carts: stats.add_to_carts,
        purchases: stats.purchases,
      }));

      setDailyStats(dailyStatsArray);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const eventDistribution = [
    { name: "Views", value: summary.views },
    { name: "Add to Cart", value: summary.addToCarts },
    { name: "Purchases", value: summary.purchases },
    { name: "Wishlist", value: summary.wishlistAdds },
  ].filter((d) => d.value > 0);

  return (
    <AdminLayout title="Analytics" subtitle="Track product views, cart additions, and conversions">
      <div className="flex items-center justify-end gap-3 mb-6">
        <Button
          variant="outline"
          onClick={runPerformanceAlerts}
          disabled={runningAlerts}
        >
          <Bell className="h-4 w-4 mr-2" />
          {runningAlerts ? "Running..." : "Run Performance Check"}
        </Button>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Views</p>
                    <p className="text-2xl font-semibold">{summary.views.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Add to Cart</p>
                    <p className="text-2xl font-semibold">{summary.addToCarts.toLocaleString()}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchases</p>
                    <p className="text-2xl font-semibold">{summary.purchases.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Wishlist Adds</p>
                    <p className="text-2xl font-semibold">{summary.wishlistAdds.toLocaleString()}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <p className="text-2xl font-semibold">{summary.conversionRate.toFixed(2)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Trends */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-normal">Daily Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Views" strokeWidth={2} />
                      <Line type="monotone" dataKey="add_to_carts" stroke="#f59e0b" name="Add to Cart" strokeWidth={2} />
                      <Line type="monotone" dataKey="purchases" stroke="#10b981" name="Purchases" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Event Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Event Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {eventDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {eventDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Top Products by Views</CardTitle>
            </CardHeader>
            <CardContent>
              {productStats.length > 0 ? (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="product_name" 
                        type="category" 
                        width={150}
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar dataKey="views" fill="#3b82f6" name="Views" />
                      <Bar dataKey="add_to_carts" fill="#f59e0b" name="Add to Cart" />
                      <Bar dataKey="purchases" fill="#10b981" name="Purchases" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  No product analytics data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Stats Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {productStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Product</th>
                        <th className="text-right py-3 px-4 font-medium">Views</th>
                        <th className="text-right py-3 px-4 font-medium">Add to Cart</th>
                        <th className="text-right py-3 px-4 font-medium">Purchases</th>
                        <th className="text-right py-3 px-4 font-medium">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStats.map((stat) => (
                        <tr key={stat.product_id} className="border-b">
                          <td className="py-3 px-4">{stat.product_name}</td>
                          <td className="py-3 px-4 text-right">{stat.views.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{stat.add_to_carts.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{stat.purchases.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{stat.conversion_rate.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AnalyticsAdmin;

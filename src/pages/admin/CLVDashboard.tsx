import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from "date-fns";
import { 
  TrendingUp, 
  PoundSterling, 
  Users, 
  Download,
  Repeat,
  ShoppingCart,
  Calendar
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface CLVMetrics {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  avgOrderValue: number;
  avgPurchaseFrequency: number;
  avgCustomerLifespan: number;
  overallClv: number;
  projectedAnnualClv: number;
  totalRevenue: number;
}

interface CohortCLV {
  cohort: string;
  customers: number;
  totalRevenue: number;
  clv: number;
  projectedClv: number;
}

interface ProductCLV {
  productName: string;
  productId: string;
  firstPurchaseCustomers: number;
  avgClv: number;
}

interface CLVTrend {
  month: string;
  actualClv: number;
  projectedClv: number;
  customers: number;
}

const CLVDashboard = () => {
  const [monthsBack, setMonthsBack] = useState("12");
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CLVMetrics>({
    totalCustomers: 0,
    repeatCustomers: 0,
    repeatRate: 0,
    avgOrderValue: 0,
    avgPurchaseFrequency: 0,
    avgCustomerLifespan: 0,
    overallClv: 0,
    projectedAnnualClv: 0,
    totalRevenue: 0,
  });
  const [cohortData, setCohortData] = useState<CohortCLV[]>([]);
  const [productClv, setProductClv] = useState<ProductCLV[]>([]);
  const [clvTrend, setClvTrend] = useState<CLVTrend[]>([]);

  useEffect(() => {
    fetchCLVData();
  }, [monthsBack]);

  const fetchCLVData = async () => {
    setLoading(true);
    const months = parseInt(monthsBack);

    try {
      // Fetch orders with items
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, user_id, email, created_at, total")
        .not("user_id", "is", null)
        .order("created_at", { ascending: true });

      if (ordersError) throw ordersError;

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("order_id, product_id, product_name");

      if (itemsError) throw itemsError;

      // Build customer orders map
      const customerOrders = new Map<string, { firstOrder: Date; orders: { date: Date; total: number; orderId: string }[] }>();
      
      orders?.forEach((order) => {
        const customerId = order.user_id!;
        const orderDate = new Date(order.created_at);
        const total = Number(order.total) || 0;
        
        if (!customerOrders.has(customerId)) {
          customerOrders.set(customerId, { firstOrder: orderDate, orders: [] });
        }
        customerOrders.get(customerId)!.orders.push({ date: orderDate, total, orderId: order.id });
      });

      // Calculate overall metrics
      const totalCustomers = customerOrders.size;
      const repeatCustomers = Array.from(customerOrders.values()).filter(c => c.orders.length > 1).length;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
      
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate lifespan and frequency
      let totalLifespanMonths = 0;
      let customersWithMultipleOrders = 0;
      let totalPurchaseFrequency = 0;
      
      customerOrders.forEach((data) => {
        if (data.orders.length > 1) {
          const sortedOrders = data.orders.sort((a, b) => a.date.getTime() - b.date.getTime());
          const firstOrder = sortedOrders[0].date;
          const lastOrder = sortedOrders[sortedOrders.length - 1].date;
          const lifespanMonths = differenceInMonths(lastOrder, firstOrder) || 1;
          totalLifespanMonths += lifespanMonths;
          totalPurchaseFrequency += data.orders.length / Math.max(lifespanMonths, 1);
          customersWithMultipleOrders++;
        }
      });
      
      const avgCustomerLifespan = customersWithMultipleOrders > 0 ? totalLifespanMonths / customersWithMultipleOrders : 1;
      const avgPurchaseFrequency = customersWithMultipleOrders > 0 ? totalPurchaseFrequency / customersWithMultipleOrders : 1;
      
      const overallClv = avgOrderValue * avgPurchaseFrequency * avgCustomerLifespan;
      const projectedAnnualClv = avgOrderValue * avgPurchaseFrequency * 12;

      setMetrics({
        totalCustomers,
        repeatCustomers,
        repeatRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
        avgOrderValue,
        avgPurchaseFrequency,
        avgCustomerLifespan,
        overallClv,
        projectedAnnualClv,
        totalRevenue,
      });

      // Build cohort CLV data
      const now = new Date();
      const cohorts: CohortCLV[] = [];
      const trends: CLVTrend[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const cohortMonth = startOfMonth(subMonths(now, i));
        const cohortEnd = endOfMonth(cohortMonth);
        const cohortLabel = format(cohortMonth, "MMM yy");

        const cohortCustomerIds: string[] = [];
        customerOrders.forEach((data, customerId) => {
          if (data.firstOrder >= cohortMonth && data.firstOrder <= cohortEnd) {
            cohortCustomerIds.push(customerId);
          }
        });

        let cohortTotalRevenue = 0;
        cohortCustomerIds.forEach((customerId) => {
          const customerData = customerOrders.get(customerId)!;
          customerData.orders.forEach((order) => {
            cohortTotalRevenue += order.total;
          });
        });

        const cohortClv = cohortCustomerIds.length > 0 ? cohortTotalRevenue / cohortCustomerIds.length : 0;
        const monthsTracked = months - i;
        const projectedClv = monthsTracked > 0 ? (cohortClv / monthsTracked) * 12 : 0;

        cohorts.push({
          cohort: cohortLabel,
          customers: cohortCustomerIds.length,
          totalRevenue: cohortTotalRevenue,
          clv: cohortClv,
          projectedClv,
        });

        trends.push({
          month: cohortLabel,
          actualClv: cohortClv,
          projectedClv,
          customers: cohortCustomerIds.length,
        });
      }

      setCohortData(cohorts);
      setClvTrend(trends);

      // Calculate CLV by first product purchased
      const firstProductMap = new Map<string, { productName: string; customers: Set<string>; totalClv: number }>();
      
      customerOrders.forEach((data, customerId) => {
        if (data.orders.length === 0) return;
        const sortedOrders = data.orders.sort((a, b) => a.date.getTime() - b.date.getTime());
        const firstOrderId = sortedOrders[0].orderId;
        
        // Find first product in this order
        const firstOrderItems = orderItems?.filter(item => item.order_id === firstOrderId) || [];
        if (firstOrderItems.length === 0) return;
        
        const firstProduct = firstOrderItems[0];
        const customerTotalRevenue = data.orders.reduce((sum, o) => sum + o.total, 0);
        
        if (!firstProductMap.has(firstProduct.product_id)) {
          firstProductMap.set(firstProduct.product_id, {
            productName: firstProduct.product_name,
            customers: new Set(),
            totalClv: 0,
          });
        }
        
        const productData = firstProductMap.get(firstProduct.product_id)!;
        productData.customers.add(customerId);
        productData.totalClv += customerTotalRevenue;
      });

      const productClvArray: ProductCLV[] = [];
      firstProductMap.forEach((data, productId) => {
        productClvArray.push({
          productId,
          productName: data.productName,
          firstPurchaseCustomers: data.customers.size,
          avgClv: data.customers.size > 0 ? data.totalClv / data.customers.size : 0,
        });
      });

      // Sort by avg CLV descending
      productClvArray.sort((a, b) => b.avgClv - a.avgClv);
      setProductClv(productClvArray.slice(0, 10));

    } catch (error) {
      console.error("Error fetching CLV data:", error);
      toast.error("Failed to load CLV data");
    } finally {
      setLoading(false);
    }
  };

  const exportCLVData = () => {
    const csvRows = [
      ["Metric", "Value"],
      ["Total Customers", metrics.totalCustomers.toString()],
      ["Repeat Customers", metrics.repeatCustomers.toString()],
      ["Repeat Rate (%)", metrics.repeatRate.toFixed(1)],
      ["Average Order Value (£)", metrics.avgOrderValue.toFixed(2)],
      ["Purchase Frequency (per month)", metrics.avgPurchaseFrequency.toFixed(2)],
      ["Average Lifespan (months)", metrics.avgCustomerLifespan.toFixed(1)],
      ["Overall CLV (£)", metrics.overallClv.toFixed(2)],
      ["Projected Annual CLV (£)", metrics.projectedAnnualClv.toFixed(2)],
      ["Total Revenue (£)", metrics.totalRevenue.toFixed(2)],
      [],
      ["Cohort", "Customers", "Total Revenue (£)", "Actual CLV (£)", "Projected 12mo CLV (£)"],
      ...cohortData.map(c => [c.cohort, c.customers.toString(), c.totalRevenue.toFixed(2), c.clv.toFixed(2), c.projectedClv.toFixed(2)]),
      [],
      ["First Product", "Customers", "Avg CLV (£)"],
      ...productClv.map(p => [p.productName, p.firstPurchaseCustomers.toString(), p.avgClv.toFixed(2)]),
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clv-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CLV report exported");
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <AdminLayout title="Customer Lifetime Value" subtitle="Comprehensive CLV analysis and projections">
      <div className="flex items-center justify-end gap-3 mb-6">
        <Select value={monthsBack} onValueChange={setMonthsBack}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCLVData} disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero CLV Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="pt-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="text-center md:text-left">
                  <p className="text-sm text-muted-foreground mb-1">Current Customer Lifetime Value</p>
                  <p className="text-5xl font-bold text-primary">£{metrics.overallClv.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Based on actual purchase behaviour</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Projected 12-Month CLV</p>
                  <p className="text-4xl font-semibold text-foreground">£{metrics.projectedAnnualClv.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground mt-2">If current trends continue</p>
                </div>
                <div className="text-center md:text-right">
                  <div className="inline-block bg-background/80 rounded-lg p-4 border">
                    <p className="text-xs text-muted-foreground mb-2">CLV Formula</p>
                    <p className="text-sm font-mono">
                      <span className="text-primary">CLV</span> = AOV × Freq × Lifespan
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      £{metrics.avgOrderValue.toFixed(0)} × {metrics.avgPurchaseFrequency.toFixed(2)} × {metrics.avgCustomerLifespan.toFixed(1)}mo
                    </p>
                  </div>
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
                    <p className="text-xs text-muted-foreground">Total Customers</p>
                    <p className="text-lg font-semibold">{metrics.totalCustomers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Repeat className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Repeat Rate</p>
                    <p className="text-lg font-semibold">{metrics.repeatRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Order Value</p>
                    <p className="text-lg font-semibold">£{metrics.avgOrderValue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Purchase Freq</p>
                    <p className="text-lg font-semibold">{metrics.avgPurchaseFrequency.toFixed(2)}/mo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Calendar className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Lifespan</p>
                    <p className="text-lg font-semibold">{metrics.avgCustomerLifespan.toFixed(1)} mo</p>
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
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                    <p className="text-lg font-semibold">£{metrics.totalRevenue.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* CLV Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">CLV Trend by Cohort</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={clvTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="actualClv" name="Actual CLV" stroke="hsl(var(--primary))" strokeWidth={2} />
                      <Line type="monotone" dataKey="projectedClv" name="Projected CLV" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CLV by First Product */}
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">CLV by First Product Purchased</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {productClv.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productClv} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis dataKey="productName" type="category" width={120} className="text-xs" />
                        <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Avg CLV']} />
                        <Bar dataKey="avgClv" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No product data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cohort Table */}
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">CLV by Acquisition Cohort</CardTitle>
            </CardHeader>
            <CardContent>
              {cohortData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-3 px-4">Cohort</TableHead>
                        <TableHead className="text-right py-3 px-4">Customers</TableHead>
                        <TableHead className="text-right py-3 px-4">Total Revenue</TableHead>
                        <TableHead className="text-right py-3 px-4">Actual CLV</TableHead>
                        <TableHead className="text-right py-3 px-4">Projected CLV</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cohortData.map((cohort) => (
                        <TableRow key={cohort.cohort}>
                          <TableCell className="py-3 px-4">{cohort.cohort}</TableCell>
                          <TableCell className="py-3 px-4 text-right">{cohort.customers}</TableCell>
                          <TableCell className="py-3 px-4 text-right">£{cohort.totalRevenue.toFixed(2)}</TableCell>
                          <TableCell className="py-3 px-4 text-right">£{cohort.clv.toFixed(2)}</TableCell>
                          <TableCell className="py-3 px-4 text-right">£{cohort.projectedClv.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No cohort data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Key Insights</CardTitle>
              <CardDescription>Recommendations based on your CLV data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.repeatRate < 20 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Low Repeat Rate:</strong> Your repeat purchase rate is {metrics.repeatRate.toFixed(1)}%. Consider implementing loyalty programs, subscription options, or targeted re-engagement campaigns to increase customer retention.
                    </p>
                  </div>
                )}
                {metrics.avgCustomerLifespan < 3 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Short Customer Lifespan:</strong> Average customer lifespan is {metrics.avgCustomerLifespan.toFixed(1)} months. Focus on creating longer-term engagement through educational content, product bundles, and personalized recommendations.
                    </p>
                  </div>
                )}
                {productClv.length > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>Top Entry Product:</strong> Customers who first purchase "{productClv[0]?.productName}" have the highest CLV (£{productClv[0]?.avgClv.toFixed(2)}). Consider promoting this product to new customers.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default CLVDashboard;

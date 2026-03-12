import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from "date-fns";
import { Users, Repeat, TrendingUp, PoundSterling, Target } from "lucide-react";

interface CohortData {
  cohort: string;
  customers: number;
  retention: number[];
  revenue: number[];
  avgRevenue: number[];
  clv: number;
  projectedClv: number;
}

interface CustomerMetrics {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  avgOrdersPerCustomer: number;
  totalRevenue: number;
  avgRevenuePerCustomer: number;
  avgOrderValue: number;
  avgPurchaseFrequency: number;
  avgCustomerLifespan: number;
  overallClv: number;
  projectedAnnualClv: number;
}

const CohortAnalysis = () => {
  const [monthsBack, setMonthsBack] = useState("6");
  const [cohortData, setCohortData] = useState<CohortData[]>([]);
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    repeatCustomers: 0,
    repeatRate: 0,
    avgOrdersPerCustomer: 0,
    totalRevenue: 0,
    avgRevenuePerCustomer: 0,
    avgOrderValue: 0,
    avgPurchaseFrequency: 0,
    avgCustomerLifespan: 0,
    overallClv: 0,
    projectedAnnualClv: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCohortData();
  }, [monthsBack]);

  const fetchCohortData = async () => {
    setLoading(true);
    const months = parseInt(monthsBack);

    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, user_id, email, created_at, total")
        .not("user_id", "is", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group orders by customer with revenue data
      const customerOrders = new Map<string, { firstOrder: Date; orders: { date: Date; total: number }[] }>();
      
      orders?.forEach((order) => {
        const customerId = order.user_id!;
        const orderDate = new Date(order.created_at);
        const total = Number(order.total) || 0;
        
        if (!customerOrders.has(customerId)) {
          customerOrders.set(customerId, { firstOrder: orderDate, orders: [] });
        }
        customerOrders.get(customerId)!.orders.push({ date: orderDate, total });
      });

      // Calculate overall metrics
      const totalCustomers = customerOrders.size;
      const repeatCustomers = Array.from(customerOrders.values()).filter(
        (c) => c.orders.length > 1
      ).length;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (Number(o.total) || 0), 0) || 0;
      
      // CLV calculations
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate average customer lifespan
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
        avgOrdersPerCustomer: totalCustomers > 0 ? totalOrders / totalCustomers : 0,
        totalRevenue,
        avgRevenuePerCustomer: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
        avgOrderValue,
        avgPurchaseFrequency,
        avgCustomerLifespan,
        overallClv,
        projectedAnnualClv,
      });

      // Build cohort data
      const now = new Date();
      const cohorts: CohortData[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const cohortMonth = startOfMonth(subMonths(now, i));
        const cohortEnd = endOfMonth(cohortMonth);
        const cohortLabel = format(cohortMonth, "MMM yyyy");

        // Find customers whose first order was in this month
        const cohortCustomers: string[] = [];
        customerOrders.forEach((data, customerId) => {
          if (data.firstOrder >= cohortMonth && data.firstOrder <= cohortEnd) {
            cohortCustomers.push(customerId);
          }
        });

        if (cohortCustomers.length === 0) {
          cohorts.push({
            cohort: cohortLabel,
            customers: 0,
            retention: Array(months - i).fill(0),
            revenue: Array(months - i).fill(0),
            avgRevenue: Array(months - i).fill(0),
            clv: 0,
            projectedClv: 0,
          });
          continue;
        }

        // Calculate retention and revenue for each subsequent month
        const retention: number[] = [100];
        const revenue: number[] = [];
        const avgRevenue: number[] = [];
        
        // Month 0 revenue
        let month0Revenue = 0;
        cohortCustomers.forEach((customerId) => {
          const customerData = customerOrders.get(customerId)!;
          customerData.orders.forEach((order) => {
            if (order.date >= cohortMonth && order.date <= cohortEnd) {
              month0Revenue += order.total;
            }
          });
        });
        revenue.push(month0Revenue);
        avgRevenue.push(month0Revenue / cohortCustomers.length);
        
        for (let m = 1; m <= months - i - 1; m++) {
          const targetMonth = startOfMonth(subMonths(now, i - m));
          const targetEnd = endOfMonth(targetMonth);
          
          let monthRevenue = 0;
          let retainedCount = 0;
          
          cohortCustomers.forEach((customerId) => {
            const customerData = customerOrders.get(customerId)!;
            let customerPurchasedThisMonth = false;
            
            customerData.orders.forEach((order) => {
              if (order.date >= targetMonth && order.date <= targetEnd) {
                monthRevenue += order.total;
                customerPurchasedThisMonth = true;
              }
            });
            
            if (customerPurchasedThisMonth) {
              retainedCount++;
            }
          });

          retention.push((retainedCount / cohortCustomers.length) * 100);
          revenue.push(monthRevenue);
          avgRevenue.push(cohortCustomers.length > 0 ? monthRevenue / cohortCustomers.length : 0);
        }

        // Calculate cohort CLV
        const cohortTotalRevenue = revenue.reduce((sum, r) => sum + r, 0);
        const clv = cohortCustomers.length > 0 ? cohortTotalRevenue / cohortCustomers.length : 0;
        
        const monthsTracked = revenue.length;
        const avgMonthlyRevenuePerCustomer = clv / Math.max(monthsTracked, 1);
        const projectedClv = avgMonthlyRevenuePerCustomer * 12;

        cohorts.push({
          cohort: cohortLabel,
          customers: cohortCustomers.length,
          retention,
          revenue,
          avgRevenue,
          clv,
          projectedClv,
        });
      }

      setCohortData(cohorts);
    } catch (error) {
      console.error("Error fetching cohort data:", error);
      toast.error("Failed to load cohort analysis");
    } finally {
      setLoading(false);
    }
  };

  const getRetentionColor = (value: number): string => {
    if (value >= 50) return "bg-emerald-500 text-white";
    if (value >= 30) return "bg-emerald-400 text-white";
    if (value >= 20) return "bg-emerald-300 text-emerald-900";
    if (value >= 10) return "bg-emerald-200 text-emerald-900";
    if (value > 0) return "bg-emerald-100 text-emerald-900";
    return "bg-muted text-muted-foreground";
  };

  const getRevenueColor = (value: number, maxValue: number): string => {
    if (maxValue === 0) return "bg-muted text-muted-foreground";
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return "bg-blue-500 text-white";
    if (percentage >= 60) return "bg-blue-400 text-white";
    if (percentage >= 40) return "bg-blue-300 text-blue-900";
    if (percentage >= 20) return "bg-blue-200 text-blue-900";
    if (value > 0) return "bg-blue-100 text-blue-900";
    return "bg-muted text-muted-foreground";
  };

  const maxMonths = parseInt(monthsBack);
  const monthHeaders = Array.from({ length: maxMonths }, (_, i) => 
    i === 0 ? "Month 0" : `Month ${i}`
  );
  const maxRevenue = Math.max(...cohortData.flatMap((c) => c.revenue));

  return (
    <AdminLayout title="Cohort Analysis" subtitle="Track customer retention and revenue patterns over time">
      <div className="flex items-center justify-end mb-6">
        <Select value={monthsBack} onValueChange={setMonthsBack}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-semibold">{metrics.totalCustomers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Repeat Rate</p>
                    <p className="text-2xl font-semibold">{metrics.repeatRate.toFixed(1)}%</p>
                  </div>
                  <Repeat className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-semibold">£{metrics.avgOrderValue.toFixed(2)}</p>
                  </div>
                  <PoundSterling className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Customer Lifetime Value</p>
                    <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">£{metrics.overallClv.toFixed(2)}</p>
                  </div>
                  <Target className="h-8 w-8 text-emerald-600 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CLV Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-semibold">£{metrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <PoundSterling className="h-8 w-8 text-emerald-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Orders/Customer</p>
                    <p className="text-2xl font-semibold">{metrics.avgOrdersPerCustomer.toFixed(2)}</p>
                  </div>
                  <Repeat className="h-8 w-8 text-indigo-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Lifespan (months)</p>
                    <p className="text-2xl font-semibold">{metrics.avgCustomerLifespan.toFixed(1)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Projected 12-mo CLV</p>
                    <p className="text-2xl font-semibold">£{metrics.projectedAnnualClv.toFixed(2)}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cohort Tabs */}
          <Tabs defaultValue="clv" className="space-y-4">
            <TabsList>
              <TabsTrigger value="clv">CLV Analysis</TabsTrigger>
              <TabsTrigger value="retention">Customer Retention</TabsTrigger>
              <TabsTrigger value="revenue">Revenue by Cohort</TabsTrigger>
              <TabsTrigger value="avgRevenue">Avg Revenue</TabsTrigger>
            </TabsList>

            <TabsContent value="clv">
              <Card>
                <CardHeader>
                  <CardTitle className="font-normal">CLV by Cohort</CardTitle>
                </CardHeader>
                <CardContent>
                  {cohortData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Cohort</th>
                            <th className="text-right py-3 px-4 font-medium">Customers</th>
                            <th className="text-right py-3 px-4 font-medium">Actual CLV</th>
                            <th className="text-right py-3 px-4 font-medium">Projected 12mo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.map((cohort) => (
                            <tr key={cohort.cohort} className="border-b">
                              <td className="py-3 px-4 font-medium">{cohort.cohort}</td>
                              <td className="py-3 px-4 text-right">{cohort.customers}</td>
                              <td className="py-3 px-4 text-right">£{cohort.clv.toFixed(2)}</td>
                              <td className="py-3 px-4 text-right text-muted-foreground">£{cohort.projectedClv.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No cohort data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retention">
              <Card>
                <CardHeader>
                  <CardTitle className="font-normal">Customer Retention %</CardTitle>
                </CardHeader>
                <CardContent>
                  {cohortData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Cohort</th>
                            <th className="text-right py-2 px-3 font-medium">Users</th>
                            {monthHeaders.map((header, i) => (
                              <th key={i} className="text-center py-2 px-3 font-medium">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.map((cohort) => (
                            <tr key={cohort.cohort} className="border-b">
                              <td className="py-2 px-3 font-medium">{cohort.cohort}</td>
                              <td className="py-2 px-3 text-right">{cohort.customers}</td>
                              {monthHeaders.map((_, i) => (
                                <td key={i} className="py-2 px-3 text-center">
                                  {i < cohort.retention.length ? (
                                    <span className={`inline-block px-2 py-1 rounded text-xs ${getRetentionColor(cohort.retention[i])}`}>
                                      {cohort.retention[i].toFixed(0)}%
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No cohort data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle className="font-normal">Revenue by Cohort (£)</CardTitle>
                </CardHeader>
                <CardContent>
                  {cohortData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Cohort</th>
                            <th className="text-right py-2 px-3 font-medium">Users</th>
                            {monthHeaders.map((header, i) => (
                              <th key={i} className="text-center py-2 px-3 font-medium">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.map((cohort) => (
                            <tr key={cohort.cohort} className="border-b">
                              <td className="py-2 px-3 font-medium">{cohort.cohort}</td>
                              <td className="py-2 px-3 text-right">{cohort.customers}</td>
                              {monthHeaders.map((_, i) => (
                                <td key={i} className="py-2 px-3 text-center">
                                  {i < cohort.revenue.length ? (
                                    <span className={`inline-block px-2 py-1 rounded text-xs ${getRevenueColor(cohort.revenue[i], maxRevenue)}`}>
                                      £{cohort.revenue[i].toFixed(0)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No cohort data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="avgRevenue">
              <Card>
                <CardHeader>
                  <CardTitle className="font-normal">Average Revenue per Customer (£)</CardTitle>
                </CardHeader>
                <CardContent>
                  {cohortData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium">Cohort</th>
                            <th className="text-right py-2 px-3 font-medium">Users</th>
                            {monthHeaders.map((header, i) => (
                              <th key={i} className="text-center py-2 px-3 font-medium">{header}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.map((cohort) => (
                            <tr key={cohort.cohort} className="border-b">
                              <td className="py-2 px-3 font-medium">{cohort.cohort}</td>
                              <td className="py-2 px-3 text-right">{cohort.customers}</td>
                              {monthHeaders.map((_, i) => (
                                <td key={i} className="py-2 px-3 text-center">
                                  {i < cohort.avgRevenue.length ? (
                                    <span className="text-foreground">
                                      £{cohort.avgRevenue[i].toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      No cohort data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Interpretation Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="font-normal">Understanding the Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p><strong>Cohort:</strong> Customers grouped by the month they made their first purchase.</p>
              <p><strong>Retention:</strong> Percentage of customers who made a purchase in each subsequent month.</p>
              <p><strong>CLV:</strong> Customer Lifetime Value = Average Order Value × Purchase Frequency × Customer Lifespan</p>
              <div className="flex gap-4 flex-wrap pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-500"></div>
                  <span>High retention (≥50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-emerald-200"></div>
                  <span>Low retention (&lt;20%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500"></div>
                  <span>High revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100"></div>
                  <span>Low revenue</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default CohortAnalysis;

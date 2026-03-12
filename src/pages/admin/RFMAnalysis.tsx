import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { differenceInDays, subMonths } from "date-fns";
import { Users, Crown, Star, AlertTriangle, Clock, PoundSterling, Target, TrendingUp, Mail } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

interface CustomerRFM {
  userId: string;
  email: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: number;
  segment: string;
}

interface SegmentData {
  name: string;
  count: number;
  percentage: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  totalRevenue: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  "Champions": "hsl(142, 76%, 36%)",
  "Loyal Customers": "hsl(142, 69%, 58%)",
  "Potential Loyalists": "hsl(200, 98%, 39%)",
  "Recent Customers": "hsl(200, 74%, 60%)",
  "Promising": "hsl(280, 67%, 55%)",
  "Need Attention": "hsl(45, 93%, 47%)",
  "About to Sleep": "hsl(30, 100%, 50%)",
  "At Risk": "hsl(15, 100%, 55%)",
  "Can't Lose Them": "hsl(0, 84%, 60%)",
  "Hibernating": "hsl(0, 0%, 60%)",
  "Lost": "hsl(0, 0%, 40%)",
};

const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  "Champions": "Best customers - bought recently, buy often, spend the most",
  "Loyal Customers": "Buy regularly with good spend - great retention targets",
  "Potential Loyalists": "Recent customers with average frequency - nurture them",
  "Recent Customers": "New customers who made a purchase recently",
  "Promising": "Recent shoppers but haven't spent much yet",
  "Need Attention": "Above average customers who haven't purchased lately",
  "About to Sleep": "Below average recency and frequency - need re-engagement",
  "At Risk": "Spent big money but haven't returned - win them back",
  "Can't Lose Them": "Used to be loyal but slipping away - urgent action needed",
  "Hibernating": "Low recency, frequency and monetary - may be lost",
  "Lost": "Haven't purchased in a very long time",
};

const getSegment = (r: number, f: number, m: number): string => {
  // Champions: High R, High F, High M
  if (r >= 4 && f >= 4 && m >= 4) return "Champions";
  // Loyal Customers: High F, High M
  if (f >= 4 && m >= 3) return "Loyal Customers";
  // Potential Loyalists: High R, Medium F
  if (r >= 4 && f >= 2 && f <= 4) return "Potential Loyalists";
  // Recent Customers: High R, Low F
  if (r >= 4 && f <= 2) return "Recent Customers";
  // Promising: Medium R, Low F, Low M
  if (r >= 3 && f <= 2 && m <= 2) return "Promising";
  // Need Attention: Medium R, Medium F, Medium M
  if (r >= 2 && r <= 3 && f >= 2 && f <= 3 && m >= 2 && m <= 3) return "Need Attention";
  // About to Sleep: Low R, Low F
  if (r <= 2 && f <= 2) return "About to Sleep";
  // At Risk: Low R, High F, High M
  if (r <= 2 && f >= 3 && m >= 3) return "At Risk";
  // Can't Lose Them: Low R, High F or High M
  if (r <= 2 && (f >= 4 || m >= 4)) return "Can't Lose Them";
  // Hibernating: Very low R, Low F
  if (r <= 2 && f <= 2) return "Hibernating";
  // Lost: Lowest scores
  if (r === 1 && f === 1) return "Lost";
  
  return "Need Attention";
};

const calculateScore = (value: number, thresholds: number[]): number => {
  if (value <= thresholds[0]) return 1;
  if (value <= thresholds[1]) return 2;
  if (value <= thresholds[2]) return 3;
  if (value <= thresholds[3]) return 4;
  return 5;
};

const RFMAnalysis = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("12");
  const [customers, setCustomers] = useState<CustomerRFM[]>([]);
  const [segments, setSegments] = useState<SegmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFMData();
  }, [timeRange]);

  const fetchRFMData = async () => {
    setLoading(true);
    const months = parseInt(timeRange);
    const startDate = subMonths(new Date(), months);

    try {
      // Fetch all orders with user info
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("id, user_id, email, total, created_at, status")
        .gte("created_at", startDate.toISOString())
        .in("status", ["delivered", "shipped", "processing"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!ordersData || ordersData.length === 0) {
        setCustomers([]);
        setSegments([]);
        setLoading(false);
        return;
      }

      // Group orders by customer (email)
      const customerOrders: Record<string, { orders: typeof ordersData, userId: string | null }> = {};
      
      ordersData.forEach(order => {
        const key = order.email;
        if (!customerOrders[key]) {
          customerOrders[key] = { orders: [], userId: order.user_id };
        }
        customerOrders[key].orders.push(order);
      });

      // Calculate RFM values for each customer
      const now = new Date();
      const customerRFMs: CustomerRFM[] = [];
      
      Object.entries(customerOrders).forEach(([email, { orders, userId }]) => {
        const mostRecentOrder = new Date(orders[0].created_at);
        const recencyDays = differenceInDays(now, mostRecentOrder);
        const frequency = orders.length;
        const monetary = orders.reduce((sum, o) => sum + Number(o.total), 0);
        
        customerRFMs.push({
          userId: userId || email,
          email,
          recencyDays,
          frequency,
          monetary,
          rScore: 0,
          fScore: 0,
          mScore: 0,
          rfmScore: 0,
          segment: "",
        });
      });

      // Calculate percentile-based thresholds
      const recencyValues = customerRFMs.map(c => c.recencyDays).sort((a, b) => a - b);
      const frequencyValues = customerRFMs.map(c => c.frequency).sort((a, b) => a - b);
      const monetaryValues = customerRFMs.map(c => c.monetary).sort((a, b) => a - b);

      const getPercentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p)] || arr[0];

      // For Recency, lower is better (reverse scoring)
      const rThresholds = [
        getPercentile(recencyValues, 0.8),
        getPercentile(recencyValues, 0.6),
        getPercentile(recencyValues, 0.4),
        getPercentile(recencyValues, 0.2),
      ];

      const fThresholds = [
        getPercentile(frequencyValues, 0.2),
        getPercentile(frequencyValues, 0.4),
        getPercentile(frequencyValues, 0.6),
        getPercentile(frequencyValues, 0.8),
      ];

      const mThresholds = [
        getPercentile(monetaryValues, 0.2),
        getPercentile(monetaryValues, 0.4),
        getPercentile(monetaryValues, 0.6),
        getPercentile(monetaryValues, 0.8),
      ];

      // Score each customer
      customerRFMs.forEach(customer => {
        // Recency: lower days = higher score (reverse the thresholds)
        customer.rScore = 6 - calculateScore(customer.recencyDays, rThresholds);
        customer.fScore = calculateScore(customer.frequency, fThresholds);
        customer.mScore = calculateScore(customer.monetary, mThresholds);
        customer.rfmScore = customer.rScore * 100 + customer.fScore * 10 + customer.mScore;
        customer.segment = getSegment(customer.rScore, customer.fScore, customer.mScore);
      });

      // Sort by RFM score descending
      customerRFMs.sort((a, b) => b.rfmScore - a.rfmScore);
      setCustomers(customerRFMs);

      // Calculate segment aggregates
      const segmentMap: Record<string, CustomerRFM[]> = {};
      customerRFMs.forEach(c => {
        if (!segmentMap[c.segment]) segmentMap[c.segment] = [];
        segmentMap[c.segment].push(c);
      });

      const totalCustomers = customerRFMs.length;
      const segmentData: SegmentData[] = Object.entries(segmentMap).map(([name, customers]) => ({
        name,
        count: customers.length,
        percentage: (customers.length / totalCustomers) * 100,
        avgRecency: customers.reduce((sum, c) => sum + c.recencyDays, 0) / customers.length,
        avgFrequency: customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length,
        avgMonetary: customers.reduce((sum, c) => sum + c.monetary, 0) / customers.length,
        totalRevenue: customers.reduce((sum, c) => sum + c.monetary, 0),
        color: SEGMENT_COLORS[name] || "hsl(0, 0%, 50%)",
        icon: getSegmentIcon(name),
        description: SEGMENT_DESCRIPTIONS[name] || "",
      }));

      // Sort by count descending
      segmentData.sort((a, b) => b.count - a.count);
      setSegments(segmentData);

    } catch (error) {
      console.error("Error fetching RFM data:", error);
      toast.error("Failed to load RFM analysis data");
    } finally {
      setLoading(false);
    }
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case "Champions": return <Crown className="h-4 w-4" />;
      case "Loyal Customers": return <Star className="h-4 w-4" />;
      case "At Risk":
      case "Can't Lose Them": return <AlertTriangle className="h-4 w-4" />;
      case "Hibernating":
      case "Lost": return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getSegmentBadgeVariant = (segment: string): "default" | "secondary" | "destructive" | "outline" => {
    if (["Champions", "Loyal Customers"].includes(segment)) return "default";
    if (["At Risk", "Can't Lose Them", "Lost"].includes(segment)) return "destructive";
    if (["Hibernating", "About to Sleep"].includes(segment)) return "outline";
    return "secondary";
  };

  const totalRevenue = customers.reduce((sum, c) => sum + c.monetary, 0);
  const avgRecency = customers.length > 0 
    ? customers.reduce((sum, c) => sum + c.recencyDays, 0) / customers.length 
    : 0;
  const avgFrequency = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length
    : 0;
  const avgMonetary = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.monetary, 0) / customers.length
    : 0;

  const championsCount = segments.find(s => s.name === "Champions")?.count || 0;
  const atRiskCount = segments.filter(s => ["At Risk", "Can't Lose Them", "About to Sleep"].includes(s.name))
    .reduce((sum, s) => sum + s.count, 0);

  return (
    <AdminLayout title="RFM Customer Segmentation" subtitle="Analyse customers by Recency, Frequency, and Monetary value">
      <div className="flex items-center justify-end mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Calculating RFM scores...</div>
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No customer data available for the selected period.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {championsCount} Champions ({((championsCount / customers.length) * 100).toFixed(1)}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  £{avgMonetary.toFixed(2)} avg per customer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Recency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgRecency.toFixed(0)} days</div>
                <p className="text-xs text-muted-foreground">
                  Since last purchase
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">At Risk Customers</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{atRiskCount}</div>
                <p className="text-xs text-muted-foreground">
                  Need re-engagement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Segment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Segment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segments}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [`${value} customers`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segments} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [`£${value.toFixed(2)}`, 'Revenue']} />
                      <Bar dataKey="totalRevenue" radius={[0, 4, 4, 0]}>
                        {segments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segment Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Segment Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((segment) => (
                  <div 
                    key={segment.name}
                    className="p-4 border rounded-lg"
                    style={{ borderLeftColor: segment.color, borderLeftWidth: 4 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {segment.icon}
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <Badge variant={getSegmentBadgeVariant(segment.name)}>
                        {segment.count}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{segment.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Avg Recency</p>
                        <p className="font-medium">{segment.avgRecency.toFixed(0)} days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Freq</p>
                        <p className="font-medium">{segment.avgFrequency.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Spend</p>
                        <p className="font-medium">£{segment.avgMonetary.toFixed(0)}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => navigate(`/admin/newsletter?segment=${encodeURIComponent(segment.name)}`)}
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      Send Campaign
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by RFM Score</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Recency</TableHead>
                    <TableHead className="text-right">Frequency</TableHead>
                    <TableHead className="text-right">Monetary</TableHead>
                    <TableHead className="text-center">RFM Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.slice(0, 20).map((customer) => (
                    <TableRow key={customer.userId}>
                      <TableCell className="font-medium">{customer.email}</TableCell>
                      <TableCell>
                        <Badge variant={getSegmentBadgeVariant(customer.segment)}>
                          {customer.segment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{customer.recencyDays} days</TableCell>
                      <TableCell className="text-right">{customer.frequency}</TableCell>
                      <TableCell className="text-right">£{customer.monetary.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-sm">
                          {customer.rScore}{customer.fScore}{customer.mScore}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
};

export default RFMAnalysis;

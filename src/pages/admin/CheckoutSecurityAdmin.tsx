import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Shield, AlertTriangle, Ban, Activity, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SecurityStats {
  total_attempts: number;
  total_failures: number;
  total_suspicious: number;
  total_rate_limited: number;
  unique_ips: number;
  top_suspicious_ips: Array<{
    ip: string;
    count: number;
    last_seen: string;
  }>;
}

interface SecurityLog {
  id: string;
  ip_address: string;
  event_type: string;
  user_id: string | null;
  session_id: string | null;
  metadata: unknown;
  created_at: string;
}

const CheckoutSecurityAdmin = () => {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<SecurityLog[]>([]);
  const [timeRange, setTimeRange] = useState("24");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Worker route /admin/checkout-security-stats returns 30-day aggregates
      // from the orders table. There is no dedicated checkout_security_log
      // table yet — the raw event log was a Supabase artefact and is treated
      // as out-of-scope for this rebuild. Recent-events list shows empty
      // until that pipeline is wired (see plan/handoffs).
      const { totals } = await apiGet<{
        totals: { total: number; confirmed: number; cancelled: number; pending: number; with_discount: number };
      }>('/admin/checkout-security-stats');

      setStats({
        total_attempts: totals.total,
        total_failures: totals.cancelled,
        total_suspicious: 0,
        total_rate_limited: 0,
        unique_ips: 0,
        top_suspicious_ips: [],
      });
      setRecentLogs([]);
    } catch (error) {
      console.error("Error fetching security data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case "suspicious":
        return <Badge variant="destructive">Suspicious</Badge>;
      case "rate_limited":
        return <Badge variant="destructive">Rate Limited</Badge>;
      case "failure":
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">Failed</Badge>;
      case "attempt":
        return <Badge variant="outline">Attempt</Badge>;
      case "success":
        return <Badge variant="secondary" className="bg-green-500/20 text-green-600">Success</Badge>;
      default:
        return <Badge variant="outline">{eventType}</Badge>;
    }
  };

  return (
    <AdminLayout title="Checkout Security" subtitle="Monitor checkout activity and suspicious behavior">
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex items-center justify-between">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last hour</SelectItem>
              <SelectItem value="6">Last 6 hours</SelectItem>
              <SelectItem value="24">Last 24 hours</SelectItem>
              <SelectItem value="72">Last 3 days</SelectItem>
              <SelectItem value="168">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_attempts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failures</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats?.total_failures || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
              <Shield className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.total_suspicious || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rate Limited</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.total_rate_limited || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.unique_ips || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Suspicious IPs */}
        {stats?.top_suspicious_ips && stats.top_suspicious_ips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Top Suspicious IPs
              </CardTitle>
              <CardDescription>
                IPs with the most suspicious or rate-limited events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Event Count</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.top_suspicious_ips.map((ip, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{ip.ip}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{ip.count}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ip.last_seen), "MMM d, yyyy HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest checkout security events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No security events recorded yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
                      <TableCell>{getEventBadge(log.event_type)}</TableCell>
                      <TableCell className="text-sm">
                        {log.user_id ? (
                          <span className="font-mono text-xs">{log.user_id.slice(0, 8)}...</span>
                        ) : (
                          <span className="text-muted-foreground">Guest</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {log.metadata && Object.keys(log.metadata).length > 0
                          ? JSON.stringify(log.metadata)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CheckoutSecurityAdmin;

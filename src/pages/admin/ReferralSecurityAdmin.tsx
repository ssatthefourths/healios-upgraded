import { useState, useEffect } from "react";
import { format } from "date-fns";
import { RefreshCw, UserX, AlertTriangle, Users, Clock, CheckCircle, Ban, Plus, Trash2, Globe, MapPin, Search, Download } from "lucide-react";
import { apiGet } from "@/lib/api";
import { logger } from "@/lib/logger";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SecurityStats {
  total_entries: number;
  high_attempt_entries: number;
  unique_identifiers: number;
  pending_referrals: number;
  converted_referrals: number;
  blocked_identifiers: number;
  top_rate_limited: Array<{
    identifier: string;
    attempt_count: number;
    window_start: string;
  }>;
}

interface RateLimitEntry {
  id: string;
  identifier: string;
  attempt_count: number;
  window_start: string;
  created_at: string;
}

interface Referral {
  id: string;
  referral_code: string;
  referred_email: string | null;
  status: string;
  created_at: string;
  converted_at: string | null;
}

interface GeoInfo {
  country: string | null;
  region: string | null;
  city: string | null;
  country_code: string | null;
}

interface BlockedIdentifier {
  id: string;
  identifier: string;
  reason: string | null;
  blocked_at: string;
  country: string | null;
  region: string | null;
  city: string | null;
  country_code: string | null;
}

// Check if string is a valid IP address
const isIPAddress = (str: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(str) || ipv6Regex.test(str);
};

// Lookup geolocation for an IP address using free ip-api.com
const lookupGeoLocation = async (ip: string): Promise<GeoInfo | null> => {
  if (!isIPAddress(ip)) return null;
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,countryCode`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.status === 'fail') return null;
    
    return {
      country: data.country || null,
      region: data.regionName || null,
      city: data.city || null,
      country_code: data.countryCode || null,
    };
  } catch (error) {
    logger.error('Geolocation lookup failed', error);
    return null;
  }
};

const ReferralSecurityAdmin = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [blocklist, setBlocklist] = useState<BlockedIdentifier[]>([]);
  const [timeRange, setTimeRange] = useState("24");
  const [isLoading, setIsLoading] = useState(true);
  
  // Add to blocklist dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIdentifier, setNewIdentifier] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [lookingUpGeoId, setLookingUpGeoId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Worker /admin/referral-security-stats returns 30-day aggregates from
      // the referrals table. Rate-limit and blocklist tables are intentionally
      // not migrated (they were Supabase-only artefacts); this view shows
      // the metrics we DO track and zeros for the rest until a real
      // observability pipeline is wired.
      const { totals, selfReferralAttempts } = await apiGet<{
        totals: { total: number; pending: number; converted: number; rewarded: number };
        selfReferralAttempts: number;
      }>('/admin/referral-security-stats');

      setStats({
        total_entries: totals.total,
        high_attempt_entries: selfReferralAttempts,
        unique_identifiers: 0,
        pending_referrals: totals.pending,
        converted_referrals: totals.converted,
        blocked_identifiers: 0,
        top_rate_limited: [],
      });

      // Real referral list — we do have this. Other admin tabs (rate-limits,
      // blocklist) intentionally render empty until a logger is wired.
      const { data: referralRows } = await apiGet<{ data: Array<Referral & { referrer_id: string }> }>('/referrals');
      setReferrals((referralRows || []) as Referral[]);
      setRateLimits([]);
      setBlocklist([]);

    } catch (error) {
      logger.error('Error fetching referral security data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const handleAddToBlocklist = async () => {
    if (!newIdentifier.trim()) {
      toast.error("Please enter an identifier");
      return;
    }

    // Blocklist features (add/quick-block/unblock/geo-lookup) depend on a
    // referral_blocklist table that was Supabase-specific and has not been
    // ported to D1. Until that pipeline is rebuilt, these handlers tell the
    // admin politely instead of throwing — see plan/handoffs.
    toast.error("Blocklist is not yet available — pending observability rebuild.");
    setIsAdding(false);
  };

  const handleQuickBlock = async (_identifier: string) => {
    toast.error("Blocklist is not yet available — pending observability rebuild.");
  };

  const handleUnblock = async (_id: string) => {
    toast.error("Blocklist is not yet available — pending observability rebuild.");
  };

  const handleLookupGeo = async (entry: BlockedIdentifier) => {
    if (!isIPAddress(entry.identifier)) {
      toast.error("Can only lookup geolocation for IP addresses");
      return;
    }
    setLookingUpGeoId(entry.id);
    try {
      const geo = await lookupGeoLocation(entry.identifier);
      if (!geo) {
        toast.error("Could not fetch geolocation data");
        return;
      }
      toast.success(`Location: ${geo.city || geo.region || geo.country} (saving disabled — blocklist pending)`);
    } catch (error) {
      logger.error('Error looking up geolocation', error);
      toast.error('Geolocation lookup failed');
    } finally {
      setLookingUpGeoId(null);
    }
  };

  const isBlocked = (identifier: string) => {
    return blocklist.some(b => b.identifier === identifier);
  };

  // CSV Export helpers
  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportBlocklistCSV = () => {
    if (blocklist.length === 0) {
      toast.error("No blocklist data to export");
      return;
    }
    const headers = ['Identifier', 'Reason', 'Blocked At', 'Country', 'Region', 'City', 'Country Code'];
    const rows = blocklist.map(entry => [
      entry.identifier,
      entry.reason || '',
      entry.blocked_at,
      entry.country || '',
      entry.region || '',
      entry.city || '',
      entry.country_code || ''
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCSV(csv, `blocklist-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success("Blocklist exported");
  };

  const exportRateLimitsCSV = () => {
    if (rateLimits.length === 0) {
      toast.error("No rate limit data to export");
      return;
    }
    const headers = ['Identifier', 'Attempt Count', 'Window Start', 'Created At', 'Is Blocked'];
    const rows = rateLimits.map(entry => [
      entry.identifier,
      entry.attempt_count,
      entry.window_start,
      entry.created_at,
      isBlocked(entry.identifier) ? 'Yes' : 'No'
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    downloadCSV(csv, `rate-limits-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success("Rate limits exported");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Converted</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAttemptBadge = (count: number) => {
    if (count > 10) {
      return <Badge variant="destructive">{count} attempts</Badge>;
    } else if (count > 5) {
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">{count} attempts</Badge>;
    }
    return <Badge variant="secondary">{count} attempts</Badge>;
  };

  return (
    <AdminLayout title="Referral Security" subtitle="Monitor referral abuse attempts and rate limit violations">
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

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportBlocklistCSV} disabled={blocklist.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Blocklist
            </Button>
            <Button variant="outline" onClick={exportRateLimitsCSV} disabled={rateLimits.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export Rate Limits
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Blocklist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Blocklist</DialogTitle>
                  <DialogDescription>
                    Block an identifier (IP address or email prefix) from creating referrals.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier">Identifier</Label>
                    <Input
                      id="identifier"
                      placeholder="e.g., 192.168.1.1 or ab***"
                      value={newIdentifier}
                      onChange={(e) => setNewIdentifier(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for blocking..."
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddToBlocklist} disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add to Blocklist"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={fetchData} disabled={isLoading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.total_entries || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Attempts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-amber-600">{stats?.high_attempt_entries || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">&gt;5 attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique IDs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.unique_identifiers || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <Ban className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-destructive">{stats?.blocked_identifiers || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.pending_referrals || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{stats?.converted_referrals || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Blocklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Blocked Identifiers
            </CardTitle>
            <CardDescription>Permanently blocked from creating referrals</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : blocklist.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No blocked identifiers</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Blocked At</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blocklist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.identifier}</TableCell>
                      <TableCell>
                        {entry.country ? (
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">
                              {entry.city && `${entry.city}, `}
                              {entry.region && `${entry.region}, `}
                              {entry.country}
                              {entry.country_code && (
                                <span className="ml-1 text-xs text-muted-foreground">({entry.country_code})</span>
                              )}
                            </span>
                          </div>
                        ) : isIPAddress(entry.identifier) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLookupGeo(entry)}
                            disabled={lookingUpGeoId === entry.id}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {lookingUpGeoId === entry.id ? (
                              <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <Search className="h-3.5 w-3.5 mr-1" />
                            )}
                            Lookup
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{entry.reason || "—"}</TableCell>
                      <TableCell>{format(new Date(entry.blocked_at), 'MMM d, yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblock(entry.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Rate Limited */}
        {stats?.top_rate_limited && stats.top_rate_limited.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Rate Limited Identifiers</CardTitle>
              <CardDescription>Identifiers with the highest attempt counts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Window Start</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.top_rate_limited.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{entry.identifier}</TableCell>
                      <TableCell>{getAttemptBadge(entry.attempt_count)}</TableCell>
                      <TableCell>{format(new Date(entry.window_start), 'MMM d, HH:mm')}</TableCell>
                      <TableCell>
                        {isBlocked(entry.identifier) ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickBlock(entry.identifier)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Block
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Recent Rate Limit Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Rate Limit Activity</CardTitle>
            <CardDescription>All rate limit entries in the selected time range</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : rateLimits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No rate limit entries found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Window Start</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateLimits.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.created_at), 'MMM d, HH:mm:ss')}</TableCell>
                      <TableCell className="font-mono text-sm">{entry.identifier}</TableCell>
                      <TableCell>{getAttemptBadge(entry.attempt_count)}</TableCell>
                      <TableCell>{format(new Date(entry.window_start), 'MMM d, HH:mm')}</TableCell>
                      <TableCell>
                        {isBlocked(entry.identifier) ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickBlock(entry.identifier)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Referral Activity</CardTitle>
            <CardDescription>Referrals created in the selected time range</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : referrals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No referrals found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Email (masked)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Converted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{format(new Date(referral.created_at), 'MMM d, HH:mm')}</TableCell>
                      <TableCell className="font-mono text-sm">{referral.referral_code}</TableCell>
                      <TableCell className="font-mono text-sm">{referral.referred_email || '—'}</TableCell>
                      <TableCell>{getStatusBadge(referral.status)}</TableCell>
                      <TableCell>
                        {referral.converted_at 
                          ? format(new Date(referral.converted_at), 'MMM d, HH:mm')
                          : '—'
                        }
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

export default ReferralSecurityAdmin;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  MousePointer,
  Eye,
  ShoppingCart,
  TrendingUp,
  Users,
  Calendar,
  ArrowLeft,
  UserMinus,
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Campaign {
  id: string;
  subject: string;
  sent_at: string;
  recipients_count: number;
  target_segments: string[];
  targeting_mode: string;
  status: string;
}

interface CampaignEvent {
  id: string;
  campaign_id: string;
  event_type: string;
  recipient_email: string;
  segment: string | null;
  created_at: string;
}

interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
}

interface SegmentStats {
  segment: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
}

const CHART_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(200, 98%, 39%)",
  "hsl(280, 67%, 55%)",
  "hsl(45, 93%, 47%)",
  "hsl(15, 100%, 55%)",
  "hsl(0, 84%, 60%)",
];

const CampaignAnalytics = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [events, setEvents] = useState<CampaignEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setCampaigns((data as Campaign[]) || []);
      
      if (data && data.length > 0) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampaignId) {
      fetchCampaignEvents(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const fetchCampaignEvents = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from("email_campaign_events")
        .select("*")
        .eq("campaign_id", campaignId);

      if (error) throw error;
      setEvents((data as CampaignEvent[]) || []);
    } catch (error) {
      console.error("Error fetching campaign events:", error);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const calculateStats = (): CampaignStats => {
    const sent = events.filter(e => e.event_type === "sent").length;
    const opened = new Set(events.filter(e => e.event_type === "opened").map(e => e.recipient_email)).size;
    const clicked = new Set(events.filter(e => e.event_type === "clicked").map(e => e.recipient_email)).size;
    const converted = new Set(events.filter(e => e.event_type === "converted").map(e => e.recipient_email)).size;
    const unsubscribed = new Set(events.filter(e => e.event_type === "unsubscribed").map(e => e.recipient_email)).size;
    const totalSent = sent || selectedCampaign?.recipients_count || 0;

    return {
      sent: totalSent,
      opened,
      clicked,
      converted,
      unsubscribed,
      openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      conversionRate: clicked > 0 ? (converted / clicked) * 100 : 0,
      unsubscribeRate: totalSent > 0 ? (unsubscribed / totalSent) * 100 : 0,
    };
  };

  const calculateSegmentStats = (): SegmentStats[] => {
    const segmentMap: Record<string, { sent: number; opened: Set<string>; clicked: Set<string>; converted: Set<string>; unsubscribed: Set<string> }> = {};

    events.forEach(event => {
      const segment = event.segment || "All Subscribers";
      if (!segmentMap[segment]) {
        segmentMap[segment] = { sent: 0, opened: new Set(), clicked: new Set(), converted: new Set(), unsubscribed: new Set() };
      }

      if (event.event_type === "sent") {
        segmentMap[segment].sent++;
      } else if (event.event_type === "opened") {
        segmentMap[segment].opened.add(event.recipient_email);
      } else if (event.event_type === "clicked") {
        segmentMap[segment].clicked.add(event.recipient_email);
      } else if (event.event_type === "converted") {
        segmentMap[segment].converted.add(event.recipient_email);
      } else if (event.event_type === "unsubscribed") {
        segmentMap[segment].unsubscribed.add(event.recipient_email);
      }
    });

    return Object.entries(segmentMap).map(([segment, data]) => ({
      segment,
      sent: data.sent,
      opened: data.opened.size,
      clicked: data.clicked.size,
      converted: data.converted.size,
      unsubscribed: data.unsubscribed.size,
      openRate: data.sent > 0 ? (data.opened.size / data.sent) * 100 : 0,
      clickRate: data.opened.size > 0 ? (data.clicked.size / data.opened.size) * 100 : 0,
      unsubscribeRate: data.sent > 0 ? (data.unsubscribed.size / data.sent) * 100 : 0,
    }));
  };

  const stats = calculateStats();
  const segmentStats = calculateSegmentStats();

  const funnelData = [
    { name: "Sent", value: stats.sent, fill: "hsl(var(--primary))" },
    { name: "Opened", value: stats.opened, fill: "hsl(142, 76%, 36%)" },
    { name: "Clicked", value: stats.clicked, fill: "hsl(200, 98%, 39%)" },
    { name: "Converted", value: stats.converted, fill: "hsl(280, 67%, 55%)" },
  ];

  const pieData = segmentStats.map((s, i) => ({
    name: s.segment,
    value: s.sent,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <AdminLayout title="Campaign Analytics" subtitle="Track email campaign performance">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/newsletter")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Newsletter
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Campaigns Yet</h3>
            <p className="text-muted-foreground mb-4">
              Send your first newsletter campaign to start tracking analytics.
            </p>
            <Button onClick={() => navigate("/admin/newsletter")}>
              Go to Newsletter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Campaign Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Campaign
            </label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a campaign..." />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{campaign.subject}</span>
                      <span className="text-muted-foreground text-xs">
                        ({format(new Date(campaign.sent_at), "MMM d, yyyy")})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCampaign && (
            <>
              {/* Campaign Info */}
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedCampaign.subject}</CardTitle>
                    <Badge variant="secondary">
                      {selectedCampaign.targeting_mode === "segments" 
                        ? selectedCampaign.target_segments?.join(", ") 
                        : "All Subscribers"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sent on {format(new Date(selectedCampaign.sent_at), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </CardHeader>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{stats.sent}</p>
                        <p className="text-sm text-muted-foreground">Emails Sent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Eye className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{stats.openRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Open Rate ({stats.opened})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <MousePointer className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{stats.clickRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Click Rate ({stats.clicked})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{stats.conversionRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Conversion ({stats.converted})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <UserMinus className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">{stats.unsubscribeRate.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Unsubscribed ({stats.unsubscribed})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Funnel Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Campaign Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {funnelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Segment Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Segment Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              labelLine={false}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          No segment data available
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segment Performance Table */}
              {segmentStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Performance by Segment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium">Segment</th>
                            <th className="text-right py-3 px-4 font-medium">Sent</th>
                            <th className="text-right py-3 px-4 font-medium">Open Rate</th>
                            <th className="text-right py-3 px-4 font-medium">Click Rate</th>
                            <th className="text-right py-3 px-4 font-medium">Unsubscribe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segmentStats.map((stat) => (
                            <tr key={stat.segment} className="border-b">
                              <td className="py-3 px-4">{stat.segment}</td>
                              <td className="py-3 px-4 text-right">{stat.sent}</td>
                              <td className="py-3 px-4 text-right">{stat.openRate.toFixed(1)}%</td>
                              <td className="py-3 px-4 text-right">{stat.clickRate.toFixed(1)}%</td>
                              <td className="py-3 px-4 text-right">{stat.unsubscribeRate.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default CampaignAnalytics;

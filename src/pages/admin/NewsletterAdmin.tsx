import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, 
  Loader2, 
  Search, 
  Download,
  Mail,
  Users,
  Send,
  FileText,
  Clock,
  Calendar,
  X,
  Target,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { useRFMSegments, SEGMENT_COLORS } from "@/hooks/useRFMSegments";

interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  created_at: string;
}

interface ScheduledNewsletter {
  id: string;
  subject: string;
  content: string;
  scheduled_at: string;
  status: string;
  sent_at: string | null;
  recipients_count: number | null;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

// General email templates
const generalTemplates: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Newsletter",
    subject: "Welcome to the Healios Family!",
    content: `Hi there,

Welcome to the Healios community! We're thrilled to have you join us on your wellness journey.

At Healios, we believe that taking care of your health should be simple, effective, and enjoyable. That's why we've created a range of delicious gummy supplements designed to support your wellbeing every day.

Here's what you can look forward to as a subscriber:
- Exclusive offers and early access to new products
- Wellness tips and insights from our team
- Updates on our latest innovations

Ready to start your wellness routine? Visit our shop to explore our full range of supplements.

To your health,
The Healios Team`
  },
  {
    id: "new-product",
    name: "New Product Launch",
    subject: "Introducing Our Latest Wellness Innovation",
    content: `Hi there,

We're excited to share some big news with you!

After months of careful research and development, we're thrilled to introduce our newest addition to the Healios family.

Crafted with the same commitment to quality and effectiveness you've come to expect from us, this new product is designed to help you feel your best every single day.

Be among the first to try it and experience the Healios difference.

Shop now and discover what's new.

To your health,
The Healios Team`
  },
  {
    id: "seasonal",
    name: "Seasonal Wellness",
    subject: "Your Seasonal Wellness Guide from Healios",
    content: `Hi there,

As the seasons change, so do our wellness needs. That's why we wanted to share some tips to help you stay at your best during this time of year.

Supporting your body through seasonal transitions is all about consistency and giving yourself what you need. Our gummy supplements are designed to make that easy and enjoyable.

Whether you're looking to support your immune system, boost your energy, or simply maintain your daily routine, we've got you covered.

Check out our recommendations for this season and give your body the support it deserves.

Stay well,
The Healios Team`
  },
  {
    id: "flash-sale",
    name: "Flash Sale",
    subject: "Limited Time Offer - Don't Miss Out!",
    content: `Hi there,

We wanted to let you know about a special offer just for our newsletter subscribers.

For a limited time, you can enjoy exclusive savings on your favourite Healios products. This is the perfect opportunity to stock up on your wellness essentials or try something new.

But hurry - this offer won't last long!

Shop now and make the most of this exclusive deal.

Happy shopping,
The Healios Team`
  },
  {
    id: "wellness-tips",
    name: "Wellness Tips",
    subject: "Simple Wellness Tips to Brighten Your Day",
    content: `Hi there,

We hope this message finds you well! Today, we wanted to share a few simple tips to help you feel your best.

1. Stay Hydrated - Drinking enough water throughout the day supports energy levels and overall wellbeing.

2. Move Your Body - Even a short walk can boost your mood and help you feel more energised.

3. Prioritise Rest - Quality sleep is essential for recovery and feeling refreshed.

4. Be Consistent - Small daily habits, like taking your Healios gummies, add up to big results over time.

Remember, wellness is a journey, not a destination. We're here to support you every step of the way.

To your health,
The Healios Team`
  }
];

// Segment-specific email templates for RFM campaigns
const segmentTemplates: EmailTemplate[] = [
  {
    id: "segment-champions",
    name: "Champions - VIP Rewards",
    subject: "You're a Healios VIP - Here's Your Exclusive Reward",
    content: `Hi there,

You're one of our most valued customers, and we wanted to take a moment to say thank you.

Your commitment to your wellness journey inspires us every day. As a token of our appreciation, we've got something special just for you:

EXCLUSIVE VIP OFFER: Use code CHAMPION20 for 20% off your next order, plus free priority shipping.

As a valued member of our community, you'll always be first to know about:
- New product launches before anyone else
- Exclusive VIP-only offers
- Early access to limited editions

Thank you for being part of the Healios family. We're honoured to be part of your wellness routine.

With gratitude,
The Healios Team`
  },
  {
    id: "segment-loyal",
    name: "Loyal Customers - Appreciation",
    subject: "Thank You for Your Loyalty - A Special Gift Inside",
    content: `Hi there,

We've noticed you've been with us for a while now, and we couldn't be more grateful.

Your loyalty means the world to us. As a thank you, we'd love to offer you:

YOUR LOYALTY REWARD: Enjoy 15% off your next order with code LOYAL15

Plus, have you considered sharing Healios with friends? For every friend who makes their first purchase, you'll both receive £5 off your next order.

Here's to many more months of wellness together.

Warmly,
The Healios Team`
  },
  {
    id: "segment-potential-loyalists",
    name: "Potential Loyalists - Build the Habit",
    subject: "Ready to Make Wellness a Daily Habit?",
    content: `Hi there,

We loved seeing you back for another order! It tells us you're serious about your wellness journey.

Did you know that consistency is the key to seeing real results? That's why we created our Subscribe & Save programme:

- Save 15% on every order
- Never run out of your favourites
- Flexible delivery schedules
- Cancel anytime

Making wellness a daily habit has never been easier. Set up your subscription today and enjoy seamless, worry-free deliveries.

To your health,
The Healios Team`
  },
  {
    id: "segment-recent",
    name: "Recent Customers - Welcome Back",
    subject: "How's Your Wellness Journey Going?",
    content: `Hi there,

Thanks for giving Healios a try! We hope you're enjoying your first experience with us.

We'd love to hear how you're finding your products. In the meantime, here are some tips to get the most out of your wellness routine:

- Take your gummies at the same time each day for consistency
- Store them in a cool, dry place
- Pair complementary products for enhanced benefits

Ready to explore more? Use code NEWBIE10 for 10% off your second order.

We're here if you have any questions!

Warmly,
The Healios Team`
  },
  {
    id: "segment-promising",
    name: "Promising - Encouragement",
    subject: "Your Wellness Journey is Just Beginning",
    content: `Hi there,

We noticed you've started your wellness journey with us, and we're cheering you on!

Getting started is often the hardest part, and you've already taken that important first step. Now, let's build on that momentum together.

HERE'S A LITTLE ENCOURAGEMENT: Save 10% on your next order with code KEEPGOING

Not sure what to try next? Here are our most popular products that pair perfectly with what you already have:

- Magnesium Gummies for relaxation and sleep support
- Vitamin D3 for immune and bone health
- Probiotics for digestive wellness

Keep going - you've got this!

The Healios Team`
  },
  {
    id: "segment-need-attention",
    name: "Need Attention - Re-engagement",
    subject: "We've Missed You - Here's Something Special",
    content: `Hi there,

It's been a little while since we've seen you, and we wanted to check in.

Life gets busy - we understand. But your wellness routine doesn't have to be complicated. Just one gummy a day can make a real difference.

WE'D LOVE TO SEE YOU BACK: Enjoy 15% off your next order with code MISSYOU15

Is there anything we can help with? Whether you have questions about our products or need recommendations, we're always here for you.

Looking forward to having you back,
The Healios Team`
  },
  {
    id: "segment-about-to-sleep",
    name: "About to Sleep - Wake Up Call",
    subject: "Don't Let Your Wellness Routine Slip Away",
    content: `Hi there,

We noticed it's been a while since your last order, and we wanted to reach out before too much time passes.

Consistency is everything when it comes to wellness. The good news? It's never too late to get back on track.

TIME-SENSITIVE OFFER: Use code WAKEUPCALL for 15% off - valid for 48 hours only

Your body will thank you for getting back to your routine. We're here to make it easy.

Let's get you back on track,
The Healios Team`
  },
  {
    id: "segment-at-risk",
    name: "At Risk - Win Back",
    subject: "We Want You Back - Here's 20% Off",
    content: `Hi there,

We've noticed you haven't ordered in a while, and honestly? We miss you.

You were one of our valued customers, and we'd love the chance to win you back. Whatever the reason you stepped away, we want to make things right.

WIN-BACK OFFER: Take 20% off your entire order with code COMEBACK20

Plus, free shipping on orders over £30.

Is there something we could do better? We'd genuinely love to hear your feedback. Simply reply to this email, and our team will be in touch.

Hoping to see you again soon,
The Healios Team`
  },
  {
    id: "segment-cant-lose",
    name: "Can't Lose Them - Urgent Win Back",
    subject: "We Really Miss You - Please Come Back",
    content: `Hi there,

You've been one of our best customers, and it's been too long since we've heard from you.

We truly value your support, and we want to do whatever it takes to welcome you back to the Healios family.

OUR BEST OFFER YET: Take 25% off your entire order with code COMEBACKVIP

We'd also love to hear from you. If there's anything we could have done better, or if you have suggestions for new products, please let us know.

Your wellness matters to us,
The Healios Team`
  },
  {
    id: "segment-hibernating",
    name: "Hibernating - Reactivation",
    subject: "Time to Restart Your Wellness Journey?",
    content: `Hi there,

It's been quite some time since we last connected, and we wanted to reach out.

A lot has changed at Healios! We've introduced new products, improved our formulations, and made it even easier to maintain your wellness routine.

REACTIVATION OFFER: Enjoy 20% off + free shipping with code RESTART20

Whether you're ready to jump back in or just curious about what's new, we're here for you.

Here's to fresh starts,
The Healios Team`
  },
  {
    id: "segment-lost",
    name: "Lost - Final Attempt",
    subject: "One Last Chance - Our Biggest Discount Ever",
    content: `Hi there,

We know it's been a long time, and we respect that your priorities may have changed.

Before we say goodbye, we wanted to offer you one final opportunity to reconnect with Healios:

FINAL OFFER: Take 30% off your entire order with code LASTCHANCE30

This is our biggest discount, and it's exclusively for you. If you've found alternatives that work better for you, we understand. But if you're open to giving us another try, we promise to make it worth your while.

Whatever you decide, thank you for being part of our journey.

With appreciation,
The Healios Team`
  }
];

// Combine all templates
const emailTemplates: EmailTemplate[] = [...generalTemplates, ...segmentTemplates];

const NewsletterAdmin = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Email compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [scheduledNewsletters, setScheduledNewsletters] = useState<ScheduledNewsletter[]>([]);
  
  // RFM Segment targeting
  const [targetingMode, setTargetingMode] = useState<"all" | "segments">("all");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const { segments: rfmSegments, loading: loadingSegments, getEmailsBySegments } = useRFMSegments(12);

  // Mapping from segment names to template IDs
  const segmentToTemplateMap: Record<string, string> = {
    "Champions": "segment-champions",
    "Loyal Customers": "segment-loyal",
    "Potential Loyalists": "segment-potential-loyalists",
    "Recent Customers": "segment-recent",
    "Promising": "segment-promising",
    "Need Attention": "segment-need-attention",
    "About to Sleep": "segment-about-to-sleep",
    "At Risk": "segment-at-risk",
    "Can't Lose Them": "segment-cant-lose",
    "Hibernating": "segment-hibernating",
    "Lost": "segment-lost",
  };

  // Reverse mapping from template ID to segment name
  const templateToSegmentMap: Record<string, string> = Object.entries(segmentToTemplateMap)
    .reduce((acc, [segment, templateId]) => ({ ...acc, [templateId]: segment }), {});

  // Handle segment query param from URL (from RFM page)
  useEffect(() => {
    const segmentParam = searchParams.get("segment");
    if (segmentParam && !loadingSegments) {
      const segmentExists = rfmSegments.some(s => s.name === segmentParam);
      if (segmentExists) {
        setTargetingMode("segments");
        setSelectedSegments([segmentParam]);
        // Auto-select matching template
        const matchingTemplateId = segmentToTemplateMap[segmentParam];
        if (matchingTemplateId) {
          const template = emailTemplates.find(t => t.id === matchingTemplateId);
          if (template) {
            setSelectedTemplate(matchingTemplateId);
            setEmailSubject(template.subject);
            setEmailContent(template.content);
          }
        }
        setComposeOpen(true);
        // Clear the query param
        setSearchParams({});
      }
    }
  }, [searchParams, loadingSegments, rfmSegments]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId === "custom") {
      setEmailSubject("");
      setEmailContent("");
    } else {
      const template = emailTemplates.find(t => t.id === templateId);
      if (template) {
        setEmailSubject(template.subject);
        setEmailContent(template.content);
      }
      // Auto-select segment when using a segment template
      if (templateId.startsWith("segment-")) {
        const segmentName = templateToSegmentMap[templateId];
        if (segmentName && rfmSegments.some(s => s.name === segmentName)) {
          setTargetingMode("segments");
          setSelectedSegments([segmentName]);
        }
      }
    }
  };

  const resetComposeForm = () => {
    setEmailSubject("");
    setEmailContent("");
    setSelectedTemplate("");
    setScheduleMode(false);
    setScheduledDate("");
    setScheduledTime("");
    setTargetingMode("all");
    setSelectedSegments([]);
  };

  // Fetch data on mount - AdminLayout handles auth
  useEffect(() => {
    fetchSubscribers();
    fetchScheduledNewsletters();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast.error("Failed to load subscribers");
    } finally {
      setLoadingSubscribers(false);
    }
  };

  const fetchScheduledNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_newsletters")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setScheduledNewsletters((data as ScheduledNewsletter[]) || []);
    } catch (error) {
      console.error("Error fetching scheduled newsletters:", error);
    }
  };

  const exportToCSV = () => {
    const activeSubscribers = subscribers.filter(s => s.is_active);
    const csvContent = [
      ["Email", "Subscribed Date", "Status"].join(","),
      ...activeSubscribers.map(s => [
        s.email,
        format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm:ss"),
        s.is_active ? "Active" : "Inactive"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success(`Exported ${activeSubscribers.length} subscribers`);
  };

  const toggleSubscriberStatus = async (subscriber: Subscriber) => {
    setTogglingId(subscriber.id);
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .update({ is_active: !subscriber.is_active })
        .eq("id", subscriber.id);

      if (error) throw error;

      setSubscribers(subscribers.map(s => 
        s.id === subscriber.id ? { ...s, is_active: !s.is_active } : s
      ));
      toast.success(`Subscriber ${!subscriber.is_active ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling subscriber:", error);
      toast.error("Failed to update subscriber");
    } finally {
      setTogglingId(null);
    }
  };

  const sendNewsletter = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error("Please fill in both subject and content");
      return;
    }

    if (scheduleMode) {
      if (!scheduledDate || !scheduledTime) {
        toast.error("Please select a date and time for scheduling");
        return;
      }
      await scheduleNewsletter();
      return;
    }

    let recipients: string[] = [];

    if (targetingMode === "segments") {
      if (selectedSegments.length === 0) {
        toast.error("Please select at least one customer segment");
        return;
      }
      recipients = getEmailsBySegments(selectedSegments);
    } else {
      recipients = subscribers.filter(s => s.is_active).map(s => s.email);
    }

    if (recipients.length === 0) {
      toast.error("No recipients found for this campaign");
      return;
    }

    setSending(true);
    try {
      // Create campaign record first
      const { data: campaignData, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          subject: emailSubject,
          content: emailContent,
          recipients_count: recipients.length,
          target_segments: targetingMode === "segments" ? selectedSegments : [],
          targeting_mode: targetingMode,
          created_by: user?.id || null,
        } as any)
        .select()
        .single();

      if (campaignError) {
        console.error("Error creating campaign record:", campaignError);
      }

      const { data, error } = await supabase.functions.invoke('send-newsletter', {
        body: {
          subject: emailSubject,
          content: emailContent,
          recipients,
          campaignId: campaignData?.id,
          segments: targetingMode === "segments" ? selectedSegments : null
        }
      });

      if (error) throw error;

      const targetLabel = targetingMode === "segments" 
        ? `${selectedSegments.join(", ")} segment${selectedSegments.length > 1 ? "s" : ""}`
        : "all subscribers";
      toast.success(`Newsletter sent to ${data.sent} recipients (${targetLabel})`);
      if (data.failed > 0) {
        toast.warning(`${data.failed} emails failed to send`);
      }
      
      setComposeOpen(false);
      resetComposeForm();
    } catch (error: any) {
      console.error("Error sending newsletter:", error);
      toast.error(error.message || "Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  const scheduleNewsletter = async () => {
    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from("scheduled_newsletters")
        .insert({
          subject: emailSubject,
          content: emailContent,
          scheduled_at: scheduledAt.toISOString(),
          created_by: user?.id || null
        } as any);

      if (error) throw error;

      toast.success(`Newsletter scheduled for ${format(scheduledAt, "MMM d, yyyy 'at' h:mm a")}`);
      setComposeOpen(false);
      resetComposeForm();
      fetchScheduledNewsletters();
    } catch (error: any) {
      console.error("Error scheduling newsletter:", error);
      toast.error(error.message || "Failed to schedule newsletter");
    } finally {
      setSending(false);
    }
  };

  const cancelScheduledNewsletter = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_newsletters")
        .update({ status: "cancelled" } as any)
        .eq("id", id);

      if (error) throw error;

      toast.success("Scheduled newsletter cancelled");
      fetchScheduledNewsletters();
    } catch (error) {
      console.error("Error cancelling newsletter:", error);
      toast.error("Failed to cancel newsletter");
    }
  };

  const pendingNewsletters = scheduledNewsletters.filter(n => n.status === "pending");

  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = subscribers.filter(s => s.is_active).length;

  return (
    <AdminLayout title="Newsletter Subscribers">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Total Subscribers</p>
              </div>
              <p className="text-2xl font-medium text-foreground">{subscribers.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-700">Active Subscribers</p>
              </div>
              <p className="text-2xl font-medium text-green-800">{activeCount}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" disabled={activeCount === 0}>
                  <Send className="h-4 w-4" />
                  Send Newsletter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Compose Newsletter</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {/* Audience Targeting */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Target Audience
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={targetingMode === "all" ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => {
                          setTargetingMode("all");
                          setSelectedSegments([]);
                        }}
                      >
                        <Users className="h-4 w-4" />
                        All Subscribers ({activeCount})
                      </Button>
                      <Button
                        type="button"
                        variant={targetingMode === "segments" ? "default" : "outline"}
                        className="justify-start gap-2"
                        onClick={() => setTargetingMode("segments")}
                        disabled={loadingSegments || rfmSegments.length === 0}
                      >
                        <Target className="h-4 w-4" />
                        RFM Segments
                      </Button>
                    </div>
                  </div>

                  {/* Segment Selection */}
                  {targetingMode === "segments" && (
                    <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Select Customer Segments</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedSegments.length > 0 
                            ? `${getEmailsBySegments(selectedSegments).length} recipients`
                            : "No segments selected"
                          }
                        </span>
                      </div>
                      {loadingSegments ? (
                        <div className="flex items-center gap-2 py-4 justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading segments...</span>
                        </div>
                      ) : rfmSegments.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2 text-center">
                          No customer segments available. RFM analysis requires order history.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {rfmSegments.map((segment) => (
                            <label
                              key={segment.name}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedSegments.includes(segment.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSegments([...selectedSegments, segment.name]);
                                  } else {
                                    setSelectedSegments(selectedSegments.filter(s => s !== segment.name));
                                  }
                                }}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <div
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: segment.color }}
                                />
                                <span className="text-sm text-foreground">{segment.name}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {segment.count} customers
                              </Badge>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Template Selector */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Template
                    </label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template or start from scratch..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Start from scratch
                          </div>
                        </SelectItem>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                          General Templates
                        </div>
                        {generalTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                          Segment Campaigns
                        </div>
                        {segmentTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Subject
                    </label>
                    <Input
                      placeholder="Enter email subject..."
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Content
                    </label>
                    <Textarea
                      placeholder="Write your newsletter content..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Schedule Toggle */}
                  <div className="flex items-center gap-3 py-2 border-t border-border">
                    <Switch
                      checked={scheduleMode}
                      onCheckedChange={setScheduleMode}
                    />
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">Schedule for later</span>
                    </div>
                  </div>

                  {/* Schedule Date/Time */}
                  {scheduleMode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={format(new Date(), "yyyy-MM-dd")}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          Time
                        </label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setComposeOpen(false)}
                      disabled={sending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={sendNewsletter}
                      disabled={
                        sending || 
                        !emailSubject.trim() || 
                        !emailContent.trim() || 
                        (scheduleMode && (!scheduledDate || !scheduledTime)) ||
                        (targetingMode === "segments" && selectedSegments.length === 0)
                      }
                      className="gap-2"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {scheduleMode ? "Scheduling..." : "Sending..."}
                        </>
                      ) : scheduleMode ? (
                        <>
                          <Calendar className="h-4 w-4" />
                          Schedule Newsletter
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send to {targetingMode === "segments" 
                            ? `${getEmailsBySegments(selectedSegments).length} customers`
                            : `${activeCount} subscribers`
                          }
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Scheduled Newsletters */}
          {pendingNewsletters.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Newsletters
              </h2>
              <div className="space-y-3">
                {pendingNewsletters.map((newsletter) => (
                  <div
                    key={newsletter.id}
                    className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{newsletter.subject}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        Scheduled for {format(new Date(newsletter.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelScheduledNewsletter(newsletter.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subscribers List */}
          {loadingSubscribers ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredSubscribers.length > 0 ? (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-foreground">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-foreground">Subscribed</th>
                    <th className="text-left p-4 text-sm font-medium text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-t border-border">
                      <td className="p-4 text-sm text-foreground">{subscriber.email}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={subscriber.is_active}
                            onCheckedChange={() => toggleSubscriberStatus(subscriber)}
                            disabled={togglingId === subscriber.id}
                          />
                          <span className={`text-xs ${
                            subscriber.is_active ? "text-green-700" : "text-muted-foreground"
                          }`}>
                            {subscriber.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No subscribers match your search" : "No subscribers yet"}
              </p>
            </div>
          )}
    </AdminLayout>
  );
};

export default NewsletterAdmin;


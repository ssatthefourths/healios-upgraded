-- Create email campaigns table to track sent campaigns
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recipients_count INTEGER NOT NULL DEFAULT 0,
  target_segments TEXT[] DEFAULT '{}',
  targeting_mode TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'sent',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email campaign events table to track opens, clicks, conversions
CREATE TABLE public.email_campaign_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'sent', 'opened', 'clicked', 'converted'
  recipient_email TEXT NOT NULL,
  segment TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_campaigns_sent_at ON public.email_campaigns(sent_at DESC);
CREATE INDEX idx_email_campaign_events_campaign_id ON public.email_campaign_events(campaign_id);
CREATE INDEX idx_email_campaign_events_event_type ON public.email_campaign_events(event_type);
CREATE INDEX idx_email_campaign_events_recipient ON public.email_campaign_events(recipient_email);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_campaigns (admin only)
CREATE POLICY "Admins can view email campaigns"
ON public.email_campaigns FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email campaigns"
ON public.email_campaigns FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for email_campaign_events
CREATE POLICY "Admins can view campaign events"
ON public.email_campaign_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert campaign events"
ON public.email_campaign_events FOR INSERT
WITH CHECK (true);
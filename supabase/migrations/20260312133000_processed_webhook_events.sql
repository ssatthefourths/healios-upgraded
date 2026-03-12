-- Create table for tracking processed Stripe webhook events to ensure idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No public access - only service role
CREATE POLICY "Service role only access for processed_webhook_events"
ON public.processed_webhook_events
FOR ALL
USING (auth.role() = 'service_role');

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_stripe_id ON public.processed_webhook_events(stripe_event_id);

COMMENT ON TABLE public.processed_webhook_events IS 'Stores processed Stripe event IDs to prevent duplicate processing (idempotency).';

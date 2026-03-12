-- Create checkout_recovery table for payment failure recovery emails
CREATE TABLE public.checkout_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  cart_items JSONB NOT NULL,
  customer_details JSONB,
  shipping_address JSONB,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on token for fast lookups
CREATE INDEX idx_checkout_recovery_token ON public.checkout_recovery(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX idx_checkout_recovery_expires ON public.checkout_recovery(expires_at);

-- Enable RLS
ALTER TABLE public.checkout_recovery ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to read recovery records by token (for cart recovery)
CREATE POLICY "Anyone can read recovery by token"
ON public.checkout_recovery
FOR SELECT
USING (used_at IS NULL AND expires_at > now());

-- Policy: Allow service role full access (for edge functions)
CREATE POLICY "Service role has full access to recovery"
ON public.checkout_recovery
FOR ALL
USING (true)
WITH CHECK (true);
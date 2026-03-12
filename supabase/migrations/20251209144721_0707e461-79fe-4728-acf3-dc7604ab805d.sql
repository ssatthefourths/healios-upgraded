-- Add column to track review email status
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS review_email_sent_at timestamp with time zone DEFAULT NULL;
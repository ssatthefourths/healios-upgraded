-- Create table for stock notifications
CREATE TABLE public.stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.stock_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own notifications
CREATE POLICY "Users can create their own notifications"
ON public.stock_notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.stock_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.stock_notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update notifications (for marking as notified)
CREATE POLICY "Admins can update notifications"
ON public.stock_notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));
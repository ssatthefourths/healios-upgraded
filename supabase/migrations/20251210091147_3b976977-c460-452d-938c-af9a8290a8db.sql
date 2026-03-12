-- Create product_versions table to track changes
CREATE TABLE public.product_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  action TEXT NOT NULL DEFAULT 'update',
  changes JSONB NOT NULL DEFAULT '{}',
  previous_values JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

-- Admins can view all versions
CREATE POLICY "Admins can view product versions"
ON public.product_versions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert versions
CREATE POLICY "Admins can insert product versions"
ON public.product_versions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_product_versions_product_id ON public.product_versions(product_id);
CREATE INDEX idx_product_versions_changed_at ON public.product_versions(changed_at DESC);
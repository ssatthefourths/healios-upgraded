-- Add invoice_url column to orders table
ALTER TABLE public.orders ADD COLUMN invoice_url TEXT;

-- Create storage bucket for order documents (invoices)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-documents', 'order-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can view their own invoices
CREATE POLICY "Users can view their own order documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'order-documents' 
  AND (storage.foldername(name))[1] = 'invoices'
  AND EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id::text = (storage.foldername(name))[2]
    AND orders.user_id = auth.uid()
  )
);

-- Policy: Service role can manage all order documents
CREATE POLICY "Service role can manage order documents"
ON storage.objects
FOR ALL
USING (bucket_id = 'order-documents')
WITH CHECK (bucket_id = 'order-documents');
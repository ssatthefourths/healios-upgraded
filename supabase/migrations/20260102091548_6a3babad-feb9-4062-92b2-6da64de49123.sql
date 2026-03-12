-- Update the email_campaign_events INSERT policy to validate against existing campaigns
DROP POLICY IF EXISTS "Anyone can insert campaign events" ON public.email_campaign_events;

-- Create a more restrictive INSERT policy that validates campaign_id exists
CREATE POLICY "Only insert events for existing campaigns"
ON public.email_campaign_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE id = campaign_id
  )
);
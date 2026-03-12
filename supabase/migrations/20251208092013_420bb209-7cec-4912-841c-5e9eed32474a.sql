-- Fix addresses country default to UK
ALTER TABLE public.addresses 
ALTER COLUMN country SET DEFAULT 'United Kingdom';
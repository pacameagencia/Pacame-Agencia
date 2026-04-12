-- Add portal access and Stripe columns to clients table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/kfmnllpscheodgxnutkw/sql

ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_token_expires TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Index for fast portal token lookups
CREATE INDEX IF NOT EXISTS idx_clients_portal_token ON clients(portal_token) WHERE portal_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer ON clients(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

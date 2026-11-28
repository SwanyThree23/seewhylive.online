-- Migration: add_slug_and_panel_tips
-- Apply via: psql $DATABASE_URL -f this_file
-- Or via Supabase MCP: apply_migration project_id=rxlgywvfclyjdfyvfvyc

-- Add shareable slug to streams table
ALTER TABLE streams ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS streams_slug_idx ON streams(slug) WHERE slug IS NOT NULL;

-- Panel tips table for Stripe-confirmed tip alerts
CREATE TABLE IF NOT EXISTS panel_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL,
  creator_cents INTEGER NOT NULL,
  platform_cents INTEGER NOT NULL,
  message TEXT,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS panel_tips_stream_idx ON panel_tips(stream_id);
CREATE INDEX IF NOT EXISTS panel_tips_created_idx ON panel_tips(created_at DESC);

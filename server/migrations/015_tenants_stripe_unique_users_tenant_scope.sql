-- Migration 015: missing unique constraint + indexes for data integrity
--
-- 1. tenantBilling.js uses ON CONFLICT (stripe_subscription_id) DO NOTHING
--    but tenants has no unique constraint on that column — causes runtime error.
--
-- 2. users.tenant_id index — helps the new tenant-scoped queries in users.js.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_stripe_subscription_id
  ON tenants(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_tenant_id
  ON users(tenant_id)
  WHERE tenant_id IS NOT NULL;

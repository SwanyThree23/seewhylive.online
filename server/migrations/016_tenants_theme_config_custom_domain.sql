-- Migration 016: add theme_config and custom_domain to tenants
-- resolveTenant.js queries theme_config which was missing → every tenant lookup
-- fails and the app falls back to FALLBACK_TENANT, breaking multi-tenancy.
-- publicPreview.js reads tenant.custom_domain for branded share links.

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS theme_config  JSONB,
  ADD COLUMN IF NOT EXISTS custom_domain TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_custom_domain
  ON tenants(custom_domain)
  WHERE custom_domain IS NOT NULL;

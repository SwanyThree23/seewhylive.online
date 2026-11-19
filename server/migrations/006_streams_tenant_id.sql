-- Migration 006: add tenant_id to streams table for multi-tenant scoping
-- Without this column, INSERT/SELECT/UPDATE with tenant_id WHERE clauses silently fail.

ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_streams_tenant_id ON streams(tenant_id);

-- Migration 007: add tenant_id to pk_battles for multi-tenant scoping
-- battleService.js references tenant_id in every query but the column was missing.

ALTER TABLE pk_battles
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pk_battles_tenant_id ON pk_battles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pk_battles_tenant_status ON pk_battles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_pk_battles_room_tenant ON pk_battles(room_id, tenant_id);

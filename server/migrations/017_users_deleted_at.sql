-- Migration 017: add deleted_at to users for soft-delete support
-- users.js, inviteService.js, routes.js all query/set deleted_at but the column is missing.
-- Without it every user invite, search, and account-delete throws a Postgres error.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_deleted_at
  ON users(deleted_at)
  WHERE deleted_at IS NOT NULL;

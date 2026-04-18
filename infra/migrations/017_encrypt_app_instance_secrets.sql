-- Migration 017: Soporte cifrado AES-256-GCM para app_instances.secrets
-- NO cifra los datos existentes — eso lo hace scripts/encrypt-secrets.mjs en ventana controlada
-- tras SECRETS_ENCRYPTION_KEY estar configurada.

ALTER TABLE app_instances ADD COLUMN IF NOT EXISTS secrets_ciphertext BYTEA;
ALTER TABLE app_instances ADD COLUMN IF NOT EXISTS secrets_encrypted_at TIMESTAMPTZ;
ALTER TABLE app_instances ADD COLUMN IF NOT EXISTS secrets_key_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_app_instances_need_encryption
  ON app_instances(id)
  WHERE secrets != '{}'::jsonb AND secrets_ciphertext IS NULL;

COMMENT ON COLUMN app_instances.secrets_ciphertext IS 'AES-256-GCM de JSON.stringify(secrets). Formato v1:iv(12):tag(16):ct base64.';
COMMENT ON COLUMN app_instances.secrets_key_version IS 'Version de clave (para rotacion sin downtime).';
COMMENT ON COLUMN app_instances.secrets IS 'DEPRECATED — sera NULL tras migracion 019 (30d post-backfill).';

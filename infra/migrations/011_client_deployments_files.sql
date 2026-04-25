-- 011_client_deployments_files.sql
-- FASE E — Materializador. Añade columnas a client_deployments para trackear
-- los archivos físicos generados (subidos a Supabase Storage) y crea el bucket.

ALTER TABLE client_deployments
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS materialized_files jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS materialized_at timestamptz,
  ADD COLUMN IF NOT EXISTS zip_url text,
  ADD COLUMN IF NOT EXISTS zip_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS missing_vars text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS warnings text[] DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_deployments_slug
  ON client_deployments(slug)
  WHERE slug IS NOT NULL;

-- Bucket para archivos materializados (idempotente).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-deployments',
  'client-deployments',
  false,  -- privado, requiere signed URL
  10485760,  -- 10 MB max por archivo
  ARRAY[
    'text/plain',
    'text/markdown',
    'application/json',
    'application/sql',
    'application/zip',
    'text/typescript',
    'application/x-typescript'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas: solo service role puede leer/escribir (bypassa RLS).
-- El acceso público se hace vía signed URL desde el endpoint API.
DROP POLICY IF EXISTS "service_role_all_client_deployments" ON storage.objects;
CREATE POLICY "service_role_all_client_deployments" ON storage.objects
  FOR ALL
  USING (bucket_id = 'client-deployments' AND auth.role() = 'service_role');

COMMENT ON COLUMN client_deployments.slug IS
  'Slug derivado de business_name + city; usado como path raíz en bucket client-deployments.';
COMMENT ON COLUMN client_deployments.materialized_files IS
  'Array de objetos: [{ path, size_bytes, content_type, signed_url_expires_at }]';
COMMENT ON COLUMN client_deployments.zip_url IS
  'Signed URL temporal del ZIP completo del despliegue (expira en 7d, se regenera al solicitar).';

-- 020_promptforge_generations.sql
-- Generaciones reales (Freepik imagen, Kling vídeo, ElevenLabs audio) ligadas
-- a un prompt del historial. Permite volver al render sin re-pagar.

CREATE TABLE IF NOT EXISTS promptforge_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES pacame_product_users(id) ON DELETE CASCADE,
  prompt_id uuid REFERENCES promptforge_prompts(id) ON DELETE SET NULL,
  modality text NOT NULL CHECK (modality IN ('image', 'video', 'audio')),
  provider text NOT NULL,            -- 'freepik-mystic' | 'freepik-kling' | 'elevenlabs'
  provider_task_id text,             -- task id en el proveedor (para polling)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  prompt_text text NOT NULL,
  params jsonb DEFAULT '{}'::jsonb,  -- aspect_ratio, model, voice_id, …
  urls jsonb DEFAULT '[]'::jsonb,    -- ["https://…"]
  error_message text,
  cost_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pfg_user_created ON promptforge_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pfg_task ON promptforge_generations(provider, provider_task_id) WHERE provider_task_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_pfg_updated ON promptforge_generations;
CREATE TRIGGER trg_pfg_updated BEFORE UPDATE ON promptforge_generations
  FOR EACH ROW EXECUTE FUNCTION pacame_products_updated_at();

COMMENT ON TABLE promptforge_generations IS
  'Renders reales de prompts: Freepik Mystic (imagen), Kling 2.6 (vídeo), ElevenLabs (audio). El user los paga una vez y los reutiliza.';

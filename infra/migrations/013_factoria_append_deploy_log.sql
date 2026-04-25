-- 013_factoria_append_deploy_log.sql
-- Función RPC atómica para append a deploy_log evitando race conditions
-- cuando los 3 deploys (vercel/vapi/n8n) corren en paralelo y todos
-- intentan modificar el mismo jsonb array.

CREATE OR REPLACE FUNCTION factoria_append_deploy_log(
  p_deployment_id uuid,
  p_entry jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE client_deployments
  SET deploy_log = COALESCE(deploy_log, '[]'::jsonb) || jsonb_build_array(p_entry)
  WHERE id = p_deployment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION factoria_append_deploy_log(uuid, jsonb) TO service_role;

COMMENT ON FUNCTION factoria_append_deploy_log IS
  'Append atómico a client_deployments.deploy_log. Usado por /api/factoria/deploy para evitar pérdida de entries cuando los 3 deploys corren en paralelo.';

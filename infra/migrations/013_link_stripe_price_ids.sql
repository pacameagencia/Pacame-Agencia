-- Migration 013: Link subscription_plans and apps_catalog to Stripe price IDs
-- Aplicada via Supabase MCP execute_sql.
-- Los products + prices fueron creados via Stripe MCP (modo live).

UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1TNMFdLILWpOzDaiaFAMGBtl',
  stripe_price_id_yearly  = 'price_1TNMFkLILWpOzDaiNhCfBym9'
WHERE slug = 'start';

UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1TNMFpLILWpOzDaifAF9JOw6',
  stripe_price_id_yearly  = 'price_1TNMFtLILWpOzDaiekkwWRYB'
WHERE slug = 'pro';

UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1TNMFyLILWpOzDairTnCdZ3u',
  stripe_price_id_yearly  = 'price_1TNMG1LILWpOzDaiUhHWJo5r'
WHERE slug = 'growth';

UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1TNMG5LILWpOzDaiAl94v0wZ',
  stripe_price_id_yearly  = 'price_1TNMGALILWpOzDai2gyXwG4s'
WHERE slug = 'scale';

UPDATE apps_catalog SET
  stripe_price_id_monthly = 'price_1TNMGELILWpOzDaipFwMjgOu',
  stripe_price_id_yearly  = 'price_1TNMGJLILWpOzDaiGxbqFoYy'
WHERE slug = 'pacame-contact';

-- Stripe Products (modo live):
--   prod_UM4NmybiVJtRRu  PACAME Start
--   prod_UM4OWqy1BBinw6  PACAME Pro
--   prod_UM4OUtTbm6KZDu  PACAME Growth
--   prod_UM4OQi3xXjkRR8  PACAME Scale
--   prod_UM4OwEHf139rwd  PACAME Contact (app)

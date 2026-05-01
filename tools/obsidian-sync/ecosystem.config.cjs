/**
 * pm2 ecosystem PacameCueva → Supabase bridge.
 * Despliegue en VPS Hostinger (72.62.185.125).
 *
 * Setup VPS (una vez):
 *   git clone <repo> /opt/pacame && cd /opt/pacame/tools/obsidian-sync && npm ci
 *   pm2 start ecosystem.config.cjs --only pacame-vault-pull
 *   pm2 save && pm2 startup
 *
 * Vault en VPS (opcional): se sincroniza vía Obsidian Git + GitHub privado
 * a /opt/pacame/PacameCueva. Sin vault, el watcher no se activa (pull sí).
 */
const TSX = '/opt/pacame/tools/obsidian-sync/node_modules/tsx/dist/cli.mjs';

module.exports = {
  apps: [
    {
      name: 'pacame-vault-watcher',
      script: TSX,
      args: 'watcher.ts',
      cwd: '/opt/pacame/tools/obsidian-sync',
      env: {
        NODE_ENV: 'production',
        PACAME_ROOT: '/opt/pacame',
        PACAME_VAULT: '/opt/pacame/PacameCueva',
      },
      max_memory_restart: '512M',
      restart_delay: 5000,
      watch: false,
      out_file: '/var/log/pacame/watcher.log',
      error_file: '/var/log/pacame/watcher.err.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'pacame-vault-pull',
      script: TSX,
      args: 'pull.ts',
      cwd: '/opt/pacame/tools/obsidian-sync',
      env: {
        NODE_ENV: 'production',
        PACAME_ROOT: '/opt/pacame',
        PACAME_VAULT: '/opt/pacame/PacameCueva',
      },
      cron_restart: '*/5 * * * *',
      autorestart: false,
      out_file: '/var/log/pacame/pull.log',
      error_file: '/var/log/pacame/pull.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};

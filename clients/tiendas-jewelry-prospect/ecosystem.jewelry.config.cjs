module.exports = {
  apps: [
    {
      name: 'tiendas-jewelry-worker',
      script: './scripts/worker-jewelry.mjs',
      args: '--rate=4 --hours=7-23',
      cwd: '/root/pacame/tiendas-jewelry-prospect',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      autorestart: true,
      restart_delay: 10000,
      max_restarts: 50,
      watch: false,
      env: {
        NODE_ENV: 'production',
        TZ: 'Europe/Madrid',
      },
      error_file: '/root/pacame/tiendas-jewelry-prospect/logs/worker-err.log',
      out_file: '/root/pacame/tiendas-jewelry-prospect/logs/worker-out.log',
      time: true,
      merge_logs: true,
    },
  ],
};

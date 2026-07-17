// ecosystem.config.js
// Usage:
//   pm2 start ecosystem.config.js           -- start all processes
//   pm2 start ecosystem.config.js --only turbo-monorepo
//   pm2 reload ecosystem.config.js          -- zero-downtime reload
//   pm2 save && pm2 startup                 -- persist across reboots

const path = require('path')

const ROOT = __dirname

module.exports = {
  apps: [
    // -----------------------------------------------------------------
    // 1. Turborepo -- starts all workspace apps at once
    //    root package.json: "start": "turbo run start"
    //    covers: sheets-api (port 3001) + turbo-docs (port 3000)
    // -----------------------------------------------------------------
    {
      name: 'turbo-monorepo',
      script: 'bun',
      args: 'run start',
      cwd: ROOT,
      interpreter: 'none', // bun is the interpreter, not node

      autorestart: true,
      max_restarts: 15,
      restart_delay: 3000,
      exp_backoff_restart_delay: 150,

      max_memory_restart: '1536M',

      kill_timeout: 15000,
      listen_timeout: 30000,

      out_file: path.join(ROOT, 'logs', 'turbo-monorepo.out.log'),
      error_file: path.join(ROOT, 'logs', 'turbo-monorepo.err.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      env_production: {
        NODE_ENV: 'production',
      },
    },

    // -----------------------------------------------------------------
    // 2. zrok tunnel
    //    Equivalent to: pm2 start "zrok share reserved tj31c889tzsk --headless" --name "zrok-tunnel"
    // -----------------------------------------------------------------
    {
      name: 'zrok-tunnel',
      script: 'zrok',
      args: 'share reserved tj31c889tzsk --headless',
      interpreter: 'none',

      autorestart: true,
      max_restarts: 20,
      restart_delay: 2000,
      exp_backoff_restart_delay: 100,

      kill_timeout: 5000,

      out_file: path.join(ROOT, 'logs', 'zrok-tunnel.out.log'),
      error_file: path.join(ROOT, 'logs', 'zrok-tunnel.err.log'),
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}

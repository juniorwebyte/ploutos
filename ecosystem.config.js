module.exports = {
  apps: [{
    name: 'ploutosledger-api',
    script: './dist-server/index.js',
    instances: process.env.NODE_ENV === 'production' ? 2 : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 4000,
      HOST: 'localhost'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4000,
      HOST: process.env.HOST || '0.0.0.0'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist', 'dist-server', 'prisma', '*.db', '*.db-journal'],
    instance_var: 'INSTANCE_ID',
    // Health check
    min_uptime: '10s',
    max_restarts: 10,
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Logs
    combine_logs: true,
    log_type: 'json'
  }]
};


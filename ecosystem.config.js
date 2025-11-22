module.exports = {
  apps: [{
    name: 'ploutosledger-api',
    script: './dist-server/index.js',
    instances: process.env.NODE_ENV === 'production' ? 2 : 1,
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'dist', 'dist-server'],
    instance_var: 'INSTANCE_ID'
  }]
};


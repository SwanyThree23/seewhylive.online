'use strict';

module.exports = {
  apps: [{
    name: 'seewhy-server',
    script: './index.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/seewhy/pm2-error.log',
    out_file:   '/var/log/seewhy/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay: 2000,
    max_restarts: 10,
    autorestart: true
  }]
};

'use strict';

// Production PM2 config — runs the server from its deployed location on the VPS.
// deploy.sh rsync's server/ to /opt/seewhy/server/ before starting this.
module.exports = {
  apps: [{
    name:               'seewhy-server',
    script:             '/opt/seewhy/server/index.js',
    cwd:                '/opt/seewhy/server',
    instances:          1,
    exec_mode:          'fork',
    max_memory_restart: '800M',
    env: {
      NODE_ENV: 'production',
      PORT:     3001,
    },
    error_file:      '/var/log/seewhy/pm2-error.log',
    out_file:        '/var/log/seewhy/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    restart_delay:   2000,
    max_restarts:    10,
    autorestart:     true,
    merge_logs:      true,
  }],
};

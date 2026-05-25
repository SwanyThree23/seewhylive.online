module.exports = {
  apps: [
    {
      name: 'seewhy-server',
      script: '/opt/seewhy/server/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/seewhy/server-error.log',
      out_file: '/var/log/seewhy/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};

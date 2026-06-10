module.exports = {
  apps: [
    {
      name: 'seewhy-server',
      script: '/opt/seewhy/server/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1024M',
      node_args: '--max-old-space-size=2048',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        UV_THREADPOOL_SIZE: 16,
        DEPLOY_TOKEN: 'sw33-7ed4b3a370219c60bfea',
      ANTHROPIC_API_KEY: 'sk-ant-YOURREALKEYHERE'
      },
      error_file: '/var/log/seewhy/server-error.log',
      out_file:   '/var/log/seewhy/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      kill_timeout: 5000,
      listen_timeout: 10000,
      restart_delay: 2000
    }
  ]
};

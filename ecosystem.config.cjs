module.exports = {
  apps: [{
    name: 'seewhy-server',
    script: '/opt/seewhy/server/index.js',
    cwd: '/opt/seewhy',
    env_file: '/opt/seewhy/.env'
  }]
};

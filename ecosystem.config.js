module.exports = {
  apps: [
    {
      name: 'dsi-backend',
      cwd: '/opt/dsi-contract-manager/backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_file: '/var/log/dsi-backend/combined.log',
      out_file: '/var/log/dsi-backend/out.log',
      error_file: '/var/log/dsi-backend/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};

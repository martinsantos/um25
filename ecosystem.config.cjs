const runtimeEnv = {
  NODE_ENV: 'production',
  PORT: 4321,
  HOST: '0.0.0.0',
};

// Credentials must arrive from the deployment environment, never from git.
for (const key of ['BLOG_API_USER', 'BLOG_API_PASS']) {
  if (process.env[key]) runtimeEnv[key] = process.env[key];
}

module.exports = {
  apps: [{
    name: 'astro-ultimamilla',
    script: './dist/server/entry.mjs',
    instances: 1,
    exec_mode: 'fork',
    env: runtimeEnv,
    error_file: '/root/.pm2/logs/astro-ultimamilla-error.log',
    out_file: '/root/.pm2/logs/astro-ultimamilla-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

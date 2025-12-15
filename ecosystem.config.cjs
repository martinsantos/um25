module.exports = {
  apps: [
    {
      name: 'astro-ultimamilla',
      script: './dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4321,
        PUBLIC_DIRECTUS_URL: 'https://admin.ultimamilla.com.ar'
      },
      error_file: '/root/.pm2/logs/astro-ultimamilla-error.log',
      out_file: '/root/.pm2/logs/astro-ultimamilla-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

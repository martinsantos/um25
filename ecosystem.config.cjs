module.exports = {
  apps: [
    {
      name: 'astro-ultimamilla',
      script: './dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',

      // Memory limits - CRITICAL for preventing VSZ bloat
      max_memory_restart: '320M',  // Restart if exceeds 320MB (prevents memory leaks)
      node_args: '--max-old-space-size=256',  // Limit Node.js heap to 256MB

      env: {
        NODE_ENV: 'production',
        PORT: 4321,
        PUBLIC_DIRECTUS_URL: 'https://admin.ultimamilla.com.ar',
        NODE_OPTIONS: '--max-old-space-size=256 --enable-source-maps'  // Heap limit + source maps for debugging
      },
      error_file: '/root/.pm2/logs/astro-ultimamilla-error.log',
      out_file: '/root/.pm2/logs/astro-ultimamilla-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },

    {
      name: 'sgi',
      script: 'src/server.js',
      cwd: '/home/sgi.ultimamilla.com.ar',
      instances: 1,
      exec_mode: 'fork',

      // Memory limits for SGI
      max_memory_restart: '200M',  // Restart if exceeds 200MB
      node_args: '--max-old-space-size=150',  // Limit heap to 150MB

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=150'  // Heap limit
      },
      error_file: '/root/.pm2/logs/sgi-error.log',
      out_file: '/root/.pm2/logs/sgi-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

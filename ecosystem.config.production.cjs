/**
 * PM2 PRODUCTION ECOSYSTEM CONFIG
 *
 * This is the PRODUCTION configuration with memory limits and monitoring
 *
 * Usage:
 *   pm2 start ecosystem.config.production.cjs
 *
 * Memory limits prevent processes from consuming all available RAM and
 * crashing the server. When limit is reached, PM2 automatically restarts.
 *
 * Known Issues:
 * - Astro (VSZ: 22.8GB) - Investigate memory leak
 * - SGI (Normal): ~40-50MB
 *
 * TODO: Optimize Astro memory consumption
 */

module.exports = {
  apps: [
    {
      // MAIN FRONTEND - Astro SSR
      name: 'astro-ultimamilla',
      script: './dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 4321,
        PUBLIC_DIRECTUS_URL: 'https://admin.ultimamilla.com.ar',
        // Limit V8 heap size to prevent memory bloat
        NODE_OPTIONS: '--max-old-space-size=256'
      },

      // Memory Management
      max_memory_restart: '256M',  // Restart if exceeds 256MB

      // Logging
      error_file: '/root/.pm2/logs/astro-ultimamilla-error.log',
      out_file: '/root/.pm2/logs/astro-ultimamilla-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Monitoring & Restarting
      max_restarts: 10,          // Max restarts in max_restarts window
      min_uptime: '10s',         // Min time to consider app "stable"
      autorestart: true,
      watch: false,              // Don't watch files in production

      // Crash Handling
      listen_timeout: 5000,      // ms to wait before killing on restart
      kill_timeout: 5000,        // ms to wait before SIGKILL
    },

    {
      // SGI - Sistema de Gestión Integral
      name: 'sgi',
      script: '/home/sgi.ultimamilla.com.ar/src/server.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/home/sgi.ultimamilla.com.ar',

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_USER: 'root',
        DB_PORT: 3306,
        DB_NAME: 'sgi_production'
      },

      // Memory Management
      max_memory_restart: '200M',  // Restart if exceeds 200MB

      // Logging
      error_file: '/root/.pm2/logs/sgi-error.log',
      out_file: '/root/.pm2/logs/sgi-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Monitoring & Restarting
      max_restarts: 10,
      min_uptime: '10s',
      autorestart: true,
      watch: false,

      // Crash Handling
      listen_timeout: 5000,
      kill_timeout: 5000,
    }
  ],

  /**
   * CLUSTER MODE CONFIGURATION
   *
   * Uncomment below to run multiple instances for better load distribution
   * and resilience. Each instance runs independently and can crash without
   * affecting others.
   *
   * Note: Load balancing is handled by Nginx upstream config
   */

  // For future scaling when memory is available:
  /*
  apps: [
    {
      name: 'astro-ultimamilla',
      script: './dist/server/entry.mjs',
      instances: 2,              // Run 2 instances
      exec_mode: 'cluster',      // Cluster mode
      max_memory_restart: '256M',
      env: { NODE_ENV: 'production', PORT: 4321 }
    }
  ]
  */
};

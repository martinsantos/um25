/**
 * PM2 Configuration - PRODUCTION with Memory Limits
 *
 * Esta configuración incluye límites de memoria para prevenir
 * que los procesos Node.js consuman toda la RAM del sistema.
 */

module.exports = {
  apps: [
    {
      // Aplicación principal Astro
      name: 'astro-ultimamilla',
      script: './dist/server/entry.mjs',
      cwd: '/root/fumbling-field',

      // Configuración de memoria
      max_memory_restart: '320M',  // Reiniciar si supera 320MB
      node_args: '--max-old-space-size=256',  // Limitar heap a 256MB

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 4321,
        NODE_OPTIONS: '--max-old-space-size=256 --enable-source-maps'
      },

      // Procesos
      instances: 1,
      exec_mode: 'fork',

      // Restart policy
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'dist'],
      max_restarts: 10,
      min_uptime: '10s',

      // Logs
      error_file: '/var/log/pm2/astro-error.log',
      out_file: '/var/log/pm2/astro-out.log',

      // Health check
      instance_var: 'INSTANCE_ID'
    },

    {
      // Sistema de Gestión Interna (SGI)
      name: 'sgi',
      script: 'src/server.js',
      cwd: '/home/sgi.ultimamilla.com.ar',

      // Configuración de memoria
      max_memory_restart: '200M',  // Reiniciar si supera 200MB
      node_args: '--max-old-space-size=150',  // Limitar heap a 150MB

      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=150'
      },

      // Procesos
      instances: 1,
      exec_mode: 'fork',

      // Restart policy
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',

      // Logs
      error_file: '/var/log/pm2/sgi-error.log',
      out_file: '/var/log/pm2/sgi-out.log'
    }
  ],

  // Configuración global
  watch: false,
  env: {
    NODE_ENV: 'production'
  },

  // Logs
  error_file: '/var/log/pm2/pm2-error.log',
  out_file: '/var/log/pm2/pm2-out.log'
};

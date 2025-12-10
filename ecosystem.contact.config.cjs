module.exports = {
  apps: [{
    name: 'astro-ultimamilla',
    script: './dist/server/entry.mjs',
    cwd: '/root/fumbling-field',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      SMTP_USER: 'martin@ultimamilla.com.ar',
      SMTP_PASS: 'pwrxasnjzdipbrml',
      PUBLIC_DIRECTUS_URL: 'http://localhost:8055',
      PUBLIC_DIRECTUS_TOKEN: 'k6P8LAY8_x_y1miB_KTlWnysCnx2Abky',
      PORT: '4321',
      HOST: '0.0.0.0'
    }
  }]
};
